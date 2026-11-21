/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.os.Looper
import android.os.SystemClock
import android.view.InputDevice
import android.view.InputEvent
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.EditText
import android.widget.LinearLayout
import androidx.activity.ComponentActivity
import com.facebook.react.R
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.SurfaceHandlerBinding
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlagsDefaults
import com.facebook.react.uimanager.events.Event
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.testutils.fakes.FakeEventDispatcher
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowNativeArray
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@OptIn(UnstableReactNativeAPI::class)
@Config(
    shadows =
        [
            ShadowArguments::class,
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowNativeArray::class,
            ShadowNativeMap::class,
            ShadowWritableNativeArray::class,
            ShadowWritableNativeMap::class,
        ],
)
@RunWith(RobolectricTestRunner::class)
class ReactSurfaceViewKeyEventTest {

  private lateinit var eventDispatcher: FakeEventDispatcher
  private lateinit var activity: KeyRecordingActivity

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeNewArchitectureFeatureFlagsDefaults() {
          override fun enableKeyEvents(): Boolean = true
        },
    )
    eventDispatcher = FakeEventDispatcher()
    activity =
        Robolectric.buildActivity(KeyRecordingActivity::class.java)
            .setup()
            .windowFocusChanged(true)
            .get()
  }

  @Test
  fun testKeyWithNoViewFocusedTargetsTheTappedFocusableView() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(activity.window.decorView.findFocus()).isNull()
    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to BUTTON_TAG, KEY_UP to BUTTON_TAG)
    assertThat(keyEvents().map { it.surfaceId }).containsOnly(surfaceView.surface.surfaceID)
    assertThat(activity.keyCodesDown).containsExactly(KeyEvent.KEYCODE_ESCAPE)
  }

  @Test
  fun testKeyWithAViewFocusedTargetsThatViewOnce() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)
    val field = addTextField(surfaceView, FIELD_TAG, top = 2 * VIEW_SIZE)

    tapThroughWindow(button)
    field.requestFocus()
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(activity.window.decorView.findFocus()).isSameAs(field)
    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to FIELD_TAG, KEY_UP to FIELD_TAG)
  }

  @Test
  fun testKeyWithNoViewFocusedTargetsTheNearestFocusableAncestorOfTheTap() {
    val surfaceView = startSurfaceViews(1).single()
    val container =
        addLaidOutView(
            surfaceView,
            ReactViewGroup(activity).apply { isFocusable = true },
            CONTAINER_TAG,
            size = 2 * VIEW_SIZE,
        )
    val label = addLaidOutView(container, ReactViewGroup(activity), LABEL_TAG)

    tapThroughWindow(label)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents())
        .containsExactly(KEY_DOWN to CONTAINER_TAG, KEY_UP to CONTAINER_TAG)
  }

  @Test
  fun testKeyWithNoViewFocusedTargetsTheNearestReactViewOfATapOnANativeView() {
    val surfaceView = startSurfaceViews(1).single()
    val container =
        addLaidOutView(
            surfaceView,
            ReactViewGroup(activity).apply { isFocusable = true },
            CONTAINER_TAG,
            size = 2 * VIEW_SIZE,
        )
    val nativeView =
        addLaidOutView(
            container,
            View(activity).apply {
              isFocusable = true
              isClickable = true
            },
            View.NO_ID,
        )

    tapThroughWindow(nativeView)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents())
        .containsExactly(KEY_DOWN to CONTAINER_TAG, KEY_UP to CONTAINER_TAG)
  }

  @Test
  fun testAViewThatLosesFocusToATouchThatIsNoTapIsTheTarget() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)
    val touchSlop = ViewConfiguration.get(activity).scaledTouchSlop
    button.requestFocus()
    assertThat(button.isFocused).isTrue()

    touchThroughWindow(
        surfaceView,
        surfaceView.width - VIEW_SIZE / 2f,
        MotionEvent.ACTION_DOWN to VIEW_SIZE / 2f,
        MotionEvent.ACTION_MOVE to VIEW_SIZE / 2f + 2 * touchSlop,
        MotionEvent.ACTION_UP to VIEW_SIZE / 2f + 2 * touchSlop,
    )
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(activity.window.decorView.findFocus()).isNull()
    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to BUTTON_TAG, KEY_UP to BUTTON_TAG)
  }

  @Test
  fun testAFieldThatKeepsFocusThroughATouchIsNoTargetOnceItLosesFocus() {
    val surfaceView = startSurfaceViews(1).single()
    val field = addTextField(surfaceView, FIELD_TAG)
    val touchSlop = ViewConfiguration.get(activity).scaledTouchSlop
    field.requestFocus()

    touchThroughWindow(
        surfaceView,
        surfaceView.width - VIEW_SIZE / 2f,
        MotionEvent.ACTION_DOWN to VIEW_SIZE / 2f,
        MotionEvent.ACTION_MOVE to VIEW_SIZE / 2f + 2 * touchSlop,
        MotionEvent.ACTION_UP to VIEW_SIZE / 2f + 2 * touchSlop,
    )
    assertThat(field.isFocused).isTrue()
    field.clearFocus()
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents()).isEmpty()
  }

  @Test
  fun testAViewOutsideTheRootThatTakesFocusEndsTheTapFocus() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)
    val nativeField = EditText(activity)
    (surfaceView.parent as ViewGroup).addView(nativeField)
    shadowOf(Looper.getMainLooper()).idle()

    tapThroughWindow(button)
    nativeField.requestFocus()
    nativeField.clearFocus()
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(activity.window.decorView.findFocus()).isNull()
    assertThat(dispatchedKeyEvents()).isEmpty()
  }

  @Test
  fun testARootThatIsItsWindowsTopViewSendsAKeyOnce() {
    val surfaceView = makeSurfaceView(surfaceId = 1)
    activity.windowManager.addView(surfaceView, WindowManager.LayoutParams())
    shadowOf(Looper.getMainLooper()).idle()
    giveWindowFocus(surfaceView)
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE, surfaceView)

    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to BUTTON_TAG, KEY_UP to BUTTON_TAG)
    activity.windowManager.removeView(surfaceView)
  }

  @Test
  fun testAViewInANestedRootIsTheTargetOfThatRootAlone() {
    val outerSurfaceView = startSurfaceViews(1).single()
    val innerSurfaceView =
        addLaidOutView(
            outerSurfaceView,
            makeSurfaceView(surfaceId = INNER_SURFACE_ID),
            INNER_SURFACE_ID,
            size = 2 * VIEW_SIZE,
        )
    val button = addFocusableView(innerSurfaceView, SECOND_BUTTON_TAG)

    tapThroughWindow(button)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents())
        .containsExactly(KEY_DOWN to SECOND_BUTTON_TAG, KEY_UP to SECOND_BUTTON_TAG)
    assertThat(keyEvents().map { it.surfaceId }).containsOnly(INNER_SURFACE_ID)
  }

  @Test
  fun testWithKeyEventsOffATapIsNotTracked() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(ReactNativeNewArchitectureFeatureFlagsDefaults())
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button)

    assertThat(activity.window.decorView.getTag(R.id.tap_focused_view)).isNull()
  }

  @Test
  fun testMakingARootViewReadsNoFeatureFlag() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactRootView(activity)

    ReactNativeFeatureFlags.override(ReactNativeNewArchitectureFeatureFlagsDefaults())
  }

  @Test
  fun testKeyWithNoViewFocusedTargetsNoViewAfterATapOnNothingFocusable() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button)
    tapThroughWindow(surfaceView, x = surfaceView.width - VIEW_SIZE / 2f, y = VIEW_SIZE / 2f)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents()).isEmpty()
    assertThat(activity.keyCodesDown).containsExactly(KeyEvent.KEYCODE_ESCAPE)
  }

  @Test
  fun testKeyWithNoViewFocusedTargetsNoViewOnceTheTappedViewCannotTakeFocus() {
    val surfaceView = startSurfaceViews(1).single()
    val changes: List<(View) -> Unit> =
        listOf(
            { view -> surfaceView.removeView(view) },
            { view -> view.id = RECYCLED_TAG },
            { view -> view.visibility = View.INVISIBLE },
            { view -> view.isFocusable = false },
            { view -> view.isEnabled = false },
        )

    for (change in changes) {
      val button = addFocusableView(surfaceView, BUTTON_TAG)
      tapThroughWindow(button)
      change(button)
      pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)
      surfaceView.removeView(button)
    }

    assertThat(dispatchedKeyEvents()).isEmpty()
  }

  @Test
  fun testKeyWithNoViewFocusedTargetsOnlyTheSurfaceViewTappedLast() {
    val (firstSurfaceView, secondSurfaceView) = startSurfaceViews(2)
    val firstButton = addFocusableView(firstSurfaceView, BUTTON_TAG)
    val secondButton = addFocusableView(secondSurfaceView, SECOND_BUTTON_TAG)

    tapThroughWindow(firstButton)
    tapThroughWindow(
        secondSurfaceView,
        x = secondSurfaceView.width - VIEW_SIZE / 4f,
        y = VIEW_SIZE / 2f,
    )
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)
    tapThroughWindow(secondButton)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents())
        .containsExactly(KEY_DOWN to SECOND_BUTTON_TAG, KEY_UP to SECOND_BUTTON_TAG)
    assertThat(keyEvents().map { it.surfaceId }).containsOnly(secondSurfaceView.surface.surfaceID)
  }

  @Test
  fun testAStylusTapMakesTheTargetAsAFingerTapDoes() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button, source = InputDevice.SOURCE_STYLUS)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to BUTTON_TAG, KEY_UP to BUTTON_TAG)
  }

  @Test
  fun testAScrollKeepsTheTappedViewTheTarget() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)
    val listItem = addFocusableView(surfaceView, SECOND_BUTTON_TAG, top = 2 * VIEW_SIZE)
    val touchSlop = ViewConfiguration.get(activity).scaledTouchSlop

    tapThroughWindow(button)
    touchThroughWindow(
        listItem,
        VIEW_SIZE / 2f,
        MotionEvent.ACTION_DOWN to VIEW_SIZE / 4f,
        MotionEvent.ACTION_MOVE to VIEW_SIZE / 4f + 2 * touchSlop,
        MotionEvent.ACTION_UP to VIEW_SIZE / 4f + 2 * touchSlop,
    )
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to BUTTON_TAG, KEY_UP to BUTTON_TAG)
  }

  @Test
  fun testACancelledTouchKeepsTheTappedViewTheTarget() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button)
    touchThroughWindow(
        surfaceView,
        surfaceView.width - VIEW_SIZE / 2f,
        MotionEvent.ACTION_DOWN to VIEW_SIZE / 2f,
        MotionEvent.ACTION_CANCEL to VIEW_SIZE / 2f,
    )
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to BUTTON_TAG, KEY_UP to BUTTON_TAG)
  }

  @Test
  fun testATouchWithASecondPointerKeepsTheTappedViewTheTarget() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button)
    touchWithTwoPointersThroughWindow(
        surfaceView,
        x = surfaceView.width - VIEW_SIZE / 2f,
        y = VIEW_SIZE / 2f,
    )
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to BUTTON_TAG, KEY_UP to BUTTON_TAG)
  }

  @Test
  fun testATappedViewThatTakesFocusIsNoTargetOnceItLosesFocus() {
    val surfaceView = startSurfaceViews(1).single()
    tapThroughWindow(surfaceView, x = surfaceView.width - VIEW_SIZE / 2f, y = VIEW_SIZE / 2f)
    val field = addTextField(surfaceView, FIELD_TAG)

    tapThroughWindow(field)
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)
    field.clearFocus()
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(activity.window.decorView.findFocus()).isNull()
    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to FIELD_TAG, KEY_UP to FIELD_TAG)
  }

  @Test
  fun testATappedViewThatHeldFocusIsNoTargetOnceItLosesFocus() {
    val surfaceView = startSurfaceViews(1).single()
    val field = addTextField(surfaceView, FIELD_TAG)
    field.requestFocus()

    tapThroughWindow(field)
    field.clearFocus()
    pressKeyThroughWindow(KeyEvent.KEYCODE_ESCAPE)

    assertThat(activity.window.decorView.findFocus()).isNull()
    assertThat(dispatchedKeyEvents()).isEmpty()
  }

  @Test
  fun testBackReachesTheActivityAndTheTappedView() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button)
    pressKeyThroughWindow(KeyEvent.KEYCODE_BACK)

    assertThat(dispatchedKeyEvents()).containsExactly(KEY_DOWN to BUTTON_TAG, KEY_UP to BUTTON_TAG)
    assertThat(activity.keyCodesDown).containsExactly(KeyEvent.KEYCODE_BACK)
    assertThat(activity.keyCodesUp).containsExactly(KeyEvent.KEYCODE_BACK)
  }

  @Test
  fun testKeyWithNoViewFocusedSendsModifiersAndRepeatsToTheTappedView() {
    val surfaceView = startSurfaceViews(1).single()
    val button = addFocusableView(surfaceView, BUTTON_TAG)

    tapThroughWindow(button)
    val downTime = SystemClock.uptimeMillis()
    dispatchThroughWindow(
        KeyEvent(downTime, downTime, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_SHIFT_LEFT, 0),
    )
    for (repeatCount in 0..1) {
      dispatchThroughWindow(
          KeyEvent(downTime, downTime, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ESCAPE, repeatCount),
      )
    }

    assertThat(dispatchedKeyEvents())
        .containsExactly(KEY_DOWN to BUTTON_TAG, KEY_DOWN to BUTTON_TAG, KEY_DOWN to BUTTON_TAG)
  }

  private fun startSurfaceViews(count: Int): List<ReactSurfaceView> {
    val surfaceViews = List(count) { index -> makeSurfaceView(surfaceId = index + 1) }
    val content = LinearLayout(activity)
    for (surfaceView in surfaceViews) {
      content.addView(
          surfaceView,
          LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f),
      )
    }
    activity.setContentView(content)
    shadowOf(Looper.getMainLooper()).idle()
    return surfaceViews
  }

  private fun makeSurfaceView(surfaceId: Int): ReactSurfaceView {
    val reactContext = createTestReactApplicationContext()
    val reactHost: ReactHostImpl = mock()
    whenever(reactHost.eventDispatcher).doReturn(eventDispatcher)
    whenever(reactHost.currentReactContext).doReturn(reactContext)
    val surfaceHandler: SurfaceHandlerBinding = mock()
    whenever(surfaceHandler.surfaceId).doReturn(surfaceId)
    val surface = ReactSurfaceImpl(surfaceHandler, activity)
    val surfaceView = ReactSurfaceView(activity, surface)
    surface.attachView(surfaceView)
    surface.attach(reactHost)
    return surfaceView
  }

  private fun addFocusableView(parent: ViewGroup, tag: Int, top: Int = 0): View =
      addLaidOutView(parent, ReactViewGroup(parent.context).apply { isFocusable = true }, tag, top)

  private fun addTextField(parent: ViewGroup, tag: Int, top: Int = 0): EditText =
      addLaidOutView(parent, EditText(parent.context), tag, top)

  private fun <T : View> addLaidOutView(
      parent: ViewGroup,
      view: T,
      tag: Int,
      top: Int = 0,
      size: Int = VIEW_SIZE,
  ): T {
    view.id = tag
    parent.addView(view)
    val measureSpec = View.MeasureSpec.makeMeasureSpec(size, View.MeasureSpec.EXACTLY)
    view.measure(measureSpec, measureSpec)
    view.layout(0, top, size, top + size)
    return view
  }

  private fun tapThroughWindow(
      view: View,
      x: Float = view.width / 2f,
      y: Float = view.height / 2f,
      source: Int = InputDevice.SOURCE_TOUCHSCREEN,
  ) {
    touchThroughWindow(
        view,
        x,
        MotionEvent.ACTION_DOWN to y,
        MotionEvent.ACTION_UP to y,
        source = source,
    )
  }

  private fun touchThroughWindow(
      view: View,
      x: Float,
      vararg actionsWithY: Pair<Int, Float>,
      source: Int = InputDevice.SOURCE_TOUCHSCREEN,
  ) {
    val location = IntArray(2)
    view.getLocationInWindow(location)
    val downTime = SystemClock.uptimeMillis()
    for ((action, y) in actionsWithY) {
      val event =
          MotionEvent.obtain(downTime, downTime, action, location[0] + x, location[1] + y, 0)
      event.source = source
      dispatchThroughWindow(event, view.rootView)
    }
  }

  private fun touchWithTwoPointersThroughWindow(view: View, x: Float, y: Float) {
    val location = IntArray(2)
    view.getLocationInWindow(location)
    val downTime = SystemClock.uptimeMillis()
    val pointerProperties =
        Array(2) { pointerId ->
          MotionEvent.PointerProperties().apply {
            id = pointerId
            toolType = MotionEvent.TOOL_TYPE_FINGER
          }
        }
    val pointerCoords =
        Array(2) { pointerId ->
          MotionEvent.PointerCoords().apply {
            this.x = location[0] + x + pointerId * VIEW_SIZE / 4f
            this.y = location[1] + y
          }
        }
    val secondPointer = 1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT
    val steps =
        listOf(
            MotionEvent.ACTION_DOWN to 1,
            (MotionEvent.ACTION_POINTER_DOWN or secondPointer) to 2,
            (MotionEvent.ACTION_POINTER_UP or secondPointer) to 2,
            MotionEvent.ACTION_UP to 1,
        )
    for ((action, pointerCount) in steps) {
      dispatchThroughWindow(
          MotionEvent.obtain(
              downTime,
              downTime,
              action,
              pointerCount,
              pointerProperties,
              pointerCoords,
              0,
              0,
              1f,
              1f,
              0,
              0,
              InputDevice.SOURCE_TOUCHSCREEN,
              0,
          ),
          view.rootView,
      )
    }
  }

  private fun pressKeyThroughWindow(
      keyCode: Int,
      windowView: View = activity.window.decorView,
  ) {
    for (action in intArrayOf(KeyEvent.ACTION_DOWN, KeyEvent.ACTION_UP)) {
      dispatchThroughWindow(KeyEvent(action, keyCode), windowView)
    }
  }

  private fun giveWindowFocus(windowView: View) {
    val viewRootImpl = View::class.java.getMethod("getViewRootImpl").invoke(windowView)
    viewRootImpl.javaClass
        .getMethod("windowFocusChanged", Boolean::class.javaPrimitiveType)
        .invoke(viewRootImpl, true)
    shadowOf(Looper.getMainLooper()).idle()
  }

  /**
   * Android enters touch mode on a touch, and offers a key no view took to
   * `View.OnUnhandledKeyEventListener`s, only from the window's input stages, which `Activity`'s
   * own dispatch methods skip.
   */
  private fun dispatchThroughWindow(
      event: InputEvent,
      windowView: View = activity.window.decorView,
  ) {
    val viewRootImpl = View::class.java.getMethod("getViewRootImpl").invoke(windowView)
    viewRootImpl.javaClass
        .getMethod("dispatchInputEvent", InputEvent::class.java)
        .invoke(viewRootImpl, event)
    shadowOf(Looper.getMainLooper()).idle()
  }

  private fun keyEvents(): List<Event<*>> =
      eventDispatcher.getRecordedDispatchedEvents().filter {
        it.getEventName() == KEY_DOWN || it.getEventName() == KEY_UP
      }

  private fun dispatchedKeyEvents(): List<Pair<String, Int>> =
      keyEvents().map { it.getEventName() to it.viewTag }

  class KeyRecordingActivity : ComponentActivity() {
    val keyCodesDown: MutableList<Int> = mutableListOf()
    val keyCodesUp: MutableList<Int> = mutableListOf()

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
      keyCodesDown.add(keyCode)
      return true
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
      keyCodesUp.add(keyCode)
      return true
    }
  }

  private companion object {
    const val KEY_DOWN = "topKeyDown"
    const val KEY_UP = "topKeyUp"
    const val BUTTON_TAG = 42
    const val SECOND_BUTTON_TAG = 43
    const val FIELD_TAG = 44
    const val CONTAINER_TAG = 45
    const val LABEL_TAG = 46
    const val RECYCLED_TAG = 47
    const val INNER_SURFACE_ID = 9
    const val VIEW_SIZE = 100
  }
}
