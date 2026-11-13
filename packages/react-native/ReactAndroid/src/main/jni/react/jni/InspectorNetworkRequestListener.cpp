/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorNetworkRequestListener.h"
#include "SafeReleaseJniRef.h"

#include <map>
#include <utility>

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react {

InspectorNetworkRequestListener::InspectorNetworkRequestListener(
    jsinspector_modern::ScopedExecutor<
        jsinspector_modern::NetworkRequestListener> executor)
    : executor_(std::move(executor)) {}

void InspectorNetworkRequestListener::registerNatives() {
  registerHybrid({
      makeNativeMethod("onHeaders", InspectorNetworkRequestListener::onHeaders),
      makeNativeMethod("onData", InspectorNetworkRequestListener::onData),
      makeNativeMethod("onError", InspectorNetworkRequestListener::onError),
      makeNativeMethod(
          "onCompletion", InspectorNetworkRequestListener::onCompletion),
  });
}

void InspectorNetworkRequestListener::onHeaders(
    jint httpStatusCode,
    jni::alias_ref<jni::JMap<jstring, jstring>> headers) {
  executor_([httpStatusCode = httpStatusCode,
             headers = SafeReleaseJniRef(make_global(headers))](
                jsinspector_modern::NetworkRequestListener& listener) {
    std::map<std::string, std::string> headersMap;

    for (auto it : *headers) {
      auto key = it.first->toStdString();
      auto value = it.second->toStdString();
      headersMap[key] = value;
    }

    listener.onHeaders(httpStatusCode, headersMap);
  });
}

void InspectorNetworkRequestListener::onData(jni::alias_ref<jstring> data) {
  executor_([data = SafeReleaseJniRef(make_global(data))](
                jsinspector_modern::NetworkRequestListener& listener) {
    listener.onData(data->toStdString());
  });
}

void InspectorNetworkRequestListener::onError(jni::alias_ref<jstring> message) {
  executor_([message = SafeReleaseJniRef(make_global(message))](
                jsinspector_modern::NetworkRequestListener& listener) {
    listener.onError(
        // Handle @Nullable string param
        message->isInstanceOf(jni::JString::javaClassStatic()) &&
                !message->toStdString().empty()
            ? message->toStdString()
            : "Unknown error");
  });
}

void InspectorNetworkRequestListener::onCompletion() {
  executor_([](jsinspector_modern::NetworkRequestListener& listener) {
    listener.onCompletion();
  });
}

} // namespace facebook::react
