/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.animation.ValueAnimator
import android.graphics.Point
import android.view.View
import android.view.ViewGroup
import android.widget.OverScroller
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito
import org.mockito.stubbing.Answer
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Exercises the real flingAndSnap methods while recording their native physics calls. */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class ReactScrollSnapOffsetsTest {
  private val drivers = mutableListOf<ScrollSnapTestDriver>()
  private lateinit var helper: MockedStatic<ReactScrollViewHelper>

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    helper =
        Mockito.mockStatic(
            ReactScrollViewHelper::class.java,
            Answer { invocation ->
              if (invocation.method.name == "predictFinalScrollPosition") {
                val driver = drivers.single { it.view === invocation.arguments[0] }
                if (driver.horizontal) Point(driver.predicted, 0) else Point(0, driver.predicted)
              } else {
                invocation.callRealMethod()
              }
            },
        )
  }

  @After
  fun tearDown() {
    helper.close()
  }

  private fun eachView(block: (ScrollSnapTestDriver) -> Unit) {
    for (name in listOf("ReactScrollView", "ReactNestedScrollView", "ReactHorizontalScrollView")) {
      val driver = ScrollSnapTestDriver(name)
      drivers.add(driver)
      block(driver)
    }
  }

  @Test
  fun explicitOffsetsPreserveNativeVelocityBoost() = eachView { driver ->
    driver.setOffsets(listOf(20, 60, 100))
    driver.predicted = 40
    assertEquals(ScrollSnapObservation(60, 210, 0), driver.fling(10))
    assertEquals(ScrollSnapObservation(20, -210, 0), driver.fling(-10))
    assertEquals(ScrollSnapObservation(60, 60, 0), driver.fling(0))
  }

  @Test
  fun customizedAnimatorReceivesOnlyTheSelectedTarget() = eachView { driver ->
    driver.customAnimator = true
    driver.setOffsets(listOf(20, 60, 100))
    driver.predicted = 40
    assertEquals(ScrollSnapObservation(60, null, null), driver.fling(10))
    assertEquals(ScrollSnapObservation(20, null, null), driver.fling(-10))
  }

  @Test
  fun disabledBoundariesPreserveFreeScrollingAndCrossing() = eachView { driver ->
    driver.setOffsets(listOf(20, 60, 100))
    driver.set("setSnapToStart", false)
    driver.set("setSnapToEnd", false)
    driver.current = 110
    driver.predicted = 120
    assertEquals(ScrollSnapObservation(120, 10, 0), driver.fling(10))
    driver.current = 90
    assertEquals(ScrollSnapObservation(100, 10, 0), driver.fling(10))
    driver.current = 10
    driver.predicted = 0
    assertEquals(ScrollSnapObservation(0, -10, 100), driver.fling(-10))
    driver.current = 30
    assertEquals(ScrollSnapObservation(20, -10, 0), driver.fling(-10))
  }

  @Test
  fun disablingMomentumUsesCurrentOffsetBeforeSelecting() = eachView { driver ->
    driver.setOffsets(listOf(20, 60, 100))
    driver.set("setDisableIntervalMomentum", true)
    driver.current = 25
    driver.predicted = 90
    assertEquals(ScrollSnapObservation(60, 360, 0), driver.fling(10))
  }

  @Test
  fun propertyChangesAndNativeMutationsRemainVisible() = eachView { driver ->
    driver.customAnimator = true
    val offsets = mutableListOf(20, 60, 100)
    driver.setOffsets(offsets)
    driver.predicted = 40
    offsets[1] = 90
    assertEquals(90, driver.fling(10).target)
    offsets.add(50)
    assertEquals(50, driver.fling(10).target)
    driver.setOffsets(listOf(20, 80, 100))
    assertEquals(80, driver.fling(10).target)
    driver.setOffsets(null)
    driver.set("setSnapInterval", 50)
    assertEquals(50, driver.fling(10).target)
  }

  @Test
  fun clearingRetainedListsPreservesPlatformEmptyListBehavior() = eachView { driver ->
    val offsets = mutableListOf(20, 60, 100)
    driver.setOffsets(offsets)
    driver.set("setSnapInterval", 50)
    driver.predicted = 40
    offsets.clear()
    if (driver.horizontal) {
      assertEquals(50, driver.fling(10).target)
    } else {
      val failure =
          assertThrows(java.lang.reflect.InvocationTargetException::class.java) { driver.fling(10) }
      assertTrue(failure.cause is IndexOutOfBoundsException)
    }
  }

  @Test
  fun recyclingClearsTheSelectorBeforeNativeIntervalSnapping() = eachView { driver ->
    driver.setOffsets(listOf(20, 60, 100))
    driver.recycle()
    driver.set("setSnapInterval", 50)
    driver.predicted = 40
    assertEquals(50, driver.fling(10).target)
  }

  @Test
  fun extremeOffsetsPreserveAndroidIntegerArithmetic() = eachView { driver ->
    driver.setOffsets(listOf(Int.MIN_VALUE, 20, 100))
    driver.predicted = 150
    assertEquals(ScrollSnapObservation(300, 300, 100), driver.fling(0))
  }

  @Test
  fun horizontalRtlKeepsCoordinatesAndVelocityInNativeSpace() {
    val driver = ScrollSnapTestDriver("ReactHorizontalScrollView")
    drivers.add(driver)
    driver.rtl = true
    driver.current = 280
    driver.predicted = 260
    driver.setOffsets(listOf(20, 60, 100))
    assertEquals(ScrollSnapObservation(240, -210, 0), driver.fling(-10))
    assertEquals(ScrollSnapObservation(280, 210, 0), driver.fling(10))
  }
}

internal data class ScrollSnapObservation(val target: Int, val velocity: Int?, val overscroll: Int?)

/**
 * Native prediction/rendering are controlled; selection and velocity adjustment execute unchanged.
 */
internal class ScrollSnapTestDriver(name: String) {
  val horizontal = name.contains("Horizontal")
  var current = 0
  var predicted = 0
  var maximum = 300
  var rtl = false
  var customAnimator = false
  private var observation: ScrollSnapObservation? = null
  private val type =
      Class.forName("com.facebook.react.views.scroll.$name").asSubclass(ViewGroup::class.java)
  private val defaultAnimator = Mockito.mock(ValueAnimator::class.java)
  private val otherAnimator = Mockito.mock(ValueAnimator::class.java)
  private val state = ReactScrollViewHelper.ReactScrollViewScrollState().apply { isFinished = true }
  private val child =
      Mockito.mock(
          View::class.java,
          Answer { invocation ->
            when (invocation.method.name) {
              "getHeight",
              "getWidth",
              "getBottom",
              "getRight" -> maximum + 200
              else -> Mockito.RETURNS_DEFAULTS.answer(invocation)
            }
          },
      )
  private val scroller =
      Mockito.mock(
          OverScroller::class.java,
          Answer { invocation ->
            if (invocation.method.name == "fling") {
              val args = invocation.arguments
              observation =
                  ScrollSnapObservation(
                      args[if (horizontal) 4 else 6] as Int,
                      args[if (horizontal) 2 else 3] as Int,
                      args[if (horizontal) 8 else 9] as Int,
                  )
              null
            } else {
              Mockito.RETURNS_DEFAULTS.answer(invocation)
            }
          },
      )
  val view: ViewGroup =
      Mockito.mock(
          type,
          Answer { invocation ->
            when (invocation.method.name) {
              "getFlingAnimator" -> if (customAnimator) otherAnimator else defaultAnimator
              "getFlingExtrapolatedDistance" -> predicted - current
              "getReactScrollViewScrollState" -> state
              "getScrollX" -> if (horizontal) current else 0
              "getScrollY" -> if (horizontal) 0 else current
              "getWidth",
              "getHeight" -> 200
              "computeHorizontalScrollRange" -> maximum + 200
              "getPaddingStart",
              "getPaddingEnd",
              "getPaddingTop",
              "getPaddingBottom" -> 0
              "getChildCount" -> 1
              "getChildAt" -> child
              "getLayoutDirection" ->
                  if (rtl) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR
              "postInvalidateOnAnimation", "invalidate" -> null
              "reactSmoothScrollTo" -> {
                observation =
                    ScrollSnapObservation(
                        invocation.arguments[if (horizontal) 0 else 1] as Int,
                        null,
                        null,
                    )
                null
              }
              else -> invocation.callRealMethod()
            }
          },
      )

  init {
    for ((name, value) in
        listOf(
            "defaultFlingAnimator" to defaultAnimator,
            "scroller" to scroller,
            "contentView" to child,
        )) {
      type.declaredFields.find { it.name == name }?.apply { isAccessible = true }?.set(view, value)
    }
    set("setSnapToStart", true)
    set("setSnapToEnd", true)
  }

  fun set(name: String, value: Any) {
    type.methods.single { it.name == name && it.parameterCount == 1 }.invoke(view, value)
  }

  fun setOffsets(offsets: List<Int>?) {
    type.getMethod("setSnapOffsets", List::class.java).invoke(view, offsets)
  }

  fun recycle() {
    type.declaredMethods
        .single { it.name.startsWith("recycleView") }
        .apply { isAccessible = true }
        .invoke(view)
    // Reattach the fixture's measured content after the real recycle reset.
    type.getMethod("onChildViewAdded", View::class.java, View::class.java).invoke(view, view, child)
  }

  fun fling(velocity: Int): ScrollSnapObservation {
    observation = null
    type
        .getDeclaredMethod("flingAndSnap", Int::class.javaPrimitiveType)
        .apply { isAccessible = true }
        .invoke(view, velocity)
    return checkNotNull(observation)
  }
}
