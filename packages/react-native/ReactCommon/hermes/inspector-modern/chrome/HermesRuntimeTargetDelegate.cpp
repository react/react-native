/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsi/jsi.h>
#include <jsinspector-modern/RuntimeTarget.h>

#include "HermesRuntimeSamplingProfileSerializer.h"
#include "HermesRuntimeTargetDelegate.h"

// If HERMES_ENABLE_DEBUGGER isn't defined, we can't access any Hermes
// CDPHandler headers or types.
#ifdef HERMES_ENABLE_DEBUGGER
#include "HermesRuntimeAgentDelegate.h"

#include <hermes/cdp/CDPDebugAPI.h>

using namespace facebook::hermes::cdp;
#else
#include <jsinspector-modern/FallbackRuntimeTargetDelegate.h>
#endif // HERMES_ENABLE_DEBUGGER

#include <utility>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

namespace {

const uint16_t HERMES_SAMPLING_FREQUENCY_HZ = 10000;

class HermesRuntimeSamplingProfileDelegate {
 public:
  explicit HermesRuntimeSamplingProfileDelegate(
      std::shared_ptr<jsi::Runtime> runtime,
      hermes::HermesRuntime& hermesRuntime)
      : runtime_(std::move(runtime)), hermesRuntime_(hermesRuntime) {}

  void startSampling() {
    auto* hermesAPI = jsi::castInterface<IHermesRootAPI>(makeHermesRootAPI());
    hermesAPI->enableSamplingProfiler(HERMES_SAMPLING_FREQUENCY_HZ);
  }

  void stopSampling() {
    auto* hermesAPI = jsi::castInterface<IHermesRootAPI>(makeHermesRootAPI());
    hermesAPI->disableSamplingProfiler();
  }

  tracing::RuntimeSamplingProfile collectSamplingProfile() {
    return tracing::HermesRuntimeSamplingProfileSerializer::
        serializeToTracingSamplingProfile(
            hermesRuntime_.dumpSampledTraceToProfile());
  }

 private:
  std::shared_ptr<jsi::Runtime> runtime_;
  HermesRuntime& hermesRuntime_;
};

} // namespace

#ifdef HERMES_ENABLE_DEBUGGER
class HermesRuntimeTargetDelegate::Impl final : public RuntimeTargetDelegate {
  using HermesStackTrace = debugger::StackTrace;

  class HermesStackTraceWrapper : public StackTrace {
   public:
    explicit HermesStackTraceWrapper(HermesStackTrace&& hermesStackTrace)
        : hermesStackTrace_{std::move(hermesStackTrace)} {}

    HermesStackTrace& operator*() {
      return hermesStackTrace_;
    }

    HermesStackTrace* operator->() {
      return &hermesStackTrace_;
    }

    const HermesStackTrace& operator*() const {
      return hermesStackTrace_;
    }

    const HermesStackTrace* operator->() const {
      return &hermesStackTrace_;
    }

   private:
    HermesStackTrace hermesStackTrace_;
  };

 public:
  explicit Impl(
      HermesRuntimeTargetDelegate& delegate,
      std::shared_ptr<jsi::Runtime> runtime,
      HermesRuntime& hermesRuntime)
      : delegate_(delegate),
        runtime_(runtime),
        hermesRuntime_(hermesRuntime),
        cdpDebugAPI_(CDPDebugAPI::create(hermesRuntime_)),
        samplingProfileDelegate_(
            std::make_unique<HermesRuntimeSamplingProfileDelegate>(
                std::move(runtime),
                hermesRuntime_)) {}

  CDPDebugAPI& getCDPDebugAPI() {
    return *cdpDebugAPI_;
  }

  // RuntimeTargetDelegate methods

  std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      RuntimeExecutor runtimeExecutor) override {
    return std::unique_ptr<RuntimeAgentDelegate>(new HermesRuntimeAgentDelegate(
        frontendChannel,
        sessionState,
        std::move(previouslyExportedState),
        executionContextDescription,
        hermesRuntime_,
        delegate_,
        std::move(runtimeExecutor)));
  }

  void addConsoleMessage(jsi::Runtime& /*unused*/, ConsoleMessage message)
      override {
    using HermesConsoleMessage = facebook::hermes::cdp::ConsoleMessage;
    using HermesConsoleAPIType = facebook::hermes::cdp::ConsoleAPIType;

    HermesConsoleAPIType type{};
    switch (message.type) {
      case ConsoleAPIType::kLog:
        type = HermesConsoleAPIType::kLog;
        break;
      case ConsoleAPIType::kDebug:
        type = HermesConsoleAPIType::kDebug;
        break;
      case ConsoleAPIType::kInfo:
        type = HermesConsoleAPIType::kInfo;
        break;
      case ConsoleAPIType::kError:
        type = HermesConsoleAPIType::kError;
        break;
      case ConsoleAPIType::kWarning:
        type = HermesConsoleAPIType::kWarning;
        break;
      case ConsoleAPIType::kDir:
        type = HermesConsoleAPIType::kDir;
        break;
      case ConsoleAPIType::kDirXML:
        type = HermesConsoleAPIType::kDirXML;
        break;
      case ConsoleAPIType::kTable:
        type = HermesConsoleAPIType::kTable;
        break;
      case ConsoleAPIType::kTrace:
        type = HermesConsoleAPIType::kTrace;
        break;
      case ConsoleAPIType::kStartGroup:
        type = HermesConsoleAPIType::kStartGroup;
        break;
      case ConsoleAPIType::kStartGroupCollapsed:
        type = HermesConsoleAPIType::kStartGroupCollapsed;
        break;
      case ConsoleAPIType::kEndGroup:
        type = HermesConsoleAPIType::kEndGroup;
        break;
      case ConsoleAPIType::kClear:
        type = HermesConsoleAPIType::kClear;
        break;
      case ConsoleAPIType::kAssert:
        type = HermesConsoleAPIType::kAssert;
        break;
      case ConsoleAPIType::kTimeEnd:
        type = HermesConsoleAPIType::kTimeEnd;
        break;
      case ConsoleAPIType::kCount:
        type = HermesConsoleAPIType::kCount;
        break;
      default:
        throw std::logic_error{"Unknown console message type"};
    }
    HermesStackTrace hermesStackTrace{};
    if (auto hermesStackTraceWrapper =
            dynamic_cast<HermesStackTraceWrapper*>(message.stackTrace.get())) {
      hermesStackTrace = std::move(**hermesStackTraceWrapper);
    }
    HermesConsoleMessage hermesConsoleMessage{
        message.timestamp,
        type,
        std::move(message.args),
        std::move(hermesStackTrace)};
    cdpDebugAPI_->addConsoleMessage(std::move(hermesConsoleMessage));
  }

  bool supportsConsole() const override {
    return true;
  }

  std::unique_ptr<StackTrace> captureStackTrace(
      jsi::Runtime& /* runtime */,
      size_t /* framesToSkip */) override {
    // TODO(moti): Pass framesToSkip to Hermes. Ignoring framesToSkip happens
    // to work for our current use case, because the HostFunction frame we want
    // to skip is stripped by CDPDebugAPI::addConsoleMessage before being sent
    // to the client. This is still conceptually wrong and could block us from
    // properly representing the stack trace in other use cases, where native
    // frames aren't stripped on serialisation.
    return std::make_unique<HermesStackTraceWrapper>(
        hermesRuntime_.getDebugger().captureStackTrace());
  }

  void enableSamplingProfiler() override {
    samplingProfileDelegate_->startSampling();
  }

  void disableSamplingProfiler() override {
    samplingProfileDelegate_->stopSampling();
  }

  tracing::RuntimeSamplingProfile collectSamplingProfile() override {
    return samplingProfileDelegate_->collectSamplingProfile();
  }

  std::optional<folly::dynamic> serializeStackTrace(
      const StackTrace& stackTrace) override {
    if (auto* hermesStackTraceWrapper =
            dynamic_cast<const HermesStackTraceWrapper*>(&stackTrace)) {
      // The logic below is duplicated from
      // facebook::hermes::cdp::message::makeCallFrames in
      // hermes/cdp/MessageConverters.cpp (and rewritten to use Folly).
      // TODO: Use a suitable Hermes API (D83560910 / D83560972 / D83562078) to
      // serialize the stack trace to CDP-formatted JSON.
      folly::dynamic cdpStackTrace = folly::dynamic::object();
      auto& hermesStackTrace = **hermesStackTraceWrapper;
      if (hermesStackTrace.callFrameCount() > 0) {
        folly::dynamic callFrames = folly::dynamic::array();
        callFrames.reserve(hermesStackTrace.callFrameCount());
        for (int i = 0, n = hermesStackTrace.callFrameCount(); i != n; i++) {
          auto callFrame = hermesStackTrace.callFrameForIndex(i);
          if (callFrame.location.fileId ==
              facebook::hermes::debugger::kInvalidLocation) {
            continue;
          }
          folly::dynamic callFrameObj = folly::dynamic::object();
          callFrameObj["functionName"] = callFrame.functionName;
          callFrameObj["scriptId"] = std::to_string(callFrame.location.fileId);
          callFrameObj["url"] = callFrame.location.fileName;
          if (callFrame.location.line !=
              facebook::hermes::debugger::kInvalidLocation) {
            callFrameObj["lineNumber"] = callFrame.location.line - 1;
          }
          if (callFrame.location.column !=
              facebook::hermes::debugger::kInvalidLocation) {
            callFrameObj["columnNumber"] = callFrame.location.column - 1;
          }
          callFrames.push_back(std::move(callFrameObj));
        }
        cdpStackTrace["callFrames"] = std::move(callFrames);
      }
      return cdpStackTrace;
    }
    return std::nullopt;
  }

 private:
  HermesRuntimeTargetDelegate& delegate_;
  std::shared_ptr<jsi::Runtime> runtime_;
  HermesRuntime& hermesRuntime_;
  const std::unique_ptr<CDPDebugAPI> cdpDebugAPI_;
  std::unique_ptr<HermesRuntimeSamplingProfileDelegate>
      samplingProfileDelegate_;
};

#else

/**
 * A stub for HermesRuntimeTargetDelegate when Hermes is compiled without
 * debugging support.
 */
class HermesRuntimeTargetDelegate::Impl final
    : public FallbackRuntimeTargetDelegate {
 public:
  explicit Impl(
      HermesRuntimeTargetDelegate&,
      std::shared_ptr<jsi::Runtime> runtime,
      HermesRuntime& hermesRuntime)
      : FallbackRuntimeTargetDelegate{hermesRuntime.description()},
        samplingProfileDelegate_(
            std::make_unique<HermesRuntimeSamplingProfileDelegate>(
                std::move(runtime),
                hermesRuntime)) {}

  void enableSamplingProfiler() override {
    samplingProfileDelegate_->startSampling();
  }

  void disableSamplingProfiler() override {
    samplingProfileDelegate_->stopSampling();
  }

  tracing::RuntimeSamplingProfile collectSamplingProfile() override {
    return samplingProfileDelegate_->collectSamplingProfile();
  }

 private:
  std::unique_ptr<HermesRuntimeSamplingProfileDelegate>
      samplingProfileDelegate_;
};

#endif // HERMES_ENABLE_DEBUGGER

HermesRuntimeTargetDelegate::HermesRuntimeTargetDelegate(
    std::shared_ptr<jsi::Runtime> runtime,
    HermesRuntime& hermesRuntime)
    : impl_(std::make_unique<Impl>(*this, std::move(runtime), hermesRuntime)) {}

HermesRuntimeTargetDelegate::~HermesRuntimeTargetDelegate() = default;

std::unique_ptr<RuntimeAgentDelegate>
HermesRuntimeTargetDelegate::createAgentDelegate(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
        previouslyExportedState,
    const ExecutionContextDescription& executionContextDescription,
    RuntimeExecutor runtimeExecutor) {
  return impl_->createAgentDelegate(
      frontendChannel,
      sessionState,
      std::move(previouslyExportedState),
      executionContextDescription,
      std::move(runtimeExecutor));
}

void HermesRuntimeTargetDelegate::addConsoleMessage(
    jsi::Runtime& runtime,
    ConsoleMessage message) {
  impl_->addConsoleMessage(runtime, std::move(message));
}

bool HermesRuntimeTargetDelegate::supportsConsole() const {
  return impl_->supportsConsole();
}

std::unique_ptr<StackTrace> HermesRuntimeTargetDelegate::captureStackTrace(
    jsi::Runtime& runtime,
    size_t framesToSkip) {
  return impl_->captureStackTrace(runtime, framesToSkip);
}

void HermesRuntimeTargetDelegate::enableSamplingProfiler() {
  impl_->enableSamplingProfiler();
}

void HermesRuntimeTargetDelegate::disableSamplingProfiler() {
  impl_->disableSamplingProfiler();
}

tracing::RuntimeSamplingProfile
HermesRuntimeTargetDelegate::collectSamplingProfile() {
  return impl_->collectSamplingProfile();
}

std::optional<folly::dynamic> HermesRuntimeTargetDelegate::serializeStackTrace(
    const StackTrace& stackTrace) {
  return impl_->serializeStackTrace(stackTrace);
}

#ifdef HERMES_ENABLE_DEBUGGER
CDPDebugAPI& HermesRuntimeTargetDelegate::getCDPDebugAPI() {
  return impl_->getCDPDebugAPI();
}
#endif

} // namespace facebook::react::jsinspector_modern
