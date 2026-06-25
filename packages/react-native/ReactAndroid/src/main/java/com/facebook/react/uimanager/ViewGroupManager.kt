/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil

@Suppress("DEPRECATION")
public abstract class ViewGroupManager<T : ViewGroup>
@JvmOverloads
constructor(reactContext: ReactApplicationContext? = null) :
    BaseViewManager<T, LayoutShadowNode>(reactContext), IViewGroupManager<T> {

  public override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

  public override fun getShadowNodeClass(): Class<out LayoutShadowNode> =
      LayoutShadowNode::class.java

  public override fun updateExtraData(root: T, extraData: Any): Unit = Unit

  public override fun addView(parent: T, child: View, index: Int): Unit =
      parent.addView(child, index)

  /**
   * Convenience method for batching a set of addView calls Note that this adds the views to the
   * beginning of the ViewGroup
   *
   * @param parent the parent ViewGroup
   * @param views the set of views to add
   */
  public fun addViews(parent: T, views: List<View>) {
    UiThreadUtil.assertOnUiThread()
    views.forEachIndexed { i, view -> addView(parent, view, i) }
  }

  public override fun getChildCount(parent: T): Int = parent.childCount

  public override fun getChildAt(parent: T, index: Int): View? = parent.getChildAt(index)

  public override fun removeViewAt(parent: T, index: Int) {
    UiThreadUtil.assertOnUiThread()
    parent.removeViewAt(index)
  }

  /**
   * Expo overrides this function GroupViewManagerWrapper.kt`, which is a replacement view manager
   * adding support for delegates receiving callbacks whenever one of the methods in the view
   * manager are called.
   */
  public open fun removeView(parent: T, view: View) {
    UiThreadUtil.assertOnUiThread()

    for (i in 0 until getChildCount(parent)) {
      if (getChildAt(parent, i) === view) {

        removeViewAt(parent, i)
        break
      }
    }
  }

  /**
   * Returns whether this View type needs to handle laying out its own children instead of deferring
   * to the standard css-layout algorithm. Returns true for the layout to *not* be automatically
   * invoked. Instead onLayout will be invoked as normal and it is the View instance's
   * responsibility to properly call layout on its children. Returns false for the default behavior
   * of automatically laying out children without going through the ViewGroup's onLayout method. In
   * that case, onLayout for this View type must *not* call layout on its children.
   */
  public override fun needsCustomLayoutForChildren(): Boolean = false
}
