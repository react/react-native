/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>
#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSPercentage.h>

namespace facebook::react {

/**
 * Marker for the <length-percentage> data type
 * https://drafts.csswg.org/css-values/#mixed-percentages
 */
using CSSLengthPercentage = CSSCompoundDataType<CSSLength, CSSPercentage>;

} // namespace facebook::react
