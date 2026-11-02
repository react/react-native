/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.text.Editable
import android.text.TextWatcher
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.StateWrapper.UpdateMode
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher

@OptIn(UnstableReactNativeAPI::class)
internal class ReactTextInputTextWatcher(
    reactContext: ReactContext,
    private val editText: ReactEditText,
) : TextWatcher {
  private val eventDispatcher: EventDispatcher? = UIManagerHelper.getEventDispatcher(reactContext)
  private val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
  private var previousText: String? = null
  private var previousLineCount: Int? = null
  private var pendingEventCount: Int? = null

  override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {
    // Incoming charSequence gets mutated before onTextChanged() is invoked
    previousText = s.toString()
    previousLineCount = editText.layout?.lineCount
  }

  override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {
    if (editText.disableTextDiffing) {
      return
    }

    // Rearranging the text (i.e. changing between singleline and multiline attributes) can
    // also trigger onTextChanged, call the event in JS only when the text actually changed
    if (count == 0 && before == 0) {
      return
    }

    val newText = s.toString().substring(start, start + count)
    val oldText = checkNotNull(previousText).substring(start, start + before)
    // Don't send same text changes
    if (count == before && newText == oldText) {
      return
    }

    if (editText.stateWrapper != null) {
      val eventCount = editText.incrementAndGetEventCounter()
      if (shouldUpdateSynchronously) {
        pendingEventCount = eventCount
      } else {
        updateState(eventCount)
      }
    }

    // The event that contains the event counter and updates it must be sent first.
    eventDispatcher?.dispatchEvent(
        ReactTextChangedEvent(
            surfaceId,
            editText.id,
            s.toString(),
            editText.incrementAndGetEventCounter(),
            editText.selectionStart,
            editText.selectionEnd,
        ),
    )
  }

  override fun afterTextChanged(s: Editable) {
    // Update here rather than in on TextChanged since ReactEditText updates the cached spannable
    // only after every TextWatcher has seen onTextChanged
    pendingEventCount?.let { eventCount ->
      // A synchronous update flushes all enqueued state updates. Mounting a queued text update
      // calls maybeSetTextFromState() which re-runs this callback, so clear pendingEventCount first
      pendingEventCount = null
      updateState(eventCount, UpdateMode.unstable_Immediate)
    }
  }

  private fun updateState(eventCount: Int, updateMode: UpdateMode = UpdateMode.Asynchronous) {
    val stateWrapper = editText.stateWrapper ?: return
    val newStateData: WritableMap = WritableNativeMap()
    newStateData.putInt("mostRecentEventCount", eventCount)
    newStateData.putInt("opaqueCacheId", editText.id)
    stateWrapper.updateState(newStateData, updateMode)
  }

  private val shouldUpdateSynchronously: Boolean
    get() {
      if (!ReactNativeFeatureFlags.fixMultilineContentJumpAndroid()) {
        return false
      }
      val lineCount = editText.layout?.lineCount
      return editText.isMultiline && lineCount != null && lineCount != previousLineCount
    }
}
