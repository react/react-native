/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

function isMetaExportedPullRequest(pr) {
  // meta-codesync applies this label, sometimes after the PR is opened.
  if (pr.labels?.some(label => label.name === 'meta-exported')) {
    return true;
  }

  // The PR body and branch are author-controlled. Require a repository member
  // as well as a matching Differential revision before skipping the first run.
  if (!['OWNER', 'MEMBER'].includes(pr.author_association)) {
    return false;
  }
  const match = /^export-(D[1-9]\d*)$/.exec(pr.head?.ref ?? '');
  if (!match) {
    return false;
  }
  const revisions = [
    ...(pr.body ?? '').matchAll(
      /^[ \t]*Differential Revision:[ \t]*(D[1-9]\d*)[ \t]*$/gm,
    ),
  ];
  return revisions.length === 1 && revisions[0][1] === match[1];
}

module.exports = isMetaExportedPullRequest;
