/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.ViewParent
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags

/**
 * Implemented by views that cache whether their subtree contains a descendant with `elevation`, so
 * the offscreen-compositing decision in `ReactViewGroup.hasOverlappingRendering()` is O(1) at draw
 * time (see https://github.com/react/react-native/issues/23090).
 *
 * The cache is marked stale only from logical mount/unmount and elevation changes (via
 * [invalidateAncestors]), never from the subview-clipping/scroll path, so scrolling a
 * `removeClippedSubviews` list does no per-frame work. Invalidation is lazy -- it only flips a flag
 * and the subtree is rescanned once, on the next query -- so mounting N children costs O(N) marks
 * rather than O(N^2) rescans. The cache is self-correcting and cannot drift like a maintained
 * counter.
 *
 * Mutation paths that change children without going through `ViewGroupManager` /
 * `ReactClippingViewManager` or `BaseViewManager.setElevation` (a view manager overriding
 * `addView`/`removeViewAt` without calling super, or re-routing children to another container) do
 * not invalidate ancestor caches; the worst case is a briefly stale flag until the next tracked
 * change, never a leak or drift.
 *
 * One known limitation: an invalidation that *originates inside a subtree currently clipped out of
 * a `removeClippedSubviews` container* cannot reach that container. [invalidateAncestors] walks up
 * via `View.getParent()`, which is null for a clipped-out (detached) node, so the walk stops at the
 * detached subtree root before reaching the logical container that still holds it in `allChildren`.
 * This affects both invalidation sources: `BaseViewManager.setElevation` (an elevation change on a
 * clipped-out view or its descendant) and the `ViewGroupManager.addView`/`removeViewAt` mount hooks
 * (mounting/unmounting an elevated descendant under a clipped-out sub-container). In both cases the
 * container's cache stays briefly stale until the next tracked change to its own direct children --
 * which any sibling mount/unmount during scrolling provides -- so the shadow may only briefly fail
 * to composite offscreen in this narrow scenario.
 */
internal interface HasElevatedDescendantCache {
  /**
   * Marks this view's cached elevated-descendant flag stale. The value is recomputed lazily on the
   * next `hasOverlappingRendering()` query, so this stays O(1) on the mount/unmount path. Returns
   * `true` if the cache was valid and is now newly invalidated, or `false` if it was already stale
   * -- in which case its ancestors were already invalidated too, so callers walking up can stop.
   */
  fun invalidateElevatedDescendantCache(): Boolean

  companion object {
    /**
     * Marks the elevated-descendant cache stale on [start] and each ancestor, walking through any
     * intervening non-implementing container. This is O(depth) of flag writes; the actual subtree
     * scan happens once, lazily, at the next draw. A no-op unless the feature flag is enabled, so
     * the flag-off path costs nothing.
     */
    @JvmStatic
    fun invalidateAncestors(start: ViewParent?) {
      if (!ReactNativeFeatureFlags.enableAndroidAutoOffscreenCompositingForElevation()) {
        return
      }
      var node: ViewParent? = start
      while (node != null) {
        val cache = node as? HasElevatedDescendantCache
        if (cache != null && !cache.invalidateElevatedDescendantCache()) {
          // Already stale: whatever invalidated it already walked up and invalidated its ancestors.
          break
        }
        node = node.parent
      }
    }
  }
}
