/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Test updating view through [ViewManager] with [ReactProp] and [ReactPropGroup] annotations. */
@RunWith(RobolectricTestRunner::class)
class ReactPropAnnotationSetterTest {
  interface ViewManagerUpdatesReceiver {
    fun onBooleanSetterCalled(value: Boolean)

    fun onIntSetterCalled(value: Int)

    fun onDoubleSetterCalled(value: Double)

    fun onFloatSetterCalled(value: Float)

    fun onStringSetterCalled(value: String?)

    fun onBoxedBooleanSetterCalled(value: Boolean?)

    fun onBoxedIntSetterCalled(value: Int?)

    fun onArraySetterCalled(value: ReadableArray?)

    fun onMapSetterCalled(value: ReadableMap?)

    fun onFloatGroupPropSetterCalled(index: Int, value: Float)

    fun onIntGroupPropSetterCalled(index: Int, value: Int)

    fun onBoxedIntGroupPropSetterCalled(index: Int, value: Int?)
  }

  @Suppress("UNUSED_PARAMETER", "DEPRECATION")
  private inner class ViewManagerUnderTest(
      val viewManagerUpdatesReceiver: ViewManagerUpdatesReceiver,
  ) : ViewManager<View, ReactShadowNode<*>>() {
    override fun getName() = "RedpandasLivestreamVideoView"

    override fun createShadowNodeInstance(): ReactShadowNode<*> =
        error("This method should not be executed as a part of this test")

    override fun getShadowNodeClass(): Class<out ReactShadowNode<*>> = ReactShadowNode::class.java

    override fun createViewInstance(reactContext: ThemedReactContext): View =
        error("This method should not be executed as a part of this test")

    override fun prepareToRecycleView(reactContext: ThemedReactContext, view: View): View? {
      error("This method should not be executed as a part of this test")
    }

    override fun updateExtraData(root: View, extraData: Any) =
        error("This method should not be executed as a part of this test")

    @ReactProp(name = "boolProp")
    fun setBoolProp(v: View?, value: Boolean) {
      viewManagerUpdatesReceiver.onBooleanSetterCalled(value)
    }

    @ReactProp(name = "boolPropWithDefault", defaultBoolean = true)
    fun setBoolPropWithDefault(v: View?, value: Boolean) {
      viewManagerUpdatesReceiver.onBooleanSetterCalled(value)
    }

    @ReactProp(name = "intProp")
    fun setIntProp(v: View?, value: Int) {
      viewManagerUpdatesReceiver.onIntSetterCalled(value)
    }

    @ReactProp(name = "intPropWithDefault", defaultInt = 7168)
    fun setIntPropWithDefault(v: View?, value: Int) {
      viewManagerUpdatesReceiver.onIntSetterCalled(value)
    }

    @ReactProp(name = "floatProp")
    fun setFloatProp(v: View?, value: Float) {
      viewManagerUpdatesReceiver.onFloatSetterCalled(value)
    }

    @ReactProp(name = "floatPropWithDefault", defaultFloat = 14.0f)
    fun setFloatPropWithDefault(v: View?, value: Float) {
      viewManagerUpdatesReceiver.onFloatSetterCalled(value)
    }

    @ReactProp(name = "doubleProp")
    fun setDoubleProp(v: View?, value: Double) {
      viewManagerUpdatesReceiver.onDoubleSetterCalled(value)
    }

    @ReactProp(name = "doublePropWithDefault", defaultDouble = -88.0)
    fun setDoublePropWithDefault(v: View?, value: Double) {
      viewManagerUpdatesReceiver.onDoubleSetterCalled(value)
    }

    @ReactProp(name = "stringProp")
    fun setStringProp(v: View?, value: String?) {
      viewManagerUpdatesReceiver.onStringSetterCalled(value)
    }

    @ReactProp(name = "boxedBoolProp")
    fun setBoxedBoolProp(v: View?, value: Boolean?) {
      viewManagerUpdatesReceiver.onBoxedBooleanSetterCalled(value)
    }

    @ReactProp(name = "boxedIntProp")
    fun setBoxedIntProp(v: View?, value: Int?) {
      viewManagerUpdatesReceiver.onBoxedIntSetterCalled(value)
    }

    @ReactProp(name = "arrayProp")
    fun setArrayProp(v: View?, value: ReadableArray?) {
      viewManagerUpdatesReceiver.onArraySetterCalled(value)
    }

    @ReactProp(name = "mapProp")
    fun setMapProp(v: View?, value: ReadableMap?) {
      viewManagerUpdatesReceiver.onMapSetterCalled(value)
    }

    @ReactPropGroup(names = ["floatGroupPropFirst", "floatGroupPropSecond"])
    fun setFloatGroupProp(v: View?, index: Int, value: Float) {
      viewManagerUpdatesReceiver.onFloatGroupPropSetterCalled(index, value)
    }

    @ReactPropGroup(
        names = ["floatGroupPropWithDefaultFirst", "floatGroupPropWithDefaultSecond"],
        defaultFloat = -100.0f,
    )
    fun setFloatGroupPropWithDefault(v: View?, index: Int, value: Float) {
      viewManagerUpdatesReceiver.onFloatGroupPropSetterCalled(index, value)
    }

    @ReactPropGroup(names = ["intGroupPropFirst", "intGroupPropSecond"])
    fun setIntGroupProp(v: View?, index: Int, value: Int) {
      viewManagerUpdatesReceiver.onIntGroupPropSetterCalled(index, value)
    }

    @ReactPropGroup(
        names = ["intGroupPropWithDefaultFirst", "intGroupPropWithDefaultSecond"],
        defaultInt = 555,
    )
    fun setIntGroupPropWithDefault(v: View?, index: Int, value: Int) {
      viewManagerUpdatesReceiver.onIntGroupPropSetterCalled(index, value)
    }

    @ReactPropGroup(names = ["boxedIntGroupPropFirst", "boxedIntGroupPropSecond"])
    fun setBoxedIntGroupProp(v: View?, index: Int, value: Int?) {
      viewManagerUpdatesReceiver.onBoxedIntGroupPropSetterCalled(index, value)
    }
  }

  private lateinit var viewManager: ViewManagerUnderTest
  private lateinit var updatesReceiverMock: ViewManagerUpdatesReceiver
  private lateinit var targetView: View

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    updatesReceiverMock = Mockito.mock(ViewManagerUpdatesReceiver::class.java)
    viewManager = ViewManagerUnderTest(updatesReceiverMock)
    targetView = View(RuntimeEnvironment.getApplication())
  }

  @Test
  fun testBooleanSetter() {
    viewManager.updateProperties(targetView, buildStyles("boolProp", true))
    Mockito.verify(updatesReceiverMock).onBooleanSetterCalled(true)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boolProp", false))
    Mockito.verify(updatesReceiverMock).onBooleanSetterCalled(false)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boolProp", null))
    Mockito.verify(updatesReceiverMock).onBooleanSetterCalled(false)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boolPropWithDefault", false))
    Mockito.verify(updatesReceiverMock).onBooleanSetterCalled(false)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boolPropWithDefault", null))
    Mockito.verify(updatesReceiverMock).onBooleanSetterCalled(true)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testIntSetter() {
    viewManager.updateProperties(targetView, buildStyles("intProp", 13))
    Mockito.verify(updatesReceiverMock).onIntSetterCalled(13)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intProp", null))
    Mockito.verify(updatesReceiverMock).onIntSetterCalled(0)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intProp", -7.4))
    Mockito.verify(updatesReceiverMock).onIntSetterCalled(-7)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intPropWithDefault", -1))
    Mockito.verify(updatesReceiverMock).onIntSetterCalled(-1)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intPropWithDefault", null))
    Mockito.verify(updatesReceiverMock).onIntSetterCalled(7168)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testDoubleSetter() {
    viewManager.updateProperties(targetView, buildStyles("doubleProp", 13.0))
    Mockito.verify(updatesReceiverMock).onDoubleSetterCalled(13.0)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("doubleProp", null))
    Mockito.verify(updatesReceiverMock).onDoubleSetterCalled(0.0)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("doublePropWithDefault", -1.0))
    Mockito.verify(updatesReceiverMock).onDoubleSetterCalled(-1.0)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("doublePropWithDefault", null))
    Mockito.verify(updatesReceiverMock).onDoubleSetterCalled(-88.0)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testFloatSetter() {
    viewManager.updateProperties(targetView, buildStyles("floatProp", 13.0))
    Mockito.verify(updatesReceiverMock).onFloatSetterCalled(13.0f)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("floatProp", null))
    Mockito.verify(updatesReceiverMock).onFloatSetterCalled(0.0f)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("floatPropWithDefault", -1.0))
    Mockito.verify(updatesReceiverMock).onFloatSetterCalled(-1.0f)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("floatPropWithDefault", null))
    Mockito.verify(updatesReceiverMock).onFloatSetterCalled(14.0f)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testStringSetter() {
    viewManager.updateProperties(targetView, buildStyles("stringProp", "someRandomString"))
    Mockito.verify(updatesReceiverMock).onStringSetterCalled("someRandomString")
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("stringProp", null))
    Mockito.verify(updatesReceiverMock).onStringSetterCalled(null)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testBoxedBooleanSetter() {
    viewManager.updateProperties(targetView, buildStyles("boxedBoolProp", true))
    Mockito.verify(updatesReceiverMock).onBoxedBooleanSetterCalled(java.lang.Boolean.TRUE)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boxedBoolProp", false))
    Mockito.verify(updatesReceiverMock).onBoxedBooleanSetterCalled(java.lang.Boolean.FALSE)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boxedBoolProp", null))
    Mockito.verify(updatesReceiverMock).onBoxedBooleanSetterCalled(null)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testBoxedIntSetter() {
    viewManager.updateProperties(targetView, buildStyles("boxedIntProp", 55))
    Mockito.verify(updatesReceiverMock).onBoxedIntSetterCalled(55)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boxedIntProp", 1))
    Mockito.verify(updatesReceiverMock).onBoxedIntSetterCalled(1)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boxedIntProp", null))
    Mockito.verify(updatesReceiverMock).onBoxedIntSetterCalled(null)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testArraySetter() {
    val array: ReadableArray = JavaOnlyArray()
    viewManager.updateProperties(targetView, buildStyles("arrayProp", array))
    Mockito.verify(updatesReceiverMock).onArraySetterCalled(array)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("arrayProp", null))
    Mockito.verify(updatesReceiverMock).onArraySetterCalled(null)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testMapSetter() {
    val map: ReadableMap = JavaOnlyMap()
    viewManager.updateProperties(targetView, buildStyles("mapProp", map))
    Mockito.verify(updatesReceiverMock).onMapSetterCalled(map)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("mapProp", null))
    Mockito.verify(updatesReceiverMock).onMapSetterCalled(null)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testFloatGroupSetter() {
    viewManager.updateProperties(targetView, buildStyles("floatGroupPropFirst", 11.0))
    Mockito.verify(updatesReceiverMock).onFloatGroupPropSetterCalled(0, 11.0f)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("floatGroupPropSecond", -111.0))
    Mockito.verify(updatesReceiverMock).onFloatGroupPropSetterCalled(1, -111.0f)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("floatGroupPropSecond", null))
    Mockito.verify(updatesReceiverMock).onFloatGroupPropSetterCalled(1, 0.0f)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("floatGroupPropWithDefaultFirst", null))
    Mockito.verify(updatesReceiverMock).onFloatGroupPropSetterCalled(0, -100.0f)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testIntGroupSetter() {
    viewManager.updateProperties(targetView, buildStyles("intGroupPropFirst", -7))
    Mockito.verify(updatesReceiverMock).onIntGroupPropSetterCalled(0, -7)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intGroupPropSecond", -77))
    Mockito.verify(updatesReceiverMock).onIntGroupPropSetterCalled(1, -77)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intGroupPropSecond", null))
    Mockito.verify(updatesReceiverMock).onIntGroupPropSetterCalled(1, 0)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intGroupPropWithDefaultFirst", 5))
    Mockito.verify(updatesReceiverMock).onIntGroupPropSetterCalled(0, 5)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intGroupPropWithDefaultFirst", null))
    Mockito.verify(updatesReceiverMock).onIntGroupPropSetterCalled(0, 555)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("intGroupPropWithDefaultSecond", null))
    Mockito.verify(updatesReceiverMock).onIntGroupPropSetterCalled(1, 555)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test
  fun testStringGroupSetter() {
    viewManager.updateProperties(targetView, buildStyles("boxedIntGroupPropFirst", -7))
    Mockito.verify(updatesReceiverMock).onBoxedIntGroupPropSetterCalled(0, -7)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boxedIntGroupPropSecond", 12345))
    Mockito.verify(updatesReceiverMock).onBoxedIntGroupPropSetterCalled(1, 12345)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
    viewManager.updateProperties(targetView, buildStyles("boxedIntGroupPropSecond", null))
    Mockito.verify(updatesReceiverMock).onBoxedIntGroupPropSetterCalled(1, null)
    Mockito.verifyNoMoreInteractions(updatesReceiverMock)
    Mockito.reset(updatesReceiverMock)
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateBoolPropWithMap() {
    viewManager.updateProperties(targetView, buildStyles("boolProp", JavaOnlyMap()))
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateStringPropWithDouble() {
    viewManager.updateProperties(targetView, buildStyles("stringProp", 14.5))
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateDoublePropWithString() {
    viewManager.updateProperties(targetView, buildStyles("doubleProp", "hello"))
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateArrayPropWithBool() {
    viewManager.updateProperties(targetView, buildStyles("arrayProp", false))
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateMapPropWithArray() {
    viewManager.updateProperties(targetView, buildStyles("mapProp", JavaOnlyArray()))
  }

  companion object {
    fun buildStyles(vararg keysAndValues: Any?) = ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }
}
