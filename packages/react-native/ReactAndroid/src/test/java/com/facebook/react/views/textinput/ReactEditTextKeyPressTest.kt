/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.app.Activity
import android.os.Looper
import android.util.DisplayMetrics
import android.view.InputDevice
import android.view.KeyCharacterMap
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.RCTModernEventEmitter
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadow.api.Shadow
import org.robolectric.shadows.ShadowViewRootImpl

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowArguments::class, ShadowSoLoader::class])
class ReactEditTextKeyPressTest {

  private data class KeyPress(
      val key: String?,
      val heldModifiers: Set<String>,
      val textWhenReported: String,
  )

  private lateinit var activity: Activity
  private lateinit var view: ReactEditText
  private val keyPresses = mutableListOf<KeyPress>()
  private var nextDownTime = 1_000L

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    val reactContext = createTestReactApplicationContext()
    val eventDispatcher: EventDispatcher = mock {
      on { dispatchEvent(any()) } doAnswer
          { invocation ->
            val event = invocation.getArgument<Event<*>>(0)
            if (event is ReactTextInputKeyPressEvent) {
              keyPresses.add(read(event))
            }
          }
    }
    view = ReactEditText(ThemedReactContext(reactContext, activity, null, ID_NULL))
    view.setEventDispatcher(eventDispatcher)
    view.setOnKeyPress(true)
    activity.setContentView(view)
    Shadow.extract<ShadowViewRootImpl>(activity.window.decorView.parent)
        .callWindowFocusChanged(true)
    view.requestFocusFromJS()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(view.hasWindowFocus()).isTrue()
    assertThat(view.isFocused).isTrue()
  }

  @Suppress("DEPRECATION")
  private fun read(event: ReactTextInputKeyPressEvent): KeyPress {
    val emitter = mock<RCTModernEventEmitter>()
    val payload = argumentCaptor<WritableMap>()
    event.dispatchModern(emitter)
    verify(emitter).receiveEvent(any(), any(), any(), any(), any(), payload.capture(), any())
    val data: ReadableMap = payload.firstValue
    return KeyPress(
        key = data.getString("key"),
        heldModifiers = MODIFIER_FIELDS.filter { data.hasKey(it) && data.getBoolean(it) }.toSet(),
        textWhenReported = view.text.toString(),
    )
  }

  private fun keys(): List<String?> = keyPresses.map { it.key }

  private fun keyEvent(
      action: Int,
      keyCode: Int,
      downTime: Long,
      metaState: Int = 0,
      repeatCount: Int = 0,
      flags: Int = 0,
  ): KeyEvent =
      KeyEvent(
          downTime,
          downTime + repeatCount,
          action,
          keyCode,
          repeatCount,
          metaState,
          KeyCharacterMap.VIRTUAL_KEYBOARD,
          0,
          flags,
          InputDevice.SOURCE_KEYBOARD,
      )

  private fun pressHardwareKey(keyCode: Int, metaState: Int = 0, repeats: Int = 0) {
    val downTime = nextDownTime++
    val window = activity.window.decorView
    for (repeatCount in 0..repeats) {
      window.dispatchKeyEvent(
          keyEvent(KeyEvent.ACTION_DOWN, keyCode, downTime, metaState, repeatCount)
      )
    }
    window.dispatchKeyEvent(keyEvent(KeyEvent.ACTION_UP, keyCode, downTime, metaState))
  }

  // Robolectric's key character map has no dead keys and ignores Alt, so this event carries its
  // own.
  private class LayoutKeyEvent(
      action: Int,
      keyCode: Int,
      downTime: Long,
      metaState: Int,
      private val layout: (metaState: Int) -> Int,
  ) :
      KeyEvent(
          downTime,
          downTime,
          action,
          keyCode,
          0,
          metaState,
          KeyCharacterMap.VIRTUAL_KEYBOARD,
          0,
          0,
          InputDevice.SOURCE_KEYBOARD,
      ) {
    override fun getUnicodeChar(metaState: Int): Int = layout(metaState)
  }

  private fun pressHardwareKeyOnLayout(keyCode: Int, metaState: Int, layout: (Int) -> Int) {
    val downTime = nextDownTime++
    val window = activity.window.decorView
    window.dispatchKeyEvent(
        LayoutKeyEvent(KeyEvent.ACTION_DOWN, keyCode, downTime, metaState, layout)
    )
    window.dispatchKeyEvent(
        LayoutKeyEvent(KeyEvent.ACTION_UP, keyCode, downTime, metaState, layout)
    )
  }

  private fun openInputConnection(): InputConnection =
      checkNotNull(view.onCreateInputConnection(EditorInfo()))

  private fun sendFromInputMethod(inputConnection: InputConnection, keyCode: Int, flags: Int) {
    val downTime = nextDownTime++
    inputConnection.sendKeyEvent(keyEvent(KeyEvent.ACTION_DOWN, keyCode, downTime, flags = flags))
    inputConnection.sendKeyEvent(keyEvent(KeyEvent.ACTION_UP, keyCode, downTime, flags = flags))
  }

  private fun deliverPendingInput() {
    shadowOf(Looper.getMainLooper()).idle()
  }

  @Test
  fun hardwareKeysAreReportedByTheirKeyValue() {
    pressHardwareKey(KeyEvent.KEYCODE_A)
    pressHardwareKey(KeyEvent.KEYCODE_7)
    pressHardwareKey(KeyEvent.KEYCODE_SPACE)
    pressHardwareKey(KeyEvent.KEYCODE_DPAD_LEFT)
    pressHardwareKey(KeyEvent.KEYCODE_MOVE_HOME)
    pressHardwareKey(KeyEvent.KEYCODE_F1)
    pressHardwareKey(KeyEvent.KEYCODE_SHIFT_LEFT)
    pressHardwareKey(KeyEvent.KEYCODE_BUTTON_A)

    assertThat(keys())
        .containsExactly("a", "7", " ", "ArrowLeft", "Home", "F1", "Shift", "Unidentified")
  }

  @Test
  fun hardwareKeyIsReportedWithTheModifiersHeldWithIt() {
    pressHardwareKey(KeyEvent.KEYCODE_A, KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_LEFT_ON)
    pressHardwareKey(KeyEvent.KEYCODE_Z, KeyEvent.META_CTRL_ON or KeyEvent.META_CTRL_LEFT_ON)

    assertThat(keyPresses.map { it.key to it.heldModifiers })
        .containsExactly("A" to setOf("shiftKey"), "z" to setOf("ctrlKey"))
  }

  @Test
  fun characterTypedAfterADeadKeyIsReportedComposed() {
    val acuteOnAltE = { metaState: Int ->
      if ((metaState and KeyEvent.META_ALT_ON) != 0) KeyCharacterMap.COMBINING_ACCENT or '´'.code
      else 'e'.code
    }

    pressHardwareKeyOnLayout(KeyEvent.KEYCODE_E, ALT_HELD, acuteOnAltE)
    pressHardwareKeyOnLayout(KeyEvent.KEYCODE_E, 0, acuteOnAltE)

    assertThat(keyPresses.map { it.key to it.heldModifiers })
        .containsExactly("Dead" to setOf("altKey"), "é" to emptySet())
    assertThat(view.text.toString()).isEqualTo("é")
  }

  @Test
  fun altShortcutOnALayoutWhereAltTypesNothingIsReportedByItsKeysCharacter() {
    val nothingOnAlt = { metaState: Int ->
      if ((metaState and KeyEvent.META_ALT_ON) != 0) 0 else 'e'.code
    }

    pressHardwareKeyOnLayout(KeyEvent.KEYCODE_E, ALT_HELD, nothingOnAlt)

    assertThat(keyPresses.map { it.key to it.heldModifiers })
        .containsExactly("e" to setOf("altKey"))
    assertThat(view.text.toString()).isEmpty()
  }

  @Test
  fun hardwareEnterAndBackspaceUseTheNamesTheInputMethodReports() {
    view.setText("ab")
    view.setSelection(2)

    pressHardwareKey(KeyEvent.KEYCODE_DEL)
    pressHardwareKey(KeyEvent.KEYCODE_ENTER)

    assertThat(keys()).containsExactly("Backspace", "Enter")
  }

  @Test
  fun systemKeysAreNotReported() {
    pressHardwareKey(KeyEvent.KEYCODE_VOLUME_UP)
    pressHardwareKey(KeyEvent.KEYCODE_VOLUME_DOWN)
    pressHardwareKey(KeyEvent.KEYCODE_BACK)

    assertThat(keyPresses).isEmpty()
  }

  @Test
  fun keyIsReportedBeforeTheTextItTypesChanges() {
    pressHardwareKey(KeyEvent.KEYCODE_A)

    assertThat(keyPresses.map { it.textWhenReported }).containsExactly("")
    assertThat(view.text.toString()).isEqualTo("a")
  }

  @Test
  fun heldKeyIsReportedAtEachRepeat() {
    view.setText("abc")
    view.setSelection(3)

    pressHardwareKey(KeyEvent.KEYCODE_DEL, repeats = 2)

    assertThat(keys()).containsExactly("Backspace", "Backspace", "Backspace")
    assertThat(view.text.toString()).isEmpty()
  }

  @Test
  fun characterTheInputMethodSendsAsAKeyIsReportedOnce() {
    sendFromInputMethod(openInputConnection(), KeyEvent.KEYCODE_A, SOFT_KEYBOARD_FLAGS)
    deliverPendingInput()

    assertThat(keys()).containsExactly("a")
    assertThat(view.text.toString()).isEqualTo("a")
  }

  @Test
  fun digitTheNumericKeypadSendsIsReportedOnce() {
    sendFromInputMethod(openInputConnection(), KeyEvent.KEYCODE_7, SOFT_KEYBOARD_FLAGS)
    deliverPendingInput()

    assertThat(keys()).containsExactly("7")
  }

  @Test
  fun backspaceTheInputMethodSendsOnAnEmptyFieldIsReportedOnce() {
    sendFromInputMethod(openInputConnection(), KeyEvent.KEYCODE_DEL, SOFT_KEYBOARD_FLAGS)
    deliverPendingInput()

    assertThat(keys()).containsExactly("Backspace")
  }

  @Test
  fun hardwareKeyTheInputMethodForwardsIsReportedOnce() {
    sendFromInputMethod(
        openInputConnection(),
        KeyEvent.KEYCODE_DPAD_LEFT,
        KeyEvent.FLAG_FROM_SYSTEM,
    )
    deliverPendingInput()

    assertThat(keys()).containsExactly("ArrowLeft")
  }

  @Test
  fun keysTheInputMethodSendsTogetherAreReportedInOrder() {
    val inputConnection = openInputConnection()
    sendFromInputMethod(inputConnection, KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.FLAG_FROM_SYSTEM)
    sendFromInputMethod(inputConnection, KeyEvent.KEYCODE_DEL, KeyEvent.FLAG_FROM_SYSTEM)
    deliverPendingInput()

    assertThat(keys()).containsExactly("ArrowLeft", "Backspace")
  }

  @Test
  fun textTheInputMethodCommitsIsReportedOnce() {
    openInputConnection().commitText("a", 1)
    deliverPendingInput()

    assertThat(keys()).containsExactly("a")
  }

  @Test
  fun noKeyIsReportedWithoutAnOnKeyPressListener() {
    view.setOnKeyPress(false)

    pressHardwareKey(KeyEvent.KEYCODE_DPAD_UP)
    sendFromInputMethod(openInputConnection(), KeyEvent.KEYCODE_A, SOFT_KEYBOARD_FLAGS)
    deliverPendingInput()

    assertThat(keyPresses).isEmpty()
  }

  private companion object {
    val MODIFIER_FIELDS = listOf("altKey", "ctrlKey", "metaKey", "shiftKey")
    const val SOFT_KEYBOARD_FLAGS = KeyEvent.FLAG_SOFT_KEYBOARD or KeyEvent.FLAG_KEEP_TOUCH_MODE
    const val ALT_HELD = KeyEvent.META_ALT_ON or KeyEvent.META_ALT_LEFT_ON
  }
}
