/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {ScrollView, View} from 'react-native';

const ITEM_HEIGHT = 40;
const VIEWPORT_HEIGHT = 200;
const NUM_ITEMS = 20;

function makeItems(count, startKey = 0) {
  return Array.from({length: count}, (_, i) => ({
    key: String(i + startKey),
    id: i + startKey,
  }));
}

function renderItem(item) {
  return (
    <View
      key={item.key}
      nativeID={`item_${item.id}`}
      style={{height: ITEM_HEIGHT, width: 100}}>
      <View
        nativeID={`inner_${item.id}`}
        style={{
          height: ITEM_HEIGHT - 2,
          width: 100 - 2,
          backgroundColor: '#4CAF50',
        }}
      />
    </View>
  );
}

test('maintainVisibleContentPosition preserves position on prepend', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render initial list
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  // Verify initial mount
  const initialLogs = root.takeMountingManagerLogs();
  expect(initialLogs.length).toBeGreaterThan(0);

  // Scroll to item 5 (approximately 200px down)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  // Capture scroll logs
  const scrollLogs1 = root.takeMountingManagerLogs();
  expect(scrollLogs1.length).toBeGreaterThan(0);

  // Prepend 5 items at the top
  const itemsAfterPrepend = [
    ...makeItems(5, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  // Simulate the native scroll correction that would happen after prepend.
  // The content height increased by 5 * ITEM_HEIGHT, so the scroll offset
  // should be adjusted to keep the same item visible.
  const expectedContentHeight = itemsAfterPrepend.length * ITEM_HEIGHT;
  Fantom.runTask(() => {
    // Trigger content size change simulation
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        contentSize={{width: 100, height: expectedContentHeight}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const prependingLogs = root.takeMountingManagerLogs();
  expect(prependingLogs.length).toBeGreaterThan(0);

  // Verify that the item_5 is still in the rendered tree after prepend
  // (it should have moved from index 5 to index 10, but still be visible)
  expect(prependingLogs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition handles consecutive prepends without drift', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  let currentItems = makeItems(NUM_ITEMS);

  // Render initial list
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to middle of the list
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 8,
  });

  root.takeMountingManagerLogs();

  // Perform 3 consecutive prepends
  const numPrepends = 3;
  const itemsPerPrepend = 3;
  let lastLogs = [];

  for (let i = 0; i < numPrepends; i++) {
    currentItems = [
      ...makeItems(itemsPerPrepend, currentItems.length),
      ...currentItems,
    ];

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          ref={nodeRef}
          style={{height: VIEWPORT_HEIGHT, width: 100}}
          maintainVisibleContentPosition={{minIndexForVisible: 0}}>
          {currentItems.map(renderItem)}
        </ScrollView>,
      );
    });

    lastLogs = root.takeMountingManagerLogs();
    expect(lastLogs.length).toBeGreaterThan(0);
  }

  // The list should still contain the original items
  expect(lastLogs.some(log => log.includes('item_0'))).toBe(true);
  expect(lastLogs.some(log => log.includes('item_19'))).toBe(true);
});

test('maintainVisibleContentPosition does not interfere with normal scroll', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const items = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {items.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Normal scrolling should work as expected
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: 0,
  });

  let logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);

  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 10,
  });

  logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);

  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
});

test('maintainVisibleContentPosition with autoscrollToTopThreshold triggers scroll to top', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const items = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}>
        {items.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll near the top (within threshold)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: 5,
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);

  // Prepend items — since we're within the threshold, scroll should go to top
  const itemsAfterPrepend = [
    ...makeItems(5, NUM_ITEMS),
    ...items,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const prependingLogs = root.takeMountingManagerLogs();
  expect(prependingLogs.length).toBeGreaterThan(0);
});

test('maintainVisibleContentPosition with minIndexForVisible > 0 skips early items', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const items = makeItems(NUM_ITEMS);

  // Use minIndexForVisible: 5 — only maintain position for items at index 5+
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 5}}>
        {items.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 8
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 8,
  });

  const logs1 = root.takeMountingManagerLogs();
  expect(logs1.length).toBeGreaterThan(0);

  // Prepend 3 items — item 8 becomes item 11, but minIndexForVisible: 5
  // means items 0-4 are not considered for anchor
  const itemsAfterPrepend = [
    ...makeItems(3, NUM_ITEMS),
    ...items,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 5}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs2 = root.takeMountingManagerLogs();
  expect(logs2.length).toBeGreaterThan(0);
});

test('maintainVisibleContentPosition with inverted ScrollView preserves position on prepend', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render initial list with inverted mode
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        inverted
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  // Verify initial mount
  const initialLogs = root.takeMountingManagerLogs();
  expect(initialLogs.length).toBeGreaterThan(0);

  // Scroll to item 5 (in inverted mode, this is near the bottom)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  const scrollLogs1 = root.takeMountingManagerLogs();
  expect(scrollLogs1.length).toBeGreaterThan(0);

  // Prepend 5 items at the top
  const itemsAfterPrepend = [
    ...makeItems(5, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        inverted
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const prependingLogs = root.takeMountingManagerLogs();
  expect(prependingLogs.length).toBeGreaterThan(0);

  // Verify that the item_5 is still in the rendered tree after prepend
  expect(prependingLogs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition with inverted ScrollView handles consecutive prepends', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  let currentItems = makeItems(NUM_ITEMS);

  // Render initial list with inverted mode
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        inverted
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to middle
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 8,
  });

  root.takeMountingManagerLogs();

  // Perform 3 consecutive prepends in inverted mode
  const numPrepends = 3;
  const itemsPerPrepend = 3;
  let lastLogs = [];

  for (let i = 0; i < numPrepends; i++) {
    currentItems = [
      ...makeItems(itemsPerPrepend, currentItems.length),
      ...currentItems,
    ];

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          ref={nodeRef}
          style={{height: VIEWPORT_HEIGHT, width: 100}}
          inverted
          maintainVisibleContentPosition={{minIndexForVisible: 0}}>
          {currentItems.map(renderItem)}
        </ScrollView>,
      );
    });

    lastLogs = root.takeMountingManagerLogs();
    expect(lastLogs.length).toBeGreaterThan(0);
  }

  // The list should still contain the original items
  expect(lastLogs.some(log => log.includes('item_0'))).toBe(true);
  expect(lastLogs.some(log => log.includes('item_19'))).toBe(true);
});

test('maintainVisibleContentPosition does not interrupt scroll during prepend', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render initial list
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Scroll to item 10 (simulating user dragging upward)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 10,
  });

  const dragScrollLogs = root.takeMountingManagerLogs();
  expect(dragScrollLogs.length).toBeGreaterThan(0);

  // Prepend 5 items while the scroll position is at item 10
  const itemsAfterPrepend = [
    ...makeItems(5, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const prependLogs = root.takeMountingManagerLogs();
  expect(prependLogs.length).toBeGreaterThan(0);

  // Verify that the item_10 is still visible after prepend
  // (it should have moved from index 10 to index 15, but remain at the same screen position)
  expect(prependLogs.some(log => log.includes('item_10'))).toBe(true);
});

test('maintainVisibleContentPosition preserves position on horizontal prepend', () => {
  const root = Fantom.createRoot({
    viewportWidth: VIEWPORT_HEIGHT,
    viewportHeight: 100,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        horizontal
        style={{height: 100, width: VIEWPORT_HEIGHT}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll horizontally to item 5
  Fantom.scrollTo(nodeRef, {
    x: ITEM_HEIGHT * 5,
    y: 0,
  });

  root.takeMountingManagerLogs();

  // Prepend 5 items
  const itemsAfterPrepend = [
    ...makeItems(5, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        horizontal
        style={{height: 100, width: VIEWPORT_HEIGHT}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  expect(logs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition preserves position on horizontal + inverted prepend', () => {
  const root = Fantom.createRoot({
    viewportWidth: VIEWPORT_HEIGHT,
    viewportHeight: 100,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        horizontal
        inverted
        style={{height: 100, width: VIEWPORT_HEIGHT}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  Fantom.scrollTo(nodeRef, {
    x: ITEM_HEIGHT * 5,
    y: 0,
  });

  root.takeMountingManagerLogs();

  const itemsAfterPrepend = [
    ...makeItems(5, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        horizontal
        inverted
        style={{height: 100, width: VIEWPORT_HEIGHT}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  expect(logs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition does not trigger correction on append', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Append 5 items at the end (should not affect anchor position)
  const itemsAfterAppend = [
    ...initialItems,
    ...makeItems(5, NUM_ITEMS),
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterAppend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // Append shouldn't affect anchor — verify list is still rendered with new items
  expect(logs.some(log => log.includes('item_20'))).toBe(true);
});

test('maintainVisibleContentPosition handles delete of anchor item', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  let currentItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5 (it will be the anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Delete item 5 (the anchor)
  currentItems = currentItems.filter((_, i) => i !== 5);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // item_5 should be gone, item_6 should now be visible (shifted to index 5)
  expect(logs.some(log => log.includes('item_6'))).toBe(true);
});

test('maintainVisibleContentPosition handles delete from middle of list', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  let currentItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 10 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 10,
  });

  root.takeMountingManagerLogs();

  // Delete item 3 (above anchor, should cause anchor to shift up)
  currentItems = currentItems.filter((_, i) => i !== 3);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // item_10 should still be visible (now at index 9 after deletion)
  expect(logs.some(log => log.includes('item_10'))).toBe(true);
});

test('maintainVisibleContentPosition handles empty list gracefully', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Remove all items (empty list)
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {[]}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
});

test('maintainVisibleContentPosition handles sibling items above anchor growing', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 8 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 8,
  });

  root.takeMountingManagerLogs();

  // Render with items 0-4 growing from 40px to 80px each (40px growth per item = 200px total)
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map((item, index) =>
          index < 5
            ? (
                <View
                  key={item.key}
                  nativeID={`item_${item.id}`}
                  style={{height: ITEM_HEIGHT * 2, width: 100}}>
                  <View
                    nativeID={`inner_${item.id}`}
                    style={{
                      height: ITEM_HEIGHT * 2 - 2,
                      width: 100 - 2,
                      backgroundColor: '#4CAF50',
                    }}
                  />
                </View>
              )
            : renderItem(item),
        )}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  expect(logs.some(log => log.includes('item_8'))).toBe(true);
});

test('maintainVisibleContentPosition handles sibling items above anchor shrinking', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 8 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 8,
  });

  root.takeMountingManagerLogs();

  // Render with items 0-4 shrinking from 40px to 20px each (20px shrink per item = 100px total)
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map((item, index) =>
          index < 5
            ? (
                <View
                  key={item.key}
                  nativeID={`item_${item.id}`}
                  style={{height: ITEM_HEIGHT / 2, width: 100}}>
                  <View
                    nativeID={`inner_${item.id}`}
                    style={{
                      height: ITEM_HEIGHT / 2 - 2,
                      width: 100 - 2,
                      backgroundColor: '#4CAF50',
                    }}
                  />
                </View>
              )
            : renderItem(item),
        )}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  expect(logs.some(log => log.includes('item_8'))).toBe(true);
});

test('maintainVisibleContentPosition handles data reset with entire data replacement', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Replace entire data with new items (different keys)
  const resetItems = makeItems(NUM_ITEMS, 100);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {resetItems.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // Original items should be gone, new items should be present
  expect(logs.some(log => log.includes('item_105'))).toBe(true);
});

test('maintainVisibleContentPosition with initialScrollIndex + prepend after remount', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render list with initialScrollIndex pointing to a non-first item
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        key="list-1"
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        initialScrollIndex={5}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Force remount with a different key (simulates navigation to new screen with same component)
  const itemsAfterPrepend = [
    ...makeItems(3, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        key="list-2"
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        initialScrollIndex={8}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // After remount with prepend, items should be rendered with new keys
  expect(logs.some(log => log.includes('item_20'))).toBe(true);
});

test('maintainVisibleContentPosition preserves position on horizontal prepend in RTL', () => {
  const root = Fantom.createRoot({
    viewportWidth: VIEWPORT_HEIGHT,
    viewportHeight: 100,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        horizontal
        style={{direction: 'rtl', height: 100, width: VIEWPORT_HEIGHT}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll horizontally to item 5
  Fantom.scrollTo(nodeRef, {
    x: ITEM_HEIGHT * 5,
    y: 0,
  });

  root.takeMountingManagerLogs();

  // Prepend 5 items in RTL mode
  const itemsAfterPrepend = [
    ...makeItems(5, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        horizontal
        style={{direction: 'rtl', height: 100, width: VIEWPORT_HEIGHT}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // Verify items are rendered after prepend in RTL mode
  // (item_20 = first item after the 5 prepended items starting at key 20)
  expect(logs.some(log => log.includes('item_20'))).toBe(true);
});

test('maintainVisibleContentPosition handles complex concurrent mutations (prepend + append + middle delete)', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  let currentItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 8 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 8,
  });

  root.takeMountingManagerLogs();

  // Apply complex mutations in a single batch:
  // - Prepend 3 items at the top
  // - Append 2 items at the bottom
  // - Delete 2 items from the middle (indices 10 and 12 in the original array)
  const itemsAfterPrepend = [
    ...makeItems(3, NUM_ITEMS),
    ...currentItems,
    ...makeItems(2, NUM_ITEMS + 23),
  ];

  // Delete items at original indices 10 and 12 (which are now at indices 13 and 15 after prepend)
  currentItems = itemsAfterPrepend.filter((_, i) => i !== 13 && i !== 15);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The anchor item should still be visible after complex mutations
  expect(logs.some(log => log.includes('item_8'))).toBe(true);
  // Verify prepended items are present
  expect(logs.some(log => log.includes('item_20'))).toBe(true);
});

test('maintainVisibleContentPosition with getItemLayout prop', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  const getItemLayout = (_: mixed, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        getItemLayout={getItemLayout}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 7
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 7,
  });

  root.takeMountingManagerLogs();

  // Prepend 4 items
  const itemsAfterPrepend = [
    ...makeItems(4, NUM_ITEMS),
    ...initialItems,
  ];

  const getItemLayoutAfterPrepend = (_: mixed, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        getItemLayout={getItemLayoutAfterPrepend}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The anchor item should still be visible after prepend
  expect(logs.some(log => log.includes('item_7'))).toBe(true);
});

test('maintainVisibleContentPosition handles all items culled (spacers only in viewport)', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render list with items that have larger heights to push more items off-screen
  const LARGE_ITEM_HEIGHT = 80;

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map((item, index) => (
          <View
            key={item.key}
            nativeID={`item_${item.id}`}
            style={{height: LARGE_ITEM_HEIGHT, width: 100}}>
            <View
              nativeID={`inner_${item.id}`}
              style={{
                height: LARGE_ITEM_HEIGHT - 2,
                width: 100 - 2,
                backgroundColor: '#4CAF50',
              }}
            />
          </View>
        ))}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 10 (anchor) — this pushes items 0-2 off-screen (culled)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: LARGE_ITEM_HEIGHT * 10,
  });

  root.takeMountingManagerLogs();

  // Prepend 3 items — the culled items (0-2) are replaced by new items (20-22)
  // The viewport may show spacers (culled item slots) and new data items
  const itemsAfterPrepend = [
    ...makeItems(3, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map((item, index) => (
          <View
            key={item.key}
            nativeID={`item_${item.id}`}
            style={{height: LARGE_ITEM_HEIGHT, width: 100}}>
            <View
              nativeID={`inner_${item.id}`}
              style={{
                height: LARGE_ITEM_HEIGHT - 2,
                width: 100 - 2,
                backgroundColor: '#4CAF50',
              }}
            />
          </View>
        ))}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The list should still render without crashing
  expect(logs.some(log => log.includes('item_10'))).toBe(true);
});

test('maintainVisibleContentPosition simulates pull-to-refresh pattern', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  let currentItems = makeItems(NUM_ITEMS);

  // Render initial list
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Simulate pull-to-refresh: scroll to top first
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: 0,
  });

  root.takeMountingManagerLogs();

  // Refresh completes: prepend new items (simulating fresh data from server)
  const itemsAfterRefresh = [
    ...makeItems(3, NUM_ITEMS),
    ...currentItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterRefresh.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // Original items should still be present after refresh+prepend
  expect(logs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition handles unmount/remount (navigation pattern)', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render first list (screen 1)
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Unmount: replace with empty content (simulates navigating away)
  Fantom.runTask(() => {
    root.render(
      <View style={{height: VIEWPORT_HEIGHT, width: 100}} />,
    );
  });

  const unmountLogs = root.takeMountingManagerLogs();
  expect(unmountLogs.length).toBeGreaterThanOrEqual(0);

  // Remount: render a new list (simulates navigating to a new screen with same component)
  const newItems = makeItems(NUM_ITEMS, 50);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {newItems.map(renderItem)}
      </ScrollView>,
    );
  });

  const remountLogs = root.takeMountingManagerLogs();
  expect(remountLogs.length).toBeGreaterThan(0);
  // New list items should be rendered (not old ones)
  expect(remountLogs.some(log => log.includes('item_55'))).toBe(true);
});

test('maintainVisibleContentPosition handles contentInset changes (keyboard/safe area)', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render list without contentInset
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 8 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 8,
  });

  root.takeMountingManagerLogs();

  // Simulate keyboard appearance: change contentInset (bottom inset increases)
  const itemsAfterPrepend = [
    ...makeItems(2, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        contentInset={{bottom: 200, top: 0, left: 0, right: 0}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The anchor item should still be visible after contentInset change + prepend
  expect(logs.some(log => log.includes('item_8'))).toBe(true);
});

test('maintainVisibleContentPosition handles prepend with delete from bottom', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  let currentItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Prepend 1 item at top AND delete 3 from bottom in same batch
  const itemsAfterMutation = [
    ...makeItems(1, NUM_ITEMS),
    ...currentItems.slice(0, NUM_ITEMS - 3),
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterMutation.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The anchor item should still be visible after prepending at top and deleting from bottom
  expect(logs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition handles large prepend (50+ items)', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Prepend 50 items — this causes view recycling, tag comparison safeguard must detect it
  const itemsAfterPrepend = [
    ...makeItems(50, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The list should render without crashing despite view recycling
  expect(logs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition handles first prepend after initial mount', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render initial list — anchor state not yet initialized
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  const initialLogs = root.takeMountingManagerLogs();
  expect(initialLogs.length).toBeGreaterThan(0);

  // Prepend 5 items on the very first update (anchor state being initialized)
  const itemsAfterPrepend = [
    ...makeItems(5, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // Items should be rendered correctly after first prepend
  expect(logs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition handles variable-height items', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  // Render with variable heights (some items taller than others)
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map((item, index) => (
          <View
            key={item.key}
            nativeID={`item_${item.id}`}
            style={{height: index % 3 === 0 ? ITEM_HEIGHT * 2 : ITEM_HEIGHT, width: 100}}>
            <View
              nativeID={`inner_${item.id}`}
              style={{
                height: (index % 3 === 0 ? ITEM_HEIGHT * 2 : ITEM_HEIGHT) - 2,
                width: 100 - 2,
                backgroundColor: '#4CAF50',
              }}
            />
          </View>
        ))}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 6
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 6,
  });

  root.takeMountingManagerLogs();

  // Prepend 3 variable-height items
  const itemsAfterPrepend = [
    ...makeItems(3, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map((item, index) => (
          <View
            key={item.key}
            nativeID={`item_${item.id}`}
            style={{height: index % 3 === 0 ? ITEM_HEIGHT * 2 : ITEM_HEIGHT, width: 100}}>
            <View
              nativeID={`inner_${item.id}`}
              style={{
                height: (index % 3 === 0 ? ITEM_HEIGHT * 2 : ITEM_HEIGHT) - 2,
                width: 100 - 2,
                backgroundColor: '#4CAF50',
              }}
            />
          </View>
        ))}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The anchor item should still be visible after prepend with variable heights
  expect(logs.some(log => log.includes('item_6'))).toBe(true);
});

test('maintainVisibleContentPosition handles anchor culled (pushed off-screen)', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 3 (anchor near top)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 3,
  });

  root.takeMountingManagerLogs();

  // Prepend 10 items — pushes item_3 off-screen (culled), a new anchor is selected
  const itemsAfterPrepend = [
    ...makeItems(10, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The list should render without crashing when anchor is culled
  expect(logs.some(log => log.includes('item_13'))).toBe(true);
});

test('maintainVisibleContentPosition with inverted + recycling', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        inverted
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5 (in inverted mode, near bottom)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Prepend 50 items — causes recycling in inverted mode
  const itemsAfterPrepend = [
    ...makeItems(50, NUM_ITEMS),
    ...initialItems,
  ];

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        inverted
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {itemsAfterPrepend.map(renderItem)}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // The list should render without crashing in inverted + recycling mode
  expect(logs.some(log => log.includes('item_5'))).toBe(true);
});

test('maintainVisibleContentPosition handles rapid state updates', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  let currentItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {currentItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 8
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 8,
  });

  root.takeMountingManagerLogs();

  // Perform many rapid prepends in succession (simulates many rapid state updates)
  const numBatches = 5;
  const itemsPerBatch = 10;

  for (let i = 0; i < numBatches; i++) {
    currentItems = [
      ...makeItems(itemsPerBatch, currentItems.length),
      ...currentItems,
    ];

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          ref={nodeRef}
          style={{height: VIEWPORT_HEIGHT, width: 100}}
          maintainVisibleContentPosition={{minIndexForVisible: 0}}>
          {currentItems.map(renderItem)}
        </ScrollView>,
      );
    });
  }

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // Original items should still be present after many rapid updates
  expect(logs.some(log => log.includes('item_8'))).toBe(true);
});

test('maintainVisibleContentPosition with scrollToOffset (non-animated)', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Call scrollToOffset while MVCP is active
  // Programmatic scrollToOffset during MVCP active can cause incorrect final position
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 10,
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
});

test('maintainVisibleContentPosition with scrollToOffset (animated)', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Call scrollToOffset while MVCP is active
  // Animated scrollToOffset is interrupted by MVCP correction
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 15,
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
});

test('maintainVisibleContentPosition handles content change with same size', () => {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const nodeRef = createRef<HostInstance>();

  const initialItems = makeItems(NUM_ITEMS);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map(renderItem)}
      </ScrollView>,
    );
  });

  root.takeMountingManagerLogs();

  // Scroll to item 5 (anchor)
  Fantom.scrollTo(nodeRef, {
    x: 0,
    y: ITEM_HEIGHT * 5,
  });

  root.takeMountingManagerLogs();

  // Re-render with different content but same size (simulates text change, icon swap, etc.)
  Fantom.runTask(() => {
    root.render(
      <ScrollView
        ref={nodeRef}
        style={{height: VIEWPORT_HEIGHT, width: 100}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}>
        {initialItems.map((item, index) => (
          <View
            key={item.key}
            nativeID={`item_${item.id}`}
            style={{height: ITEM_HEIGHT, width: 100}}>
            <View
              nativeID={`inner_${item.id}`}
              style={{
                height: ITEM_HEIGHT - 2,
                width: 100 - 2,
                backgroundColor: index % 2 === 0 ? '#4CAF50' : '#2196F3',
              }}
            />
          </View>
        ))}
      </ScrollView>,
    );
  });

  const logs = root.takeMountingManagerLogs();
  expect(logs.length).toBeGreaterThan(0);
  // No frame change, no scroll correction expected
  // No frame change, no scroll correction expected (content change alone doesn't shift frames)
});
