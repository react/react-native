/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableSetNativePropsBatching:* enableFabricCommitBranching:*
 * @fantom_flags enableResizeObserverByDefault:true useSharedAnimatedBackend:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type ResizeObserverType from '../../../webapis/resizeobserver/ResizeObserver';
import type {Root} from '@react-native/fantom';
import type {HostInstance} from 'react-native';

import {getFabricUIManager} from '../../../../../Libraries/ReactNative/FabricUIManager';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {useState} from 'react';
import {Animated, View} from 'react-native';
import {
  ReactNativeFeatureFlags,
  getInternalInstanceHandleFromPublicInstance,
  getNodeFromPublicInstance,
} from 'react-native/react-private-interface';

declare const ResizeObserver: Class<ResizeObserverType>;

const UIManager = nullthrows(getFabricUIManager());

function renderSiblings(
  root: Root,
  refs: ReadonlyArray<React.RefSetter<HostInstance>>,
) {
  Fantom.runTask(() => {
    root.render(
      <View nativeID="parent">
        {refs.map((ref, index) => (
          <View key={index} nativeID={`child-${index}`} ref={ref} />
        ))}
      </View>,
    );
  });
}

describe('setNativeProps', () => {
  test('applies the props from every call in a task', () => {
    const root = Fantom.createRoot();
    const refs = [
      React.createRef<HostInstance>(),
      React.createRef<HostInstance>(),
      React.createRef<HostInstance>(),
    ];
    renderSiblings(root, refs);

    Fantom.runTask(() => {
      refs.forEach((ref, index) => {
        nullthrows(ref.current).setNativeProps({testID: `test-${index}`});
      });
    });

    expect(
      root.getRenderedOutput({props: ['nativeID', 'testID']}).toJSX(),
    ).toEqual(
      <rn-view nativeID="parent">
        <rn-view nativeID="child-0" testID="test-0" key="0" />
        <rn-view nativeID="child-1" testID="test-1" key="1" />
        <rn-view nativeID="child-2" testID="test-2" key="2" />
      </rn-view>,
    );
  });

  test('applies calls on one node in order', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<HostInstance>();
    renderSiblings(root, [ref]);

    Fantom.runTask(() => {
      const element = nullthrows(ref.current);
      element.setNativeProps({testID: 'first', accessibilityLabel: 'label'});
      element.setNativeProps({testID: 'second'});
    });

    expect(
      root.getRenderedOutput({props: ['testID', 'accessibilityLabel']}).toJSX(),
    ).toEqual(
      <rn-view>
        <rn-view testID="second" accessibilityLabel="label" />
      </rn-view>,
    );
  });

  test('applies only the props it sets', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<HostInstance>();
    const marginLeft = new Animated.Value(0);

    Fantom.runTask(() => {
      root.render(<Animated.View ref={ref} style={{marginLeft}} />);
    });
    Fantom.runTask(() => {
      nullthrows(ref.current).setNativeProps({style: {marginLeft: 0}});
    });

    // A native-driven animation changes the prop without `setNativeProps`.
    Fantom.runTask(() => {
      Animated.timing(marginLeft, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    Fantom.unstable_produceFramesForDuration(100);

    Fantom.runTask(() => {
      nullthrows(ref.current).setNativeProps({testID: 'native'});
    });

    expect(
      root.getRenderedOutput({props: ['marginLeft', 'testID']}).toJSX(),
    ).toEqual(<rn-view marginLeft="50" testID="native" />);
    // The animation is left running: when it ends with commit branching on,
    // `AnimationBackend`'s end-of-animation commit fails an assertion.
  });

  describe('is visible to reads later in the task', () => {
    function renderHalfWidthChild(root: Root) {
      const parentRef = React.createRef<HostInstance>();
      const childRef = React.createRef<HostInstance>();
      Fantom.runTask(() => {
        root.render(
          <View
            nativeID="parent"
            ref={parentRef}
            style={{width: 100, height: 100}}>
            <View
              nativeID="child"
              ref={childRef}
              style={{width: 50, height: 100}}
            />
          </View>,
        );
      });
      return [nullthrows(parentRef.current), nullthrows(childRef.current)];
    }

    test('getBoundingClientRect', () => {
      const root = Fantom.createRoot();
      const [, child] = renderHalfWidthChild(root);

      let width: ?number = null;
      Fantom.runTask(() => {
        child.setNativeProps({style: {width: 100}});
        width = child.getBoundingClientRect().width;
      });

      expect(width).toBe(100);
    });

    // These read the tree through the Fabric UI manager directly, as the
    // inspector and legacy UIManager APIs do.
    test('findNodeAtPoint', () => {
      const root = Fantom.createRoot();
      const [parent, child] = renderHalfWidthChild(root);

      let hit = null;
      Fantom.runTask(() => {
        child.setNativeProps({style: {width: 100}});
        UIManager.findNodeAtPoint(
          nullthrows(getNodeFromPublicInstance(parent)),
          75,
          50,
          instanceHandle => {
            hit = instanceHandle;
          },
        );
      });

      expect(hit).toBe(getInternalInstanceHandleFromPublicInstance(child));
    });

    test('getRelativeLayoutMetrics', () => {
      const root = Fantom.createRoot();
      const [parent, child] = renderHalfWidthChild(root);

      let width: ?number = null;
      Fantom.runTask(() => {
        child.setNativeProps({style: {width: 100}});
        width = UIManager.getRelativeLayoutMetrics(
          nullthrows(getNodeFromPublicInstance(child)),
          nullthrows(getNodeFromPublicInstance(parent)),
        ).width;
      });

      expect(width).toBe(100);
    });
  });

  test('is visible to ResizeObserver in the same task', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<HostInstance>();
    const log: Array<string> = [];

    Fantom.runTask(() => {
      root.render(<View ref={ref} style={{width: 100, height: 100}} />);
    });
    Fantom.runTask(() => {
      new ResizeObserver(entries => {
        log.push(`observed ${entries[0].contentRect.width}`);
      }).observe(nullthrows(ref.current));
    });
    log.length = 0;

    Fantom.runTask(() => {
      Fantom.scheduleTask(() => {
        log.push('next task');
      });
      nullthrows(ref.current).setNativeProps({style: {width: 50}});
    });

    expect(log).toEqual(['observed 50', 'next task']);
  });

  describe('with a React update in the same event handler', () => {
    // A discrete event makes React commit in the same task as the handler.
    function renderAndClick(
      onClick: (setLabel: (label: string) => void) => void,
      renderChildren: (label: string) => React.Node,
    ) {
      const root = Fantom.createRoot();
      const containerRef = React.createRef<HostInstance>();

      function TestComponent() {
        const [label, setLabel] = useState('first');
        return (
          <View
            nativeID="parent"
            ref={containerRef}
            onClick={() => onClick(setLabel)}>
            {renderChildren(label)}
          </View>
        );
      }

      Fantom.runTask(() => {
        root.render(<TestComponent />);
      });
      Fantom.dispatchNativeEvent(nullthrows(containerRef.current), 'click');
      return root;
    }

    for (const updateFirst of [false, true]) {
      const order = updateFirst ? 'before' : 'after';
      test(`keeps the props when React updates another subtree ${order} the call`, () => {
        const ref = React.createRef<HostInstance>();
        const root = renderAndClick(
          setLabel => {
            if (updateFirst) {
              setLabel('second');
            }
            nullthrows(ref.current).setNativeProps({testID: 'native'});
            if (!updateFirst) {
              setLabel('second');
            }
          },
          label => [
            <View key="a" nativeID="a">
              <View nativeID="target" ref={ref} />
            </View>,
            <View key="b" nativeID="b">
              <View nativeID={`label-${label}`} />
            </View>,
          ],
        );

        expect(
          root.getRenderedOutput({props: ['nativeID', 'testID']}).toJSX(),
        ).toEqual(
          <rn-view nativeID="parent">
            <rn-view nativeID="a" key="0">
              <rn-view nativeID="target" testID="native" />
            </rn-view>
            <rn-view nativeID="b" key="1">
              <rn-view nativeID="label-second" />
            </rn-view>
          </rn-view>,
        );
      });
    }

    test('lets React override the props', () => {
      const ref = React.createRef<HostInstance>();
      const root = renderAndClick(
        setLabel => {
          nullthrows(ref.current).setNativeProps({testID: 'native'});
          setLabel('second');
        },
        label => <View nativeID="target" ref={ref} testID={label} />,
      );

      expect(
        root.getRenderedOutput({props: ['nativeID', 'testID']}).toJSX(),
      ).toEqual(
        <rn-view nativeID="parent">
          <rn-view nativeID="target" testID="second" />
        </rn-view>,
      );
    });
  });

  test('applies the props from a task that throws, and later calls', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<HostInstance>();
    renderSiblings(root, [ref]);

    expect(() =>
      Fantom.runTask(() => {
        nullthrows(ref.current).setNativeProps({testID: 'before-throw'});
        throw new Error('Task error');
      }),
    ).toThrow('Task error');

    expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
      <rn-view>
        <rn-view testID="before-throw" />
      </rn-view>,
    );

    Fantom.runTask(() => {
      nullthrows(ref.current).setNativeProps({testID: 'next-task'});
    });

    expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
      <rn-view>
        <rn-view testID="next-task" />
      </rn-view>,
    );
  });

  if (ReactNativeFeatureFlags.enableSetNativePropsBatching()) {
    describe('when `enableSetNativePropsBatching` is on', () => {
      test('clones each node once per task', () => {
        const root = Fantom.createRoot();
        const refs = [
          React.createRef<HostInstance>(),
          React.createRef<HostInstance>(),
        ];
        renderSiblings(root, refs);
        const getRevision = Fantom.createShadowNodeRevisionGetter(
          nullthrows(refs[0].current),
        );
        const before = nullthrows(getRevision());

        Fantom.runTask(() => {
          for (const ref of refs) {
            nullthrows(ref.current).setNativeProps({testID: 'native'});
          }
        });

        // A commit per call would clone the first node again, as a sibling of
        // the second.
        expect(getRevision()).toBe(before + 1);
      });
    });
  }
});
