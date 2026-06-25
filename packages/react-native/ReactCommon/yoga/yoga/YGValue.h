/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stdbool.h>

#include <yoga/YGEnums.h>
#include <yoga/YGMacros.h>

/**
 * Float value to represent "undefined" in style values.
 */
#ifdef __cplusplus
#include <limits>
constexpr float YGUndefined = std::numeric_limits<float>::quiet_NaN();
#else
#include <math.h>
#define YGUndefined NAN
#endif

YG_EXTERN_C_BEGIN

/**
 * Structure used to represent a dimension in a style.
 */
typedef struct YGValue {
  float value;
  YGUnit unit;
} YGValue;

/**
 * Constant for a dimension of "auto".
 */
YG_EXPORT extern const YGValue YGValueAuto;

/**
 * Constant for a dimension which is not defined.
 */
YG_EXPORT extern const YGValue YGValueUndefined;

/**
 * Constant for a dimension that is zero-length.
 */
YG_EXPORT extern const YGValue YGValueZero;

/**
 * Whether a dimension represented as a float is defined.
 */
YG_EXPORT bool YGFloatIsUndefined(float value);

YG_EXTERN_C_END

// Equality operators for comparison of YGValue in C++
#ifdef __cplusplus
inline bool operator==(const YGValue& lhs, const YGValue& rhs) {
  if (lhs.unit != rhs.unit) {
    return false;
  }

  switch (lhs.unit) {
    case YGUnitUndefined:
    case YGUnitAuto:
    case YGUnitFitContent:
    case YGUnitMaxContent:
    case YGUnitStretch:
      return true;
    case YGUnitPoint:
    case YGUnitPercent:
      return lhs.value == rhs.value;
    default:
      return false;
  }
}

inline YGValue operator-(const YGValue& value) {
  return {-value.value, value.unit};
}
#endif
