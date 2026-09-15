/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  changedFilesFromPatch,
  commentableRightLines,
  parsePatch,
} = require('../reportFormattingErrors');

describe('reportFormattingErrors', () => {
  test('converts formatter hunks into minimal suggestions', () => {
    const patch = `diff --git a/example.js b/example.js
--- a/example.js
+++ b/example.js
@@ -10,3 +10,3 @@
 unchanged
-const value={answer:42};
+const value = {answer: 42};
 unchanged
`;

    expect(parsePatch(patch)).toEqual([
      {
        path: 'example.js',
        startLine: 11,
        endLine: 11,
        replacement: 'const value = {answer: 42};',
      },
    ]);
  });

  test('tracks lines that can receive right-side review comments', () => {
    const lines = commentableRightLines(`@@ -4,2 +4,3 @@
 context
-old
+new
+added
`);

    expect([...lines]).toEqual([4, 5, 6]);
  });

  test.each(['../../../etc/passwd', '/absolute/path', `\0evil`])(
    'rejects unsafe patch path %p',
    unsafePath => {
      const patch = `diff --git a/file b/file
--- a/file
+++ b/${unsafePath}
@@ -1 +1 @@
-old
+new
`;

      expect(parsePatch(patch)).toEqual([]);
      expect(changedFilesFromPatch(patch)).toEqual([]);
    },
  );

  test('parses multiple files without carrying hunk state across headers', () => {
    const patch = `diff --git a/one.js b/one.js
--- a/one.js
+++ b/one.js
@@ -1 +1 @@
-one
+first
diff --git a/two.js b/two.js
--- a/two.js
+++ b/two.js
@@ -2 +2 @@
-two
+second
`;

    expect(parsePatch(patch)).toEqual([
      {path: 'one.js', startLine: 1, endLine: 1, replacement: 'first'},
      {path: 'two.js', startLine: 2, endLine: 2, replacement: 'second'},
    ]);
    expect(changedFilesFromPatch(patch)).toEqual(['one.js', 'two.js']);
  });

  test('reports files even when a hunk cannot become a suggestion', () => {
    const patch = `diff --git a/example.js b/example.js
--- a/example.js
+++ b/example.js
@@ -1 +1 @@
-old
+\`\`\`unsafe suggestion fence
`;

    expect(parsePatch(patch)).toEqual([]);
    expect(changedFilesFromPatch(patch)).toEqual(['example.js']);
  });

  test('ignores non-hunk lines when collecting commentable lines', () => {
    const lines = commentableRightLines(`@@ -4 +4 @@
+new
index 123..456 100644
`);

    expect([...lines]).toEqual([4]);
  });
});
