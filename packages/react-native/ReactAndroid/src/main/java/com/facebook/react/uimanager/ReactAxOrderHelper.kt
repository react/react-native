/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import android.view.ViewGroup
import com.facebook.react.R
import java.util.Collections
import java.util.WeakHashMap

/**
 * Helper object for managing accessibility order in React Native views.
 *
 * This object provides utilities to build ordered lists of views based on accessibility order
 * preferences, and to write the focus flags of views whose focus an accessibility order holds.
 */
public object ReactAxOrderHelper {
  // A focus flag set while an accessibility order holds the view's focus is the one it restores.
  internal fun setFocusable(view: View, focusable: Boolean) {
    val originalFocusability = view.originalFocusability
    if (originalFocusability != null) {
      view.setTag(R.id.original_focusability, originalFocusability.copy(focusable = focusable))
    } else {
      view.isFocusable = focusable
    }
  }

  @JvmStatic
  @JvmName("internal_setScreenReaderFocusable")
  internal fun setScreenReaderFocusable(view: View, screenReaderFocusable: Boolean) {
    val originalFocusability = view.originalFocusability
    if (originalFocusability != null) {
      view.setTag(
          R.id.original_focusability,
          originalFocusability.copy(screenReaderFocusable = screenReaderFocusable),
      )
    } else {
      ScreenReaderFocusableHelper.setScreenReaderFocusable(view, screenReaderFocusable)
    }
  }

  internal fun isAxOrderElement(view: View): Boolean =
      view.isFocusable || ScreenReaderFocusableHelper.isScreenReaderFocusable(view)

  /**
   * Builds an ordered list of views based on accessibility order preferences.
   *
   * This method recursively traverses the view hierarchy starting from the given view, looking for
   * views whose native IDs match entries in the accessibility order list. When matches are found,
   * views are placed in the result array at positions corresponding to their position in the
   * accessibility order list. This method also tags each view with its accessibility order parent.
   *
   * @param view The current view being processed in the hierarchy traversal
   * @param parent The parent view that defines the accessibility order context
   * @param axOrderList The list of native IDs defining the desired accessibility order
   * @param result The output array where views are placed according to their order in axOrderList
   */
  public fun buildAxOrderList(
      view: View,
      parent: View,
      axOrderList: MutableList<*>,
      result: Array<View?>,
  ) {
    val nativeId = view.getTag(R.id.view_tag_native_id)
    view.setTag(R.id.accessibility_order_parent, parent)

    if (axOrderList.contains(nativeId)) {
      val idx = axOrderList.indexOf(nativeId)
      if (idx != -1) {
        result[idx] = view
      }
    }

    if (view is ViewGroup) {
      for (i in 0..<view.childCount) {
        buildAxOrderList(view.getChildAt(i), parent, axOrderList, result)
      }
    }
  }
}

// Recorded, so a release reaches the held views that have left the order's subtree.
internal class AccessibilityOrderHolds {
  private val heldViews: MutableSet<View> = Collections.newSetFromMap(WeakHashMap())

  fun disableFocusForSubtree(view: View, axOrderList: List<*>) {
    if (!axOrderList.contains(view.getTag(R.id.view_tag_native_id))) {
      hold(view)
    }

    if (view is ViewGroup) {
      for (i in 0..<view.childCount) {
        disableFocusForSubtree(view.getChildAt(i), axOrderList)
      }
    }
  }

  fun restoreFocusability() {
    val views = heldViews.toList()
    heldViews.clear()
    for (view in views) {
      val originalFocusability = view.originalFocusability
      if (originalFocusability?.holds === this) {
        view.setTag(R.id.original_focusability, null)
        view.isFocusable = originalFocusability.focusable
        ScreenReaderFocusableHelper.setScreenReaderFocusable(
            view,
            originalFocusability.screenReaderFocusable,
        )
      }
    }
  }

  private fun hold(view: View) {
    view.setTag(
        R.id.original_focusability,
        view.originalFocusability?.copy(holds = this)
            ?: OriginalFocusability(
                holds = this,
                focusable = view.isFocusable,
                screenReaderFocusable = ScreenReaderFocusableHelper.isScreenReaderFocusable(view),
            ),
    )
    heldViews.add(view)
    view.isFocusable = false
    ScreenReaderFocusableHelper.setScreenReaderFocusable(view, false)
  }
}

private data class OriginalFocusability(
    val holds: AccessibilityOrderHolds,
    val focusable: Boolean,
    val screenReaderFocusable: Boolean,
)

private val View.originalFocusability: OriginalFocusability?
  get() = getTag(R.id.original_focusability) as? OriginalFocusability
