/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsinspector-modern/HostTarget.h>
#include <jsinspector-modern/NetworkIOAgent.h>
#include <jsinspector-modern/ScopedExecutor.h>
#include <react/jni/JExecutor.h>

namespace facebook::react {

class InspectorNetworkRequestListener
    : public jni::HybridClass<InspectorNetworkRequestListener> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/devsupport/inspector/InspectorNetworkRequestListener;";

  static void registerNatives();

  void onHeaders(
      jint httpStatusCode,
      jni::alias_ref<jni::JMap<jstring, jstring>> headers);
  void onData(jni::alias_ref<jstring> data);
  void onError(jni::alias_ref<jstring> message);
  void onCompletion();

 private:
  friend HybridBase;

  InspectorNetworkRequestListener(
      jsinspector_modern::ScopedExecutor<
          jsinspector_modern::NetworkRequestListener> executor);

  jsinspector_modern::ScopedExecutor<jsinspector_modern::NetworkRequestListener>
      executor_;
};

} // namespace facebook::react
