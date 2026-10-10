/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import java.lang.NumberFormatException

public enum class LengthPercentageType {
  POINT,
  PERCENT,
}

public data class LengthPercentage(
    private val value: Float,
    public val type: LengthPercentageType,
) {
  public companion object {
    @JvmStatic
    public fun setFromDynamic(dynamic: Dynamic, allowNegative: Boolean = false): LengthPercentage? {
      return when (dynamic.type) {
        ReadableType.Number -> {
          val value = dynamic.asDouble()
          if (value < 0 && !allowNegative) {
            return null
          }
          LengthPercentage(value.toFloat(), LengthPercentageType.POINT)
        }
        ReadableType.String -> {
          val s = dynamic.asString()
          if (s != null && s.endsWith("%")) {
            try {
              val value = s.substring(0, s.length - 1).toFloat()
              if (value < 0 && !allowNegative) {
                return null
              }
              LengthPercentage(value, LengthPercentageType.PERCENT)
            } catch (e: NumberFormatException) {
              FLog.w(ReactConstants.TAG, "Invalid percentage format: $s")
              null
            }
          } else {
            FLog.w(ReactConstants.TAG, "Invalid string value: $s")
            null
          }
        }
        ReadableType.Null -> null
        else -> {
          FLog.w(ReactConstants.TAG, "Unsupported type for radius property: ${dynamic.type}")
          null
        }
      }
    }
  }

  public fun resolve(referenceLength: Float): Float {
    if (type == LengthPercentageType.PERCENT) {
      return (value / 100) * referenceLength
    }

    return value
  }

  public constructor() : this(0f, LengthPercentageType.POINT)
}
