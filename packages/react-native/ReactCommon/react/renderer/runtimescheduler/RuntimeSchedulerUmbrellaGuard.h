/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// POC: This header is intentionally NOT `#pragma once` guarded. It must be
// re-evaluated on every inclusion so that any direct `#include` of a private
// module header is caught.
//
// The runtimescheduler module exposes a single public entry point:
//   <react/renderer/runtimescheduler/RuntimeScheduler.umbrella.h>
//
// All other headers in this module are implementation details. To enforce
// that, define `REACT_RUNTIMESCHEDULER_ENFORCE_UMBRELLA` for the consuming
// build target. When enforcement is on, including any module header other than
// the umbrella (and outside of the module's own build) becomes a hard error.
//
// Enforcement is OPT-IN: when the macro is not defined the guard is inert, so
// existing consumers and the OSS CMake build are unaffected by this POC.

#if defined(REACT_RUNTIMESCHEDULER_ENFORCE_UMBRELLA) && !defined(REACT_RUNTIMESCHEDULER_UMBRELLA_INCLUDE) && \
    !defined(REACT_RUNTIMESCHEDULER_BUILDING)
#error \
    "Do not include runtimescheduler headers directly. Include <react/renderer/runtimescheduler/RuntimeScheduler.umbrella.h> instead."
#endif
