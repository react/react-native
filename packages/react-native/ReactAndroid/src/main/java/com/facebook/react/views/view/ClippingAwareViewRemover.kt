/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import android.view.ViewGroup
import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * Helper for detaching a [View] from its current parent while keeping subview-clipping bookkeeping
 * consistent.
 *
 * When a parent [ReactViewGroup] has `removeClippedSubviews` enabled it maintains an internal
 * `allChildren` array that is only kept in sync through its clipping-aware removal path. A raw
 * [ViewGroup.removeView] detaches the child from the Android hierarchy but leaves a stale entry in
 * that array pointing at a view that may then be re-mounted under another parent, which later trips
 * the parent's `parent === this` clipping invariant and crashes. Recycling and reparenting paths
 * that detach a view from an arbitrary parent should route through here instead of calling
 * [ViewGroup.removeView] directly.
 */
@UnstableReactNativeAPI
public object ClippingAwareViewRemover {
  /**
   * Removes [view] from its current parent. If the parent is a clipping-enabled [ReactViewGroup],
   * the removal first goes through the clipping-aware path so `allChildren` stays in sync. Then, if
   * the view is still attached — a non-clipping parent, or a child not tracked in the clipping
   * bookkeeping — it is detached with a plain [ViewGroup.removeView]. No-op if [view] has no
   * [ViewGroup] parent.
   */
  @JvmStatic
  public fun removeFromParent(view: View) {
    val parent = view.parent
    if (parent is ReactViewGroup && parent.removeClippedSubviews) {
      parent.removeViewWithSubviewClippingEnabled(view)
    }
    // `removeViewWithSubviewClippingEnabled` detaches tracked children itself; this handles the
    // non-clipping parent and the untracked-child cases (and is a no-op once already detached).
    (view.parent as? ViewGroup)?.removeView(view)
  }
}
