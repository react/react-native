/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {diff} from 'jest-diff';

export type SnapshotConfig = {
  updateSnapshot: 'all' | 'new' | 'none',
  data: {[key: string]: string},
};

export type TestSnapshotResults = {
  [key: string]:
    | {
        pass: true,
      }
    | {
        pass: false,
        value: string,
      },
};

export type InlineSnapshotResult =
  | {pass: true}
  | {pass: false, isNew: boolean, value: string, stackTrace: string};

export type TestInlineSnapshotResults = Array<InlineSnapshotResult>;

const COMPARISON_EQUALS_STRING = 'Compared values have no visual difference.';

const INDENTATION_REGEX: RegExp = /^([^\S\n]*)\S/m;

let snapshotConfig: ?SnapshotConfig;

// Add extra line breaks at beginning and end of multiline snapshot
// to make the content easier to read.
const addExtraLineBreaks = (string: string): string =>
  string.includes('\n') ? `\n${string}\n` : string;

// Strips source-code indentation from inline snapshot template literals.
// Matches jest-snapshot's stripAddedIndentation implementation.
function stripAddedIndentation(inlineSnapshot: string): string {
  const match = inlineSnapshot.match(INDENTATION_REGEX);
  if (!match || !match[1]) {
    return inlineSnapshot;
  }

  const indentation = match[1];
  const lines = inlineSnapshot.split('\n');

  if (lines.length <= 2) {
    return inlineSnapshot;
  }

  if (lines[0].trim() !== '' || lines[lines.length - 1].trim() !== '') {
    return inlineSnapshot;
  }

  for (let i = 1; i < lines.length - 1; i++) {
    if (lines[i] !== '') {
      if (lines[i].indexOf(indentation) !== 0) {
        return inlineSnapshot;
      }
      lines[i] = lines[i].substring(indentation.length);
    }
  }

  lines[lines.length - 1] = '';
  return lines.join('\n');
}

type SnapshotState = {
  callCount: number,
  testFullName: string,
  snapshotResults: TestSnapshotResults,
  inlineSnapshotResults: TestInlineSnapshotResults,
};

class SnapshotContext {
  #snapshotState: ?SnapshotState = null;

  setTargetTest(testFullName: string) {
    this.#snapshotState = {
      callCount: 0,
      testFullName,
      snapshotResults: {},
      inlineSnapshotResults: [],
    };
  }

  toMatchSnapshot(received: string, label: ?string): void {
    const snapshotState = this.#snapshotState;
    if (snapshotState == null) {
      throw new Error(
        'Snapshot state is not set, call `setTargetTest()` first',
      );
    }

    const snapshotKey = `${snapshotState.testFullName}${
      label != null ? `: ${label}` : ''
    } ${++snapshotState.callCount}`;

    if (snapshotConfig == null) {
      throw new Error(
        'Snapshot config is not set. Did you forget to call `setupSnapshotConfig`?',
      );
    }

    const updateSnapshot = snapshotConfig.updateSnapshot;
    const snapshot = snapshotConfig.data[snapshotKey];

    if (snapshot == null) {
      snapshotState.snapshotResults[snapshotKey] = {
        pass: false,
        value: received,
      };

      if (updateSnapshot === 'none') {
        throw new Error(
          `Expected to have snapshot \`${snapshotKey}\` but it was not found.`,
        );
      }

      return;
    }

    const result = diff(snapshot, received) ?? 'Failed to compare output';
    if (result !== COMPARISON_EQUALS_STRING) {
      snapshotState.snapshotResults[snapshotKey] = {
        pass: false,
        value: received,
      };

      if (updateSnapshot !== 'all') {
        throw new Error(`Expected to match snapshot.\n${result}`);
      }

      return;
    }

    snapshotState.snapshotResults[snapshotKey] = {pass: true};
  }

  toMatchInlineSnapshot(
    received: string,
    inlineSnapshot: string | void,
    stackTrace: string,
  ): void {
    const snapshotState = this.#snapshotState;
    if (snapshotState == null) {
      throw new Error(
        'Snapshot state is not set, call `setTargetTest()` first',
      );
    }

    if (snapshotConfig == null) {
      throw new Error(
        'Snapshot config is not set. Did you forget to call `setupSnapshotConfig`?',
      );
    }

    const updateSnapshot = snapshotConfig.updateSnapshot;
    const receivedSerialized = addExtraLineBreaks(received);

    if (inlineSnapshot === undefined) {
      // First run - no inline snapshot yet
      snapshotState.inlineSnapshotResults.push({
        pass: false,
        isNew: true,
        value: receivedSerialized,
        stackTrace,
      });

      if (updateSnapshot === 'none') {
        throw new Error(
          'New inline snapshot was not written. The update flag must be explicitly passed to write a new snapshot.\n\nThis is likely because this test is run in a continuous integration (CI) environment in which snapshots are not written by default.',
        );
      }

      return;
    }

    const expected = stripAddedIndentation(inlineSnapshot);

    if (receivedSerialized === expected) {
      snapshotState.inlineSnapshotResults.push({pass: true});
      return;
    }

    // Mismatch
    snapshotState.inlineSnapshotResults.push({
      pass: false,
      isNew: false,
      value: receivedSerialized,
      stackTrace,
    });

    if (updateSnapshot !== 'all') {
      const diffResult =
        diff(expected, receivedSerialized) ?? 'Failed to compare output';
      throw new Error(`Expected to match inline snapshot.\n${diffResult}`);
    }
  }

  getSnapshotResults(): TestSnapshotResults {
    return {...this.#snapshotState?.snapshotResults};
  }

  getInlineSnapshotResults(): TestInlineSnapshotResults {
    return [...(this.#snapshotState?.inlineSnapshotResults ?? [])];
  }
}

export const snapshotContext: SnapshotContext = new SnapshotContext();

export function setupSnapshotConfig(config: SnapshotConfig) {
  snapshotConfig = config;
}
