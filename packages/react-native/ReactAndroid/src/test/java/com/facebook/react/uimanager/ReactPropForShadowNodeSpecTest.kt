/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.yoga.YogaConfig
import com.facebook.yoga.YogaConfigFactory
import com.facebook.yoga.YogaNode
import com.facebook.yoga.YogaNodeFactory
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Test that verifies that spec of methods annotated with @ReactProp in {@link ReactShadowNode} is
 * correct
 */
@Suppress("DEPRECATION")
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactPropForShadowNodeSpecTest {

  private lateinit var yogaNodeFactory: MockedStatic<YogaNodeFactory>
  private lateinit var yogaConfigFactory: MockedStatic<YogaConfigFactory>

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    yogaNodeFactory = mockStatic(YogaNodeFactory::class.java)
    yogaNodeFactory.`when`<YogaNode> { YogaNodeFactory.create(any()) }.thenReturn(mock<YogaNode>())
    yogaConfigFactory = mockStatic(YogaConfigFactory::class.java)
    yogaConfigFactory
        .`when`<YogaConfig> { YogaConfigFactory.create() }
        .thenReturn(mock<YogaConfig>())
  }

  @After()
  fun tearDown() {
    yogaNodeFactory.close()
    yogaConfigFactory.close()
  }

  @Test(expected = RuntimeException::class)
  fun testMethodWithWrongNumberOfParams() {
    BaseViewManager(
        object : ReactShadowNodeImpl() {
              @Suppress("UNUSED_PARAMETER")
              @ReactProp(name = "prop")
              fun setterWithIncorrectNumberOfArgs(value: Boolean, anotherValue: Int) = Unit
            }
            .javaClass,
    )
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testMethodWithTooFewParams() {
    BaseViewManager(
        object : ReactShadowNodeImpl() {
              @ReactProp(name = "prop") fun setterWithNoArgs() = Unit
            }
            .javaClass,
    )
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testUnsupportedValueType() {
    BaseViewManager(
        object : ReactShadowNodeImpl() {
              @Suppress("UNUSED_PARAMETER")
              @ReactProp(name = "prop")
              fun setterWithMap(value: Map<*, *>) = Unit
            }
            .javaClass,
    )
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupInvalidNumberOfParams() {
    BaseViewManager(
        object : ReactShadowNodeImpl() {
              @Suppress("UNUSED_PARAMETER")
              @ReactPropGroup(names = ["prop1", "prop2"])
              fun setterWithTooManyParams(index: Int, value: Float, boolean: Boolean) = Unit
            }
            .javaClass,
    )
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupTooFewParams() {
    BaseViewManager(
        object : ReactShadowNodeImpl() {
              @Suppress("UNUSED_PARAMETER")
              @ReactPropGroup(names = ["props1", "prop2"])
              fun setterWithTooFewParams(index: Int) = Unit
            }
            .javaClass,
    )
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupNoIndexParam() {
    BaseViewManager(
        object : ReactShadowNodeImpl() {
              @Suppress("UNUSED_PARAMETER")
              @ReactPropGroup(names = ["prop1", "prop2"])
              fun setterWithNoIndexParam(value: Float, boolean: Boolean) = Unit
            }
            .javaClass,
    )
        .nativeProps
  }

  companion object {
    private class BaseViewManager(
        private val shadowNodeClass: Class<out ReactShadowNode<ReactShadowNodeImpl>>,
    ) : ViewManager<View, ReactShadowNode<*>>() {
      override fun getName(): String = "IgnoredName"

      override fun createShadowNodeInstance(): ReactShadowNode<*>? = null

      override fun getShadowNodeClass(): Class<out ReactShadowNode<ReactShadowNodeImpl>> =
          shadowNodeClass

      override fun createViewInstance(reactContext: ThemedReactContext): View = View(null)

      override fun prepareToRecycleView(reactContext: ThemedReactContext, view: View): View? = null

      override fun updateExtraData(root: View, extraData: Any?) = Unit
    }
  }
}
