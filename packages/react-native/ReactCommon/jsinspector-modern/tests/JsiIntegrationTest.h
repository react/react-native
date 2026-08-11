/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <folly/json.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/HostTarget.h>
#include <jsinspector-modern/InspectorInterfaces.h>

#include <memory>
#include <source_location>

#include "FollyDynamicMatchers.h"
#include "GmockHelpers.h"
#include "InspectorMocks.h"
#include "UniquePtrFactory.h"
#include "utils/InspectorFlagOverridesGuard.h"

namespace facebook::react::jsinspector_modern {

/**
 * A text fixture class for the integration between the modern RN CDP backend
 * and a JSI engine, mocking out the rest of RN. For simplicity, everything is
 * single-threaded and "async" work is actually done through a queued immediate
 * executor ( = run immediately and finish all queued sub-tasks before
 * returning).
 *
 * The main limitation of the simpler threading model is that we can't cover
 * breakpoints etc - since pausing during JS execution would prevent the test
 * from making progress. Such functionality is better suited for a full RN+CDP
 * integration test (using RN's own thread management) as well as for each
 * engine's unit tests.
 *
 * \tparam EngineAdapter An adapter class that implements RuntimeTargetDelegate
 * for a particular engine, plus exposes access to a RuntimeExecutor (based on
 * the provided folly::Executor) and the corresponding jsi::Runtime.
 */
template <typename EngineAdapter, typename Executor>
class JsiIntegrationPortableTestBase : public ::testing::Test,
                                       private HostTargetDelegate {
 protected:
  Executor executor_;

  JsiIntegrationPortableTestBase(InspectorFlagOverrides overrides = {})
      : inspectorFlagsGuard_(overrides), engineAdapter_{executor_} {}

  void SetUp() override {
    // NOTE: Using SetUp() so we can call virtual methods like
    // setupRuntimeBeforeRegistration().
    page_ = HostTarget::create(*this, inspectorExecutor_);
    instance_ = &page_->registerInstance(instanceTargetDelegate_);
    setupRuntimeBeforeRegistration(engineAdapter_->getRuntime());
    runtimeTarget_ = &instance_->registerRuntime(
        engineAdapter_->getRuntimeTargetDelegate(),
        engineAdapter_->getRuntimeExecutor());
    loadMainBundle();
  }

  ~JsiIntegrationPortableTestBase() override {
    toPage_.reset();
    if (runtimeTarget_ != nullptr) {
      EXPECT_TRUE(instance_);
      instance_->unregisterRuntime(*runtimeTarget_);
      runtimeTarget_ = nullptr;
    }
    if (instance_ != nullptr) {
      page_->unregisterInstance(*instance_);
      instance_ = nullptr;
    }
  }

  /**
   * Noop in JsiIntegrationPortableTest, but can be overridden by derived
   * fixture classes to load some code at startup and after each reload.
   */
  virtual void loadMainBundle() {}

  /**
   * Noop in JsiIntegrationPortableTest, but can be overridden by derived
   * fixture classes to set up the runtime before registering it with the
   * CDP backend.
   */
  virtual void setupRuntimeBeforeRegistration(jsi::Runtime& /*runtime*/) {}

  void connect(
      std::source_location location = std::source_location::current()) {
    ASSERT_FALSE(toPage_) << "Can only connect once in a JSI integration test.";
    toPage_ = page_->connect(remoteConnections_.make_unique());

    using namespace ::testing;
    // Default to ignoring console messages originating inside the backend.
    EXPECT_CALL_WITH_SOURCE_LOCATION(
        location,
        fromPage(),
        onMessage(JsonParsed(AllOf(
            AtJsonPtr("/method", "Runtime.consoleAPICalled"),
            AtJsonPtr("/params/context", "main#InstanceAgent")))))
        .Times(AnyNumber());

    // We'll always get an onDisconnect call when we tear
    // down the test. Expect it in order to satisfy the strict mock.
    EXPECT_CALL_WITH_SOURCE_LOCATION(
        location, *remoteConnections_[0], onDisconnect());
  }

  void reload() {
    if (runtimeTarget_ != nullptr) {
      ASSERT_TRUE(instance_);
      instance_->unregisterRuntime(*runtimeTarget_);
      runtimeTarget_ = nullptr;
    }
    if (instance_ != nullptr) {
      page_->unregisterInstance(*instance_);
      instance_ = nullptr;
    }
    // Recreate the engine (e.g. to wipe any state in the inner jsi::Runtime)
    engineAdapter_.emplace(executor_);
    instance_ = &page_->registerInstance(instanceTargetDelegate_);
    setupRuntimeBeforeRegistration(engineAdapter_->getRuntime());
    runtimeTarget_ = &instance_->registerRuntime(
        engineAdapter_->getRuntimeTargetDelegate(),
        engineAdapter_->getRuntimeExecutor());
    loadMainBundle();
  }

  MockRemoteConnection& fromPage() {
    assert(toPage_);
    return *remoteConnections_[0];
  }

  VoidExecutor inspectorExecutor_ = [this](auto callback) {
    executor_.add(callback);
  };

  jsi::Value eval(std::string_view code) {
    return engineAdapter_->getRuntime().evaluateJavaScript(
        std::make_shared<jsi::StringBuffer>(std::string(code)), "<eval>");
  }

  /**
   * Expect a message matching the provided gmock \c matcher and return a holder
   * that will eventually contain the parsed JSON payload.
   */
  template <typename Matcher>
  std::shared_ptr<const std::optional<folly::dynamic>> expectMessageFromPage(
      Matcher&& matcher,
      std::source_location location = std::source_location::current()) {
    using namespace ::testing;
    ScopedTrace scope(location.file_name(), location.line(), "");
    std::shared_ptr result =
        std::make_shared<std::optional<folly::dynamic>>(std::nullopt);
    EXPECT_CALL_WITH_SOURCE_LOCATION(location, fromPage(), onMessage(matcher))
        .WillOnce(
            ([result](auto message) { *result = folly::parseJson(message); }))
        .RetiresOnSaturation();
    return result;
  }

  RuntimeTargetDelegate& dangerouslyGetRuntimeTargetDelegate() {
    return engineAdapter_->getRuntimeTargetDelegate();
  }

  jsi::Runtime& dangerouslyGetRuntime() {
    return engineAdapter_->getRuntime();
  }

  class SecondaryConnection {
   public:
    SecondaryConnection(
        std::unique_ptr<ILocalConnection> toPage,
        JsiIntegrationPortableTestBase<EngineAdapter, Executor>& test,
        size_t remoteConnectionIndex)
        : toPage_(std::move(toPage)),
          remoteConnectionIndex_(remoteConnectionIndex),
          test_(test) {}

    ILocalConnection& toPage() {
      return *toPage_;
    }

    MockRemoteConnection& fromPage() {
      return *test_.remoteConnections_[remoteConnectionIndex_];
    }

   private:
    std::unique_ptr<ILocalConnection> toPage_;
    size_t remoteConnectionIndex_;
    JsiIntegrationPortableTestBase<EngineAdapter, Executor>& test_;
  };

  SecondaryConnection connectSecondary(
      std::source_location location = std::source_location::current()) {
    auto toPage = page_->connect(remoteConnections_.make_unique());

    SecondaryConnection secondary{
        std::move(toPage), *this, remoteConnections_.objectsVended() - 1};

    using namespace ::testing;
    // Default to ignoring console messages originating inside the backend.
    EXPECT_CALL_WITH_SOURCE_LOCATION(
        location,
        secondary.fromPage(),
        onMessage(JsonParsed(AllOf(
            AtJsonPtr("/method", "Runtime.consoleAPICalled"),
            AtJsonPtr("/params/context", "main#InstanceAgent")))))
        .Times(AnyNumber());

    // We'll always get an onDisconnect call when we tear
    // down the test. Expect it in order to satisfy the strict mock.
    EXPECT_CALL_WITH_SOURCE_LOCATION(
        location, secondary.fromPage(), onDisconnect());

    return secondary;
  }

  std::shared_ptr<HostTarget> page_;
  InstanceTarget* instance_{};
  RuntimeTarget* runtimeTarget_{};

  InspectorFlagOverridesGuard inspectorFlagsGuard_;
  MockInstanceTargetDelegate instanceTargetDelegate_;
  std::optional<EngineAdapter> engineAdapter_;

 private:
  UniquePtrFactory<::testing::StrictMock<MockRemoteConnection>>
      remoteConnections_;

 protected:
  // NOTE: Needs to be destroyed before page_.
  std::unique_ptr<ILocalConnection> toPage_;

 private:
  // HostTargetDelegate methods

  HostTargetMetadata getMetadata() override {
    return {.integrationName = "JsiIntegrationTest"};
  }

  void onReload(const PageReloadRequest& request) override {
    (void)request;
    reload();
  }

  void onSetPausedInDebuggerMessage(
      const OverlaySetPausedInDebuggerMessageRequest& /*request*/) override {}
};

} // namespace facebook::react::jsinspector_modern
