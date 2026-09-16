/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.yoga.YogaUnit
import com.facebook.yoga.YogaValue

internal class DimensionPropConverter {
  companion object {
    @JvmStatic
    fun getDimension(value: Any?): YogaValue? {
      return when (value) {
        null -> null
        is Double -> YogaValue(value.toFloat(), YogaUnit.POINT)
        is String -> YogaValue.parse(value)
        else ->
            throw JSApplicationCausedNativeException(
                "DimensionValue: the value must be a number or string.",
            )
      }
    }
  }
}
