/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.Gravity
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class TextAttributePropsTest {

  @Test
  fun textAlignStartUsesStartSide() {
    assertThat(textAlignment("start", isRTL = false)).isEqualTo(Gravity.LEFT)
    assertThat(textAlignment("start", isRTL = true)).isEqualTo(Gravity.RIGHT)
  }

  @Test
  fun textAlignEndUsesEndSide() {
    assertThat(textAlignment("end", isRTL = false)).isEqualTo(Gravity.RIGHT)
    assertThat(textAlignment("end", isRTL = true)).isEqualTo(Gravity.LEFT)
  }

  private fun textAlignment(textAlign: String, isRTL: Boolean): Int {
    return TextAttributeProps.getTextAlignment(
        ReactStylesDiffMap(JavaOnlyMap.of("textAlign", textAlign)),
        isRTL,
        Gravity.CENTER_HORIZONTAL,
    )
  }
}
