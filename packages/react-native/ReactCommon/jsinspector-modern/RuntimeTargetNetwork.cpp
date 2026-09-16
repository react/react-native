/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/InspectorFlags.h>
#include <jsinspector-modern/RuntimeTarget.h>
#include <jsinspector-modern/network/NetworkHandler.h>

#include <react/utils/Uuid.h>

using namespace facebook::jsi;
using namespace std::string_literals;

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * JS `Object.create()`
 */
Object objectCreate(Runtime& runtime, Value prototype) {
  auto objectGlobal = runtime.global().getPropertyAsObject(runtime, "Object");
  auto createFn = objectGlobal.getPropertyAsFunction(runtime, "create");
  return createFn.callWithThis(runtime, objectGlobal, prototype)
      .getObject(runtime);
}

/**
 * JS `Object.freeze()`
 */
Object objectFreeze(Runtime& runtime, Object object) {
  auto objectGlobal = runtime.global().getPropertyAsObject(runtime, "Object");
  auto freezeFn = objectGlobal.getPropertyAsFunction(runtime, "freeze");
  return freezeFn.callWithThis(runtime, objectGlobal, object)
      .getObject(runtime);
}

} // namespace

void RuntimeTarget::installNetworkReporterAPI() {
  auto jsiCreateDevToolsRequestId = [selfWeak = weak_from_this()](
                                        Runtime& runtime,
                                        const Value& /*thisVal*/,
                                        const Value* /*args*/,
                                        size_t /*count*/) -> Value {
    std::optional<std::string> devToolsRequestId;
    tryExecuteSync(selfWeak, [&](RuntimeTarget& self) {
      devToolsRequestId = self.createNetworkRequestId();
      if (self.isDomainEnabled(Domain::Network)) {
        // Q: Why is it safe to use self.delegate_ here?
        // A: Because the caller of InspectorTarget::registerRuntime
        // is explicitly required to guarantee that the delegate not
        // only outlives the target, but also outlives all JS code
        // execution that occurs on the JS thread.
        auto stackTrace = self.delegate_.captureStackTrace(runtime);
        auto cdpStackTrace = self.delegate_.serializeStackTrace(*stackTrace);
        if (cdpStackTrace) {
          NetworkHandler::getInstance().recordRequestInitiatorStack(
              *devToolsRequestId, std::move(*cdpStackTrace));
        }
      }
    });
    if (!devToolsRequestId) {
      throw JSError(runtime, "React Native Runtime is shutting down");
    }
    return String::createFromUtf8(runtime, *devToolsRequestId);
  };

  jsExecutor_([selfWeak = weak_from_this(),
               selfExecutor = executorFromThis(),
               jsiCreateDevToolsRequestId =
                   std::move(jsiCreateDevToolsRequestId)](Runtime& runtime) {
    auto globalObj = runtime.global();
    auto networkReporterApi = objectCreate(runtime, nullptr);
    networkReporterApi.setProperty(
        runtime,
        "createDevToolsRequestId",
        Function::createFromHostFunction(
            runtime,
            PropNameID::forAscii(runtime, "createDevToolsRequestId"),
            0,
            jsiCreateDevToolsRequestId));
    networkReporterApi = objectFreeze(runtime, std::move(networkReporterApi));
    globalObj.setProperty(runtime, "__NETWORK_REPORTER__", networkReporterApi);
  });
}

std::string RuntimeTarget::createNetworkRequestId() {
  return generateRandomUuidString();
}

} // namespace facebook::react::jsinspector_modern
