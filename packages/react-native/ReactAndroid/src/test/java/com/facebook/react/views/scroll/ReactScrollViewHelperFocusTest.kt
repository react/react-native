/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.View
import android.widget.FrameLayout
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verifies the containment check used by the scroll views' keyboard focus search. */
@RunWith(RobolectricTestRunner::class)
class ReactScrollViewHelperFocusTest {

  private lateinit var host: FrameLayout
  private lateinit var content: FrameLayout

  @Before
  fun setup() {
    val context = RuntimeEnvironment.getApplication()
    host = FrameLayout(context)
    content = FrameLayout(context)
    host.addView(content)
  }

  @Test
  fun hostItselfIsIncluded() {
    assertThat(ReactScrollViewHelper.isSelfOrDescendant(host, host)).isTrue()
  }

  @Test
  fun descendantWithIdIsIncluded() {
    val child = View(host.context).apply { id = 42 }
    content.addView(child)

    assertThat(ReactScrollViewHelper.isSelfOrDescendant(host, child)).isTrue()
  }

  @Test
  fun descendantWithoutIdIsIncluded() {
    // For example the AndroidComposeView that a ComposeView adds as its child.
    val child = View(host.context)
    content.addView(child)

    assertThat(child.id).isEqualTo(View.NO_ID)
    assertThat(ReactScrollViewHelper.isSelfOrDescendant(host, child)).isTrue()
  }

  @Test
  fun viewOutsideHostIsExcludedEvenIfIdMatchesADescendant() {
    content.addView(View(host.context).apply { id = 42 })
    val parent = FrameLayout(host.context)
    parent.addView(host)
    val outside = View(host.context).apply { id = 42 }
    parent.addView(outside)

    assertThat(ReactScrollViewHelper.isSelfOrDescendant(host, outside)).isFalse()
  }

  @Test
  fun detachedViewIsExcluded() {
    assertThat(ReactScrollViewHelper.isSelfOrDescendant(host, View(host.context))).isFalse()
  }
}
