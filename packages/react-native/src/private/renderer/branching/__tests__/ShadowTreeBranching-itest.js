/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableFabricCommitBranching:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';
import NativeFantomTestSpecificMethods from 'react-native/src/private/testing/fantom/specs/NativeFantomTestSpecificMethods';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('ShadowTreeBranching', () => {
  function LayoutEffectObserver({onCommit}: {onCommit: () => void}) {
    React.useLayoutEffect(() => {
      onCommit();
    });
    return null;
  }

  it('should not mount React revision before merging them', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<View style={{width: 100, height: 100}} nativeID="view" />);
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "view"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "view"}',
    ]);

    let updatesBeforeEndOfTask: ReadonlyArray<string> = [];

    Fantom.runTask(() => {
      root.render(
        <>
          <View style={{width: 50, height: 50}} nativeID="view" />
          <LayoutEffectObserver
            onCommit={() => {
              updatesBeforeEndOfTask = root.takeMountingManagerLogs();
            }}
          />
        </>,
      );
    });

    const updatesAfterEndOfTask = root.takeMountingManagerLogs();

    // The intermediate React revision should not be mounted
    expect(updatesBeforeEndOfTask).toEqual([]);
    expect(updatesAfterEndOfTask).toEqual([
      'Update {type: "View", nativeID: "view"}',
    ]);
  });

  it('should not skip intermediate React commits', () => {
    const root = Fantom.createRoot();

    let updatesBeforeEndOfTask: ReadonlyArray<string> = [];

    // When rendered with `shouldTriggerIntermediate=false`, it renders two views
    // both with blue background. When rendered with `shouldTriggerIntermediate=true`,
    // it renders two views, the first one with red background and the second one
    // with blue background. The layout effect will update the second view to red.
    // The intermediate React revision with different background colors should not
    // be committed.
    function AutoUpdateComponent({
      shouldTriggerIntermediate,
    }: {
      shouldTriggerIntermediate: boolean,
    }) {
      const [intermediateRender, setIntermediateRender] = React.useState(false);

      return (
        <View style={{width: 100, height: 100}} nativeID="view">
          <View
            style={{
              flex: 1,
              backgroundColor: shouldTriggerIntermediate ? 'red' : 'blue',
            }}
            nativeID="A"
          />
          <View
            style={{
              flex: 1,
              backgroundColor: intermediateRender ? 'red' : 'blue',
            }}
            nativeID="B"
          />
          <LayoutEffectObserver
            onCommit={() => {
              if (shouldTriggerIntermediate) {
                if (!intermediateRender) {
                  setIntermediateRender(true);
                  return;
                }

                updatesBeforeEndOfTask = root.takeMountingManagerLogs();
              }
            }}
          />
        </View>
      );
    }

    Fantom.runTask(() => {
      root.render(<AutoUpdateComponent shouldTriggerIntermediate={false} />);
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "view"}',
      'Create {type: "View", nativeID: "A"}',
      'Create {type: "View", nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "view", index: 0, nativeID: "A"}',
      'Insert {type: "View", parentNativeID: "view", index: 1, nativeID: "B"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "view"}',
    ]);

    Fantom.runTask(() => {
      root.render(<AutoUpdateComponent shouldTriggerIntermediate={true} />);
    });

    const updatesAfterEndOfTask = root.takeMountingManagerLogs();

    // The intermediate React revision should not be committed
    expect(updatesBeforeEndOfTask).toEqual([]);
    expect(updatesAfterEndOfTask).toEqual([
      'Update {type: "View", nativeID: "A"}',
      'Update {type: "View", nativeID: "B"}',
    ]);
  });

  it('should provide up-to-date data when read from JS', () => {
    const root = Fantom.createRoot();

    const viewRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={viewRef}
          style={{width: 100, height: 100}}
          nativeID="view"
        />,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "view"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "view"}',
    ]);

    let dimensions: [number, number] = [0, 0];
    let mountingManagerLogs: Array<string> = [];

    Fantom.runTask(() => {
      root.render(
        <>
          <View ref={viewRef} style={{width: 50, height: 50}} nativeID="view" />
          <LayoutEffectObserver
            onCommit={() => {
              mountingManagerLogs = root.takeMountingManagerLogs();

              // The React revision is not merged yet but the new dimensions
              // should be visible from JS
              const viewNode = ensureInstance(
                viewRef.current,
                ReactNativeElement,
              );
              const rect = viewNode.getBoundingClientRect();
              dimensions = [rect.width, rect.height];
            }}
          />
        </>,
      );
    });

    expect(mountingManagerLogs).toEqual([]);
    expect(dimensions).toEqual([50, 50]);
  });

  it('should not mount intermediate React tree when committing from another source', () => {
    const root = Fantom.createRoot();

    const viewRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={viewRef}
          style={{width: 100, height: 100}}
          nativeID="view"
        />,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "view"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "view"}',
    ]);

    let mountingManagerLogsBeforeEndOfTask: Array<string> = [];

    Fantom.runTask(() => {
      root.render(
        <>
          <View ref={viewRef} style={{width: 50, height: 50}} nativeID="view" />
          <LayoutEffectObserver
            onCommit={() => {
              NativeFantomTestSpecificMethods.setRootNodeSize(
                root.getRootTag() as $FlowFixMe,
                150,
                150,
              );

              mountingManagerLogsBeforeEndOfTask =
                root.takeMountingManagerLogs();
            }}
          />
        </>,
      );
    });

    // Commit made from outside of React - it should not mount intermediate React tree
    expect(mountingManagerLogsBeforeEndOfTask).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
    ]);

    // Commit made from React - it should mount the final React tree
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "view"}',
    ]);
  });
});
