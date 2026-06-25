/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TimerManager.h"

#include <cxxreact/TraceSection.h>

#include <cmath>
#include <utility>

namespace facebook::react {

namespace {

double coerceNumberTimeout(jsi::Runtime& rt, const jsi::Value& timeout) {
  double delay = 0.0;

  // fast-path
  if (timeout.isNumber()) {
    delay = timeout.getNumber();
  } else {
    // perform number coercion for timeout to be web spec compliant
    auto numberCtor = rt.global().getPropertyAsObject(rt, "Number");
    auto delayNumberObject =
        numberCtor.getFunction(rt).callAsConstructor(rt, timeout).getObject(rt);
    auto delayNumericValue =
        delayNumberObject.getPropertyAsFunction(rt, "valueOf")
            .callWithThis(rt, delayNumberObject);
    delay = delayNumericValue.isNumber() ? delayNumericValue.getNumber() : 0;
  }

  return std::isnan(delay) ? 0.0 : std::max(0.0, delay);
}

inline const char* getTimerSourceName(TimerSource source) {
  switch (source) {
    case TimerSource::Unknown:
      return "unknown";
    case TimerSource::SetTimeout:
      return "setTimeout";
    case TimerSource::SetInterval:
      return "setInterval";
    case TimerSource::RequestAnimationFrame:
      return "requestAnimationFrame";
  }
  return "unknown";
}

} // namespace

TimerManager::TimerManager(
    std::unique_ptr<PlatformTimerRegistry> platformTimerRegistry) noexcept
    : platformTimerRegistry_(std::move(platformTimerRegistry)) {}

TimerManager::~TimerManager() noexcept {
  quit();
}

void TimerManager::quit() {
  if (platformTimerRegistry_ == nullptr) {
    return;
  }
  platformTimerRegistry_->quit();
  platformTimerRegistry_ = nullptr;
}

void TimerManager::setRuntimeExecutor(
    RuntimeExecutor runtimeExecutor) noexcept {
  runtimeExecutor_ = std::move(runtimeExecutor);
}

TimerHandle TimerManager::createTimer(
    jsi::Function&& callback,
    std::vector<jsi::Value>&& args,
    double delay,
    TimerSource source) {
  // Get the id for the callback.
  TimerHandle timerID = timerIndex_++;

  TraceSection s(
      "TimerManager::createTimer",
      "id",
      timerID,
      "type",
      getTimerSourceName(source),
      "delay",
      delay);

  timers_.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(timerID),
      std::forward_as_tuple(
          std::move(callback),
          std::move(args),
          /* repeat */ false,
          source));

  platformTimerRegistry_->createTimer(timerID, delay);

  return timerID;
}

TimerHandle TimerManager::createRecurringTimer(
    jsi::Function&& callback,
    std::vector<jsi::Value>&& args,
    double delay,
    TimerSource source) {
  // Get the id for the callback.
  TimerHandle timerID = timerIndex_++;

  TraceSection s(
      "TimerManager::createRecurringTimer",
      "id",
      timerID,
      "type",
      getTimerSourceName(source),
      "delay",
      delay);

  timers_.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(timerID),
      std::forward_as_tuple(
          std::move(callback), std::move(args), /* repeat */ true, source));

  platformTimerRegistry_->createRecurringTimer(timerID, delay);

  return timerID;
}

void TimerManager::deleteTimer(
    jsi::Runtime& /* runtime */,
    TimerHandle timerHandle) {
  if (timerHandle < 0) {
    /**
     * Do nothing for negative values to match web spec.
     *
     * cancelAnimationFrame:
     * https://www.w3.org/TR/animation-timing/#Window-interface-extensions
     * clearTimeout:
     * https://developer.mozilla.org/en-US/docs/Web/API/Window/clearTimeout#notes
     */
    return;
  }

  platformTimerRegistry_->deleteTimer(timerHandle);
  timers_.erase(timerHandle);
}

void TimerManager::deleteRecurringTimer(
    jsi::Runtime& /* runtime */,
    TimerHandle timerHandle) {
  if (timerHandle < 0) {
    /**
     * Do nothing for negative values to match web spec.
     *
     * clearInterval:
     * https://developer.mozilla.org/en-US/docs/Web/API/Window/clearInterval
     */
    return;
  }

  platformTimerRegistry_->deleteTimer(timerHandle);
  timers_.erase(timerHandle);
}

void TimerManager::callTimer(TimerHandle timerHandle) {
  runtimeExecutor_([this, timerHandle](jsi::Runtime& runtime) {
    auto it = timers_.find(timerHandle);
    if (it != timers_.end()) {
      auto& timerCallback = it->second;
      bool repeats = timerCallback.repeat;

      {
        TraceSection s(
            "TimerManager::callTimer",
            "id",
            timerHandle,
            "type",
            getTimerSourceName(timerCallback.source));
        timerCallback.invoke(runtime);
      }

      if (!repeats) {
        // Invoking a timer has the potential to delete it. Do not re-use the
        // existing iterator to erase it from the map.
        timers_.erase(timerHandle);
      }
    }
  });
}

void TimerManager::attachGlobals(jsi::Runtime& runtime) {
  // Install host functions for timers.
  // TODO (T45786383): Add missing timer functions from JSTimers
  runtime.global().setProperty(
      runtime,
      "setTimeout",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "setTimeout"),
          3, // Function, delay, ...args
          [this](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t count) {
            if (count == 0) {
              throw jsi::JSError(
                  rt,
                  "setTimeout must be called with at least one argument (the function to call).");
            }

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
              // Do not throw any error to match web spec; instead return 0, an
              // invalid timer id
              return 0;
            }

            auto callback = args[0].getObject(rt).getFunction(rt);
            auto delay = count > 1 ? coerceNumberTimeout(rt, args[1]) : 0.0;

            // Package up the remaining argument values into one place.
            std::vector<jsi::Value> moreArgs;
            for (size_t extraArgNum = 2; extraArgNum < count; extraArgNum++) {
              moreArgs.emplace_back(rt, args[extraArgNum]);
            }

            return createTimer(
                std::move(callback),
                std::move(moreArgs),
                delay,
                TimerSource::SetTimeout);
          }));

  runtime.global().setProperty(
      runtime,
      "clearTimeout",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "clearTimeout"),
          1, // timerID
          [this](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t count) {
            if (count > 0 && args[0].isNumber()) {
              auto handle = (TimerHandle)args[0].asNumber();
              deleteTimer(rt, handle);
            }
            return jsi::Value::undefined();
          }));

  runtime.global().setProperty(
      runtime,
      "setInterval",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "setInterval"),
          3, // Function, delay, ...args
          [this](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t count) {
            if (count == 0) {
              throw jsi::JSError(
                  rt,
                  "setInterval must be called with at least one argument (the function to call).");
            }

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
              // Do not throw any error to match web spec; instead return 0, an
              // invalid timer id
              return 0;
            }
            auto callback = args[0].getObject(rt).getFunction(rt);
            auto delay = count > 1
                ? coerceNumberTimeout(rt, jsi::Value{rt, args[1]})
                : 0.0;

            // Package up the remaining argument values into one place.
            std::vector<jsi::Value> moreArgs;
            for (size_t extraArgNum = 2; extraArgNum < count; extraArgNum++) {
              moreArgs.emplace_back(rt, args[extraArgNum]);
            }

            return createRecurringTimer(
                std::move(callback),
                std::move(moreArgs),
                delay,
                TimerSource::SetInterval);
          }));

  runtime.global().setProperty(
      runtime,
      "clearInterval",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "clearInterval"),
          1, // timerID
          [this](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t count) {
            if (count > 0 && args[0].isNumber()) {
              auto handle = (TimerHandle)args[0].asNumber();
              deleteRecurringTimer(rt, handle);
            }
            return jsi::Value::undefined();
          }));

  runtime.global().setProperty(
      runtime,
      "requestAnimationFrame",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "requestAnimationFrame"),
          1, // callback
          [this](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t count) {
            if (count == 0) {
              throw jsi::JSError(
                  rt,
                  "requestAnimationFrame must be called with at least one argument (i.e: a callback)");
            }

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
              throw jsi::JSError(
                  rt,
                  "The first argument to requestAnimationFrame must be a function.");
            }

            auto callback = jsi::Function::createFromHostFunction(
                rt,
                jsi::PropNameID::forAscii(rt, "RN$rafFn"),
                0,
                [callbackContainer = std::make_shared<jsi::Function>(
                     args[0].getObject(rt).getFunction(rt))](
                    jsi::Runtime& rt,
                    const jsi::Value& /*thisVal*/,
                    const jsi::Value* /*args*/,
                    size_t /*count*/) {
                  auto performance =
                      rt.global().getPropertyAsObject(rt, "performance");
                  auto nowFn = performance.getPropertyAsFunction(rt, "now");
                  auto now = nowFn.callWithThis(rt, performance, {});
                  return callbackContainer->call(rt, {std::move(now)});
                });

            // The current implementation of requestAnimationFrame is the same
            // as setTimeout(0). This isn't exactly how requestAnimationFrame
            // is supposed to work on web, and may change in the future.
            return createTimer(
                std::move(callback),
                std::vector<jsi::Value>(),
                /* delay */ 0,
                TimerSource::RequestAnimationFrame);
          }));

  runtime.global().setProperty(
      runtime,
      "cancelAnimationFrame",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "cancelAnimationFrame"),
          1, // timerID
          [this](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t count) {
            if (count > 0 && args[0].isNumber()) {
              auto handle = (TimerHandle)args[0].asNumber();
              deleteTimer(rt, handle);
            }
            return jsi::Value::undefined();
          }));
}

} // namespace facebook::react
