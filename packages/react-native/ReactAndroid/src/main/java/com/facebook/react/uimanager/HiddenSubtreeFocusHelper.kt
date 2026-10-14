/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import android.view.ViewGroup

/**
 * Keeps the descendants of a view that hides them from accessibility services out of keyboard and
 * D-pad navigation too, so a hardware keyboard never lands on content a screen reader cannot reach.
 * A tap or a `focus()` call still reaches them, and the view itself keeps the place the platform
 * gives it in the focus search.
 */
internal object HiddenSubtreeFocusHelper {

  @JvmStatic
  fun hidesDescendants(view: View): Boolean =
      view.importantForAccessibility == View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS

  /**
   * Removes the descendants [group] added to [views] from [firstAddedIndex] on while it hides them.
   * A focused descendant stays, so that focus search can move on from it.
   */
  @JvmStatic
  fun removeHiddenFocusables(group: ViewGroup, views: ArrayList<View>, firstAddedIndex: Int) {
    if (hidesDescendants(group)) {
      views.subList(firstAddedIndex, views.size).removeAll { it !== group && !it.isFocused }
    }
  }

  /**
   * Moves keyboard focus off a descendant [view] now hides; touch focus stays where the user types.
   */
  @JvmStatic
  fun releaseHiddenKeyboardFocus(view: View) {
    if (view is ViewGroup && hidesDescendants(view) && !view.isInTouchMode) {
      view.findFocus()?.takeIf { it !== view }?.clearFocus()
    }
  }
}
