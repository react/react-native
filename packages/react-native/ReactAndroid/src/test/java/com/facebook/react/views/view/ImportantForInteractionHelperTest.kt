/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.app.Activity
import android.content.Context
import android.view.View
import com.facebook.react.R
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.style.Overflow
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

/** Tests for [ImportantForInteractionHelper]. */
@RunWith(RobolectricTestRunner::class)
class ImportantForInteractionHelperTest {

  private lateinit var context: Context

  private val dontClip =
      ImportantForInteractionHelper.IMPORTANT_FOR_INTERACTION_DONT_CLIP_DESCENDANTS
  private val auto =
      ImportantForInteractionHelper.IMPORTANT_FOR_INTERACTION_AUTO_CSSPOINTEREVENTSAUTO
  private val no = ImportantForInteractionHelper.IMPORTANT_FOR_INTERACTION_NO
  private val exclude = ImportantForInteractionHelper.IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun syncAndroidClipBoundsWithOverflow(): Boolean = true
        },
    )
    context = Robolectric.buildActivity(Activity::class.java).create().get()
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun tagFor(pointerEvents: PointerEvents, overflow: Overflow): Int {
    val view = View(context)
    ImportantForInteractionHelper.setImportantForInteraction(view, pointerEvents, overflow)
    return view.getTag(R.id.important_for_interaction) as Int
  }

  @Test
  fun overflowMapping() {
    assertThat(tagFor(PointerEvents.AUTO, Overflow.VISIBLE) and dontClip).isEqualTo(dontClip)
    assertThat(tagFor(PointerEvents.AUTO, Overflow.HIDDEN) and dontClip).isEqualTo(0)
    assertThat(tagFor(PointerEvents.AUTO, Overflow.SCROLL) and dontClip).isEqualTo(0)
  }

  @Test
  fun pointerEventsMapping() {
    assertThat(tagFor(PointerEvents.AUTO, Overflow.HIDDEN)).isEqualTo(auto)
    assertThat(tagFor(PointerEvents.NONE, Overflow.HIDDEN)).isEqualTo(no or exclude)
    assertThat(tagFor(PointerEvents.BOX_ONLY, Overflow.HIDDEN)).isEqualTo(auto or exclude)
    assertThat(tagFor(PointerEvents.BOX_NONE, Overflow.HIDDEN)).isEqualTo(no)
  }

  @Test
  fun tagRecomputesOnProperties() {
    val rvg = ReactViewGroup(context)
    fun tag() = rvg.getTag(R.id.important_for_interaction) as Int

    // overflow defaults to VISIBLE
    rvg.pointerEvents = PointerEvents.BOX_NONE
    assertThat(tag()).isEqualTo(no or dontClip)

    rvg.overflow = "hidden"
    assertThat(tag()).isEqualTo(no)

    rvg.pointerEvents = PointerEvents.AUTO
    assertThat(tag()).isEqualTo(auto)
  }
}
