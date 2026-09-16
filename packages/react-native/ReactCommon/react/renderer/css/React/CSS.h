/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/css` module - public entry point.
//
//   #include <React/CSS.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/css/...>` includes,
// except in headers it exports to consumers: those are preprocessed in the
// consumer's translation unit, where the fine-grained include hits this
// module's <react/cxxstableapi/UmbrellaGuard.h>. `RN_ALLOW_FRAMEWORKS` does not
// suppress that guard, so a "for frameworks" header must reach this module
// through the umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them. The marker
// is saved and restored rather than defined and undefined: the scope ends at
// this block, so later *direct* includes in the same TU are still caught, and
// it nests inside an enclosing umbrella rather than disarming it.
#pragma push_macro("RN_UMBRELLA_CONTEXT")
#undef RN_UMBRELLA_CONTEXT
#define RN_UMBRELLA_CONTEXT 1

#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSAngleUnit.h>
#include <react/renderer/css/CSSBackgroundImage.h>
#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSColorFunction.h>
#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSFilter.h>
#include <react/renderer/css/CSSFontVariant.h>
#include <react/renderer/css/CSSHexColor.h>
#include <react/renderer/css/CSSKeyword.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSLengthUnit.h>
#include <react/renderer/css/CSSList.h>
#include <react/renderer/css/CSSNamedColor.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSRatio.h>
#include <react/renderer/css/CSSShadow.h>
#include <react/renderer/css/CSSSyntaxParser.h>
#include <react/renderer/css/CSSToken.h>
#include <react/renderer/css/CSSTokenizer.h>
#include <react/renderer/css/CSSTransform.h>
#include <react/renderer/css/CSSTransformOrigin.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/css/CSSZero.h>

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")
