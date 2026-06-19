# MVCP Use Cases & Test Coverage

This document enumerates use cases that trigger `maintainVisibleContentPosition` (MVCP) and specifies expected behavior. Each scenario includes test coverage status (present/absent with rationale). Passing/failing status is tracked separately in the Maestro test coverage document.

---

## Testing Strategy

MVCP is tested across three layers, from fastest/cheapest to slowest/most expensive:

```text
JS Unit (Jest) → Fantom Integration → Maestro E2E
```

Native unit tests (Android and iOS, testing individual native classes in isolation) are **not currently feasible** for this capability because MVCP depends on a complete React Native runtime that these frameworks cannot construct (see below). Fantom integration tests avoid this limitation by running the complete runtime headlessly rather than trying to isolate individual native components.

### Layer 1: JS Unit Tests (Jest + react-test-renderer)

**File:** `packages/virtualized-lists/Lists/__tests__/VirtualizedList-test.js`

**How to run:**
```bash
yarn jest packages/virtualized-lists/Lists/__tests__/VirtualizedList-test.js --testNamePattern="maintainVisibleContentPosition"
```

**Purpose:** Validates the JS-side scroll delta computation. These tests exercise the JavaScript implementation of MVCP — how deltas are computed from scroll offsets and how they are applied to the virtualized list's scroll state. They cannot directly test native-side behavior (no access to native view frames), but ensure the JS layer behaves correctly when deltas are applied.

**Scope:** JS-side delta computation, bounded delta verification across consecutive updates, minIndexForVisible bounds enforcement, inverted mode JS behavior.

### Layer 2: Fantom Integration Tests

**File:** `packages/react-native/Libraries/Components/ScrollView/__tests__/ScrollView-maintainVisibleContentPosition-itest.js`

**How to run:**
```bash
yarn fantom -- packages/react-native/Libraries/Components/ScrollView/__tests__/ScrollView-maintainVisibleContentPosition-itest.js
```

**Purpose:** Exercises the JS→native bridge for scroll events. Provides the closest thing to E2E testing without a real device, validating end-to-end scroll behavior through the bridge. Fantom renders the actual React Native components and processes scroll events through the native bridge, catching issues that JS-only tests miss.

**Out of scope:** Visual scroll position verification (Maestro), real device behavior, keyboard events, pull-to-refresh gestures, navigation frame animations, orientation changes, momentum scroll behavior, sub-pixel drift detection.

### Layer 3: Maestro E2E Tests

**Example files:** `packages/rn-tester/js/examples/FlatList/FlatList-maintainVisibleContentPosition.js`, `packages/rn-tester/js/examples/ScrollView/ScrollViewMaintainVisibleContentPositionExample.js`

**How to run:**
```bash
# Build the RNTester app
cd packages/rn-tester
yarn e2e-build-android  # or yarn e2e-build-ios

# Run the tests
yarn e2e-test-android   # or yarn e2e-test-ios
```

**Purpose:** Runs on real devices or simulators to verify actual visual scroll position preservation. The most valuable layer for catching regressions because it exercises the complete stack: JS rendering, native view mounting, frame measurement, delta computation, and scroll offset adjustment. Maestro reads the actual visual position of list items, catching sub-pixel drift that bridge-level tests miss.

**Scope:** All MVCP scenarios across FlatList and ScrollView, including horizontal/inverted/recycling/throttle/variable-height/empty-list/scrollToOffset/orientation/momentum/rapid-prepends/prepend-delete variants.

### Native Unit Tests — Limitations

MVCP's native code depends on a complete React Native runtime (Surface, ShadowTree, MountingManager, ScrollView internals, etc.). Traditional native unit test frameworks (Robolectric, XCTest) cannot construct this runtime when testing individual native classes in isolation. Fantom integration tests avoid this limitation entirely by not isolating anything — they run the complete React Native runtime headlessly.

| Platform | Limitation |
|----------|------------|
| **Android** | Robolectric can instantiate `ReactViewGroup` and basic `View` objects, but cannot construct the full scroll view hierarchy with measured frames needed to verify `computeTargetView()` behavior. `MaintainVisibleScrollPositionHelper` depends on `ScrollView` internals, `contentView.childCount` iteration, and frame measurements that Robolectric cannot reliably simulate in isolation. |
| **iOS (Legacy)** | XCTest can create `UIView` instances and add them as subviews, but `RCTScrollView` requires a full `RCTSurfacePresenter` and `RCTBridge` context to process scroll events and mount items. Unit tests cannot inject controlled mount items or intercept the UIBlock execution sequence needed to verify the double-recompute pattern. |
| **iOS (Fabric)** | `RCTScrollViewComponentView` requires a full `Surface` with `ShadowTree` and `MountingManager`. Tag-based recycling detection (`_firstVisibleViewTag`) and the `prepareForRecycle` lifecycle cannot be tested without a complete Fabric runtime. Creating a `Surface` in a unit test context is not supported by the current XCTest infrastructure. |

### Testing Summary

| Layer | Purpose | CI Coverage |
|-------|---------|-------------|
| JS Unit (Jest) | JS-side delta computation, bounded delta verification | ✅ Automated |
| Fantom Integration | JS→native bridge exercise, scroll behavior through bridge | ✅ Automated |
| Maestro E2E | Actual visual scroll position preservation on device | ⚠️ Device required |

The three-layer approach covers the capability from delta computation through to visual behavior, with Fantom providing a headless integration layer that runs the complete React Native runtime — something traditional native unit test frameworks cannot do.

---

## 1. Prepends

### 1.1. Normal Single Prepend (1-5 items)

**Trigger:** Items are inserted at the beginning of the data array. FlatList re-renders, native mounts new views at the top.

**Expected behavior:** The anchor view (first visible item) shifts downward by the total height of prepended items. MVCP captures the anchor's pre-mount frame, computes delta = newFrame - oldFrame, and adjusts `contentOffset` by the delta to keep the anchor at the same screen position.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition preserves position on prepend`
✅ Maestro: `flatlist-maintainvisible.yml` — basic prepend of 1 item, delta assertion [42, 46]

---

### 1.2. Rapid Consecutive Prepends

**Trigger:** Multiple prepend operations in quick succession (no user interaction between batches). The `pendingScrollUpdateCount` mechanism in JS prevents render window adjustment during MVCP corrections, ensuring deltas settle before the next batch.

**Expected behavior:** Each prepend's delta is applied sequentially. The anchor's final position after all prepends should be stable — the item that was visible before any prepends should remain at the same screen position.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles consecutive prepends without drift`
✅ Maestro: `flatlist-maintainvisible.yml` — basic test covers consecutive prepends
✅ Maestro: `flatlist-rapid-prepends-maintainvisible.yml` — 5x 50-item prepends without waits, asserts total delta ~11000px

---

### 1.3. Prepend with Delete (Top + Bottom)

**Trigger:** Items are prepended at the top AND removed from the bottom in the same data batch.

**Expected behavior:** The native side is unaffected by bottom deletes since MVCP only looks at the first visible view. The prepend delta is computed from the anchor's frame shift. The `TODO: detect and handle/ignore re-ordering` comment at `RCTScrollViewComponentView.mm:1110` and `RCTScrollView.m:1001` explicitly acknowledges this is unhandled for re-ordering scenarios.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles prepend with delete from bottom`
✅ Maestro: `flatlist-maintainvisible.yml` — basic test covers prepend+delete
✅ Maestro: `flatlist-prepend-delete-maintainvisible.yml` — prepends 1, removes 3 from bottom in same batch, asserts delta ~44px

---

### 1.4. Large Prepend (50+ items)

**Trigger:** A large number of items (50+) are inserted at the beginning of the data array.

**Expected behavior:** The anchor view may be recycled by FlatList's view pool (different data item gets the same UIView). MVCP's tag comparison safeguard (`_firstVisibleView.tag != _firstVisibleViewTag`) detects the recycled view and aborts the correction. Without this check, the delta would be computed from the wrong view.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles large prepend (50+ items)`
✅ Maestro: `flatlist-recycle-maintainvisible.yml` — 50-item prepend with delta assertion [2100, 2300]
✅ Maestro: `flatlist-horizontal-recycle-maintainvisible.yml` — horizontal variant
✅ Maestro: `flatlist-inverted-recycle-maintainvisible.yml` — inverted variant
✅ Maestro: `flatlist-horizontal-inverted-recycle-maintainvisible.yml` — combined variant
✅ Maestro: `flatlist-inverted-recycle-maintainvisible.yml` — inverted variant
✅ Maestro: `flatlist-horizontal-inverted-recycle-maintainvisible.yml` — combined variant

---

### 1.5. First Prepend (Anchor State Not Yet Initialized)

**Trigger:** The very first prepend after initial list mount. The anchor state (`_prevFirstVisibleFrame`, `firstVisibleViewRef`) has not been initialized by a prior MVCP cycle.

**Expected behavior:** On first mount, `_prepareForMaintainVisibleScrollPosition` initializes the anchor state. The first prepend should work correctly because the initial mount establishes the baseline.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles first prepend after initial mount`
✅ Maestro: `flatlist-first-prepend-maintainvisible.yml` — single prepend at offset 500, asserts delta [42, 46]

---

### 1.6. Variable-Height Items

**Trigger:** Items have dynamic heights (images loading, variable text). The anchor's frame size may differ between pre-mount capture and post-layout measurement.

**Expected behavior:** The delta formula `newFrame - oldFrame` conflates two effects: (a) the position shift from prepended items, and (b) the size change of the anchor item itself. The frame-based approach is inherently correct because it measures actual positions, not estimated ones. However, the first MVCP correction may be inaccurate if the initial frame measurement doesn't match the final rendered size.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles variable-height items`
✅ Maestro: `flatlist-variable-height-maintainvisible.yml` — prepends 1 item three times, delta assertion [28, 112]
✅ Maestro: `flatlist-variable-height-first-prepend-maintainvisible.yml` — variable height + single prepend

---

## 2. Appends

### 2.1. Normal Append (Add Items at End)

**Trigger:** Items are inserted at the end of the data array.

**Expected behavior:** Appends don't shift existing items' frames, so MVCP delta is 0 and no scroll correction is triggered. The anchor view stays at the same frame position.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition does not trigger correction on append`
✅ Maestro: `flatlist-append-maintainvisible.yml` — append baseline (control test)

---

### 2.2. Append with initialScrollIndex > 0

**Trigger:** A list is rendered with `initialScrollIndex` pointing to a non-first item, then items are prepended.

**Expected behavior:** If `initialScrollIndex` refers to an item that gets pushed by prepend, the scroll destination may be wrong because JS's initial scroll calculation doesn't account for MVCP corrections.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition with initialScrollIndex + prepend after remount`

---

## 3. Deletes

### 3.1. Delete Anchor Item

**Trigger:** The item currently at the anchor position (first visible) is removed from the data array.

**Expected behavior:** The anchor shifts to the next visible item. MVCP captures the new anchor's frame, computes delta, and adjusts scroll. The visible content may jump slightly as a new anchor is selected.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles delete of anchor item`
✅ Maestro: covered implicitly in `flatlist-prepend-delete-maintainvisible.yml` (delete from bottom doesn't affect anchor)

---

### 3.2. Delete Non-Anchor Item

**Trigger:** An item that is not the anchor is removed from the data array.

**Expected behavior:** If the deleted item is above the anchor, the anchor shifts up. MVCP delta = newFrame - oldFrame, scroll offset adjusted accordingly. If below anchor, no effect.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles delete from middle of list`

---

### 3.3. Delete All Items (Empty List)

**Trigger:** All items are removed from the data array. The list becomes empty.

**Expected behavior:** When the list becomes empty, `_recomputeFirstVisibleViewForMaintainVisibleContentPosition` doesn't execute (loop doesn't run), leaving `_firstVisibleView` unchanged (pointing to a culled/detached view). The nil check (`if (!_firstVisibleView) return`) prevents accessing frame on a nil/invalid view. Android is safe: `updateScrollPositionInternal` checks `firstVisibleViewRef.get() ?: return`.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles empty list gracefully`
✅ Maestro: `flatlist-empty-list-maintainvisible.yml` — MVCP nil frame check verified

---

### 3.4. Delete from Middle

**Trigger:** Items are removed from the middle of the data array.

**Expected behavior:** Items below the deletion point shift up. The anchor's frame changes. MVCP delta = newFrame - oldFrame, scroll offset adjusted to keep anchor at same screen position.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles delete from middle of list`

---

## 4. Item Updates (Content, Size, Key Changes)

### 4.1. Content Change (Same Size)

**Trigger:** An item's content changes but its rendered size stays the same.

**Expected behavior:** No frame change, no delta, no scroll correction. The anchor stays at the same position.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles content change with same size`

---

### 4.2. Size Change (Item Grows/Shrinks)

**Trigger:** An item's rendered size changes (e.g., image loads, text wraps differently).

**Expected behavior:** The anchor's new frame is compared against `prevFirstVisibleFrame`, and the delta correction keeps the item at the same screen position. If the anchor itself changes size (not just items above/below), the delta correction is applied to the scroll offset, which may over-correct because the item's own size change is included in the delta.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles sibling items above anchor growing`, `maintainVisibleContentPosition handles sibling items above anchor shrinking`
✅ Maestro: `flatlist-variable-height-maintainvisible.yml` — variable height items inherently exercise size changes

---

### 4.3. Key Change (New Key)

**Trigger:** An item's `key` prop changes, causing React to treat it as a new item.

**Expected behavior:** If the old anchor key exists in new data, position is maintained. Otherwise, JS computes adjustment as null and native side recomputes anchor from new view hierarchy.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles data reset with entire data replacement`

---

## 5. View Culling Scenarios

### 5.1. Anchor Culled (Pushed Off-Screen)

**Trigger:** Items above the anchor grow, pushing the anchor off the top of the visible area. Culling removes off-screen views.

**Expected behavior:** On the next mount cycle, `_recomputeFirstVisibleViewForMaintainVisibleContentPosition` finds a new anchor (the first view whose bottom edge is below the scroll offset). The tag comparison safeguard detects when the anchor view was recycled (different tag) and aborts the correction.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles anchor culled (pushed off-screen)`
✅ Maestro: `flatlist-recycle-maintainvisible.yml` — 50-item prepend causes anchor recycling

---

### 5.2. Non-Anchor Culled

**Trigger:** An item that is not the anchor is culled (pushed off-screen).

**Expected behavior:** No effect on MVCP. The anchor is unaffected by culling of non-anchor views.

**Test coverage:** ✅ Fantom: inherent in all Fantom tests (culling is a native-side behavior exercised during prepends)

---

### 5.3. All Visible Items Culled (Spacers Only)

**Trigger:** The content view has only spacers (placeholder views with no data binding) in the visible area.

**Expected behavior:** The anchor selection is incorrect. The delta computed from a spacer's frame is meaningless.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles all items culled (spacers only in viewport)`

---

## 6. Orientation Changes

### 6.1. Vertical to Horizontal

**Trigger:** Device rotates from portrait to landscape. The ScrollView's contentSize changes, potentially changing its horizontal flag.

**Expected behavior:**
- **iOS Paper:** `isHorizontal:` at `RCTScrollView.m:557` checks `contentSize.width > frame.size.width` dynamically — handles orientation changes correctly.
- **iOS Fabric:** `horizontal` detection at line 1073 also checks `contentSize.width > self.frame.size.width` dynamically — handles orientation changes correctly.
- **Android:** `horizontal` flag is set at constructor time (`MaintainVisibleScrollPositionHelper.kt:33`) and never changes. If the ScrollView's orientation changes after the helper is created, MVCP continues on the wrong axis.

**Test coverage:** ✅ Maestro: `flatlist-orientation-maintainvisible.yml` — MVCP survives landscape→portrait (iOS only)

---

## 7. Horizontal Lists (LTR vs RTL)

### 7.1. Horizontal LTR

**Trigger:** A horizontally scrolling list in left-to-right layout direction.

**Expected behavior:** Both iOS and Android compute deltas using frames directly, which are in the same coordinate space as contentOffset. The delta should be correct for LTR.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition preserves position on horizontal prepend`
✅ Maestro: `flatlist-horizontal-maintainvisible.yml` — horizontal prepend, asserts item_5 + item_10

---

### 7.2. Horizontal RTL

**Trigger:** A horizontally scrolling list in right-to-left layout direction.

**Expected behavior:** Frame-based delta computation should work for RTL since frames are in the same coordinate space as contentOffset. The `contentInset` handling in RTL isn't explicitly tested. iOS Paper at `RCTScrollView.m:1054-1056` uses `self.inverted ? self->_scrollView.contentInset.right : self->_scrollView.contentInset.left` for horizontal, but this is for inverted mode, not RTL layout direction.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition preserves position on horizontal prepend in RTL`

---

## 8. Inverted Lists

### 8.1. Vertical Inverted

**Trigger:** A vertically inverted FlatList (`inverted={true}`). Items are rendered in reverse order.

**Expected behavior:** Inverted mode uses CSS transforms (`scaleY: -1` on Android, `scaleY: -1` on iOS) to flip the visual order. The native subview order remains unchanged. The MVCP logic finds the first subview whose bottom edge is below the scroll offset — in inverted mode, this is the visually-topmost visible item. This is correct because we want to maintain the topmost visible item's position.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition with inverted ScrollView preserves position on prepend`, `maintainVisibleContentPosition with inverted ScrollView handles consecutive prepends`
✅ Maestro: `flatlist-inverted-maintainvisible.yml` — vertical inverted prepend, delta [40, 48]

---

### 8.2. Horizontal Inverted

**Trigger:** A horizontally inverted FlatList.

**Expected behavior:** Same as vertical inverted — CSS transform flips visual order, native subview order unchanged, MVCP finds first subview below scroll offset.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition preserves position on horizontal + inverted prepend`
✅ Maestro: `flatlist-horizontal-inverted-maintainvisible.yml` — horizontal + inverted

---

### 8.3. Inverted + Recycling

**Trigger:** An inverted list with culling enabled, causing view recycling during prepends.

**Expected behavior:** The tag comparison safeguard must work correctly in inverted mode. The tag check is always active (not gated behind `enableViewCulling()`) because `RCTComponentViewRegistry` assigns tags during dequeue regardless of culling state.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition with inverted + recycling`
✅ Maestro: `flatlist-inverted-recycle-maintainvisible.yml` — inverted + recycling, all three assertions pass
✅ Maestro: `flatlist-horizontal-inverted-recycle-maintainvisible.yml` — horizontal + inverted + recycling

---

## 9. Empty Lists / Initial Render / Data Reset

### 9.1. Empty List (No Items)

**Trigger:** The list has no items. MVCP prop is set.

**Expected behavior:** When the list is empty, `_firstVisibleView` is nil (or points to a culled view). The nil check (`if (!_firstVisibleView) return`) prevents accessing frame on nil. Android is safe (early return at `MaintainVisibleScrollPositionHelper.kt:95`).

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles empty list gracefully`
✅ Maestro: `flatlist-empty-list-maintainvisible.yml` — MVCP nil check verified

---

### 9.2. Initial Render with MVCP Prop

**Trigger:** A list is rendered with `maintainVisibleContentPosition` prop set on first mount.

**Expected behavior:** `_prepareForMaintainVisibleScrollPosition` initializes anchor state on first mount. Subsequent mounts use the stored state for delta computation.

**Test coverage:** ✅ Covered implicitly in all tests (all lists start with MVCP prop set)

---

### 9.3. Data Reset (Replace Entire Data)

**Trigger:** `setData([])` + `scrollToOffset(0)` clears and repopulates the list.

**Expected behavior:** If the old anchor key exists in new data, position is maintained. Otherwise, JS computes adjustment as null and native side recomputes anchor from new view hierarchy.

Two abort conditions prevent incorrect corrections during reset:
1. **Tag check** (`_firstVisibleView.tag != _firstVisibleViewTag`): Catches view recycling. If the view was reused for a different item, its tag changes.
2. **Superview check** (`_firstVisibleView.superview != _contentView`): Catches view deletion. If the view was removed from the hierarchy during reset, its superview becomes nil.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles data reset with entire data replacement`
✅ Maestro: `flatlist-maintainvisible.yml` — reset assertion in basic test
✅ Maestro: `flatlist-recycle-maintainvisible.yml` — reset with recycling
✅ Maestro: `flatlist-horizontal-recycle-maintainvisible.yml` — horizontal reset
✅ Maestro: `flatlist-horizontal-add50-reset-maintainvisible.yml` — horizontal + add 50 + reset

---

## 10. Sibling Items Above Anchor Resized

### 10.1. Sibling Items Above Anchor Grow

**Trigger:** Items positioned above the anchor in the list grow in size (e.g., images load, expandable content opens).

**Expected behavior:** The mathematical invariant `deltaY = newAnchorY - oldAnchorY = growth_of_items_above_anchor` holds. `contentOffset` increases by exactly the growth of items above, and the anchor's screen position (`anchorY - contentOffset`) remains constant. The anchor can never be pushed off-screen by sibling growth alone.

**Example:**
- List: [A, B, C, D, E, F, G, H], viewport 600px, scrollOffset.y = 0
- Before mount: A-E total = 200px, F at y=200 (first visible, anchor)
- After mount: A-E total = 800px (images load), F at y=800
- Delta = 800 - 200 = 600, contentOffset += 600 → contentOffset.y = 600
- F on screen = 800 - 600 = y=200 (same screen position as before)

**Correctness:** The delta correction works as designed. The anchor stays at the same screen position. This differs from CSS scroll anchoring, which keeps the user's *reading position* stable (visible content may shift on screen). MVCP keeps the *same view* locked to the same screen position.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles sibling items above anchor growing`

---

### 10.2. Sibling Items Above Anchor Shrink

**Trigger:** Items positioned above the anchor shrink in size.

**Expected behavior:** Same invariant as growth, but delta is negative. `contentOffset` decreases by the shrinkage amount.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles sibling items above anchor shrinking`

---

## 11. User Interaction During MVCP

### 11.1. User Drag During MVCP

**Trigger:** The user is actively dragging (touch-scrolling) the list when a data change triggers MVCP.

**Expected behavior:** If the user is actively scrolling when a prepend happens, the MVCP correction may compete with the user's scroll. The scroll skip guard (on `patch/add-scrolling-guard` branch) would skip correction during user dragging, but this is NOT merged.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition does not interrupt scroll during prepend`
✅ Maestro: `flatlist-maintainvisible.yml` — tests user scroll during prepend (drag *during* prepend only)

---

### 11.2. Momentum Scroll During MVCP

**Trigger:** The list is in momentum scroll (fling) when a data change triggers MVCP.

**Expected behavior:** The MVCP correction is applied during `didMountItems` which happens asynchronously, so timing is unpredictable. The unmerged fix on `patch/add-scrolling-guard` branch adds scroll correction skip during momentum across iOS (Fabric) and Android, but this is NOT merged. iOS Paper does NOT have this guard even in the merged fix.

**Test coverage:** ✅ Maestro: `flatlist-momentum-scroll-maintainvisible.yml` — prepend, then momentum scroll; verify position stable after settle

---

### 11.3. Pull-to-Refresh + Prepend

**Trigger:** User performs pull-to-refresh which triggers a data prepend.

**Expected behavior:** Pull-to-refresh typically scrolls to top, then prepends items. MVCP should handle the prepend delta after the refresh completes. No specific guard exists for this scenario.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition simulates pull-to-refresh pattern`

---

## 12. Navigation (Mount/Unmount Cycles)

### 12.1. Unmount ScrollView

**Trigger:** The ScrollView is unmounted (e.g., user navigates away from screen).

**Expected behavior:** iOS Fabric: `prepareForRecycle` at `RCTScrollViewComponentView.mm:685-715` resets `_prevFirstVisibleFrame`, `_firstVisibleView`, `_firstVisibleViewTag` when the ScrollView is recycled. Android: `stop()` at `MaintainVisibleScrollPositionHelper.kt:77-83` removes UIManager listener.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles unmount/remount (navigation pattern)`

---

### 12.2. Mount ScrollView (New Screen)

**Trigger:** A new screen with a FlatList is pushed onto the navigation stack.

**Expected behavior:** Fresh MVCP state initialization. `_prepareForMaintainVisibleScrollPosition` runs on first mount.

**Test coverage:** ❌ Covered implicitly in all tests (each test starts with a fresh FlatList)

---

### 12.3. Screen Transition + MVCP

**Trigger:** Items are prepended while the list is visible during a push/pop navigation transition. The ScrollView's frame is animating.

**Expected behavior:** The frame-based delta computation may be wrong because the ScrollView's frame is animating. The captured pre-mount frame and post-layout frame may not reflect the final resting position.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles unmount/remount (navigation pattern)`

---

## 13. Concurrent Mutations

### 13.1. Prepend + Append + Middle Delete

**Trigger:** Multiple mutation types in the same data batch: items prepended at top, items appended at bottom, items deleted from middle.

**Expected behavior:** The anchor's final frame reflects ALL changes, so delta is correct for the net effect. MVCP computes a single delta from the anchor's total frame shift.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles complex concurrent mutations (prepend + append + middle delete)`

---

### 13.2. Rapid State Updates (Many Renders)

**Trigger:** Many rapid state updates cause many re-renders in quick succession.

**Expected behavior:** If scroll events are throttled (via `scrollEventThrottle`), `pendingScrollUpdateCount` may not decrement promptly, blocking render window updates for longer than expected. The Android scroll throttle fix (`emitScrollEventNoThrottle()`) ensures JS state is current after MVCP adjustments.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles rapid state updates`
✅ Maestro: `flatlist-rapid-prepends-maintainvisible.yml` — 5x 50-item prepends without waits (tests rapid mutations)
✅ Maestro: `flatlist-throttle-maintainvisible.yml` — 500ms throttle; prepend under throttle; delta assertion [42, 46]

---

## 14. getItemLayout Usage

### 14.1. Fixed-Size List with getItemLayout

**Trigger:** A FlatList with a `getItemLayout` prop providing fixed item dimensions.

**Expected behavior:** Native MVCP always reads actual frames, so it is accurate regardless of JS metrics. `getItemLayout` doesn't affect native MVCP.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition with getItemLayout prop`

---

### 14.2. Dynamic-Size List without getItemLayout

**Trigger:** A FlatList without `getItemLayout`, items have variable sizes.

**Expected behavior:** Native MVCP reads actual frames, so it is accurate. The initial frame measurement may be wrong if items have highly variable sizes (e.g., images with unknown dimensions), causing incorrect first MVCP delta. Subsequent layout updates correct this.

**Test coverage:** ✅ Maestro: `flatlist-variable-height-maintainvisible.yml` — variable height items (no `getItemLayout`)

---

## 15. ContentInset Changes (Keyboard, Safe Area)

### 15.1. Keyboard Appears/Disappears

**Trigger:** The keyboard appears or disappears, changing the ScrollView's contentInset.

**Expected behavior:** If the keyboard appears exactly when MVCP correction is applied, the inset change may interfere with the scroll correction. The timing is race-dependent. Frame-based MVCP delta computation is not affected by inset changes because frames are in content coordinates, not inset-adjusted coordinates.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles contentInset changes (keyboard/safe area)`

---

### 15.2. Safe Area Inset Changes

**Trigger:** Safe area insets change (e.g., device rotation, split-screen on iPad).

**Expected behavior:** Similar to keyboard — frame-based delta is in content coordinates, so inset changes don't directly affect delta computation. The scroll offset may need adjustment if the visible area changes.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition handles contentInset changes (keyboard/safe area)`
✅ Maestro: `flatlist-orientation-maintainvisible.yml` — exercises related behavior

---

## 16. scrollToOffset During MVCP Active

### 16.1. scrollToOffset (Non-Animated)

**Trigger:** A programmatic `scrollToOffset(offset)` call is made while MVCP is active (list has `maintainVisibleContentPosition` prop set).

**Expected behavior:** Programmatic `scrollToOffset` during MVCP active can cause incorrect final position. The MVCP delta is additive, so it adds to whatever the current scroll position is, which may have been changed by `scrollToOffset`. This is a known open issue.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition with scrollToOffset (non-animated)`
✅ Maestro: `flatlist-scrolltooffset-maintainvisible.yml` — verifies offset ~100 after scrollToOffset (not 100 + MVCP delta)

---

### 16.2. scrollToOffset (Animated)

**Trigger:** An animated `scrollToOffset` call is in progress when MVCP correction is applied.

**Expected behavior:** Animated scrollToOffset is interrupted by MVCP correction because setting `contentOffset` directly (iOS) or calling `scrollToPreservingMomentum` (Android) replaces any ongoing animation.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition with scrollToOffset (animated)`
✅ Covered implicitly in `flatlist-scrolltooffset-maintainvisible.yml`

---

## 17. ScrollView-Specific Scenarios

### 17.1. ScrollView with minIndexForVisible

**Trigger:** A ScrollView (not FlatList) with `maintainVisibleContentPosition={{minIndexForVisible: N}}`.

**Expected behavior:** Same MVCP logic as FlatList, but ScrollView has a fixed set of subviews (no virtualization). The anchor is the Nth subview whose bottom edge is below the scroll offset.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition with minIndexForVisible > 0 skips early items`
✅ Maestro: `scrollview-minindex-maintainvisible.yml` — delta assertion [38, 44] for 40px items (no margin)

---

### 17.2. ScrollView with autoscrollToTopThreshold

**Trigger:** A ScrollView with `autoscrollToTopThreshold` set.

**Expected behavior:** When scroll offset drops below the threshold, the ScrollView auto-scrolls to top. MVCP should not interfere with this behavior.

**Test coverage:** ✅ Fantom: `maintainVisibleContentPosition with autoscrollToTopThreshold triggers scroll to top`
✅ Maestro: `scrollview-threshold-maintainvisible.yml` — delta [38, 44] + threshold scroll-to-top behavior

---

## Summary: Test Coverage Gaps

### Maestro Gaps

| Gap | Severity | Rationale for No Test |
|-----|----------|----------------------|
| 2.2 initialScrollIndex + prepend | Medium | `initialScrollIndex` only fires on init; remount triggers RNTester navigation |
| 4.3 Key Change (New Key) | Low | Data reset test exercises same code path (key mismatch → anchor recomputation)
| 5.3 All Visible Items Culled (Spacers) | Low | Edge case not exercisable in RNTester harness |
| 7.2 Horizontal RTL | Low | Requires device language change for RTL layout |
| 12.1/12.3 Navigation | Medium | Navigation transitions not part of RNTester harness |
| 15.1 Keyboard Inset Changes | Low | Keyboard not part of RNTester harness |

### Fantom Gaps

| Gap | Severity | Rationale for No Test |
|-----|----------|----------------------|
| 6.1 Vertical to Horizontal (Orientation) | Medium | Device rotation not simulatable in Fantom |
| 11.2 Momentum Scroll During MVCP | Medium | Physics-based scroll behavior not simulatable in Fantom |

## Summary: Tests Present

### Fantom Integration Tests

| Fantom Test | Scenarios Covered |
|-------------|------------------|
| `maintainVisibleContentPosition preserves position on prepend` | 1.1 |
| `maintainVisibleContentPosition handles consecutive prepends without drift` | 1.2 |
| `maintainVisibleContentPosition does not interfere with normal scroll` | 1.1 baseline |
| `maintainVisibleContentPosition with autoscrollToTopThreshold triggers scroll to top` | 17.2 |
| `maintainVisibleContentPosition with minIndexForVisible > 0 skips early items` | 17.1 |
| `maintainVisibleContentPosition with inverted ScrollView preserves position on prepend` | 8.1 |
| `maintainVisibleContentPosition with inverted ScrollView handles consecutive prepends` | 8.1 |
| `maintainVisibleContentPosition does not interrupt scroll during prepend` | 11.1 |
| `maintainVisibleContentPosition preserves position on horizontal prepend` | 7.1 |
| `maintainVisibleContentPosition preserves position on horizontal + inverted prepend` | 8.2 |
| `maintainVisibleContentPosition does not trigger correction on append` | 2.1 |
| `maintainVisibleContentPosition handles delete of anchor item` | 3.1 |
| `maintainVisibleContentPosition handles delete from middle of list` | 3.4 |
| `maintainVisibleContentPosition handles empty list gracefully` | 3.3, 9.1 |
| `maintainVisibleContentPosition handles sibling items above anchor growing` | 10.1 |
| `maintainVisibleContentPosition handles sibling items above anchor shrinking` | 10.2 |
| `maintainVisibleContentPosition handles data reset with entire data replacement` | 9.3 |
| `maintainVisibleContentPosition with initialScrollIndex + prepend after remount` | 2.2 |
| `maintainVisibleContentPosition preserves position on horizontal prepend in RTL` | 7.2 |
| `maintainVisibleContentPosition handles complex concurrent mutations (prepend + append + middle delete)` | 13.1 |
| `maintainVisibleContentPosition with getItemLayout prop` | 14.1 |
| `maintainVisibleContentPosition handles all items culled (spacers only in viewport)` | 5.3 |
| `maintainVisibleContentPosition simulates pull-to-refresh pattern` | 11.3 |
| `maintainVisibleContentPosition handles unmount/remount (navigation pattern)` | 12.1, 12.3 |
| `maintainVisibleContentPosition handles contentInset changes (keyboard/safe area)` | 15.1, 15.2 |
| `maintainVisibleContentPosition handles prepend with delete from bottom` | 1.3 |
| `maintainVisibleContentPosition handles large prepend (50+ items)` | 1.4 |
| `maintainVisibleContentPosition handles first prepend after initial mount` | 1.5 |
| `maintainVisibleContentPosition handles variable-height items` | 1.6 |
| `maintainVisibleContentPosition handles anchor culled (pushed off-screen)` | 5.1 |
| `maintainVisibleContentPosition with inverted + recycling` | 8.3 |
| `maintainVisibleContentPosition handles rapid state updates` | 13.2 |
| `maintainVisibleContentPosition with scrollToOffset (non-animated)` | 16.1 |
| `maintainVisibleContentPosition with scrollToOffset (animated)` | 16.2 |
| `maintainVisibleContentPosition handles content change with same size` | 4.1 |

### Maestro E2E Tests

| Test File | Scenarios Covered |
|-----------|------------------|
| `flatlist-maintainvisible.yml` | 1.1, 1.2, 1.3, 11.1, 9.3 |
| `flatlist-append-maintainvisible.yml` | 2.1 |
| `flatlist-first-prepend-maintainvisible.yml` | 1.5 |
| `flatlist-recycle-maintainvisible.yml` | 1.4, 5.1, 9.3 |
| `flatlist-variable-height-maintainvisible.yml` | 1.6, 4.2 |
| `flatlist-variable-height-first-prepend-maintainvisible.yml` | 1.6, 1.5 |
| `flatlist-delete-anchor-maintainvisible.yml` | 3.1 |
| `flatlist-delete-middle-maintainvisible.yml` | 3.2, 3.4 |
| `flatlist-pull-to-refresh-maintainvisible.yml` | 11.3 |
| `flatlist-complex-mutations-maintainvisible.yml` | 13.1 |
| `flatlist-throttle-maintainvisible.yml` | 13.2 |
| `flatlist-horizontal-maintainvisible.yml` | 7.1 |
| `flatlist-horizontal-add50-reset-maintainvisible.yml` | 9.3 |
| `flatlist-inverted-recycle-maintainvisible.yml` | 8.3 |
| `flatlist-inverted-maintainvisible.yml` | 8.1 |
| `flatlist-horizontal-inverted-maintainvisible.yml` | 8.2 |
| `flatlist-horizontal-inverted-recycle-maintainvisible.yml` | 8.3 |
| `flatlist-horizontal-recycle-maintainvisible.yml` | 1.4, 9.3 |
| `flatlist-empty-list-maintainvisible.yml` | 3.3, 9.1 |
| `flatlist-orientation-maintainvisible.yml` | 6.1 |
| `flatlist-scrolltooffset-maintainvisible.yml` | 16.1, 16.2 |
| `flatlist-momentum-scroll-maintainvisible.yml` | 11.2 |
| `flatlist-rapid-prepends-maintainvisible.yml` | 1.2, 13.2 |
| `flatlist-prepend-delete-maintainvisible.yml` | 1.3 |
| `scrollview-minindex-maintainvisible.yml` | 17.1 |
| `scrollview-threshold-maintainvisible.yml` | 17.2 |
