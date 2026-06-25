/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  TestInlineSnapshotResults,
  TestSnapshotResults,
} from '../runtime/snapshotContext';
import type {SnapshotState} from 'jest-snapshot';

import {symbolicateStackTrace} from './utils';
import fs from 'fs';
import path from 'path';

type JestSnapshotResult = {
  added: number,
  fileDeleted: boolean,
  matched: number,
  unchecked: number,
  uncheckedKeys: string[],
  unmatched: number,
  updated: number,
};

// Add extra line breaks at beginning and end of multiline snapshot
// to make the content easier to read.
const addExtraLineBreaks = (string: string): string =>
  string.includes('\n') ? `\n${string}\n` : string;

// Remove extra line breaks at beginning and end of multiline snapshot.
// Instead of trim, which can remove additional newlines or spaces
// at beginning or end of the content from a custom serializer.
const removeExtraLineBreaks = (string: string): string =>
  string.length > 2 && string.startsWith('\n') && string.endsWith('\n')
    ? string.slice(1, -1)
    : string;

export const getInitialSnapshotData = (
  snapshotState: SnapshotState,
): {[key: string]: string} => {
  const initialData: {[key: string]: string} = {};

  for (const key in snapshotState._initialData) {
    initialData[key] = removeExtraLineBreaks(snapshotState._initialData[key]);
  }

  return initialData;
};

const STACK_FRAME_REGEX: RegExp = /at .* \((.+):(\d+):(\d+)\)/;

/**
 * Extract the frame from a symbolicated stack trace that points to the test file.
 */
function extractTestFileFrame(
  symbolicatedStack: string,
  testPath: string,
): {file: string, line: number, column: number} | null {
  const testBaseName = path.basename(testPath);
  const lines = symbolicatedStack.split('\n');

  for (const line of lines) {
    const match = line.match(STACK_FRAME_REGEX);
    if (match) {
      const file = match[1];
      const lineNumber = parseInt(match[2], 10);
      const column = parseInt(match[3], 10);

      // Match by basename since source map paths may be relative
      if (file.endsWith(testBaseName) || file === testPath) {
        return {file, line: lineNumber, column};
      }
    }
  }

  return null;
}

export type PendingInlineSnapshot = {
  line: number,
  snapshot: string,
};

/**
 * Process inline snapshot results from the VM. Resolves stack traces to
 * source locations and returns pending snapshots for source file rewriting.
 * Also updates snapshotState counters.
 */
export const processInlineSnapshotResults = (
  snapshotState: SnapshotState,
  inlineSnapshotResults: Array<TestInlineSnapshotResults>,
  sourceMapPath: string,
  testPath: string,
): Array<PendingInlineSnapshot> => {
  const pending: Array<PendingInlineSnapshot> = [];

  for (const results of inlineSnapshotResults) {
    for (const result of results) {
      if (result.pass) {
        snapshotState.matched++;
        continue;
      }

      // For new snapshots in CI mode, don't write
      if (result.isNew && snapshotState._updateSnapshot === 'none') {
        snapshotState.unmatched++;
        continue;
      }

      // For mismatches without -u, don't write to source
      if (!result.isNew && snapshotState._updateSnapshot !== 'all') {
        snapshotState.unmatched++;
        continue;
      }

      // Symbolicate stack trace to get original source location
      const symbolicatedStack = symbolicateStackTrace(
        sourceMapPath,
        result.stackTrace,
      );
      const frame = extractTestFileFrame(symbolicatedStack, testPath);

      if (frame == null) {
        continue;
      }

      pending.push({
        line: frame.line,
        snapshot: result.value,
      });

      snapshotState._dirty = true;
      if (result.isNew) {
        snapshotState.added++;
        snapshotState.matched++;
      } else {
        snapshotState.updated++;
      }
    }
  }

  return pending;
};

/**
 * Escape a string for use inside a template literal.
 */
function escapeForTemplateLiteral(str: string): string {
  return str.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * Format a snapshot value as a template literal string for source insertion.
 */
function formatSnapshotAsTemplateLiteral(
  snapshot: string,
  baseIndent: string,
): string {
  const escaped = escapeForTemplateLiteral(snapshot);

  if (!escaped.includes('\n')) {
    return '`' + escaped + '`';
  }

  // Multiline: snapshot has \n prefix and \n suffix from addExtraLineBreaks.
  // Indent content lines and place closing backtick at baseIndent.
  const lines = escaped.split('\n');
  const result = lines.map((line, i) => {
    if (i === 0) {
      // Opening empty line (after the leading \n)
      return line;
    }
    if (i === lines.length - 1) {
      // Closing line: just the base indent before the backtick
      return baseIndent;
    }
    if (line === '') {
      return '';
    }
    return baseIndent + '  ' + line;
  });

  return '`' + result.join('\n') + '`';
}

/**
 * Find the offset of the closing paren that matches the open paren at
 * `openParenOffset`. Handles template literals inside the arguments.
 */
function findMatchingParen(source: string, openParenOffset: number): number {
  let depth = 1;
  let i = openParenOffset + 1;
  let inTemplate = false;

  while (i < source.length && depth > 0) {
    const ch = source[i];

    if (inTemplate) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '`') {
        inTemplate = false;
      }
    } else {
      if (ch === '`') {
        inTemplate = true;
      } else if (ch === '(') {
        depth++;
      } else if (ch === ')') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }

    i++;
  }

  return -1;
}

/**
 * Write pending inline snapshots directly into the test source file.
 * Replaces argument of each `toMatchInlineSnapshot(...)` call at the
 * resolved line with the formatted snapshot template literal.
 */
export function saveInlineSnapshotsToSource(
  testPath: string,
  pendingSnapshots: Array<PendingInlineSnapshot>,
): void {
  if (pendingSnapshots.length === 0) {
    return;
  }

  // Deduplicate by line (last value wins)
  const byLine = new Map<number, PendingInlineSnapshot>();
  for (const snapshot of pendingSnapshots) {
    byLine.set(snapshot.line, snapshot);
  }

  let source = fs.readFileSync(testPath, 'utf8');
  const originalLines = source.split('\n');

  // Process in reverse line order so earlier offsets stay valid
  const sorted = [...byLine.values()].sort((a, b) => b.line - a.line);

  for (const {line, snapshot} of sorted) {
    const lineContent = originalLines[line - 1];
    if (lineContent == null) {
      continue;
    }

    const matcherIndex = lineContent.indexOf('toMatchInlineSnapshot');
    if (matcherIndex === -1) {
      continue;
    }

    const parenIndex = lineContent.indexOf('(', matcherIndex);
    if (parenIndex === -1) {
      continue;
    }

    // Compute character offset of the open paren in the current source
    let lineOffset = 0;
    for (let i = 0; i < line - 1; i++) {
      lineOffset += originalLines[i].length + 1;
    }
    const openParenOffset = lineOffset + parenIndex;

    const closeParenOffset = findMatchingParen(source, openParenOffset);
    if (closeParenOffset === -1) {
      continue;
    }

    const baseIndent = lineContent.match(/^(\s*)/)?.[1] ?? '';
    const formatted = formatSnapshotAsTemplateLiteral(snapshot, baseIndent);

    source =
      source.slice(0, openParenOffset + 1) +
      formatted +
      source.slice(closeParenOffset);
  }

  fs.writeFileSync(testPath, source, 'utf8');
}

export const updateSnapshotsAndGetJestSnapshotResult = (
  snapshotState: SnapshotState,
  testSnapshotResults: Array<TestSnapshotResults>,
): JestSnapshotResult => {
  for (const snapshotResults of testSnapshotResults) {
    for (const [key, result] of Object.entries(snapshotResults)) {
      if (result.pass) {
        snapshotState.matched++;
        snapshotState._uncheckedKeys.delete(key);
        continue;
      }

      if (snapshotState._snapshotData[key] === undefined) {
        if (snapshotState._updateSnapshot === 'none') {
          snapshotState.unmatched++;
          continue;
        }

        snapshotState._dirty = true;
        snapshotState._snapshotData[key] = addExtraLineBreaks(result.value);
        snapshotState.added++;
        snapshotState.matched++;
        snapshotState._uncheckedKeys.delete(key);

        continue;
      }

      snapshotState._dirty = true;
      snapshotState._snapshotData[key] = addExtraLineBreaks(result.value);
      snapshotState.updated++;
      snapshotState._uncheckedKeys.delete(key);
    }
  }

  const uncheckedCount = snapshotState.getUncheckedCount();
  const uncheckedKeys = snapshotState.getUncheckedKeys();
  if (uncheckedCount) {
    snapshotState.removeUncheckedKeys();
  }

  const status = snapshotState.save();
  return {
    added: snapshotState.added,
    fileDeleted: status.deleted,
    matched: snapshotState.matched,
    unchecked: status.deleted ? 0 : snapshotState.getUncheckedCount(),
    uncheckedKeys: [...uncheckedKeys],
    unmatched: snapshotState.unmatched,
    updated: snapshotState.updated,
  };
};
