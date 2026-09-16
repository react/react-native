/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.util.LayoutDirection
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class BorderInsetsTest {
  @Test
  fun nanBorderWidthsAreTreatedAsUnset() {
    val borderInsets = BorderInsets()
    borderInsets.setBorderWidth(LogicalEdge.ALL, 4f)
    borderInsets.setBorderWidth(LogicalEdge.LEFT, Float.NaN)

    val resolved = borderInsets.resolve(LayoutDirection.LTR, mock<Context>())

    assertThat(resolved.left).isEqualTo(4f)
    assertThat(resolved.top).isEqualTo(4f)
    assertThat(resolved.right).isEqualTo(4f)
    assertThat(resolved.bottom).isEqualTo(4f)
  }
}
