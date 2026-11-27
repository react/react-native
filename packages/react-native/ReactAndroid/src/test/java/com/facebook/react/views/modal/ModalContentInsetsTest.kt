/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal

import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ModalContentInsetsTest {
  private var previousEdgeToEdge = false

  @Before
  fun setUp() {
    previousEdgeToEdge = isEdgeToEdgeFeatureFlagOn
  }

  @After
  fun tearDown() {
    isEdgeToEdgeFeatureFlagOn = previousEdgeToEdge
  }

  @Test
  fun edgeToEdge_withNeitherProp_extendsUnderBothInsets() =
      assertFits(true, false, false, top = false, bottom = false)

  @Test
  fun edgeToEdge_withStatusProp_extendsUnderBothInsets() =
      assertFits(true, true, false, top = false, bottom = false)

  @Test
  fun edgeToEdge_withNavigationProp_extendsUnderBothInsets() =
      assertFits(true, false, true, top = false, bottom = false)

  @Test
  fun edgeToEdge_withBothProps_extendsUnderBothInsets() =
      assertFits(true, true, true, top = false, bottom = false)

  @Test
  fun noEdgeToEdge_withNeitherProp_fitsBothInsets() =
      assertFits(false, false, false, top = true, bottom = true)

  @Test
  fun noEdgeToEdge_withStatusProp_fitsOnlyBottomInset() =
      assertFits(false, true, false, top = false, bottom = true)

  // This unsupported JS combination still reaches native. The content FrameLayout fits both bars.
  @Test
  fun noEdgeToEdge_withNavigationProp_fitsBothInsets() =
      assertFits(false, false, true, top = true, bottom = true)

  @Test
  fun noEdgeToEdge_withBothProps_extendsUnderBothInsets() =
      assertFits(false, true, true, top = false, bottom = false)

  private fun assertFits(
      edgeToEdge: Boolean,
      statusBarTranslucent: Boolean,
      navigationBarTranslucent: Boolean,
      top: Boolean,
      bottom: Boolean,
  ) {
    isEdgeToEdgeFeatureFlagOn = edgeToEdge
    assertThat(modalContentFitsTopInset(statusBarTranslucent)).isEqualTo(top)
    assertThat(modalContentFitsBottomInset(statusBarTranslucent, navigationBarTranslucent))
        .isEqualTo(bottom)
  }
}
