/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Verify [View] view property being applied properly by [SimpleViewManager] */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class SimpleViewPropertyTest {

  private class ConcreteViewManager : SimpleViewManager<View>() {
    @Suppress("UNUSED_PARAMETER")
    @ReactProp(name = "foo")
    fun setFoo(view: View, foo: Boolean) = Unit

    @Suppress("UNUSED_PARAMETER")
    @ReactProp(name = "bar")
    fun setBar(view: View, bar: ReadableMap?) = Unit

    override fun createViewInstance(reactContext: ThemedReactContext): View {
      return View(reactContext)
    }

    override fun getName(): String {
      return "View"
    }
  }

  private lateinit var context: ReactApplicationContext
  private lateinit var themedContext: ThemedReactContext
  private lateinit var manager: ConcreteViewManager

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = createTestReactApplicationContext()
    themedContext = ThemedReactContext(context, context, null, surfaceId)
    manager = ConcreteViewManager()
  }

  fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
    return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }

  @Test
  fun testOpacity() {
    val view = manager.createView(viewTag, themedContext, buildStyles(), null, JSResponderHandler())
    manager.updateProperties(view, buildStyles())
    Assertions.assertThat(view.alpha).isEqualTo(1.0f)
    manager.updateProperties(view, buildStyles("opacity", 0.31))
    Assertions.assertThat(view.alpha).isEqualTo(0.31f, Assertions.offset(1e-5f))
    manager.updateProperties(view, buildStyles("opacity", null))
    Assertions.assertThat(view.alpha).isEqualTo(1.0f)
  }

  @Test
  fun testGetNativeProps() {
    val nativeProps = manager.nativeProps
    Assertions.assertThat(nativeProps["foo"]).isEqualTo("boolean")
    Assertions.assertThat(nativeProps["bar"]).isEqualTo("Map")
  }

  companion object {
    private const val viewTag = 2
    private const val surfaceId = 1
  }
}
