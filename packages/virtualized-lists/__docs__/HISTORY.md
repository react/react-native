# MVCP Historical Design (Pre-bf9bb144108)

This document describes the `maintainVisibleContentPosition` (MVCP) architecture as it existed before commit `bf9bb144108` (May 30, 2026 — "test(rn-tester): add maestro tests and refactor maintainVisibleContentPosition examples"), and the three fixes that were applied after.

---

## 1. Original Architecture (Before bf9bb144108)

### 1.1 Design Overview

MVCP prevents unwanted scroll jumps when items are prepended to a list. It works by:

1. Capturing the anchor view's frame before mount mutations
2. Computing delta = (anchor's frame after mount) - (captured frame)
3. Applying delta to `contentOffset`

The algorithm runs on three layers:
- **JS**: Detects prepends via `firstVisibleItemKey` comparison, manages `pendingScrollUpdateCount`
- **iOS Fabric**: `mountingTransactionWillMount` / `mountingTransactionDidMount` callbacks
- **Android**: `willMountItems` / `didMountItems` UIManagerListener callbacks

### 1.2 Original iOS Fabric Algorithm

**`_prepareForMaintainVisibleScrollPosition` (pre-mount):**
- Scans `_contentView.subviews` from `minIndexForVisible`
- Finds first partially visible subview
- Stores: `_firstVisibleView`, `_firstVisibleViewTag`, `_prevFirstVisibleFrame`

**`_adjustForMaintainVisibleContentPosition` (post-mount):**
- Computes delta = `_firstVisibleView.frame - _prevFirstVisibleFrame`
- Applies `contentOffset += delta`
- Checks `autoscrollToTopThreshold`

**Original abort conditions (2):**
1. `!props.maintainVisibleContentPosition` — feature disabled
2. `_avoidAdjustmentForMaintainVisibleContentPosition` — immediate update mode

**Missing abort conditions:**
- No nil check for `_firstVisibleView`
- No superview check for deleted views
- Tag check existed but was gated behind `enableViewCulling()`

### 1.3 Original Android Algorithm

**`computeTargetView` (pre-mount):**
- Iterates `contentView.childCount` from `minIndexForVisible`
- Selects first child where `position > currentScroll` or last child
- Stores `WeakReference(child)` and `child.getHitRect(frame)`

**`updateScrollPositionInternal` (post-mount):**
- Retrieves `firstVisibleViewRef.get()` and `prevFirstVisibleFrame`
- Computes delta on `left` (horizontal) or `top` (vertical)
- Calls `scrollToPreservingMomentum()`
- Threshold: `delta != 0`

**Missing:**
- No `emitScrollEventNoThrottle()` after MVCP adjustment
- JS offset state could be stale during delta calculations

### 1.4 Original JS Layer

**`ListMetricsAggregator`:**
- `_cellMetrics: Map<string, CellMetrics>` — per-cell layout info
- `_measuredCellsCount: number` — count of measured cells
- `_averageCellLength: number` — computed average

**Bugs:**
1. `_invalidateIfOrientationChanged()` reset counts but did NOT clear `_cellMetrics`
2. `_averageCellLength` division was not guarded against `_measuredCellsCount === 0`

**`VirtualizedList`:**
- `pendingScrollUpdateCount` — dual-purpose (initial scroll index + MVCP adjustment)
- Detects prepends via `firstVisibleItemKey` comparison

### 1.5 Original State Variables

| Variable | iOS Fabric | Android |
|----------|-----------|---------|
| Anchor view reference | `_firstVisibleView` (UIView*) | `firstVisibleViewRef` (WeakReference) |
| Anchor view tag | `_firstVisibleViewTag` (NSInteger) | N/A |
| Captured frame | `_prevFirstVisibleFrame` (CGRect) | `prevFirstVisibleFrame` (Rect) |
| Config | `props.maintainVisibleContentPosition` | `config` (Config object) |
| Skip gate | `_avoidAdjustmentForMaintainVisibleContentPosition` | N/A |

---

## 2. Applied Fixes (After bf9bb144108)

### Fix 1: `90e370a3a20` — Clear cell metrics on orientation change + divide-by-zero guard

**Date:** June 2, 2026

**Problem:**
- `_invalidateIfOrientationChanged()` reset `_measuredCellsCount` to 0 but did NOT clear `_cellMetrics`
- New cells measured in new orientation found stale entries, causing `_measuredCellsCount` to stay at 0
- `_averageCellLength = _measuredCellsLength / _measuredCellsCount` → `NaN` or `Infinity`
- Affected scroll position calculations, content length estimates, index-to-offset conversions

**Before:**
```js
_invalidateIfOrientationChanged() {
  if (orientation.horizontal !== this._orientation.horizontal) {
    this._measuredCellsCount = 0;
    this._measuredCellsLength = 0;
    this._averageCellLength = 0;
    // _cellMetrics NOT cleared — stale entries remain
  }
}

notifyCellLayout(key, length) {
  this._measuredCellsCount++;
  this._measuredCellsLength += length;
  this._cellMetrics.set(key, { length, timestamp: Date.now() });
  this._averageCellLength = this._measuredCellsLength / this._measuredCellsCount;
  // Division not guarded — NaN/Infinity if _measuredCellsCount is 0
}
```

**After:**
```js
_invalidateIfOrientationChanged() {
  if (orientation.horizontal !== this._orientation.horizontal) {
    this._cellMetrics.clear();  // NEW: clear stale entries
    this._averageCellLength = 0;
    this._measuredCellsCount = 0;
    this._measuredCellsLength = 0;
  }
}

notifyCellLayout(key, length) {
  this._measuredCellsCount++;
  this._measuredCellsLength += length;
  this._cellMetrics.set(key, { length, timestamp: Date.now() });
  if (this._measuredCellsCount > 0) {  // NEW: guard division
    this._averageCellLength = this._measuredCellsLength / this._measuredCellsCount;
  }
}
```

---

### Fix 2: `059e57333e7` — iOS anchor view deleted/recycled abort conditions

**Date:** June 12, 2026

**Problem:**
When a FlatList with `maintainVisibleContentPosition` undergoes mount operations that delete or recycle the anchor view, `_firstVisibleView` may point to a stale view. MVCP computes a delta from this stale view's frame and applies it to the current offset, resulting in incorrect scroll position.

**Scenarios:**
- Reset/clear: `setData([])` + `scrollToOffset(0)` removes all items
- Item deletion: Items removed from list
- View recycling: When culling is enabled, views are reused for different items
- Empty→repopulate: List starts empty, then items are added

**Repro (horizontal reset):**
1. FlatList in horizontal mode with `maintainVisibleContentPosition={{minIndexForVisible: 0}}`
2. Add 50 items at top (70 items total, each 204px wide)
3. Scroll to offset ~3876 (anchor = item_18 at x=3876)
4. Reset (`setData(INITIAL_DATA)` + `scrollToOffset(0)`)
5. item_18 removed from hierarchy
6. MVCP computes `deltaX = newFrame.x - 3876` (stale)
7. `offset = 0 + deltaX ≈ 3876` (WRONG — should be 0)

**Before:**
```objc
- (void)_adjustForMaintainVisibleContentPosition
{
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (!props.maintainVisibleContentPosition || _avoidAdjustmentForMaintainVisibleContentPosition) {
    return;
  }

  // Missing: nil check for _firstVisibleView
  // Missing: superview check for deleted views

  // Tag check existed but was gated behind enableViewCulling()
  if (ReactNativeFeatureFlags::enableViewCulling()) {
    if (_firstVisibleView.tag != _firstVisibleViewTag) {
      return;
    }
  }

  CGFloat deltaX = _firstVisibleView.frame.origin.x - _prevFirstVisibleFrame.origin.x;
  if (ABS(deltaX) > 0.5) {
    _scrollView.contentOffset = CGPointMake(_scrollView.contentOffset.x + deltaX, _scrollView.contentOffset.y);
  }
}
```

**After:**
```objc
- (void)_adjustForMaintainVisibleContentPosition
{
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (!props.maintainVisibleContentPosition || _avoidAdjustmentForMaintainVisibleContentPosition) {
    return;
  }

  // NEW: Abort if no first visible view (list was empty during mount)
  if (!_firstVisibleView) {
    return;
  }

  // NEW: Tag check now ALWAYS active (removed enableViewCulling gate)
  if (_firstVisibleView.tag != _firstVisibleViewTag) {
    return;
  }

  // NEW: Abort if view was deleted during mount (removed from hierarchy)
  if (_firstVisibleView.superview != _contentView) {
    return;
  }

  CGFloat deltaX = _firstVisibleView.frame.origin.x - _prevFirstVisibleFrame.origin.x;
  if (ABS(deltaX) > 0.5) {
    _scrollView.contentOffset = CGPointMake(_scrollView.contentOffset.x + deltaX, _scrollView.contentOffset.y);
  }
}
```

**Key changes:**
1. Added nil check: `if (!_firstVisibleView) return` — handles empty list case
2. Tag check: removed `enableViewCulling()` gate — recycling happens regardless of culling state
3. Added superview check: `if (_firstVisibleView.superview != _contentView) return` — handles deletion case

**Tag vs Superview checks are mutually exclusive:**
- Recycling: tag changes, superview unchanged
- Deletion: tag unchanged, superview becomes nil

---

### Fix 3: `8c8726ff9eb` — Android event throttle blocking MVCP scroll events

**Date:** June 12, 2026

**Problem:**
`scrollEventThrottle` limits `onScroll` event frequency to reduce JS bridge traffic. With a 500ms throttle, events are only dispatched once per 500ms window. During scroll animations (~300ms), most events are throttled, and JS state never updates to reflect the actual scroll position.

When MVCP adjusts the scroll position programmatically, the `onScroll` event is also throttled if it falls within the throttle window, causing JS state to remain stale.

**Repro:**
1. Enable 500ms throttle
2. Scroll to offset 100
3. Read JS offset display — shows 1 instead of 100 (throttled)
4. Add item at top (triggers MVCP adjustment to ~144)
5. Delta = 144 - 1 = 143 (WRONG — expected 144 - 100 = 44)

**Before:**
```kotlin
// ReactScrollViewHelper.kt
private fun dispatchScrollEvent(scrollView: ScrollViewT, scrollEventType: String, x: Float, y: Float) {
  val now = SystemClock.elapsedRealtime()
  if (scrollEventType == SCROLL &&
      scrollView.scrollEventThrottle >= max(17, now - scrollView.lastScrollDispatchTime)) {
    return  // throttled — blocks MVCP-adjusted events too
  }
  // ... dispatch event
}

// MaintainVisibleScrollPositionHelper.kt
private fun updateScrollPositionInternal() {
  // ... compute delta, apply correction
  // No unthrottled event after MVCP adjustment
  // JS state remains stale
}
```

**After:**
```kotlin
// ReactScrollViewHelper.kt
private fun dispatchScrollEvent(scrollView: ScrollViewT, scrollEventType: String, x: Float, y: Float) {
  val now = SystemClock.elapsedRealtime()
  if (scrollEventType == SCROLL &&
      scrollView.scrollEventThrottle >= max(17, now - scrollView.lastScrollDispatchTime)) {
    return  // throttled during active scrolling
  }
  // ... dispatch event
}

// NEW: Bypass throttle after animations end
private fun registerFlingAnimator() {
  scrollView.flingAnimator?.addAnimatorListener(object : AnimatorListenerAdapter() {
    override fun onAnimationEnd(animation: Animator) {
      emitScrollEventNoThrottle(scrollView, 0f, 0f)  // NEW: ensure JS state is current
    }
  })
}

// MaintainVisibleScrollPositionHelper.kt
private fun updateScrollPositionInternal() {
  // ... compute delta, apply correction
  emitScrollEventNoThrottle(scrollView, 0f, 0f)  // NEW: ensure JS state reflects MVCP position
}
```

**Key changes:**
1. Added `emitScrollEventNoThrottle()` that bypasses the throttle check
2. Called after scroll animations end — ensures JS state is current when animation completes
3. Called after MVCP adjustments — ensures JS state reflects MVCP-adjusted position immediately

**Throttle still applies during active scrolling** (reduces JS bridge traffic as intended). Unthrottled events only fire after animations end or MVCP adjusts position.

---

## 3. Summary of Changes

| Fix | Commit | Date | Platform | What Changed |
|-----|--------|------|----------|-------------|
| 1 | `90e370a3a20` | Jun 2 | JS | Clear `_cellMetrics` on orientation change; guard `_averageCellLength` division |
| 2 | `059e57333e7` | Jun 12 | iOS Fabric | 3 abort conditions: nil check, tag check (ungated), superview check |
| 3 | `8c8726ff9eb` | Jun 12 | Android | `emitScrollEventNoThrottle()` after animations end and MVCP adjustments |
