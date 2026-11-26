/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableMutationObserverByDefault:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type MutationObserverType from '../MutationObserver';
import type MutationRecordType from '../MutationRecord';
import type {Root} from '@react-native/fantom';
import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';

declare const MutationObserver: Class<MutationObserverType>;

type Workload = 'props' | 'append' | 'replace' | 'reverse' | 'descendant';
type Scenario = Readonly<{
  width: number,
  workload: Workload,
  subtree: boolean,
  observers: number,
}>;

const scenarios: Array<Scenario> = [];
for (const width of [2, 32, 256, 1024]) {
  for (const workload of [
    'props',
    'append',
    'replace',
    'reverse',
    'descendant',
  ] as const) {
    scenarios.push({width, workload, subtree: true, observers: 1});
    scenarios.push({width, workload, subtree: true, observers: 0});
  }
  scenarios.push({width, workload: 'props', subtree: false, observers: 1});
}
for (const workload of ['props', 'append', 'descendant'] as const) {
  scenarios.push({width: 256, workload, subtree: true, observers: 10});
}

let commit: () => void;

Fantom.unstable_benchmark
  .suite('MutationObserver commits', {
    minIterations: 100,
    minTestExecutionTimeMs: 250,
    minWarmupIterations: 10,
  })
  .test.each(
    scenarios,
    ({width, workload, subtree, observers}) =>
      `${workload}, width=${width}, subtree=${String(subtree)}, observers=${observers}`,
    () => commit(),
    scenario => {
      const {width, workload, subtree, observers: observerCount} = scenario;
      const parentRef = createRef<HostInstance>();
      let root: Root;
      let original: React.MixedElement;
      let updated: React.MixedElement;
      const observers: Array<MutationObserverType> = [];
      let callbackCount = 0;
      let lastRecords: ReadonlyArray<MutationRecordType> = [];

      return {
        beforeAll: () => {
          root = Fantom.createRoot();
          const children = Array.from({length: width}, (_, i) => (
            <View key={i} nativeID={`child-${i}`} />
          ));
          original = (
            <View ref={parentRef} style={{backgroundColor: 'red'}}>
              {children}
            </View>
          );
          let nextChildren: React.Node = children;
          if (workload === 'append') {
            nextChildren = [...children, <View key="added" nativeID="added" />];
          } else if (workload === 'replace') {
            nextChildren = Array.from({length: width}, (_, i) => (
              <View key={`replacement-${i}`} nativeID={`replacement-${i}`} />
            ));
          } else if (workload === 'reverse') {
            nextChildren = [...children].reverse();
          } else if (workload === 'descendant') {
            nextChildren = [
              ...children.slice(0, -1),
              <View key={width - 1} nativeID={`child-${width - 1}`}>
                <View nativeID="descendant" />
              </View>,
            ];
          }
          updated = (
            <View
              ref={parentRef}
              style={{backgroundColor: workload === 'props' ? 'blue' : 'red'}}>
              {nextChildren}
            </View>
          );
          commit = () => Fantom.runTask(() => root.render(updated));
          Fantom.runTask(() => root.render(original));
          for (let i = 0; i < observerCount; i++) {
            const observer = new MutationObserver(records => {
              callbackCount++;
              lastRecords = records;
            });
            observer.observe(nullthrows(parentRef.current), {
              childList: true,
              subtree,
            });
            observers.push(observer);
          }
        },
        beforeEach: () => {
          Fantom.runTask(() => root.render(original));
          callbackCount = 0;
          lastRecords = [];
        },
        afterEach: () => {
          const changes =
            workload === 'append' ||
            workload === 'replace' ||
            workload === 'descendant';
          expect(callbackCount).toBe(changes ? observerCount : 0);
          if (changes && observerCount > 0) {
            expect(lastRecords.length).toBe(1);
            const record = lastRecords[0];
            expect(record.type).toBe('childList');
            expect(record.addedNodes.length).toBe(
              workload === 'replace' ? width : 1,
            );
            expect(record.removedNodes.length).toBe(
              workload === 'replace' ? width : 0,
            );
          }
        },
        afterAll: () => {
          for (const observer of observers) {
            observer.disconnect();
          }
          root.destroy();
        },
      };
    },
  );
