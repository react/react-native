/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstance.h"

#include <ReactCommon/RuntimeExecutor.h>
#include <cxxreact/ErrorUtils.h>
#include <cxxreact/JSBigString.h>
#include <cxxreact/JSExecutor.h>
#include <cxxreact/ReactMarker.h>
#include <cxxreact/TraceSection.h>
#include <glog/logging.h>
#include <jsi/JSIDynamic.h>
#include <jsi/hermes-interfaces.h>
#include <jsi/instrumentation.h>
#include <jsinspector-modern/HostTarget.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/runtime/JSRuntimeBindings.h>
#include <react/timing/primitives.h>
#include <react/utils/jsi-utils.h>
#include <iostream>
#include <memory>
#include <utility>

namespace facebook::react {

namespace {

std::shared_ptr<RuntimeScheduler> createRuntimeScheduler(
    RuntimeExecutor runtimeExecutor,
    RuntimeSchedulerTaskErrorHandler taskErrorHandler) {
  std::shared_ptr<RuntimeScheduler> scheduler =
      std::make_shared<RuntimeScheduler>(
          std::move(runtimeExecutor),
          HighResTimeStamp::now,
          std::move(taskErrorHandler));
  scheduler->setPerformanceEntryReporter(
      // FIXME: Move creation of PerformanceEntryReporter to here and
      // guarantee that its lifetime is the same as the runtime.
      PerformanceEntryReporter::getInstance().get());

  return scheduler;
}

std::string getSyntheticBundlePath(uint32_t bundleId) {
  std::array<char, 32> buffer{};
  std::snprintf(buffer.data(), buffer.size(), "seg-%u.js", bundleId);
  return buffer.data();
}

} // namespace

ReactInstance::ReactInstance(
    std::unique_ptr<JSRuntime> runtime,
    std::shared_ptr<MessageQueueThread> jsMessageQueueThread,
    std::shared_ptr<TimerManager> timerManager,
    JsErrorHandler::OnJsError onJsError,
    jsinspector_modern::HostTarget* parentInspectorTarget)
    : runtime_(std::move(runtime)),
      jsMessageQueueThread_(std::move(jsMessageQueueThread)),
      timerManager_(std::move(timerManager)),
      jsErrorHandler_(std::make_shared<JsErrorHandler>(std::move(onJsError))),
      parentInspectorTarget_(parentInspectorTarget) {
  RuntimeExecutor runtimeExecutor =
      [weakRuntime = std::weak_ptr(runtime_),
       weakTimerManager = std::weak_ptr(timerManager_),
       weakJsThread = std::weak_ptr(jsMessageQueueThread_),
       jsErrorHandler = jsErrorHandler_](auto callback) {
        if (weakRuntime.expired()) {
          return;
        }

        if (auto jsThread = weakJsThread.lock()) {
          jsThread->runOnQueue([jsErrorHandler,
                                weakRuntime,
                                weakTimerManager,
                                callback = std::move(callback)]() {
            auto runtime = weakRuntime.lock();
            if (!runtime) {
              return;
            }

            jsi::Runtime& jsiRuntime = runtime->getRuntime();
            TraceSection s("ReactInstance::_runtimeExecutor[Callback]");
            try {
              ShadowNode::setUseRuntimeShadowNodeReferenceUpdateOnThread(true);
              callback(jsiRuntime);
            } catch (jsi::JSError& originalError) {
              jsErrorHandler->handleError(jsiRuntime, originalError, true);
            } catch (std::exception& ex) {
              jsi::JSError error(
                  jsiRuntime, std::string("Non-JS exception: ") + ex.what());
              jsErrorHandler->handleError(jsiRuntime, error, true);
            }
          });
        }
      };

  if (parentInspectorTarget_ != nullptr) {
    auto executor = parentInspectorTarget_->executorFromThis();

    auto bufferedRuntimeExecutorThatWaitsForInspectorSetup =
        std::make_shared<BufferedRuntimeExecutor>(runtimeExecutor);
    auto runtimeExecutorThatExecutesAfterInspectorSetup =
        [bufferedRuntimeExecutorThatWaitsForInspectorSetup](
            std::function<void(jsi::Runtime & runtime)>&& callback) {
          bufferedRuntimeExecutorThatWaitsForInspectorSetup->execute(
              std::move(callback));
        };

    runtimeScheduler_ = createRuntimeScheduler(
        runtimeExecutorThatExecutesAfterInspectorSetup,
        [jsErrorHandler = jsErrorHandler_](
            jsi::Runtime& runtime, jsi::JSError& error) {
          jsErrorHandler->handleError(runtime, error, true);
        });

    auto runtimeExecutorThatGoesThroughRuntimeScheduler =
        [runtimeScheduler = runtimeScheduler_.get()](
            std::function<void(jsi::Runtime & runtime)>&& callback) {
          runtimeScheduler->scheduleWork(std::move(callback));
        };

    // This code can execute from any thread, so we need to make sure we set up
    // the inspector logic in the right one. The callback executes immediately
    // if we are already in the right thread.
    executor([this,
              runtimeExecutorThatGoesThroughRuntimeScheduler,
              bufferedRuntimeExecutorThatWaitsForInspectorSetup](
                 jsinspector_modern::HostTarget& hostTarget) {
      // Callbacks scheduled through the page target executor are generally
      // not guaranteed to run (e.g.: if the page target is destroyed)
      // but in this case it is because the page target cannot be destroyed
      // before the instance finishes its setup:
      // * On iOS it's because we do the setup synchronously.
      // * On Android it's because we explicitly wait for the instance
      //   creation task to finish before starting the destruction.
      inspectorTarget_ = &hostTarget.registerInstance(*this);
      runtimeInspectorTarget_ = &inspectorTarget_->registerRuntime(
          runtime_->getRuntimeTargetDelegate(),
          runtimeExecutorThatGoesThroughRuntimeScheduler);
      bufferedRuntimeExecutorThatWaitsForInspectorSetup->flush();
    });
  } else {
    runtimeScheduler_ = createRuntimeScheduler(
        runtimeExecutor,
        [jsErrorHandler = jsErrorHandler_](
            jsi::Runtime& runtime, jsi::JSError& error) {
          jsErrorHandler->handleError(runtime, error, true);
        });
  }

  bufferedRuntimeExecutor_ = std::make_shared<BufferedRuntimeExecutor>(
      [runtimeScheduler = runtimeScheduler_.get()](
          std::function<void(jsi::Runtime & runtime)>&& callback) {
        runtimeScheduler->scheduleWork(std::move(callback));
      });
}
ReactInstance::~ReactInstance() noexcept {
  if (timerManager_ != nullptr) {
    timerManager_->quit();
  }
}

void ReactInstance::unregisterFromInspector() {
  if (inspectorTarget_ != nullptr) {
    assert(runtimeInspectorTarget_);
    inspectorTarget_->unregisterRuntime(*runtimeInspectorTarget_);

    assert(parentInspectorTarget_);
    parentInspectorTarget_->unregisterInstance(*inspectorTarget_);

    inspectorTarget_ = nullptr;
  }
}

RuntimeExecutor ReactInstance::getUnbufferedRuntimeExecutor() noexcept {
  return [runtimeScheduler = runtimeScheduler_.get()](
             std::function<void(jsi::Runtime & runtime)>&& callback) {
    runtimeScheduler->scheduleWork(std::move(callback));
  };
}

// This BufferedRuntimeExecutor ensures that the main JS bundle finished
// execution before any JS queued into it from C++ are executed. Use
// getUnbufferedRuntimeExecutor() instead if you do not need the main JS
// bundle to have finished. e.g. setting global variables into JS runtime.
RuntimeExecutor ReactInstance::getBufferedRuntimeExecutor() noexcept {
  return [weakBufferedRuntimeExecutor_ =
              std::weak_ptr<BufferedRuntimeExecutor>(bufferedRuntimeExecutor_)](
             std::function<void(jsi::Runtime & runtime)>&& callback) {
    if (auto strongBufferedRuntimeExecutor_ =
            weakBufferedRuntimeExecutor_.lock()) {
      strongBufferedRuntimeExecutor_->execute(std::move(callback));
    }
  };
}

// TODO(T184010230): Should the RuntimeScheduler returned from this method be
// buffered?
std::shared_ptr<RuntimeScheduler>
ReactInstance::getRuntimeScheduler() noexcept {
  return runtimeScheduler_;
}

namespace {

// Copied from JSIExecutor.cpp
// basename_r isn't in all iOS SDKs, so use this simple version instead.
std::string simpleBasename(const std::string& path) {
  size_t pos = path.rfind('/');
  return (pos != std::string::npos) ? path.substr(pos) : path;
}

} // namespace

/**
 * Load the JS bundle and flush buffered JS calls, future JS calls won't be
 * buffered after calling this.
 * Note that this method is asynchronous. However, a completion callback
 * isn't needed because all calls into JS should be dispatched to the
 * JSThread, preferably via the runtimeExecutor_.
 */
void ReactInstance::loadScript(
    std::unique_ptr<const JSBigString> script,
    const std::string& sourceURL,
    std::function<void(jsi::Runtime& runtime)>&& beforeLoad,
    std::function<void(jsi::Runtime& runtime)>&& afterLoad) {
  std::shared_ptr<const jsi::Buffer> buffer(std::move(script));
  std::string scriptName = simpleBasename(sourceURL);

  runtimeScheduler_->scheduleWork(
      [jsErrorHandler = jsErrorHandler_,
       scriptName,
       sourceURL = sourceURL,
       buffer = std::move(buffer),
       weakBufferedRuntimeExecuter =
           std::weak_ptr<BufferedRuntimeExecutor>(bufferedRuntimeExecutor_),
       beforeLoad,
       afterLoad](jsi::Runtime& runtime) mutable {
        if (beforeLoad) {
          beforeLoad(runtime);
        }
        TraceSection s("ReactInstance::loadScript");
        bool hasLogger(ReactMarker::logTaggedMarkerImpl);
        if (hasLogger) {
          ReactMarker::logTaggedMarker(
              ReactMarker::RUN_JS_BUNDLE_START, scriptName.c_str());
          ReactMarker::logMarker(ReactMarker::INIT_REACT_RUNTIME_START);
          ReactMarker::logMarker(ReactMarker::APP_STARTUP_START);
        }

        // Check if the shermes unit is avaliable.
        auto* shUnitAPI = jsi::castInterface<hermes::IHermesSHUnit>(&runtime);
        auto* shUnitCreator =
            shUnitAPI ? shUnitAPI->getSHUnitCreator() : nullptr;
        if (shUnitCreator) {
          LOG(WARNING) << "ReactInstance: evaluateSHUnit";
          auto* hermesAPI = jsi::castInterface<hermes::IHermes>(&runtime);
          hermesAPI->evaluateSHUnit(shUnitCreator);
        } else {
          LOG(WARNING) << "ReactInstance: evaluateJavaScript() with JS bundle";
          runtime.evaluateJavaScript(buffer, sourceURL);
        }

        /**
         * TODO(T183610671): We need a safe/reliable way to enable the js
         * pipeline from javascript. Remove this after we figure that out, or
         * after we just remove the js pipeline.
         */
        if (!jsErrorHandler->hasHandledFatalError()) {
          jsErrorHandler->setRuntimeReady();
        }

        if (hasLogger) {
          ReactMarker::logTaggedMarker(
              ReactMarker::RUN_JS_BUNDLE_STOP, scriptName.c_str());
          ReactMarker::logMarker(ReactMarker::INIT_REACT_RUNTIME_STOP);
          ReactMarker::logMarker(ReactMarker::APP_STARTUP_STOP);
        }
        if (auto strongBufferedRuntimeExecuter =
                weakBufferedRuntimeExecuter.lock()) {
          strongBufferedRuntimeExecuter->flush();
        }
        if (afterLoad) {
          afterLoad(runtime);
        }
      });
}

/*
 * Calls a method on a JS module that has been registered with
 * `registerCallableModule`. Used to invoke a JS function from platform code.
 */
void ReactInstance::callFunctionOnModule(
    const std::string& moduleName,
    const std::string& methodName,
    folly::dynamic&& args) {
  if (bufferedRuntimeExecutor_ == nullptr) {
    LOG(ERROR)
        << "Calling callFunctionOnModule with null BufferedRuntimeExecutor";
    return;
  }

  bufferedRuntimeExecutor_->execute([this,
                                     moduleName = moduleName,
                                     methodName = methodName,
                                     args = std::move(args)](
                                        jsi::Runtime& runtime) {
    TraceSection s(
        "ReactInstance::callFunctionOnModule",
        "moduleName",
        moduleName,
        "methodName",
        methodName);
    auto it = callableModules_.find(moduleName);
    if (it == callableModules_.end()) {
      std::ostringstream knownModules;
      int i = 0;
      for (it = callableModules_.begin(); it != callableModules_.end();
           it++, i++) {
        const char* space = (i > 0 ? ", " : " ");
        knownModules << space << it->first;
      }
      throw jsi::JSError(
          runtime,
          "Failed to call into JavaScript module method " + moduleName + "." +
              methodName +
              "(). Module has not been registered as callable. Registered callable JavaScript modules (n = " +
              std::to_string(callableModules_.size()) +
              "):" + knownModules.str() +
              ". Did you forget to call `registerCallableModule`?");
    }

    if (std::holds_alternative<jsi::Function>(it->second)) {
      auto module =
          std::get<jsi::Function>(it->second).call(runtime).asObject(runtime);
      it->second = std::move(module);
    }

    auto& module = std::get<jsi::Object>(it->second);
    auto method = module.getPropertyAsFunction(runtime, methodName.c_str());

    std::vector<jsi::Value> jsArgs;
    for (auto& arg : args) {
      jsArgs.push_back(jsi::valueFromDynamic(runtime, arg));
    }
    method.callWithThis(
        runtime, module, (const jsi::Value*)jsArgs.data(), jsArgs.size());
  });
}

void ReactInstance::registerSegment(
    uint32_t segmentId,
    const std::string& segmentPath) {
  LOG(WARNING) << "Starting to run ReactInstance::registerSegment with segment "
               << segmentId;
  runtimeScheduler_->scheduleWork([=](jsi::Runtime& runtime) {
    TraceSection s("ReactInstance::registerSegment");
    auto tag = std::to_string(segmentId);
    auto script = JSBigFileString::fromPath(segmentPath);
    if (script->size() == 0) {
      throw std::invalid_argument(
          "Empty segment registered with ID " + tag + " from " + segmentPath);
    }

    ReactMarker::logTaggedMarker(
        ReactMarker::REGISTER_JS_SEGMENT_START, tag.c_str());
    LOG(WARNING) << "Starting to evaluate segment " << segmentId
                 << " in ReactInstance::registerSegment";
    runtime.evaluateJavaScript(
        std::move(script), getSyntheticBundlePath(segmentId));
    LOG(WARNING) << "Finished evaluating segment " << segmentId
                 << " in ReactInstance::registerSegment";
    ReactMarker::logTaggedMarker(
        ReactMarker::REGISTER_JS_SEGMENT_STOP, tag.c_str());
  });
}

namespace {
void defineReactInstanceFlags(
    jsi::Runtime& runtime,
    const ReactInstance::JSRuntimeFlags& options) noexcept {
  defineReadOnlyGlobal(runtime, "RN$Bridgeless", jsi::Value(true));

  if (options.isProfiling) {
    defineReadOnlyGlobal(runtime, "__RCTProfileIsProfiling", jsi::Value(true));
  }

  if (options.runtimeDiagnosticFlags.length() > 0) {
    defineReadOnlyGlobal(
        runtime,
        "RN$DiagnosticFlags",
        jsi::String::createFromUtf8(runtime, options.runtimeDiagnosticFlags));
  }
}

bool isTruthy(jsi::Runtime& runtime, const jsi::Value& value) {
  auto Boolean = runtime.global().getPropertyAsFunction(runtime, "Boolean");
  return Boolean.call(runtime, value).getBool();
}

} // namespace

void ReactInstance::initializeRuntime(
    JSRuntimeFlags options,
    BindingsInstallFunc bindingsInstallFunc) noexcept {
  runtimeScheduler_->scheduleWork([this,
                                   options = std::move(options),
                                   bindingsInstallFunc =
                                       std::move(bindingsInstallFunc)](
                                      jsi::Runtime& runtime) {
    TraceSection s("ReactInstance::initializeRuntime");

    bindNativePerformanceNow(runtime);

    RuntimeSchedulerBinding::createAndInstallIfNeeded(
        runtime, runtimeScheduler_);

    runtime_->unstable_initializeOnJsThread();

    defineReactInstanceFlags(runtime, options);

    defineReadOnlyGlobal(
        runtime,
        "RN$useAlwaysAvailableJSErrorHandling",
        jsi::Value(
            ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling()));

    defineReadOnlyGlobal(
        runtime,
        "RN$isRuntimeReady",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "isRuntimeReady"),
            0,
            [jsErrorHandler = jsErrorHandler_](
                jsi::Runtime& /*runtime*/,
                const jsi::Value& /*unused*/,
                const jsi::Value* /*args*/,
                size_t /*count*/) {
              return jsErrorHandler->isRuntimeReady();
            }));

    defineReadOnlyGlobal(
        runtime,
        "RN$hasHandledFatalException",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "hasHandledFatalException"),
            0,
            [jsErrorHandler = jsErrorHandler_](
                jsi::Runtime& /*runtime*/,
                const jsi::Value& /*unused*/,
                const jsi::Value* /*args*/,
                size_t /*count*/) {
              return jsErrorHandler->hasHandledFatalError();
            }));

    defineReadOnlyGlobal(
        runtime,
        "RN$notifyOfFatalException",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "notifyOfFatalException"),
            0,
            [jsErrorHandler = jsErrorHandler_](
                jsi::Runtime& /*runtime*/,
                const jsi::Value& /*unused*/,
                const jsi::Value* /*args*/,
                size_t /*count*/) {
              jsErrorHandler->notifyOfFatalError();
              return jsi::Value::undefined();
            }));

    defineReadOnlyGlobal(
        runtime,
        "RN$inExceptionHandler",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "inExceptionHandler"),
            0,
            [jsErrorHandler = jsErrorHandler_](
                jsi::Runtime& /*runtime*/,
                const jsi::Value& /*unused*/,
                const jsi::Value* /*args*/,
                size_t /*count*/) {
              return jsErrorHandler->inErrorHandler();
            }));

    // TODO(T196834299): We should really use a C++ turbomodule for this
    defineReadOnlyGlobal(
        runtime,
        "RN$handleException",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "handleException"),
            3,
            [jsErrorHandler = jsErrorHandler_](
                jsi::Runtime& runtime,
                const jsi::Value& /*unused*/,
                const jsi::Value* args,
                size_t count) {
              if (count < 2) {
                throw jsi::JSError(
                    runtime,
                    "handleException requires 3 arguments: error, isFatal, logToConsole (optional)");
              }

              auto isFatal = isTruthy(runtime, args[1]);

              if (!ReactNativeFeatureFlags::
                      useAlwaysAvailableJSErrorHandling()) {
                if (jsErrorHandler->isRuntimeReady()) {
                  return jsi::Value(false);
                }
              }

              auto jsError =
                  jsi::JSError(runtime, jsi::Value(runtime, args[0]));

              if (count == 2) {
                jsErrorHandler->handleError(runtime, jsError, isFatal);
              } else {
                auto logToConsole = isTruthy(runtime, args[2]);
                jsErrorHandler->handleError(
                    runtime, jsError, isFatal, logToConsole);
              }

              return jsi::Value(true);
            }));

    defineReadOnlyGlobal(
        runtime,
        "RN$registerExceptionListener",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "registerExceptionListener"),
            1,
            [errorListeners = std::vector<std::shared_ptr<jsi::Function>>(),
             jsErrorHandler = jsErrorHandler_](
                jsi::Runtime& runtime,
                const jsi::Value& /*unused*/,
                const jsi::Value* args,
                size_t count) mutable {
              if (count < 1) {
                throw jsi::JSError(
                    runtime,
                    "registerExceptionListener: requires 1 argument: fn");
              }

              if (!args[0].isObject() ||
                  !args[0].getObject(runtime).isFunction(runtime)) {
                throw jsi::JSError(
                    runtime,
                    "registerExceptionListener: The first argument must be a function");
              }

              auto errorListener = std::make_shared<jsi::Function>(
                  args[0].getObject(runtime).getFunction(runtime));
              errorListeners.emplace_back(errorListener);

              jsErrorHandler->registerErrorListener(
                  [weakErrorListener = std::weak_ptr<jsi::Function>(
                       errorListener)](jsi::Runtime& runtime, jsi::Value data) {
                    if (auto strongErrorListener = weakErrorListener.lock()) {
                      strongErrorListener->call(runtime, data);
                    }
                  });

              return jsi::Value::undefined();
            }));

    defineReadOnlyGlobal(
        runtime,
        "RN$registerCallableModule",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "registerCallableModule"),
            2,
            [this](
                jsi::Runtime& runtime,
                const jsi::Value& /*unused*/,
                const jsi::Value* args,
                size_t count) {
              if (count != 2) {
                throw jsi::JSError(
                    runtime,
                    "registerCallableModule requires exactly 2 arguments");
              }
              if (!args[0].isString()) {
                throw jsi::JSError(
                    runtime,
                    "The first argument to registerCallableModule must be a string (the name of the JS module).");
              }
              auto name = args[0].asString(runtime).utf8(runtime);
              if (!args[1].isObject() ||
                  !args[1].getObject(runtime).isFunction(runtime)) {
                throw jsi::JSError(
                    runtime,
                    "The second argument to registerCallableModule must be a function that returns the JS module.");
              }
              callableModules_.emplace(
                  std::move(name),
                  args[1].getObject(runtime).getFunction(runtime));
              return jsi::Value::undefined();
            }));

    timerManager_->attachGlobals(runtime);

    bindingsInstallFunc(runtime);
  });
}

void ReactInstance::handleMemoryPressureJs(int pressureLevel) {
  // The level is an enum value passed by the Android OS to an onTrimMemory
  // event callback. Defined in ComponentCallbacks2.
  enum AndroidMemoryPressure {
    TRIM_MEMORY_BACKGROUND = 40,
    TRIM_MEMORY_COMPLETE = 80,
    TRIM_MEMORY_MODERATE = 60,
    TRIM_MEMORY_RUNNING_CRITICAL = 15,
    TRIM_MEMORY_RUNNING_LOW = 10,
    TRIM_MEMORY_RUNNING_MODERATE = 5,
    TRIM_MEMORY_UI_HIDDEN = 20,
  };
  const char* levelName = nullptr;
  switch (pressureLevel) {
    case TRIM_MEMORY_BACKGROUND:
      levelName = "TRIM_MEMORY_BACKGROUND";
      break;
    case TRIM_MEMORY_COMPLETE:
      levelName = "TRIM_MEMORY_COMPLETE";
      break;
    case TRIM_MEMORY_MODERATE:
      levelName = "TRIM_MEMORY_MODERATE";
      break;
    case TRIM_MEMORY_RUNNING_CRITICAL:
      levelName = "TRIM_MEMORY_RUNNING_CRITICAL";
      break;
    case TRIM_MEMORY_RUNNING_LOW:
      levelName = "TRIM_MEMORY_RUNNING_LOW";
      break;
    case TRIM_MEMORY_RUNNING_MODERATE:
      levelName = "TRIM_MEMORY_RUNNING_MODERATE";
      break;
    case TRIM_MEMORY_UI_HIDDEN:
      levelName = "TRIM_MEMORY_UI_HIDDEN";
      break;
    default:
      levelName = "UNKNOWN";
      break;
  }

  switch (pressureLevel) {
    case TRIM_MEMORY_RUNNING_LOW:
    case TRIM_MEMORY_RUNNING_MODERATE:
    case TRIM_MEMORY_UI_HIDDEN:
      // For non-severe memory trims, do nothing.
      LOG(INFO) << "Memory warning (pressure level: " << levelName
                << ") received by JS VM, ignoring because it's non-severe";
      break;
    case TRIM_MEMORY_BACKGROUND:
    case TRIM_MEMORY_COMPLETE:
    case TRIM_MEMORY_MODERATE:
    case TRIM_MEMORY_RUNNING_CRITICAL:
      // For now, pressureLevel is unused by collectGarbage.
      // This may change in the future if the JS GC has different styles of
      // collections.
      LOG(INFO) << "Memory warning (pressure level: " << levelName
                << ") received by JS VM, running a GC";
      runtimeScheduler_->scheduleWork([=](jsi::Runtime& runtime) {
        TraceSection s("ReactInstance::handleMemoryPressure");
        runtime.instrumentation().collectGarbage(levelName);
      });
      break;
    default:
      // Use the raw number instead of the name here since the name is
      // meaningless.
      LOG(WARNING) << "Memory warning (pressure level: " << pressureLevel
                   << ") received by JS VM, unrecognized pressure level";
      break;
  }
}

void* ReactInstance::getJavaScriptContext() {
  return &runtime_->getRuntime();
}

} // namespace facebook::react
