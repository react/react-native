/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/bridging` module - public entry point.
//
//   #include <React/Bridging.h>
// =============================================================================

#pragma push_macro("RN_UMBRELLA_CONTEXT")
#undef RN_UMBRELLA_CONTEXT
#define RN_UMBRELLA_CONTEXT 1

#include <react/bridging/AString.h>
#include <react/bridging/Array.h>
#include <react/bridging/ArrayBuffer.h>
#include <react/bridging/Base.h>
#include <react/bridging/Bool.h>
#include <react/bridging/Bridging.h>
#include <react/bridging/CallbackWrapper.h>
#include <react/bridging/Class.h>
#include <react/bridging/Convert.h>
#include <react/bridging/Dynamic.h>
#include <react/bridging/Error.h>
#include <react/bridging/EventEmitter.h>
#include <react/bridging/Function.h>
#include <react/bridging/HighResTimeStamp.h>
#include <react/bridging/LongLivedObject.h>
#include <react/bridging/Number.h>
#include <react/bridging/Object.h>
#include <react/bridging/Promise.h>
#include <react/bridging/Value.h>

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")
