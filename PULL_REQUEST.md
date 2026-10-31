## Summary:

Resolves [#30973](https://github.com/react/react-native/issues/30973), [#30974](https://github.com/react/react-native/issues/30974), [#30975](https://github.com/react/react-native/issues/30975), and [#30977](https://github.com/react/react-native/issues/30977).

Screen reader users relying on **Android TalkBack** and **iOS VoiceOver** require explicit collection semantics when navigating virtualized list components (`FlatList`, `SectionList`, `VirtualizedList`). Without these, screen readers treat items as isolated, uncounted views instead of announcing:
- *"In list, N items"* when focusing the list container.
- *"Item X of Y"* when focusing an item.
- *"Showing items X to Y of Z"* when scrolling through list items.

This PR introduces built-in **Accessibility Collection Semantics** and `list` / `listitem` roles for all virtualized lists in React Native.

### Key Implementation Highlights:
1. **View Accessibility Interface (`ViewAccessibility.js`)**:
   - Added `'listitem'` to `AccessibilityRole`.
   - Added `AccessibilityCollection` and `AccessibilityCollectionItem` Flow types.
   - Added `accessibilityCollection`, `accessibilityCollectionItem`, `aria-setsize`, `aria-posinset`, `aria-rowcount`, `aria-colcount` to `AccessibilityProps`.

2. **Item-Level Semantics (`VirtualizedListCellRenderer.js`)**:
   - Automatically attaches `accessibilityRole="listitem"`, `aria-setsize={totalCount}`, `aria-posinset={index + 1}`, and `accessibilityCollectionItem` (calculating dynamic `rowIndex` and `columnIndex`).

3. **Container-Level Semantics (`VirtualizedList.js`)**:
   - Outer list container automatically receives `accessibilityRole="list"` (or `"grid"` when `numColumns > 1`), `aria-rowcount`, and `accessibilityCollection`.

4. **Multi-Column Grid & Edge-Case Protections**:
   - **Grid Support (`numColumns > 1`)**: Dynamically computes row indices and column indices for multi-column `FlatList` grid layouts.
   - **Opt-Out Prop (`accessibilityCollectionEnabled`)**: Added `accessibilityCollectionEnabled?: boolean` (defaults to `true`) allowing developers to bypass automatic attributes when needed.
   - **Custom Role Preservation**: Respects user-provided `accessibilityRole` overrides.

---

## Changelog:

[GENERAL] [ADDED] - Add Accessibility Collection semantics and list/listitem roles to VirtualizedList, FlatList, and SectionList

---

## Test Plan:

### Automated Tests
- Ran unit test suite in `VirtualizedList-test.js`:
```bash
yarn test packages/virtualized-lists/Lists/__tests__/VirtualizedList-test.js
```
- Added test case verifying container `accessibilityRole="list"`, `aria-rowcount`, item `accessibilityRole="listitem"`, `aria-setsize`, `aria-posinset`, and `accessibilityCollectionItem`.

### Device & Simulator Verification
- **Android TalkBack**: Verified screen reader announces total count on list focus and item position during navigation.
- **iOS VoiceOver**: Verified VoiceOver reads list container bounds and item indices.
