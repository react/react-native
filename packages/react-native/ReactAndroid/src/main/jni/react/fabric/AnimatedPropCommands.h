/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react::animationbackend {

// Buffer protocol command constants for batched animated prop updates.
// NOTE: Keep in sync with AnimatedPropCommandConstants.kt on the Java side.

// View delimiters
static constexpr int CMD_START_OF_VIEW = 1;
static constexpr int CMD_START_OF_TRANSFORM = 2;
static constexpr int CMD_END_OF_TRANSFORM = 3;
static constexpr int CMD_END_OF_VIEW = 4;

// Simple numeric props (value in doubleBuffer)
static constexpr int CMD_OPACITY = 10;
static constexpr int CMD_ELEVATION = 11;
static constexpr int CMD_Z_INDEX = 12;
static constexpr int CMD_SHADOW_OPACITY = 13;
static constexpr int CMD_SHADOW_RADIUS = 14;

// Color props (value as int in intBuffer)
static constexpr int CMD_BACKGROUND_COLOR = 15;
static constexpr int CMD_COLOR = 16;
static constexpr int CMD_TINT_COLOR = 17;

// Border radius props (value in doubleBuffer, unit in intBuffer)
static constexpr int CMD_BORDER_RADIUS = 20;
static constexpr int CMD_BORDER_TOP_LEFT_RADIUS = 21;
static constexpr int CMD_BORDER_TOP_RIGHT_RADIUS = 22;
static constexpr int CMD_BORDER_TOP_START_RADIUS = 23;
static constexpr int CMD_BORDER_TOP_END_RADIUS = 24;
static constexpr int CMD_BORDER_BOTTOM_LEFT_RADIUS = 25;
static constexpr int CMD_BORDER_BOTTOM_RIGHT_RADIUS = 26;
static constexpr int CMD_BORDER_BOTTOM_START_RADIUS = 27;
static constexpr int CMD_BORDER_BOTTOM_END_RADIUS = 28;
static constexpr int CMD_BORDER_START_START_RADIUS = 29;
static constexpr int CMD_BORDER_START_END_RADIUS = 30;
static constexpr int CMD_BORDER_END_START_RADIUS = 31;
static constexpr int CMD_BORDER_END_END_RADIUS = 32;

// Border color props (value as int in intBuffer)
static constexpr int CMD_BORDER_COLOR = 40;
static constexpr int CMD_BORDER_TOP_COLOR = 41;
static constexpr int CMD_BORDER_BOTTOM_COLOR = 42;
static constexpr int CMD_BORDER_LEFT_COLOR = 43;
static constexpr int CMD_BORDER_RIGHT_COLOR = 44;
static constexpr int CMD_BORDER_START_COLOR = 45;
static constexpr int CMD_BORDER_END_COLOR = 46;

// Transform commands
static constexpr int CMD_TRANSFORM_TRANSLATE_X = 100;
static constexpr int CMD_TRANSFORM_TRANSLATE_Y = 101;
static constexpr int CMD_TRANSFORM_SCALE = 102;
static constexpr int CMD_TRANSFORM_SCALE_X = 103;
static constexpr int CMD_TRANSFORM_SCALE_Y = 104;
static constexpr int CMD_TRANSFORM_ROTATE = 105;
static constexpr int CMD_TRANSFORM_ROTATE_X = 106;
static constexpr int CMD_TRANSFORM_ROTATE_Y = 107;
static constexpr int CMD_TRANSFORM_ROTATE_Z = 108;
static constexpr int CMD_TRANSFORM_SKEW_X = 109;
static constexpr int CMD_TRANSFORM_SKEW_Y = 110;
static constexpr int CMD_TRANSFORM_MATRIX = 111;
static constexpr int CMD_TRANSFORM_PERSPECTIVE = 112;

// Unit commands
static constexpr int CMD_UNIT_DEG = 200;
static constexpr int CMD_UNIT_RAD = 201;
static constexpr int CMD_UNIT_PX = 202;
static constexpr int CMD_UNIT_PERCENT = 203;

} // namespace facebook::react::animationbackend
