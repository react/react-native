/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeTargetGlobalStateObserver.h"

#include <string>

namespace facebook::react::jsinspector_modern {

void installGlobalStateObserver(
    jsi::Runtime& runtime,
    const char* globalName,
    const char* statusProperty,
    const char* callbackName) {
  auto globalObj = runtime.global();
  try {
    auto observer = jsi::Object(runtime);

    observer.setProperty(runtime, statusProperty, jsi::Value(false));

    auto setFunction = globalObj.getPropertyAsFunction(runtime, "Set");
    auto set = setFunction.callAsConstructor(runtime);
    observer.setProperty(runtime, "subscribers", set);

    std::string globalNameStr(globalName);
    std::string statusPropertyStr(statusProperty);

    observer.setProperty(
        runtime,
        callbackName,
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, callbackName),
            1,
            [globalNameStr, statusPropertyStr](
                jsi::Runtime& callbackRuntime,
                const jsi::Value& /* thisVal */,
                const jsi::Value* args,
                size_t argsCount) {
              if (argsCount != 1 || !args[0].isBool()) {
                throw jsi::JSError(
                    callbackRuntime,
                    "Invalid arguments: state change callback expects 1 boolean argument");
              }

              bool updatedStatus = args[0].getBool();

              auto observerInstance =
                  callbackRuntime.global().getPropertyAsObject(
                      callbackRuntime, globalNameStr.c_str());
              auto subscribersToNotify = observerInstance.getPropertyAsObject(
                  callbackRuntime, "subscribers");

              observerInstance.setProperty(
                  callbackRuntime, statusPropertyStr.c_str(), updatedStatus);

              if (subscribersToNotify.getProperty(callbackRuntime, "size")
                      .asNumber() == 0) {
                return jsi::Value::undefined();
              }

              auto forEachSubscriber =
                  subscribersToNotify.getPropertyAsFunction(
                      callbackRuntime, "forEach");
              auto forEachSubscriberCallback = jsi::Function::createFromHostFunction(
                  callbackRuntime,
                  jsi::PropNameID::forAscii(callbackRuntime, "forEachCallback"),
                  1,
                  [updatedStatus](
                      jsi::Runtime& forEachCallbackRuntime,
                      const jsi::Value& /* forEachCallbackThisVal */,
                      const jsi::Value* forEachCallbackArgs,
                      size_t forEachCallbackArgsCount) {
                    if (forEachCallbackArgsCount < 1 ||
                        !forEachCallbackArgs[0].isObject() ||
                        !forEachCallbackArgs[0]
                             .getObject(forEachCallbackRuntime)
                             .isFunction(forEachCallbackRuntime)) {
                      throw jsi::JSError(
                          forEachCallbackRuntime,
                          "Invalid arguments: forEachSubscriberCallback expects function as a first argument");
                    }

                    forEachCallbackArgs[0]
                        .getObject(forEachCallbackRuntime)
                        .asFunction(forEachCallbackRuntime)
                        .call(forEachCallbackRuntime, updatedStatus);

                    return jsi::Value::undefined();
                  });

              forEachSubscriber.callWithThis(
                  callbackRuntime,
                  subscribersToNotify,
                  forEachSubscriberCallback);

              return jsi::Value::undefined();
            }));

    globalObj.setProperty(runtime, globalName, observer);
  } catch (jsi::JSError&) {
    // Suppress any errors, they should not be visible to the user
    // and should not affect runtime.
  }
}

void emitGlobalStateObserverChange(
    jsi::Runtime& runtime,
    const char* globalName,
    const char* callbackName,
    bool value) {
  auto globalObj = runtime.global();
  auto observer = globalObj.getPropertyAsObject(runtime, globalName);
  auto callback = observer.getPropertyAsFunction(runtime, callbackName);
  callback.call(runtime, jsi::Value(value));
}

} // namespace facebook::react::jsinspector_modern
