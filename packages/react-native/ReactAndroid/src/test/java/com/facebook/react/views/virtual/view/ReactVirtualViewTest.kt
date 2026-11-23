/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual.view

import android.app.Activity
import android.content.Context
import android.graphics.Rect
import android.widget.FrameLayout
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.scroll.VirtualViewContainer
import com.facebook.react.views.scroll.VirtualViewContainerState
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactVirtualViewTest {

  private lateinit var context: Context
  private lateinit var parent: ReactViewGroup

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = Robolectric.buildActivity(Activity::class.java).create().get()

    val container = TestVirtualViewContainer(context)
    val content = ReactViewGroup(context)
    parent = ReactViewGroup(context)
    container.addView(content)
    content.addView(parent)
    content.layout(0, 0, 720, 5000)
    parent.layout(0, 128, 720, 5000)
  }

  @Test
  fun `containerRelativeRect includes parent offset when mounted under positioned parent`() {
    val virtualView = mountVirtualView()

    virtualView.layout(0, 300, 360, 727)

    assertThat(virtualView.containerRelativeRect).isEqualTo(Rect(0, 428, 360, 855))
  }

  @Test
  fun `containerRelativeRect follows parent movement after layout`() {
    val virtualView = mountVirtualView()
    virtualView.layout(0, 300, 360, 727)

    parent.layout(0, 200, 720, 5000)

    assertThat(virtualView.containerRelativeRect).isEqualTo(Rect(0, 500, 360, 927))
  }

  private fun mountVirtualView(): ReactVirtualView {
    val virtualView = ReactVirtualView(context)
    parent.addView(virtualView)
    virtualView.doAttachedToWindow()
    return virtualView
  }

  private class TestVirtualViewContainer(context: Context) :
      FrameLayout(context), VirtualViewContainer {
    override val virtualViewContainerState: VirtualViewContainerState =
        VirtualViewContainerState.create(this)
  }
}
