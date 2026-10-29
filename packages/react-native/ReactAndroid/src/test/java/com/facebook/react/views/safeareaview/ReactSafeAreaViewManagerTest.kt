/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.safeareaview

import android.widget.FrameLayout
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.TouchTargetHelper
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactSafeAreaViewManagerTest {

  private lateinit var themedContext: ThemedReactContext
  private lateinit var root: FrameLayout
  private lateinit var safeArea: ReactSafeAreaView
  private val manager = ReactSafeAreaViewManager()

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = createTestReactApplicationContext(RuntimeEnvironment.getApplication())
    themedContext = ThemedReactContext(context, context, null, -1)

    root = FrameLayout(themedContext)
    root.id = ROOT_TAG
    root.measure(500, 500)
    root.layout(0, 0, 500, 500)

    val underlying = ReactViewGroup(themedContext)
    underlying.id = UNDERLYING_TAG
    root.addView(underlying)
    underlying.layout(0, 0, 500, 500)

    safeArea = ReactSafeAreaView(themedContext)
    safeArea.id = SAFE_AREA_TAG
    root.addView(safeArea)
    safeArea.layout(0, 300, 500, 500)

    val toast = ReactViewGroup(themedContext)
    toast.id = TOAST_TAG
    safeArea.addView(toast)
    toast.layout(100, 0, 400, 100)
  }

  @Test
  fun boxNone_touchOutsideChildrenReachesViewUnderneath() {
    setPointerEvents("box-none")

    assertThat(TouchTargetHelper.findTargetTagForTouch(20f, 380f, root)).isEqualTo(UNDERLYING_TAG)
  }

  @Test
  fun boxNone_touchOnChildStillReachesChild() {
    setPointerEvents("box-none")

    assertThat(TouchTargetHelper.findTargetTagForTouch(200f, 350f, root)).isEqualTo(TOAST_TAG)
  }

  @Test
  fun withoutPointerEvents_safeAreaViewReceivesTouchOutsideChildren() {
    assertThat(TouchTargetHelper.findTargetTagForTouch(20f, 380f, root)).isEqualTo(SAFE_AREA_TAG)
  }

  @Test
  fun resettingPointerEvents_restoresDefaultHitTesting() {
    setPointerEvents("box-none")
    setPointerEvents(null)

    assertThat(TouchTargetHelper.findTargetTagForTouch(20f, 380f, root)).isEqualTo(SAFE_AREA_TAG)
  }

  private fun setPointerEvents(value: String?) {
    manager.updateProperties(safeArea, ReactStylesDiffMap(JavaOnlyMap.of("pointerEvents", value)))
  }

  private companion object {
    const val ROOT_TAG = 1
    const val UNDERLYING_TAG = 2
    const val SAFE_AREA_TAG = 3
    const val TOAST_TAG = 4
  }
}
