/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const isMetaExportedPullRequest = require('../isMetaExportedPullRequest');

const exported = {
  author_association: 'MEMBER',
  body: 'Summary: Remove old flag\n\nDifferential Revision: D134244907\n',
  head: {ref: 'export-D134244907'},
  labels: [],
};

describe('isMetaExportedPullRequest', () => {
  test('recognizes an exported PR before the bot label arrives', () => {
    expect(isMetaExportedPullRequest(exported)).toBe(true);
  });

  test('recognizes the bot-applied label even without the revision line', () => {
    expect(
      isMetaExportedPullRequest({
        ...exported,
        body: '',
        head: {ref: 'other-branch'},
        author_association: 'NONE',
        labels: [{name: 'meta-exported'}],
      }),
    ).toBe(true);
  });

  test('does not trust a non-member spoofing the body and branch', () => {
    for (const author_association of ['NONE', 'CONTRIBUTOR', 'COLLABORATOR']) {
      expect(isMetaExportedPullRequest({...exported, author_association})).toBe(
        false,
      );
    }
  });

  test('requires the revision to match the export branch exactly', () => {
    expect(
      isMetaExportedPullRequest({
        ...exported,
        head: {ref: 'export-D134244908'},
      }),
    ).toBe(false);
    expect(
      isMetaExportedPullRequest({
        ...exported,
        body: 'Differential Revision: D134244907\nDifferential Revision: D2',
      }),
    ).toBe(false);
  });

  test('does not exempt ordinary PRs from members', () => {
    expect(
      isMetaExportedPullRequest({
        ...exported,
        head: {ref: 'fix-android'},
        body: 'Update Markdown documentation',
      }),
    ).toBe(false);
  });
});
