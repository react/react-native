/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T207169925: Migrate CatalystInstance to Reacthost and remove the Suppress("DEPRECATION")
// annotation
@file:Suppress("DEPRECATION")

package com.facebook.react.views.textinput

import android.util.DisplayMetrics
import android.view.autofill.AutofillValue
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.testutils.fakes.FakeEventDispatcher
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Verify the selection reported in {@link ReactTextChangedEvent}s emitted by {@link
 * ReactTextInputTextWatcher}
 */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowArguments::class])
class ReactTextInputTextWatcherTest {

  private lateinit var context: BridgeReactContext
  private lateinit var catalystInstanceMock: CatalystInstance
  private lateinit var themedContext: ThemedReactContext
  private lateinit var manager: ReactTextInputManager
  private lateinit var view: ReactEditText
  private lateinit var eventDispatcher: FakeEventDispatcher

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = BridgeReactContext(RuntimeEnvironment.getApplication())
    catalystInstanceMock = createMockCatalystInstance()
    context.initializeWithInstance(catalystInstanceMock)
    themedContext = ThemedReactContext(context, context.baseContext, null, ID_NULL)
    manager = ReactTextInputManager()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    view = manager.createViewInstance(themedContext)
    eventDispatcher = FakeEventDispatcher()
    view.addTextChangedListener(ReactTextInputTextWatcher(themedContext, view, eventDispatcher))
  }

  @Test
  fun testAutofillReportsSelectionAtEndOfText() {
    val autofilledText = "+15551234567"

    view.autofill(AutofillValue.forText(autofilledText))

    // The framework moves the cursor to the end of the text after autofilling
    assertThat(view.selectionStart).isEqualTo(autofilledText.length)
    assertThat(view.selectionEnd).isEqualTo(autofilledText.length)

    val eventData = lastTextChangedEventData()
    assertThat(eventData.getString("text")).isEqualTo(autofilledText)
    val selection = checkNotNull(eventData.getMap("selection"))
    assertThat(selection.getInt("start")).isEqualTo(autofilledText.length)
    assertThat(selection.getInt("end")).isEqualTo(autofilledText.length)
  }

  @Test
  fun testTextInsertedAtCursorReportsSelectionAfterInsertedText() {
    view.setText("+1555123")
    view.setSelection(8)

    // Mimics pasting/typing "4567" at the cursor position
    checkNotNull(view.text).insert(8, "4567")

    val eventData = lastTextChangedEventData()
    assertThat(eventData.getString("text")).isEqualTo("+15551234567")
    val selection = checkNotNull(eventData.getMap("selection"))
    assertThat(selection.getInt("start")).isEqualTo(12)
    assertThat(selection.getInt("end")).isEqualTo(12)
  }

  private fun lastTextChangedEventData(): WritableMap {
    val events =
        eventDispatcher.getRecordedDispatchedEvents().filterIsInstance<ReactTextChangedEvent>()
    assertThat(events).isNotEmpty
    return checkNotNull(events.last().internal_getEventData())
  }
}
