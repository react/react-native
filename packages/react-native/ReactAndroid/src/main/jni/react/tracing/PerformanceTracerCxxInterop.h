/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <react/jni/ReadableNativeMap.h>

namespace facebook::react {

class TracingStateCallback
    : public facebook::jni::JavaClass<TracingStateCallback> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/internal/tracing/PerformanceTracer$TracingStateCallback;";

  void onTracingStateChanged(bool isTracing) const;
};

class PerformanceTracerCxxInterop
    : public facebook::jni::JavaClass<PerformanceTracerCxxInterop> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/internal/tracing/PerformanceTracer;";

  static void reportMark(
      facebook::jni::alias_ref<PerformanceTracerCxxInterop> jthis,
      facebook::jni::alias_ref<jstring> name,
      jlong timestampNanos,
      facebook::jni::alias_ref<ReadableNativeMap::javaobject> detail);

  static void reportMeasure(
      facebook::jni::alias_ref<PerformanceTracerCxxInterop> jthis,
      facebook::jni::alias_ref<jstring> name,
      jlong startTimestampNanos,
      jlong durationNanos,
      facebook::jni::alias_ref<ReadableNativeMap::javaobject> detail);

  static void reportTimeStamp(
      facebook::jni::alias_ref<PerformanceTracerCxxInterop> jthis,
      facebook::jni::alias_ref<jstring> name,
      jlong startTimeNanos,
      jlong endTimeNanos,
      facebook::jni::alias_ref<jstring> trackName,
      facebook::jni::alias_ref<jstring> trackGroup,
      facebook::jni::alias_ref<jstring> color);

  static jboolean isTracing(
      facebook::jni::alias_ref<PerformanceTracerCxxInterop> jthis);

  static jint subscribeToTracingStateChanges(
      facebook::jni::alias_ref<PerformanceTracerCxxInterop> jthis,
      facebook::jni::alias_ref<TracingStateCallback::javaobject> callback);

  static void unsubscribeFromTracingStateChanges(
      facebook::jni::alias_ref<PerformanceTracerCxxInterop> jthis,
      jint subscriptionId);

  static void registerNatives();
};

} // namespace facebook::react
