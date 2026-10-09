/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.annotations.ReactProp
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mockStatic
import org.mockito.Mockito.never
import org.mockito.kotlin.any
import org.robolectric.RobolectricTestRunner

/** Tests for the setter lookup done by [ViewManagerPropertyUpdater]. */
@RunWith(RobolectricTestRunner::class)
class ViewManagerPropertyUpdaterTest {
  @Suppress("DEPRECATION")
  private class ViewManagerWithoutGeneratedSetter : ViewManager<View, ReactShadowNode<*>>() {
    override fun getName() = "ViewManagerWithoutGeneratedSetter"

    override fun createShadowNodeInstance(): ReactShadowNode<*> =
        error("This method should not be executed as a part of this test")

    override fun getShadowNodeClass(): Class<out ReactShadowNode<*>> = ReactShadowNode::class.java

    override fun createViewInstance(reactContext: ThemedReactContext): View =
        error("This method should not be executed as a part of this test")

    override fun prepareToRecycleView(reactContext: ThemedReactContext, view: View): View? =
        error("This method should not be executed as a part of this test")

    override fun updateExtraData(view: View, extraData: Any) =
        error("This method should not be executed as a part of this test")

    @ReactProp(name = "someProp") fun setSomeProp(view: View?, value: Boolean) = Unit
  }

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    // Setters are cached per class, so the lookup would be skipped if an earlier test ran it.
    ViewManagerPropertyUpdater.clear()
  }

  @Test
  fun missingGeneratedSetterFallsBackToReflectionWithoutWarning() {
    mockStatic(FLog::class.java).use { flog ->
      val nativeProps = ViewManagerWithoutGeneratedSetter().nativeProps

      assertThat(nativeProps).containsKey("someProp")
      flog.verify({ FLog.w(any<String>(), any<String>()) }, never())
    }
  }
}
