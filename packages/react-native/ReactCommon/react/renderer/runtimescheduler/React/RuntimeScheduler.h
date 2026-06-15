/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `runtimescheduler` module — public entry point.
//
// POC (public C++ API surface reduction). Consumers include ONLY this header,
// via the shared top-level `React/` prefix:
//
//   #include <React/RuntimeScheduler.h>
//
// The individual interface headers below are re-exported here. The fork
// implementations `RuntimeScheduler_Modern` / `RuntimeScheduler_Legacy` are
// deliberately NOT included: they are private to the build unit.
//
// The `React/` prefix is a shared namespace (also used by React-Core's Obj-C
// headers). Naming policy: one umbrella per module, named after the module, to
// avoid leaf collisions in the shared namespace.
//
// NOTE: this file lives at `react/renderer/runtimescheduler/React/` so the
// `<React/...>` include path can be produced physically (CMake) as well as via
// header maps (Buck) and `header_dir` (CocoaPods). RN-internal code should keep
// using the fine-grained `<react/renderer/runtimescheduler/...>` includes; only
// outside consumers use this umbrella.
// =============================================================================

// Mark that subsequent module headers are pulled in through the umbrella. This
// satisfies the per-header umbrella guard (see RuntimeSchedulerUmbrellaGuard.h).
#define REACT_RUNTIMESCHEDULER_UMBRELLA_INCLUDE

#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerEventTimingDelegate.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerIntersectionObserverDelegate.h>
#include <react/renderer/runtimescheduler/SchedulerPriorityUtils.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <react/renderer/runtimescheduler/primitives.h>
