/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableFabricCommitBranching:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('ViewFlattening', () => {
  /**
   * Test reordering of views with the same parent:
   *
   * For instance:
   *    A -> [B,C,D]  ==> A -> [D,B,C]
   *
   * In the V1 of diffing this would produce 3 removes and 3 inserts, but with
   * some cleverness we can reduce this to 1 remove and 1 insert.
   */
  test('reordering', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <View nativeID="A">
          <View key="B" nativeID="B" />
          <View key="C" nativeID="C" />
          <View key="D" nativeID="D" />
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="A">
        <rn-view nativeID="B" key="0" />
        <rn-view nativeID="C" key="1" />
        <rn-view nativeID="D" key="2" />
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "A"}',
      'Create {type: "View", nativeID: "B"}',
      'Create {type: "View", nativeID: "C"}',
      'Create {type: "View", nativeID: "D"}',
      'Insert {type: "View", parentNativeID: "A", index: 0, nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "A", index: 1, nativeID: "C"}',
      'Insert {type: "View", parentNativeID: "A", index: 2, nativeID: "D"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "A"}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <View nativeID="A">
          <View key="D" nativeID="D" />
          <View key="B" nativeID="B" />
          <View key="C" nativeID="C" />
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="A">
        <rn-view key="0" nativeID="D" />
        <rn-view key="1" nativeID="B" />
        <rn-view key="2" nativeID="C" />
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: "A", index: 2, nativeID: "D"}',
      'Insert {type: "View", parentNativeID: "A", index: 0, nativeID: "D"}',
    ]);
  });

  /**
   * Test worst-case reordering: moving the first child to the end.
   *
   *    P -> [A,B,C,D,E]  ==>  P -> [B,C,D,E,A]
   *
   * The greedy two-pointer encounters A vs B mismatch at the first
   * position and generates excessive REMOVE+INSERT pairs:
   * 4 removes + 4 inserts = 8 mutations.
   */
  test('reordering: move first child to last (worst case for greedy)', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <View nativeID="P">
          <View key="A" nativeID="A" />
          <View key="B" nativeID="B" />
          <View key="C" nativeID="C" />
          <View key="D" nativeID="D" />
          <View key="E" nativeID="E" />
        </View>,
      );
    });

    root.takeMountingManagerLogs();

    Fantom.runTask(() => {
      root.render(
        <View nativeID="P">
          <View key="B" nativeID="B" />
          <View key="C" nativeID="C" />
          <View key="D" nativeID="D" />
          <View key="E" nativeID="E" />
          <View key="A" nativeID="A" />
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="P">
        <rn-view key="0" nativeID="B" />
        <rn-view key="1" nativeID="C" />
        <rn-view key="2" nativeID="D" />
        <rn-view key="3" nativeID="E" />
        <rn-view key="4" nativeID="A" />
      </rn-view>,
    );

    const logs = root.takeMountingManagerLogs();
    // Greedy: 4 removes + 4 inserts = 8 mutations
    expect(logs).toEqual([
      'Remove {type: "View", parentNativeID: "P", index: 4, nativeID: "E"}',
      'Remove {type: "View", parentNativeID: "P", index: 3, nativeID: "D"}',
      'Remove {type: "View", parentNativeID: "P", index: 2, nativeID: "C"}',
      'Remove {type: "View", parentNativeID: "P", index: 1, nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "P", index: 0, nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "P", index: 1, nativeID: "C"}',
      'Insert {type: "View", parentNativeID: "P", index: 2, nativeID: "D"}',
      'Insert {type: "View", parentNativeID: "P", index: 3, nativeID: "E"}',
    ]);
  });

  /**
   * Test reparenting mutation instruction generation.
   * We cannot practically handle all possible use-cases here.
   */
  test('view reparenting', () => {
    const root = Fantom.createRoot();

    // Root -> G* -> H -> I -> J -> A* [nodes with * are _not_ flattened]
    Fantom.runTask(() => {
      root.render(
        <View nativeID="G">
          <View>
            <View>
              <View>
                <View key="A" nativeID="A" />
              </View>
            </View>
          </View>
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="G">
        <rn-view nativeID="A" />
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "G"}',
      'Create {type: "View", nativeID: "A"}',
      'Insert {type: "View", parentNativeID: "G", index: 0, nativeID: "A"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "G"}',
    ]);

    // Root -> G* -> H* -> I -> J -> A* [nodes with * are _not_ flattened]
    // Force an update with A with new props
    Fantom.runTask(() => {
      root.render(
        <View nativeID="G">
          <View nativeID="H">
            <View>
              <View>
                <View key="A" nativeID="A" style={{width: 100}} />
              </View>
            </View>
          </View>
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="G">
        <rn-view nativeID="H">
          <rn-view width="100" nativeID="A" />
        </rn-view>
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "A"}',
      'Remove {type: "View", parentNativeID: "G", index: 0, nativeID: "A"}',
      'Create {type: "View", nativeID: "H"}',
      'Insert {type: "View", parentNativeID: "G", index: 0, nativeID: "H"}',
      'Insert {type: "View", parentNativeID: "H", index: 0, nativeID: "A"}',
    ]);

    // The view is reparented 1 level down with a different sibling
    // Root -> G* -> H* -> I* -> J -> [B*, A*] [nodes with * are _not_ flattened]
    Fantom.runTask(() => {
      root.render(
        <View nativeID="G">
          <View nativeID="H">
            <View nativeID="I">
              <View>
                <View key="B" nativeID="B" />
                <View key="A" nativeID="A" style={{width: 100}} />
              </View>
            </View>
          </View>
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="G">
        <rn-view nativeID="H">
          <rn-view nativeID="I">
            <rn-view key="0" nativeID="B" />
            <rn-view key="1" nativeID="A" width="100" />
          </rn-view>
        </rn-view>
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: "H", index: 0, nativeID: "A"}',
      'Create {type: "View", nativeID: "I"}',
      'Create {type: "View", nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "H", index: 0, nativeID: "I"}',
      'Insert {type: "View", parentNativeID: "I", index: 0, nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "I", index: 1, nativeID: "A"}',
    ]);

    // The view is reparented 1 level further down with its order with the sibling
    // swapped
    // Root -> G* -> H* -> I* -> J* -> [A*, B*] [nodes with * are _not_ flattened]
    Fantom.runTask(() => {
      root.render(
        <View nativeID="G">
          <View nativeID="H">
            <View nativeID="I">
              <View nativeID="J">
                <View key="A" nativeID="A" style={{width: 100}} />
                <View key="B" nativeID="B" />
              </View>
            </View>
          </View>
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="G">
        <rn-view nativeID="H">
          <rn-view nativeID="I">
            <rn-view nativeID="J">
              <rn-view key="0" nativeID="A" width="100" />
              <rn-view key="1" nativeID="B" />
            </rn-view>
          </rn-view>
        </rn-view>
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: "I", index: 1, nativeID: "A"}',
      'Remove {type: "View", parentNativeID: "I", index: 0, nativeID: "B"}',
      'Create {type: "View", nativeID: "J"}',
      'Insert {type: "View", parentNativeID: "I", index: 0, nativeID: "J"}',
      'Insert {type: "View", parentNativeID: "J", index: 0, nativeID: "A"}',
      'Insert {type: "View", parentNativeID: "J", index: 1, nativeID: "B"}',
    ]);
  });

  test('parent-child switching from unflattened-flattened to flattened-unflattened', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <View
          style={{
            marginTop: 100,
            opacity: 0,
          }}>
          <View
            style={{
              marginTop: 50,
            }}>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, backgroundColor: 'red'}}
            />
          </View>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    // force view to be flattened.
    Fantom.runTask(() => {
      root.render(
        <View
          style={{
            marginTop: 100,
          }}>
          <View
            style={{
              marginTop: 50,
              opacity: 0,
            }}>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, backgroundColor: 'red'}}
            />
          </View>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);
  });

  test('parent-child switching from flattened-unflattened to unflattened-flattened', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <View
          style={{
            marginTop: 100,
          }}>
          <View
            style={{
              marginTop: 50,
              opacity: 0,
            }}>
            <View nativeID={'child'} style={{height: 10, width: 10}} />
          </View>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    // force view to be flattened.
    Fantom.runTask(() => {
      root.render(
        <View
          style={{
            marginTop: 100,
            opacity: 0,
          }}>
          <View
            style={{
              marginTop: 50,
            }}>
            <View nativeID={'child'} style={{height: 10, width: 10}} />
          </View>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    ]);
  });

  test('#51378: view with rgba(255,255,255,127/256) background color is not flattened', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: `rgba(255, 255, 255, ${127 / 256})`,
          }}
        />,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    expect(
      root
        .getRenderedOutput({props: ['width', 'height', 'backgroundColor']})
        .toJSX(),
    ).toEqual(
      <rn-view
        width="100"
        height="100"
        backgroundColor="rgba(255, 255, 255, 0.498039)"
      />,
    );
  });
});

describe('reconciliation of setNativeProps and React commit', () => {
  it('props set by setNativeProps must not be overriden by React commit', () => {
    const root = Fantom.createRoot();
    const nodeRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={nodeRef}
          nativeID="first native id"
          testID="first test id"
        />,
      );
    });

    expect(
      root
        .getRenderedOutput({
          props: ['nativeID', 'testID'],
        })
        .toJSX(),
    ).toEqual(
      <rn-view nativeID={'first native id'} testID={'first test id'} />,
    );

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    Fantom.runTask(() => {
      // Calling `setNativeProps` forces bug https://github.com/facebook/react-native/issues/47476 to manifest.
      // The bug is about a collision between `setNativeProps` and `props` and how they must be applied in the correct order.
      // When a prop is set via regular React commit, it must be respected by `setNativeProps` and vice versa.
      // Learn more https://github.com/facebook/react-native/pull/47669.
      element.setNativeProps({testID: 'second test id'});
    });

    expect(
      root
        .getRenderedOutput({
          props: ['nativeID', 'testID'],
        })
        .toJSX(),
    ).toEqual(
      <rn-view nativeID={'first native id'} testID={'second test id'} />,
    );

    Fantom.runTask(() => {
      root.render(
        <View
          ref={nodeRef}
          nativeID="second native id"
          // testID was changed by `setNativeProps` and React does not know about it.
          // Therefore, it will treat testID as unchanged.
          // Fabric must correctly reconcile the changes coming from React and `setNativeProps`.
          testID="first test id"
        />,
      );
    });

    expect(
      root
        .getRenderedOutput({
          props: ['nativeID', 'testID'],
        })
        .toJSX(),
    ).toEqual(
      <rn-view nativeID={'second native id'} testID={'second test id'} />,
    );
  });

  it('allows React commit to override value set by setNativeProps', () => {
    const root = Fantom.createRoot();
    const nodeRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} nativeID="first native id" />);
    });

    expect(
      root
        .getRenderedOutput({
          props: ['nativeID'],
        })
        .toJSX(),
    ).toEqual(<rn-view nativeID={'first native id'} />);

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    Fantom.runTask(() => {
      element.setNativeProps({nativeID: 'second native id'});
    });

    expect(
      root
        .getRenderedOutput({
          props: ['nativeID'],
        })
        .toJSX(),
    ).toEqual(<rn-view nativeID={'second native id'} />);

    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} nativeID="third native id" />);
    });

    expect(
      root
        .getRenderedOutput({
          props: ['nativeID'],
        })
        .toJSX(),
    ).toEqual(<rn-view nativeID={'third native id'} />);
  });
});
