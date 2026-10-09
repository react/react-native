/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.View
import androidx.core.view.ViewCompat
import com.facebook.react.R
import com.facebook.react.bridge.JavaOnlyMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactTextViewAccessibilityDelegateTest {

  @Test
  fun testSetDelegate_accessibilityCollection_installsAccessibilityDelegate() {
    val view =
        View(RuntimeEnvironment.getApplication()).apply {
          setTag(
              R.id.accessibility_collection,
              JavaOnlyMap().apply {
                putInt("rowCount", 4)
                putInt("columnCount", 2)
              },
          )
        }

    ReactTextViewAccessibilityDelegate.setDelegate(view, false, 0)

    assertThat(ViewCompat.hasAccessibilityDelegate(view)).isTrue()
  }
}
