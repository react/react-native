/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.internal

/**
 * Prior to Android P things like setScaleX() allowed passing float values that were bogus such as
 * Float.NaN. If the app is targeting Android P or later then passing these values will result in an
 * exception being thrown. Since JS might still send Float.NaN, we want to keep the code backward
 * compatible and continue using the fallback value if an invalid float is passed.
 */
public object FloatPropertySanitizer {

  @JvmStatic
  public fun sanitizeFloatPropertyValue(value: Float): Float =
      if (value.isNaN()) 0f else value.coerceIn(-Float.MAX_VALUE, Float.MAX_VALUE)
}
