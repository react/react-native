/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/** Tests for [BackgroundSize] */
@RunWith(RobolectricTestRunner::class)
class BackgroundSizeTest {
  @Test
  fun testParseCover() {
    assertThat(BackgroundSize.parse(DynamicFromObject("cover"))).isSameAs(BackgroundSize.Cover)
  }

  @Test
  fun testParseContain() {
    assertThat(BackgroundSize.parse(DynamicFromObject("contain"))).isSameAs(BackgroundSize.Contain)
  }

  @Test
  fun testParseUnknownKeyword() {
    assertThat(BackgroundSize.parse(DynamicFromObject("fill"))).isNull()
  }

  @Test
  fun testParseLengthPercentage() {
    val size = BackgroundSize.parse(DynamicFromObject(JavaOnlyMap.of("x", 10.0, "y", "auto")))

    assertThat(size).isInstanceOf(BackgroundSize.LengthPercentageAuto::class.java)
    val lengthPercentage = (size as BackgroundSize.LengthPercentageAuto).lengthPercentage
    assertThat(lengthPercentage.isXAuto()).isFalse()
    assertThat(lengthPercentage.isYAuto()).isTrue()
  }
}
