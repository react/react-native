/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/graphics/BoxShadow.h>
#include <vector>

namespace facebook::react {

void fromRawValue(const PropsParserContext &context, const RawValue &value, std::vector<BoxShadow> &result);

} // namespace facebook::react
