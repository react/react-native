/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputConnectionWrapper
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher

/**
 * A class to implement the TextInput 'onKeyPress' API on android for soft keyboards. It is
 * instantiated in [ReactEditText.onCreateInputConnection].
 *
 * <p>Android IMEs interface with EditText views through the [InputConnection] interface, so any
 * observable change in state of the EditText via the soft-keyboard, should be a side effect of one
 * or more of the methods in [InputConnectionWrapper].
 *
 * <p>[InputConnection.setComposingText] is used to set the composing region (the underlined text)
 * in the [android.widget.EditText] view, i.e. when React Native's TextInput has the property
 * 'autoCorrect' set to true. When text is being composed in the composing state within the
 * EditText, each key press will result in a call to [InputConnection.setComposingText] with a
 * CharSequence argument equal to that of the entire composing region, rather than a single
 * character diff. We can reason about the keyPress based on the resultant cursor position changes
 * of the EditText after applying this change. For example if the cursor moved backwards by one
 * character when composing, it's likely it was a delete; if it moves forward by a character, likely
 * to be a key press of that character.
 *
 * <p>IMEs can also call [InputConnection.beginBatchEdit] to signify a batch of operations. One such
 * example is committing a word currently in composing state with the press of the space key. It is
 * IME dependent but the stock Android keyboard behavior seems to be to commit the currently
 * composing text with [InputConnection.setComposingText] and commits a space character with a
 * separate call to [InputConnection.setComposingText]. Here we chose to emit the last input of a
 * batch edit as that tends to be the user input, but it's completely arbitrary.
 */
internal class ReactEditTextInputConnectionWrapper(
    target: InputConnection,
    reactContext: ReactContext,
    private val editText: ReactEditText,
    private val eventDispatcher: EventDispatcher,
) : InputConnectionWrapper(target, false) {

  private var isBatchEdit = false
  private var key: String? = null

  override fun beginBatchEdit(): Boolean {
    isBatchEdit = true
    return super.beginBatchEdit()
  }

  override fun endBatchEdit(): Boolean {
    isBatchEdit = false
    key?.let { k ->
      dispatchKeyEvent(k)
      key = null
    }
    return super.endBatchEdit()
  }

  override fun setComposingText(text: CharSequence, newCursorPosition: Int): Boolean {
    val previousSelectionStart = editText.selectionStart
    val previousSelectionEnd = editText.selectionEnd

    val consumed = super.setComposingText(text, newCursorPosition)

    val currentSelectionStart = editText.selectionStart
    val noPreviousSelection = previousSelectionStart == previousSelectionEnd
    val cursorDidNotMove = currentSelectionStart == previousSelectionStart
    val cursorMovedBackwardsOrAtBeginningOfInput =
        currentSelectionStart < previousSelectionStart || currentSelectionStart <= 0

    val inputKey =
        if (
            cursorMovedBackwardsOrAtBeginningOfInput || (!noPreviousSelection && cursorDidNotMove)
        ) {
          BACKSPACE_KEY_VALUE
        } else {
          editText.text?.get(currentSelectionStart - 1).toString()
        }

    dispatchKeyEventOrEnqueue(inputKey)
    return consumed
  }

  override fun commitText(text: CharSequence, newCursorPosition: Int): Boolean {
    var inputKey = text.toString()
    // Assume not a keyPress if length > 1 (or 2 if unicode)
    if (inputKey.length <= 2) {
      if (inputKey.isEmpty()) {
        inputKey = BACKSPACE_KEY_VALUE
      }
      dispatchKeyEventOrEnqueue(inputKey)
    }
    return super.commitText(text, newCursorPosition)
  }

  override fun deleteSurroundingText(beforeLength: Int, afterLength: Int): Boolean {
    dispatchKeyEvent(BACKSPACE_KEY_VALUE)
    return super.deleteSurroundingText(beforeLength, afterLength)
  }

  private fun dispatchKeyEventOrEnqueue(inputKey: String) {
    if (isBatchEdit) {
      key = inputKey
    } else {
      dispatchKeyEvent(inputKey)
    }
  }

  private fun dispatchKeyEvent(inputKey: String) {
    val resolvedKey = if (inputKey == NEWLINE_RAW_VALUE) ENTER_KEY_VALUE else inputKey
    val surfaceId = UIManagerHelper.getSurfaceId(editText)
    eventDispatcher.dispatchEvent(ReactTextInputKeyPressEvent(surfaceId, editText.id, resolvedKey))
  }

  companion object {
    const val NEWLINE_RAW_VALUE: String = "\n"
    const val BACKSPACE_KEY_VALUE: String = "Backspace"
    const val ENTER_KEY_VALUE: String = "Enter"
  }
}
