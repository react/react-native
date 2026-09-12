/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.HasElevatedDescendantCache
import com.facebook.react.uimanager.ReactClippingViewGroupHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * View manager which handles clipped subviews. Useful for custom views which extends from
 * [com.facebook.react.views.view.ReactViewGroup]
 */
public abstract class ReactClippingViewManager<T : ReactViewGroup> : ViewGroupManager<T>() {

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public open fun setRemoveClippedSubviews(view: T, removeClippedSubviews: Boolean) {
    UiThreadUtil.assertOnUiThread()

    view.removeClippedSubviews = removeClippedSubviews
  }

  override fun addView(parent: T, child: View, index: Int) {
    UiThreadUtil.assertOnUiThread()

    val removeClippedSubviews = parent.removeClippedSubviews
    if (removeClippedSubviews) {
      parent.addViewWithSubviewClippingEnabled(child, index)
    } else {
      parent.addView(child, index)
    }
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }

  override fun getChildCount(parent: T): Int {
    val removeClippedSubviews = parent.removeClippedSubviews
    return if (removeClippedSubviews) {
      parent.allChildrenCount
    } else {
      parent.childCount
    }
  }

  override fun getChildAt(parent: T, index: Int): View? {
    val removeClippedSubviews = parent.removeClippedSubviews
    return if (removeClippedSubviews) {
      parent.getChildAtWithSubviewClippingEnabled(index)
    } else {
      parent.getChildAt(index)
    }
  }

  override fun removeViewAt(parent: T, index: Int) {
    UiThreadUtil.assertOnUiThread()

    val removeClippedSubviews = parent.removeClippedSubviews
    if (removeClippedSubviews) {
      val child = getChildAt(parent, index)
      if (child != null) {
        parent.removeViewWithSubviewClippingEnabled(child)
      }
    } else {
      parent.removeViewAt(index)
    }
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }

  override fun removeAllViews(parent: T) {
    UiThreadUtil.assertOnUiThread()

    val removeClippedSubviews = parent.removeClippedSubviews
    if (removeClippedSubviews) {
      parent.removeAllViewsWithSubviewClippingEnabled()
    } else {
      parent.removeAllViews()
    }
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }
}
