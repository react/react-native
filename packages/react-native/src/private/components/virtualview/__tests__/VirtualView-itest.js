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

import type {Rect} from '../VirtualView';
import type {NativeModeChangeEvent} from '../VirtualViewNativeComponent';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import isUnreachable from '../../../__tests__/utilities/isUnreachable';
import {getNodeFromPublicInstance} from '../../../../../Libraries/ReactPrivate/ReactNativePrivateInterface';
import ReactNativeElement from '../../../webapis/dom/nodes/ReactNativeElement';
import VirtualView, {_logs, VirtualViewMode} from '../VirtualView';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef, useEffect, useState} from 'react';
import {Text} from 'react-native';

beforeEach(() => {
  _logs.states = [];
});

describe('mode changes', () => {
  test('changes mode from visible to hidden', () => {
    const root = Fantom.createRoot();
    const viewRef = createRef<React.RefOf<VirtualView>>();

    Fantom.runTask(() => {
      root.render(
        <VirtualView ref={viewRef}>
          <Text>Child</Text>
        </VirtualView>,
      );
    });

    expect(_logs.states).toHaveLength(1);
    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-virtualViewExperimental>
        <rn-paragraph>Child</rn-paragraph>
      </rn-virtualViewExperimental>,
    );

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Hidden);

    expect(_logs.states).toHaveLength(2);
    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-virtualViewExperimental />,
    );
  });

  test('changes mode from hidden to visible', () => {
    const root = Fantom.createRoot();
    const viewRef = createRef<React.RefOf<VirtualView>>();

    Fantom.runTask(() => {
      root.render(
        <VirtualView ref={viewRef}>
          <Text>Child</Text>
        </VirtualView>,
      );
    });

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Hidden);

    expect(_logs.states).toHaveLength(2);
    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-virtualViewExperimental />,
    );

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Visible);

    expect(_logs.states).toHaveLength(3);
    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-virtualViewExperimental>
        <rn-paragraph>Child</rn-paragraph>
      </rn-virtualViewExperimental>,
    );
  });

  test('changes mode from prerender to visible', () => {
    const root = Fantom.createRoot();
    const viewRef = createRef<React.RefOf<VirtualView>>();

    Fantom.runTask(() => {
      root.render(
        <VirtualView ref={viewRef}>
          <Text>Child</Text>
        </VirtualView>,
      );
    });

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Prerender);

    expect(_logs.states).toHaveLength(1);
    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-virtualViewExperimental>
        <rn-paragraph>Child</rn-paragraph>
      </rn-virtualViewExperimental>,
    );

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Visible);

    // Expects `VirtualView` does not undergo a state update.
    expect(_logs.states).toHaveLength(1);
    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-virtualViewExperimental>
        <rn-paragraph>Child</rn-paragraph>
      </rn-virtualViewExperimental>,
    );
  });
});

describe('styles', () => {
  test('does not set styles when visible', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<VirtualView />);
    });

    expect(
      root.getRenderedOutput({props: ['minHeight', 'minWidth']}).toJSX(),
    ).toEqual(<rn-virtualViewExperimental />);
  });

  test('does not set styles when prerendered', () => {
    const root = Fantom.createRoot();
    const viewRef = createRef<React.RefOf<VirtualView>>();

    Fantom.runTask(() => {
      root.render(<VirtualView ref={viewRef} />);
    });

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Prerender);

    expect(
      root.getRenderedOutput({props: ['minHeight', 'minWidth']}).toJSX(),
    ).toEqual(<rn-virtualViewExperimental />);
  });

  test('sets styles when hidden', () => {
    const root = Fantom.createRoot();
    const viewRef = createRef<React.RefOf<VirtualView>>();

    Fantom.runTask(() => {
      root.render(<VirtualView ref={viewRef} />);
    });

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Hidden);

    expect(
      root.getRenderedOutput({props: ['minHeight', 'minWidth']}).toJSX(),
    ).toEqual(<rn-virtualViewExperimental minHeight="100" minWidth="100" />);
  });
});

describe('memory management', () => {
  test('does not retain memory after destroying the root', () => {
    const root = Fantom.createRoot();

    const {callbackRef, weakRefs} = createWeakRefCallback<>();

    Fantom.runTask(() => {
      root.render(
        <VirtualView>
          <Text ref={callbackRef}>Child</Text>
        </VirtualView>,
      );
    });

    expect(weakRefs.length).toBe(1);
    expect(isUnreachable(weakRefs[0])).toBe(false);

    Fantom.runTask(() => root.destroy());

    expect(isUnreachable(weakRefs[0])).toBe(true);
  });

  test('does not retain memory after unmounting', () => {
    const root = Fantom.createRoot();

    const {callbackRef, weakRefs} = createWeakRefCallback<>();

    Fantom.runTask(() => {
      root.render(
        <VirtualView>
          <Text ref={callbackRef}>Child</Text>
        </VirtualView>,
      );
    });

    expect(weakRefs.length).toBe(1);
    expect(isUnreachable(weakRefs[0])).toBe(false);

    Fantom.runTask(() => {
      root.render(<React.Fragment />);
    });

    expect(isUnreachable(weakRefs[0])).toBe(true);
  });

  test('does not retain instances after becoming hidden', () => {
    const root = Fantom.createRoot();

    const {callbackRef, weakRefs} = createWeakRefCallback<>();
    const viewRef = createRef<React.RefOf<VirtualView>>();

    Fantom.runTask(() => {
      root.render(
        <VirtualView ref={viewRef}>
          <Text ref={callbackRef}>Child</Text>
        </VirtualView>,
      );
    });

    expect(weakRefs.length).toBe(1);
    expect(isUnreachable(weakRefs[0])).toBe(false);

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Hidden);

    expect(isUnreachable(weakRefs[0])).toBe(true);
  });

  test('does not retain internal node after becoming hidden', () => {
    const root = Fantom.createRoot();

    let weakRef: ?WeakRef<interface {}>;
    const callbackRef = (instance: React.ElementRef<typeof Text> | null) => {
      if (instance !== null) {
        weakRef = new WeakRef(getNodeAsObjectFromPublicInstance(instance));
      }
    };
    const viewRef = createRef<React.RefOf<VirtualView>>();

    Fantom.runTask(() => {
      root.render(
        <VirtualView ref={viewRef}>
          <Text ref={callbackRef}>Child</Text>
        </VirtualView>,
      );
    });

    expect(weakRef).not.toBe(undefined);
    expect(isUnreachable(nullthrows(weakRef))).toBe(false);

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Hidden);

    expect(isUnreachable(nullthrows(weakRef))).toBe(true);
  });

  test('does not retain state after becoming hidden', () => {
    const root = Fantom.createRoot();

    let weakRef: ?WeakRef<interface {}>;
    const viewRef = createRef<React.RefOf<VirtualView>>();

    function MemoryAllocator({children}: {children: React.Node}): React.Node {
      const [state] = useState({});

      useEffect(() => {
        weakRef = new WeakRef(state);
        return () => {
          // Do nothing.
        };
      }, [state]);
      return children;
    }

    Fantom.runTask(() => {
      root.render(
        <VirtualView ref={viewRef}>
          <MemoryAllocator>
            <Text>Child</Text>
          </MemoryAllocator>
        </VirtualView>,
      );
    });

    expect(weakRef).not.toBe(undefined);
    expect(isUnreachable(nullthrows(weakRef))).toBe(false);

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Hidden);

    expect(isUnreachable(nullthrows(weakRef))).toBe(true);
  });
});

/**
 * Helper to reduce duplication of the mock event payload.
 */
export function dispatchModeChangeEvent(
  instance: unknown,
  mode: VirtualViewMode,
): void {
  const targetRect = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  } as Rect;
  const prerenderRect = {
    x: -50,
    y: -200,
    width: 200,
    height: 400,
  } as Rect;
  const visibleRect = {
    x: 0,
    y: 0,
    width: 100,
    height: 200,
  } as Rect;

  let thresholdRect;
  switch (mode) {
    case VirtualViewMode.Visible: {
      thresholdRect = visibleRect;
      break;
    }
    case VirtualViewMode.Prerender: {
      thresholdRect = prerenderRect;
      break;
    }
    case VirtualViewMode.Hidden: {
      thresholdRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      } as Rect;
      break;
    }
  }

  Fantom.dispatchNativeEvent(
    ensureInstance(instance, ReactNativeElement),
    'onModeChange',
    {
      mode: mode as number,
      targetRect,
      // $FlowFixMe[incompatible-type] - https://fburl.com/workplace/t8a3yvuo
      thresholdRect,
    } as NativeModeChangeEvent,
  );
}

/**
 * Helper to create a callback ref that records instances using WeakRefs.
 */
function createWeakRefCallback<
  T extends interface {} = interface {},
>(): Readonly<{
  weakRefs: ReadonlyArray<WeakRef<T>>,
  callbackRef: React.RefSetter<T>,
}> {
  const weakRefs: Array<WeakRef<T>> = [];
  return {
    callbackRef(instance: T | null) {
      if (instance !== null) {
        weakRefs.push(new WeakRef(instance));
      }
    },
    weakRefs,
  };
}

/**
 * Gets the shadow node via `instance.__internalInstanceHandle.stateNode.node`.
 */
function getNodeAsObjectFromPublicInstance(instance: unknown): interface {} {
  const node = getNodeFromPublicInstance(
    ensureInstance(instance, ReactNativeElement),
  );
  if (node == null || typeof node !== 'object') {
    throw new Error('Expected node to be an object, got: ' + typeof node);
  }
  return node;
}
