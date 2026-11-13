/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import android.graphics.Color
import com.facebook.react.bridge.RawColorParser
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Implements(RawColorParser::class)
class ShadowRawColorParser {
  companion object {
    /** Stands in for the native CSS color parser with a fixed lookup table. */
    @JvmStatic
    @Implementation
    fun nativeParse(value: String): Int? =
        when (value) {
          "#ff0000" -> Color.RED
          "transparent" -> Color.TRANSPARENT
          else -> null
        }
  }
}
