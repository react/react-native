/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/profiling/perfetto.h>

#if WITH_PERFETTO
#include <mutex>

void initializePerfetto() {
  static constinit std::once_flag s_PerfettoIsInitialized;

  std::call_once(s_PerfettoIsInitialized, []() {
    perfetto::TracingInitArgs args;
    args.shmem_size_hint_kb = 20 * 1024;
#ifdef ANDROID
    args.backends |= perfetto::kSystemBackend;
#else
    args.backends |= perfetto::kInProcessBackend;
#endif
    args.use_monotonic_clock = true;
    perfetto::Tracing::Initialize(args);
    facebook::react::TrackEvent::Register();
  });
}

#endif // WITH_PERFETTO
