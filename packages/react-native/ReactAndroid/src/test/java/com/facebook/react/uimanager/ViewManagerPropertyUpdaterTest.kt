/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.annotations.ReactProp
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ViewManagerPropertyUpdaterTest {

  private class TestViewManager : SimpleViewManager<View>() {
    var testProp: Int? = null

    override fun getName(): String = "TestView"

    override fun createViewInstance(reactContext: ThemedReactContext): View = View(reactContext)

    @ReactProp(name = "testProp")
    fun setTestProp(view: View, value: Int) {
      testProp = value
    }
  }

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    ViewManagerPropertyUpdater.clear()
  }

  @After
  fun tearDown() {
    ViewManagerPropertyUpdater.clear()
  }

  @Test
  fun setterPreloadedOnAnotherThreadUpdatesProps() {
    val preloadThread = Thread {
      ViewManagerPropertyUpdater.preloadManagerSetter(TestViewManager::class.java)
    }
    preloadThread.start()
    preloadThread.join()

    val viewManager = TestViewManager()
    viewManager.updateProperties(
        View(RuntimeEnvironment.getApplication()),
        ReactStylesDiffMap(JavaOnlyMap.of("testProp", 42.0)),
    )

    assertThat(viewManager.testProp).isEqualTo(42)
  }

  @Test
  fun preloadedSetterExportsTheSameProps() {
    val propsComputedOnDemand = getNativeProps()
    ViewManagerPropertyUpdater.clear()

    ViewManagerPropertyUpdater.preloadManagerSetter(TestViewManager::class.java)

    assertThat(getNativeProps())
        .isEqualTo(propsComputedOnDemand)
        .containsEntry("testProp", "number")
  }

  @Suppress("UNCHECKED_CAST")
  private fun getNativeProps(): Map<String, String> =
      ViewManagerPropertyUpdater.getNativeProps(
          TestViewManager::class.java as Class<out ViewManager<Nothing, *>>,
          null,
      )
}
