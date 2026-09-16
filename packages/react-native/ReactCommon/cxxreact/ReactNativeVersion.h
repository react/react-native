/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#warning "Deprecated: use <React/Utils.h> instead."

#pragma push_macro("RN_UMBRELLA_CONTEXT")
#undef RN_UMBRELLA_CONTEXT
#define RN_UMBRELLA_CONTEXT 1

#include <react/utils/ReactNativeVersion.h>

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")
