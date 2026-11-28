/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.style.BackgroundSize
import com.facebook.react.uimanager.style.BackgroundSizeLengthPercentage
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class BackgroundImageDrawableTest {
  @Test
  fun autoYAxisKeepsContainerHeight() {
    val size =
        BackgroundSize.LengthPercentageAuto(
            BackgroundSizeLengthPercentage(
                LengthPercentage(10f, LengthPercentageType.PERCENT),
                null,
            ),
        )

    val result = calculateBackgroundImageSize(200f, 100f, 200f, 100f, size, null)

    assertThat(result).isEqualTo(20f to 100f)
  }

  @Test
  fun explicitAxesAreResolvedIndependently() {
    val size =
        BackgroundSize.LengthPercentageAuto(
            BackgroundSizeLengthPercentage(
                LengthPercentage(25f, LengthPercentageType.PERCENT),
                LengthPercentage(12f, LengthPercentageType.PERCENT),
            ),
        )

    val result = calculateBackgroundImageSize(200f, 100f, 200f, 100f, size, null)

    assertThat(result).isEqualTo(50f to 12f)
  }
}
