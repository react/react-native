/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterButton from '../../components/RNTesterButton';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';

type Check = {
  readonly name: string,
  /**
   * Returns the blob to read back and the bytes it is expected to contain.
   * The harness closes the returned blob exactly once; any *other* blob
   * created here must be closed before returning.
   */
  readonly build: () => {blob: Blob, expected: Array<number>},
};

type Result = {
  readonly name: string,
  readonly expected: Array<number>,
  readonly actual: ?Array<number>,
  readonly pass: boolean,
  readonly error: ?string,
};

/**
 * One entry per `BlobPart` variant accepted by `new Blob([...])`, except for
 * `Blob` parts.
 *
 * `new Blob([someOtherBlob])` is deliberately not exercised here. On iOS,
 * `RCTBlobManager.createFromParts` resolves a `Blob` part synchronously but
 * stores its own result via `dispatch_async`, so building a blob from a blob
 * created moments earlier can resolve it before it has been stored: the part
 * contributes no bytes, and the read that follows trips an NSRangeException in
 * `subdataWithRange:`. That is pre-existing behavior, unrelated to the
 * `ArrayBuffer`/`ArrayBufferView` support these checks cover.
 */
const CHECKS: Array<Check> = [
  {
    name: 'ArrayBuffer',
    build: () => ({
      blob: new Blob([Uint8Array.from([1, 2, 3, 4]).buffer]),
      expected: [1, 2, 3, 4],
    }),
  },
  {
    name: 'ArrayBuffer (mutated after construct)',
    build: () => {
      const buffer = Uint8Array.from([1, 2, 3, 4]).buffer;
      const blob = new Blob([buffer]);
      new Uint8Array(buffer).fill(0xff);
      return {blob, expected: [1, 2, 3, 4]};
    },
  },
  {
    name: 'TypedArray (whole)',
    build: () => ({
      blob: new Blob([Uint8Array.from([5, 6, 7])]),
      expected: [5, 6, 7],
    }),
  },
  {
    name: 'TypedArray (offset view)',
    build: () => ({
      blob: new Blob([Uint8Array.from([9, 8, 7, 6, 5]).subarray(1, 4)]),
      expected: [8, 7, 6],
    }),
  },
  {
    name: 'DataView (offset)',
    build: () => {
      const buffer = Uint8Array.from([1, 2, 3, 4, 5, 6]).buffer;
      return {blob: new Blob([new DataView(buffer, 2, 2)]), expected: [3, 4]};
    },
  },
  {
    name: 'Multi-byte TypedArray',
    build: () => {
      const source = new Uint16Array([0x0201]);
      // The byte order is the device's, so read the expectation back out of
      // the same buffer instead of hardcoding a little-endian answer.
      const view = new DataView(source.buffer);
      return {
        blob: new Blob([source]),
        expected: [view.getUint8(0), view.getUint8(1)],
      };
    },
  },
  {
    name: 'String (ASCII)',
    build: () => ({blob: new Blob(['AB']), expected: [65, 66]}),
  },
  {
    name: 'Number (stringified)',
    build: () => ({
      // $FlowExpectedError[incompatible-type]
      blob: new Blob([42]),
      expected: [52, 50],
    }),
  },
  {
    name: 'String (multi-byte)',
    build: () => ({blob: new Blob(['é']), expected: [0xc3, 0xa9]}),
  },
  {
    name: 'Empty ArrayBuffer',
    build: () => ({blob: new Blob([new ArrayBuffer(0)]), expected: []}),
  },
  {
    name: 'Mixed ordering',
    build: () => ({
      blob: new Blob(['A', Uint8Array.from([66, 67]), 'D']),
      expected: [65, 66, 67, 68],
    }),
  },
  {
    name: 'slice()',
    build: () => {
      const source = new Blob([Uint8Array.from([1, 2, 3, 4, 5])]);
      const blob = source.slice(1, 4);
      // A slice is a *view* sharing the source's collector, so both objects
      // must be closed; the data is freed when the last one is released.
      source.close();
      return {blob, expected: [2, 3, 4]};
    },
  },
  {
    name: 'File',
    build: () => ({
      blob: new File([Uint8Array.from([7, 7])], 'a.bin'),
      expected: [7, 7],
    }),
  },
];

function formatBytes(bytes: ?Array<number>): string {
  return bytes == null ? '(none)' : `[${bytes.join(', ')}]`;
}

function sameBytes(a: Array<number>, b: Array<number>): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Reads a blob as an ArrayBuffer. The in-flight reader is published on
 * `readerRef` so an unmount can abort it; the blob stays alive until the read
 * settles, because closing it early frees the native buffer mid-read.
 */
function readBytes(
  blob: Blob,
  readerRef: {current: ?FileReader},
): Promise<Array<number>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    readerRef.current = reader;

    const release = () => {
      if (readerRef.current === reader) {
        readerRef.current = null;
      }
    };

    // `abort()` also dispatches `loadend`, but the promise is already settled
    // by then, so the later rejection is a no-op.
    reader.onabort = () => {
      release();
      reject(new Error('Read was aborted'));
    };
    reader.onloadend = () => {
      release();
      if (reader.error != null) {
        reject(reader.error);
        return;
      }
      const result = reader.result;
      if (result instanceof ArrayBuffer) {
        resolve(Array.from(new Uint8Array(result)));
      } else {
        reject(new Error('FileReader did not return an ArrayBuffer'));
      }
    };
    reader.readAsArrayBuffer(blob);
  });
}

async function runCheck(
  check: Check,
  readerRef: {current: ?FileReader},
): Promise<Result> {
  let blob: ?Blob = null;
  let expected: Array<number> = [];
  try {
    const built = check.build();
    blob = built.blob;
    expected = built.expected;

    const actual = await readBytes(blob, readerRef);
    const size = blob.size;
    if (size !== expected.length) {
      return {
        name: check.name,
        expected,
        actual,
        pass: false,
        error: `blob.size was ${size}, expected ${expected.length}`,
      };
    }
    return {
      name: check.name,
      expected,
      actual,
      pass: sameBytes(actual, expected),
      error: null,
    };
  } catch (error) {
    return {
      name: check.name,
      expected,
      actual: null,
      pass: false,
      error: describeError(error),
    };
  } finally {
    // The single close for this check's blob, on every path.
    blob?.close();
  }
}

function BlobPartChecks(): React.Node {
  const [results, setResults] = useState<Array<Result>>([]);
  const [running, setRunning] = useState(false);
  // Bumped whenever a run is superseded (re-run) or abandoned (unmount).
  const runIdRef = useRef(0);
  const readerRef = useRef<?FileReader>(null);

  useEffect(
    () => () => {
      runIdRef.current++;
      readerRef.current?.abort();
      readerRef.current = null;
    },
    [],
  );

  const run = useCallback(() => {
    // Cancel whatever is in flight; its `finally` still closes its blob.
    readerRef.current?.abort();
    const runId = ++runIdRef.current;
    setResults([]);
    setRunning(true);

    void (async () => {
      const collected: Array<Result> = [];
      for (const check of CHECKS) {
        const result = await runCheck(check, readerRef);
        if (runId !== runIdRef.current) {
          return;
        }
        collected.push(result);
        setResults([...collected]);
      }
      setRunning(false);
    })();
  }, []);

  const passed = results.filter(result => result.pass).length;

  return (
    <View>
      <RNTesterButton testID="blob-run" onPress={run}>
        Run checks
      </RNTesterButton>
      <RNTesterText testID="blob-summary" style={styles.summary}>
        {results.length === 0
          ? running
            ? 'Running…'
            : 'Not run yet'
          : `${passed} / ${results.length} passed${
              running ? ` (of ${CHECKS.length})` : ''
            }`}
      </RNTesterText>
      {results.map((result, index) => (
        <View
          key={result.name}
          style={styles.row}
          testID={`blob-result-${index}`}>
          <RNTesterText>
            {`${result.pass ? 'PASS' : 'FAIL'}  ${result.name}`}
          </RNTesterText>
          {result.pass ? null : (
            <View style={styles.details}>
              <RNTesterText variant="caption">
                {`expected ${formatBytes(result.expected)}`}
              </RNTesterText>
              <RNTesterText variant="caption">
                {`actual   ${formatBytes(result.actual)}`}
              </RNTesterText>
              {result.error == null ? null : (
                <RNTesterText variant="caption">
                  {`error: ${result.error}`}
                </RNTesterText>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function BlobLifecycle(): React.Node {
  const [message, setMessage] = useState<?string>(null);

  const run = useCallback(() => {
    const blob = new Blob(['gone']);
    blob.close();
    try {
      // React Native cannot deallocate blobs automatically, so a closed blob
      // is unusable — this is the RN-specific part of the Blob API.
      const size = blob.size;
      setMessage(`No error thrown; blob.size is still ${size}`);
    } catch (error) {
      setMessage(`Threw: ${describeError(error)}`);
    }
  }, []);

  return (
    <View>
      <RNTesterButton testID="blob-lifecycle-run" onPress={run}>
        Use a closed blob
      </RNTesterButton>
      <RNTesterText testID="blob-lifecycle-result" style={styles.summary}>
        {message ?? 'Not run yet'}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    paddingHorizontal: 5,
    paddingBottom: 5,
    fontWeight: 'bold',
  },
  row: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  details: {
    paddingLeft: 16,
  },
});

exports.title = 'Blob';
exports.category = 'Basic';
exports.description =
  'Construct a Blob from ArrayBuffer, ArrayBufferView, and string parts, then read it back with FileReader.readAsArrayBuffer.';
exports.examples = [
  {
    title: 'BlobPart round-trip checks',
    description:
      'Builds a blob per BlobPart variant, reads it back, and compares the bytes.',
    render: BlobPartChecks,
  },
  {
    title: 'Lifecycle',
    description:
      'Blobs must be closed explicitly; using one afterwards is an error.',
    render: BlobLifecycle,
  },
] as Array<RNTesterModuleExample>;
