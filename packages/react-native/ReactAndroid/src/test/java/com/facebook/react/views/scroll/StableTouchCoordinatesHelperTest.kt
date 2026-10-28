/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.app.Activity
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class StableTouchCoordinatesHelperTest {
  private lateinit var parent: FrameLayout
  private lateinit var view: View
  private lateinit var helper: StableTouchCoordinatesHelper

  @Before
  fun setUp() {
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    parent = FrameLayout(activity)
    view = View(activity)
    parent.addView(view)
    activity.setContentView(parent)
    parent.layout(0, 0, 1000, 2000)
    view.layout(0, 500, 1000, 1500)
    helper = StableTouchCoordinatesHelper(view)
  }

  @Test
  fun passesEventUnchangedWhenViewDidNotMove() {
    dispatch(MotionEvent.ACTION_DOWN, 100f)

    assertThat(dispatch(MotionEvent.ACTION_MOVE, 80f)).isEqualTo(80f)
  }

  @Test
  fun compensatesLayoutMovementSinceDown() {
    dispatch(MotionEvent.ACTION_DOWN, 100f)
    view.offsetTopAndBottom(-50)

    assertThat(dispatch(MotionEvent.ACTION_MOVE, 130f)).isEqualTo(80f)
  }

  @Test
  fun compensatesTranslationSinceDown() {
    dispatch(MotionEvent.ACTION_DOWN, 100f)
    view.translationY = 40f

    assertThat(dispatch(MotionEvent.ACTION_MOVE, 40f)).isEqualTo(80f)
  }

  @Test
  fun ignoresAncestorScroll() {
    dispatch(MotionEvent.ACTION_DOWN, 100f)
    parent.scrollTo(0, 50)

    assertThat(dispatch(MotionEvent.ACTION_MOVE, 130f)).isEqualTo(130f)
  }

  @Test
  fun resetsReferenceOnNextDown() {
    dispatch(MotionEvent.ACTION_DOWN, 100f)
    view.offsetTopAndBottom(-50)
    dispatch(MotionEvent.ACTION_UP, 100f)

    dispatch(MotionEvent.ACTION_DOWN, 100f)

    assertThat(dispatch(MotionEvent.ACTION_MOVE, 80f)).isEqualTo(80f)
  }

  @Test
  fun restoresEventCoordinatesAfterHandler() {
    dispatch(MotionEvent.ACTION_DOWN, 100f)
    view.offsetTopAndBottom(-50)
    val event = MotionEvent.obtain(0, 0, MotionEvent.ACTION_MOVE, 10f, 130f, 0)

    helper.withStableCoordinates(event) {}

    assertThat(event.x).isEqualTo(10f)
    assertThat(event.y).isEqualTo(130f)
    event.recycle()
  }

  private fun dispatch(action: Int, y: Float): Float {
    val event = MotionEvent.obtain(0, 0, action, 10f, y, 0)
    val seenY = helper.withStableCoordinates(event) { it.y }
    event.recycle()
    return seenY
  }
}
