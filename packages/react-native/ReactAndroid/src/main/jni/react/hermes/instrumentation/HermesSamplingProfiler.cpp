/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesSamplingProfiler.h"

#include <hermes/hermes.h>

namespace facebook::jsi::jni {

void HermesSamplingProfiler::enable(jni::alias_ref<jclass> /*unused*/) {
  auto* hermesAPI =
      castInterface<hermes::IHermesRootAPI>(hermes::makeHermesRootAPI());
  hermesAPI->enableSamplingProfiler();
}

void HermesSamplingProfiler::disable(jni::alias_ref<jclass> /*unused*/) {
  auto* hermesAPI =
      castInterface<hermes::IHermesRootAPI>(hermes::makeHermesRootAPI());
  hermesAPI->disableSamplingProfiler();
}

void HermesSamplingProfiler::dumpSampledTraceToFile(
    jni::alias_ref<jclass> /*unused*/,
    const std::string& filename) {
  auto* hermesAPI =
      castInterface<hermes::IHermesRootAPI>(hermes::makeHermesRootAPI());
  hermesAPI->dumpSampledTraceToFile(filename);
}

void HermesSamplingProfiler::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("enable", HermesSamplingProfiler::enable),
      makeNativeMethod("disable", HermesSamplingProfiler::disable),
      makeNativeMethod(
          "dumpSampledTraceToFile",
          HermesSamplingProfiler::dumpSampledTraceToFile),
  });
}

} // namespace facebook::jsi::jni
