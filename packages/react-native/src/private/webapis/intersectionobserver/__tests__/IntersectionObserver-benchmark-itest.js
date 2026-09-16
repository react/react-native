/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {Root} from '@react-native/fantom';
import type {HostInstance} from 'react-native';
import type IntersectionObserverType from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserver';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import ScrollView from 'react-native/Libraries/Components/ScrollView/ScrollView';
import View from 'react-native/Libraries/Components/View/View';
import setUpIntersectionObserver from 'react-native/src/private/setup/setUpIntersectionObserver';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

declare const IntersectionObserver: Class<IntersectionObserverType>;

setUpIntersectionObserver();

const nodeRef = createRef<HostInstance>();
let node: ReactNativeElement;
const rootRef = createRef<HostInstance>();
let rootNode: ReactNativeElement;
const scrollViewRef = createRef<HostInstance>();
let scrollViewNode: ReactNativeElement;
let observer: IntersectionObserverType;
const VIEWPORT_HEIGHT = 100;
const VIEWPORT_WIDTH = 100;
const root = Fantom.createRoot({
  viewportHeight: VIEWPORT_HEIGHT,
  viewportWidth: VIEWPORT_WIDTH,
});
let mockCallback = jest.fn();

function cleanup(renderedRoot: Root, testObserver: ?IntersectionObserverType) {
  Fantom.runTask(() => {
    if (testObserver != null) {
      testObserver.disconnect();
    }
    root.render(<></>);
  });
}

// Scroll yOffset 1px at a time
function scrollBy1(scrollNode: ReactNativeElement, yOffset: number) {
  for (let i = 1; i <= yOffset; i++) {
    Fantom.scrollTo(scrollNode, {
      x: 0,
      y: i,
    });
  }
}

// Render element such that it appears at `Fantom.scrollTo({x, y: yOffset})`
// A negative value `yOffset` means the element is already onscreen
function renderElementAtYScrollPosition(yOffset: number, element: React.Node) {
  return (
    <>
      <View
        style={{
          width: VIEWPORT_WIDTH,
          height: VIEWPORT_HEIGHT + yOffset,
        }}
      />
      {element}
    </>
  );
}

Fantom.unstable_benchmark
  .suite('IntersectionObserver')
  .test(
    'Create IntersectionObserver',
    () => {
      Fantom.runTask(() => {
        observer = new IntersectionObserver(mockCallback, {});
      });
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
      },
      afterEach: () => {
        expect(mockCallback).not.toHaveBeenCalled();
        cleanup(root, observer);
      },
    },
  )
  .test(
    'Create IntersectionObserver with custom root',
    () => {
      Fantom.runTask(() => {
        observer = new IntersectionObserver(mockCallback, {root: rootNode});
      });
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
        Fantom.runTask(() => {
          root.render(<View ref={rootRef} />);
        });
        rootNode = nullthrows(rootRef.current);
      },
      afterEach: () => {
        expect(mockCallback).not.toHaveBeenCalled();
        cleanup(root, observer);
      },
    },
  )
  .test(
    'Observe a mounted view',
    () => {
      Fantom.runTask(() => {
        observer.observe(node);
      });
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
        Fantom.runTask(() => {
          root.render(<View style={{width: 100, height: 10}} ref={nodeRef} />);
          observer = new IntersectionObserver(mockCallback);
        });
        node = nullthrows(nodeRef.current);
      },
      afterEach: () => {
        expect(mockCallback).toHaveBeenCalledTimes(1);
        const [entries] = mockCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(true);

        cleanup(root, observer);
      },
    },
  )
  .test(
    'Observe a mounted view with custom root',
    () => {
      Fantom.runTask(() => {
        observer.observe(node);
      });
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
        Fantom.runTask(() => {
          root.render(
            <View ref={rootRef}>
              <View style={{width: 100, height: 10}} ref={nodeRef} />
            </View>,
          );
        });
        node = nullthrows(nodeRef.current);
        rootNode = nullthrows(rootRef.current);
        Fantom.runTask(() => {
          observer = new IntersectionObserver(mockCallback, {root: rootNode});
        });
      },
      afterEach: () => {
        expect(mockCallback).toHaveBeenCalledTimes(1);
        const [entries] = mockCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(true);

        cleanup(root, observer);
      },
    },
  )
  .test(
    'Observe a mounted view with custom root and % rootMargin',
    () => {
      Fantom.runTask(() => {
        observer.observe(node);
      });
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();
        Fantom.runTask(() => {
          root.render(
            <View ref={rootRef}>
              <View style={{width: 100, height: 10}} ref={nodeRef} />
            </View>,
          );
        });
        node = nullthrows(nodeRef.current);
        rootNode = nullthrows(rootRef.current);
        Fantom.runTask(() => {
          observer = new IntersectionObserver(mockCallback, {
            root: rootNode,
            rootMargin: '10%',
          });
        });
      },
      afterEach: () => {
        expect(mockCallback).toHaveBeenCalledTimes(1);
        const [entries] = mockCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(true);

        cleanup(root, observer);
      },
    },
  )
  .test(
    'ScrollView no intersection, no observation',
    () => {
      scrollBy1(scrollViewNode, VIEWPORT_HEIGHT);
    },
    {
      beforeEach: () => {
        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollViewRef}>
              {renderElementAtYScrollPosition(
                VIEWPORT_HEIGHT + 50,
                <View style={{width: 100, height: 10}} />,
              )}
            </ScrollView>,
          );
        });
        scrollViewNode = nullthrows(scrollViewRef.current);
      },
      afterEach: () => {
        cleanup(root, observer);
      },
    },
  )
  .test(
    'ScrollView intersection, no observation',
    () => {
      scrollBy1(scrollViewNode, VIEWPORT_HEIGHT);
    },
    {
      beforeEach: () => {
        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollViewRef}>
              {renderElementAtYScrollPosition(
                -5,
                <View style={{width: 100, height: 10}} />,
              )}
            </ScrollView>,
          );
        });
        scrollViewNode = nullthrows(scrollViewRef.current);
      },
      afterEach: () => {
        cleanup(root);
      },
    },
  )
  .test(
    'ScrollView no intersection, observation',
    () => {
      scrollBy1(scrollViewNode, VIEWPORT_HEIGHT);
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollViewRef}>
              {renderElementAtYScrollPosition(
                VIEWPORT_HEIGHT + 50,
                <View ref={nodeRef} style={{width: 100, height: 10}} />,
              )}
            </ScrollView>,
          );
        });
        scrollViewNode = nullthrows(scrollViewRef.current);
        node = nullthrows(nodeRef.current);
        Fantom.runTask(() => {
          observer = new IntersectionObserver(mockCallback, {});
          observer.observe(node);
        });
      },
      afterEach: () => {
        expect(mockCallback).toHaveBeenCalledTimes(1);

        const [entries] = mockCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(false);

        cleanup(root, observer);
      },
    },
  )
  .test(
    'ScrollView no intersection, observation with custom root',
    () => {
      scrollBy1(scrollViewNode, VIEWPORT_HEIGHT);
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollViewRef}>
              {renderElementAtYScrollPosition(
                VIEWPORT_HEIGHT + 50,
                <View ref={nodeRef} style={{width: 100, height: 10}} />,
              )}
            </ScrollView>,
          );
        });
        scrollViewNode = nullthrows(scrollViewRef.current);
        node = nullthrows(nodeRef.current);
        Fantom.runTask(() => {
          observer = new IntersectionObserver(mockCallback, {
            root: scrollViewNode,
          });
          observer.observe(node);
        });
      },
      afterEach: () => {
        expect(mockCallback).toHaveBeenCalledTimes(1);

        const [entries] = mockCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(false);

        cleanup(root, observer);
      },
    },
  )
  .test(
    'ScrollView intersection, observation',
    () => {
      scrollBy1(scrollViewNode, VIEWPORT_HEIGHT);
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollViewRef}>
              {renderElementAtYScrollPosition(
                -5,
                <View ref={nodeRef} style={{width: 100, height: 10}} />,
              )}
            </ScrollView>,
          );
        });
        scrollViewNode = nullthrows(scrollViewRef.current);
        node = nullthrows(nodeRef.current);
        Fantom.runTask(() => {
          observer = new IntersectionObserver(mockCallback, {threshold: 1});
          observer.observe(node);
        });
      },
      afterEach: () => {
        expect(mockCallback).toHaveBeenCalledTimes(3);

        const [entries1] = mockCallback.mock.calls[0];
        expect(entries1.length).toBe(1);
        expect(entries1[0].isIntersecting).toBe(false);

        const [entries2] = mockCallback.mock.calls[1];
        expect(entries2.length).toBe(1);
        expect(entries2[0].isIntersecting).toBe(true);

        const [entries3] = mockCallback.mock.calls[2];
        expect(entries3.length).toBe(1);
        expect(entries3[0].isIntersecting).toBe(false);

        cleanup(root, observer);
      },
    },
  )
  .test(
    'ScrollView intersection, observation, with custom root',
    () => {
      scrollBy1(scrollViewNode, VIEWPORT_HEIGHT);
    },
    {
      beforeEach: () => {
        mockCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollViewRef}>
              {renderElementAtYScrollPosition(
                -5,
                <View ref={nodeRef} style={{width: 100, height: 10}} />,
              )}
            </ScrollView>,
          );
        });
        scrollViewNode = nullthrows(scrollViewRef.current);
        node = nullthrows(nodeRef.current);
        Fantom.runTask(() => {
          observer = new IntersectionObserver(mockCallback, {
            threshold: 1,
            root: scrollViewNode,
          });
          observer.observe(node);
        });
      },
      afterEach: () => {
        expect(mockCallback).toHaveBeenCalledTimes(3);

        const [entries1] = mockCallback.mock.calls[0];
        expect(entries1.length).toBe(1);
        expect(entries1[0].isIntersecting).toBe(false);

        const [entries2] = mockCallback.mock.calls[1];
        expect(entries2.length).toBe(1);
        expect(entries2[0].isIntersecting).toBe(true);

        const [entries3] = mockCallback.mock.calls[2];
        expect(entries3.length).toBe(1);
        expect(entries3[0].isIntersecting).toBe(false);

        cleanup(root, observer);
      },
    },
  );
