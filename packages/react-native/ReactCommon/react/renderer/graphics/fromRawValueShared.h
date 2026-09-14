/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/graphics/Color.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

using parsePlatformColorFn = SharedColor (*)(const ContextContainer &, int32_t, const RawValue &);

void fromRawValueShared(
    const ContextContainer &contextContainer,
    int32_t surfaceId,
    const RawValue &value,
    SharedColor &result,
    parsePlatformColorFn parsePlatformColor);

} // namespace facebook::react
