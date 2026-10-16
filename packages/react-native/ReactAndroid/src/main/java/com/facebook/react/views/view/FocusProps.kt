/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import com.facebook.react.uimanager.ReactAxOrderHelper

internal data class FocusProps(
    val focusable: Boolean? = null,
    val accessible: Boolean = false,
    val screenReaderFocusable: Boolean = false,
    val importantForAccessibility: Int = View.IMPORTANT_FOR_ACCESSIBILITY_AUTO,
) {
  val keyboardFocusable: Boolean
    get() = focusable ?: accessible

  // HTML's focus() reaches an element a negative tabindex keeps out of sequential navigation.
  val focusableOnlyFromJS: Boolean
    get() = focusable == false

  // An accessible view that keyboard navigation passes over stays one element for screen readers.
  val isScreenReaderFocusable: Boolean
    get() = screenReaderFocusable || (accessible && !keyboardFocusable)

  fun isFocusable(isFocused: Boolean): Boolean =
      keyboardFocusable || (focusableOnlyFromJS && isFocused)

  // Android makes a labelled view important, and a screenReaderFocusable one only from API 35.
  fun importantForAccessibility(hasContentDescription: Boolean): Int =
      if (
          importantForAccessibility == View.IMPORTANT_FOR_ACCESSIBILITY_AUTO &&
              (isScreenReaderFocusable || hasContentDescription)
      ) {
        View.IMPORTANT_FOR_ACCESSIBILITY_YES
      } else {
        importantForAccessibility
      }

  // Android selects text, and moves through its links, only in a view that can take focus.
  fun forText(isSelectable: Boolean, detectsLinks: Boolean): FocusProps =
      when {
        isSelectable -> copy(focusable = true)
        detectsLinks && focusable == null -> copy(focusable = true)
        else -> this
      }

  fun applyTo(view: View) {
    ReactAxOrderHelper.setFocusable(view, isFocusable(view.isFocused))
    ReactAxOrderHelper.setScreenReaderFocusable(view, isScreenReaderFocusable)
    view.importantForAccessibility =
        importantForAccessibility(hasContentDescription = !view.contentDescription.isNullOrEmpty())
  }

  fun onFocusChanged(view: View, gainFocus: Boolean) {
    if (!gainFocus && focusableOnlyFromJS) {
      ReactAxOrderHelper.setFocusable(view, false)
    }
  }

  companion object {
    @JvmField val DEFAULT: FocusProps = FocusProps()

    // TextView's constructor makes the view important for accessibility.
    @JvmField
    val TEXT_DEFAULT: FocusProps =
        FocusProps(importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES)
  }
}
