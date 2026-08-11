/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include("rncoreJSI.h") // Cmake headers on Android
#include "rncoreJSI.h"
#elif __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

namespace facebook::react {

class NativeCPUTime : public NativeCPUTimeCxxSpec<NativeCPUTime> {
 public:
  explicit NativeCPUTime(std::shared_ptr<CallInvoker> jsInvoker);

  double getCPUTimeNanos(jsi::Runtime& runtime);
  bool hasAccurateCPUTimeNanosForBenchmarks(jsi::Runtime& runtime);
};

} // namespace facebook::react
