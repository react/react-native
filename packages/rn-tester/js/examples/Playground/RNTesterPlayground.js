/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Button, ScrollView, StyleSheet, View} from 'react-native';

// Reproducer only: these checks intentionally exercise the public APIs, without
// importing a proposed fix. PASS means the reported behavior is already fixed.
const cases: ReadonlyArray<{issue: number, run: () => boolean}> = [
  {
    issue: 58204,
    run: () => {
      let entered = false;
      const source: {nested?: number, self?: unknown} = {};
      Object.defineProperty(source, 'nested', {
        enumerable: true,
        get() {
          if (!entered) {
            entered = true;
            structuredClone({value: 1});
          }
          return 1;
        },
      });
      source.self = source;
      const clone = structuredClone(source);
      return clone.self === clone;
    },
  },
  {
    issue: 58206,
    run: () => {
      const cause = {value: 1};
      const clone = structuredClone(new Error('example', {cause}));
      const falsy = structuredClone(new Error('example', {cause: false}));
      return clone.cause !== cause && falsy.cause === false;
    },
  },
  {
    issue: 58210,
    run: () => {
      const source = Object(BigInt(1));
      const clone = structuredClone(source);
      return clone !== source && clone.valueOf() === BigInt(1);
    },
  },
  {
    issue: 58218,
    run: () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer, 1, 2);
      view[0] = 42;
      const clone = structuredClone({buffer, view});
      const ordinaryCloneIsValid =
        clone.buffer !== buffer &&
        clone.view instanceof Uint8Array &&
        clone.view.buffer === clone.buffer &&
        clone.view.byteOffset === 1 &&
        clone.view[0] === 42;
      // $FlowExpectedError[cannot-write] Intentionally shadow a built-in method.
      Object.defineProperty(buffer, 'slice', {
        value() {
          throw new Error('user slice ran');
        },
      });
      return ordinaryCloneIsValid && structuredClone(buffer).byteLength === 4;
    },
  },
  {
    issue: 58220,
    run: () => {
      const rejected = () => {};
      Object.defineProperty(rejected, Symbol.toPrimitive, {
        value() {
          throw new Error('user coercion ran');
        },
      });
      try {
        structuredClone(rejected);
        return false;
      } catch (error) {
        return error instanceof DOMException && error.name === 'DataCloneError';
      }
    },
  },
  {
    issue: 58222,
    run: () => {
      const source = new Map([['key', 42]]);
      Object.defineProperty(source, Symbol.iterator, {
        value() {
          throw new Error('user iterator ran');
        },
      });
      return structuredClone(source).get('key') === 42;
    },
  },
  {
    issue: 58226,
    run: () => structuredClone(Object(false)).valueOf() === false,
  },
  {
    issue: 58240,
    run: () => {
      const rect = new DOMRect(NaN, -0, 1, 1);
      return Number.isNaN(rect.x) && Object.is(rect.y, -0);
    },
  },
];

function check(issue: number, run: () => boolean): string {
  try {
    return `#${issue}: ${run() ? 'PASS' : 'FAIL (reproduced)'}`;
  } catch (error) {
    return `#${issue}: FAIL (${String(error)})`;
  }
}

function Playground() {
  const viewRef = React.useRef<React.ElementRef<typeof View> | null>(null);
  const [results, setResults] = React.useState('Press Run reproducers.');

  function run() {
    const lines = cases.map(({issue, run: runCase}) => check(issue, runCase));
    lines.push(
      check(58242, () => {
        const node = viewRef.current;
        if (node == null || node.childNodes.length === 0) {
          throw new Error('The native View must be mounted with a child.');
        }
        let called = false;
        let retainedNull = true;
        node.childNodes.forEach(function (this: unknown) {
          'use strict';
          called = true;
          retainedNull = retainedNull && this === null;
        }, null);
        return called && retainedNull;
      }),
    );
    setResults(lines.join('\n'));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <RNTesterText>
        Expected: every check reports PASS. FAIL identifies a reproduced issue.
      </RNTesterText>
      <View id="run-reproducers">
        <Button title="Run reproducers" onPress={run} />
      </View>
      <View ref={viewRef} collapsable={false}>
        <View collapsable={false} />
      </View>
      <RNTesterText selectable>{results}</RNTesterText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Public web API issue reproducers.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
