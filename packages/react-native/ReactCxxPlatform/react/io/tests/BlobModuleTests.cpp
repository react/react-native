/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <ReactCommon/TestCallInvoker.h>
#include <ReactCommon/TurboModuleWithJSIBindings.h>
#include <hermes/hermes.h>
#include <jsi/decorator.h>
#include <jsi/instrumentation.h>
#include <jsi/jsi.h>
#include <react/io/BlobModule.h>
#include <react/io/BlobStore.h>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

namespace facebook::react {
namespace {

class ThrowOnBlobSizeRuntime
    : public jsi::RuntimeDecorator<jsi::Runtime, jsi::Runtime> {
 public:
  explicit ThrowOnBlobSizeRuntime(jsi::Runtime& runtime)
      : RuntimeDecorator(runtime) {}

  void setPropertyValue(
      const jsi::Object& object,
      const jsi::String& name,
      const jsi::Value& value) override {
    if (name.utf8(*this) == "size") {
      blobId = object.getProperty(*this, "blobId").asString(*this).utf8(*this);
      throw std::runtime_error("injected blob descriptor failure");
    }
    RuntimeDecorator::setPropertyValue(object, name, value);
  }

  std::string blobId;
};

class BlobModuleTest : public ::testing::Test {
 protected:
  void SetUp() override {
    runtime_ = facebook::hermes::makeHermesRuntime();
    invoker_ = std::make_shared<TestCallInvoker>(*runtime_);
    store_ = std::make_shared<BlobStore>();
    auto module = std::make_shared<BlobModule>(invoker_, store_);
    TurboModuleWithJSIBindings::installJSIBindings(module, *runtime_);
    runtime_->global().setProperty(
        *runtime_,
        "BlobModule",
        jsi::Object::createFromHostObject(*runtime_, module));
  }

  void TearDown() override {
    invoker_->flushQueue();
    LongLivedObjectCollection::get(*runtime_).clear(*runtime_);
    invoker_ = nullptr;
    runtime_ = nullptr;
  }

  jsi::Value eval(const std::string& source) {
    return runtime_->evaluateJavaScript(
        std::make_shared<jsi::StringBuffer>(source), "blob-module-test.js");
  }

  std::shared_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::shared_ptr<TestCallInvoker> invoker_;
  std::shared_ptr<BlobStore> store_;
};

} // namespace

TEST_F(BlobModuleTest, CollectorBindingIsInstalledBeforeBlobMethods) {
  EXPECT_TRUE(eval("typeof __blobCollectorProvider === 'function'").getBool());
}

TEST_F(BlobModuleTest, GetConstantsReturnsBlobScheme) {
  EXPECT_EQ(
      eval("BlobModule.getConstants().BLOB_URI_SCHEME")
          .asString(*runtime_)
          .utf8(*runtime_),
      "blob");
  EXPECT_TRUE(
      eval("BlobModule.getConstants().BLOB_URI_HOST === null").getBool());
}

TEST_F(BlobModuleTest, CreateFromPartsPreservesStringBytesAndSlices) {
  eval(R"(
    BlobModule.createFromParts([{type: 'string', data: 'café 日本語 😺'}], 'a');
    BlobModule.createFromParts(
      [{type: 'string', data: '<'}, {type: 'blob', data: {blobId: 'a', offset: 6, size: 9}},
       {type: 'string', data: '>'}], 'b');
  )");
  const std::string expected = "<日本語>";
  EXPECT_EQ(
      store_->resolve("b", 0, expected.size()),
      std::optional<std::vector<uint8_t>>(
          std::vector<uint8_t>(expected.begin(), expected.end())));
}

TEST_F(BlobModuleTest, InvalidPartsRejectBeforeIndexConversion) {
  eval("BlobModule.createFromParts([{type: 'string', data: 'abcd'}], 'n');");
  for (const auto* part :
       {"{blobId: 'n', offset: NaN, size: 1}",
        "{blobId: 'n', offset: 0, size: Infinity}",
        "{blobId: 'n', offset: 0.5, size: 1}",
        "{blobId: 'n', offset: 1e30, size: 1}"}) {
    EXPECT_THROW(
        eval(
            "BlobModule.createFromParts([{type: 'blob', data: " +
            std::string(part) + "}], 'x');"),
        jsi::JSError);
  }
}

TEST_F(BlobModuleTest, ReleaseAndOutOfRangeSlicesAreInvalid) {
  eval("BlobModule.createFromParts([{type: 'string', data: 'abc'}], 'r');");
  EXPECT_FALSE(store_->resolve("r", 1, 3).has_value());
  EXPECT_TRUE(store_->resolve("r", 3, 0).has_value());
  eval("BlobModule.release('r');");
  EXPECT_FALSE(store_->resolve("r", 0, 3).has_value());
}

TEST_F(BlobModuleTest, CollectedBlobIsReleased) {
  eval(R"(
    BlobModule.createFromParts([{type: 'string', data: 'abc'}], 'gc');
    (function () { __blobCollectorProvider('gc'); })();
  )");
  runtime_->instrumentation().collectGarbage("BlobModuleTest");
  EXPECT_FALSE(store_->resolve("gc", 0, 3).has_value());
}

TEST_F(BlobModuleTest, ResponseDescriptorFailureReleasesStoredBytes) {
  auto throwingRuntime = ThrowOnBlobSizeRuntime(*runtime_);
  auto handler = BlobNetworkingResponseHandler(store_);
  const std::vector<uint8_t> body{0, 255, 128};
  EXPECT_THROW(
      handler.toResponseData(throwingRuntime, body), std::runtime_error);
  ASSERT_FALSE(throwingRuntime.blobId.empty());
  EXPECT_FALSE(
      store_->resolve(throwingRuntime.blobId, 0, body.size()).has_value());

  auto response = handler.toResponseData(*runtime_, body).asObject(*runtime_);
  auto blobId = response.getProperty(*runtime_, "blobId")
                    .asString(*runtime_)
                    .utf8(*runtime_);
  EXPECT_EQ(
      store_->resolve(blobId, 0, body.size()),
      std::optional<std::vector<uint8_t>>(body));
}

TEST_F(BlobModuleTest, WebSocketBlobsAreUnsupported) {
  EXPECT_THROW(eval("BlobModule.addWebSocketHandler(1);"), jsi::JSError);
}

} // namespace facebook::react
