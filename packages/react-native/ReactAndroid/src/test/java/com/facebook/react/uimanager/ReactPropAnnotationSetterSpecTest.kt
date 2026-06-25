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
import java.util.Date
import org.junit.Before
import org.junit.Test

/** Test that verifies that spec of methods annotated with @ReactProp is correct */
@Suppress("UNUSED_PARAMETER", "DEPRECATED")
class ReactPropAnnotationSetterSpecTest {
  @Suppress("DEPRECATION")
  private abstract inner class BaseViewManager : ViewManager<View, ReactShadowNode<*>>() {
    override fun getName(): String = "IgnoredName"

    override fun createShadowNodeInstance(): ReactShadowNode<*> = ReactShadowNodeImpl()

    override fun getShadowNodeClass(): Class<out ReactShadowNode<*>> = ReactShadowNode::class.java

    override fun createViewInstance(reactContext: ThemedReactContext): View = View(reactContext)

    override fun prepareToRecycleView(reactContext: ThemedReactContext, view: View): View? = null

    override fun updateExtraData(root: View, extraData: Any) = Unit
  }

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @Test(expected = RuntimeException::class)
  fun testMethodWithWrongNumberOfParams() {
    object : BaseViewManager() {
          @ReactProp(name = "prop")
          fun setterWithIncorrectNumberOfArgs(v: View?, value: Boolean, otherValue: Boolean) = Unit
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testMethodWithTooFewParams() {
    object : BaseViewManager() {
          @ReactProp(name = "prop") fun setterWithTooFewParams(v: View?) = Unit
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testUnsupportedPropValueType() {
    object : BaseViewManager() {
          @ReactProp(name = "prop")
          fun setterWithUnsupportedValueType(v: View?, value: Date?) = Unit
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testSetterWithNonViewParam() {
    object : BaseViewManager() {
          @ReactProp(name = "prop") fun setterWithNonViewParam(v: Any?, value: Boolean) = Unit
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupInvalidNumberOfParams() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithInvalidNumberOfParams(v: View?, index: Int, value: Float, other: Float) =
              Unit
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupTooFewParams() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithTooFewParams(v: View?, index: Int) = Unit
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupNoIndexParam() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithoutIndexParam(v: View?, value: Float, sth: Float) = Unit
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupNoViewParam() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithoutViewParam(v: Any?, index: Int, value: Float) = Unit
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupUnsupportedPropType() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithUnsupportedPropType(v: View?, index: Int, value: Long) = Unit
        }
        .nativeProps
  }
}
