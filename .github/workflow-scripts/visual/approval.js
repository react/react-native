/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {sha256} = require('./manifest');

const APPROVAL_LABEL = 'visual-change-approved';
const CHECK_NAME_PREFIX = 'Visual regression';
const GATE_CHECK_NAME = 'Visual regression approval';
const APPROVER_PERMISSIONS = ['admin', 'maintain', 'write'];

/**
 * Identifies a set of visual differences: which tests differ, how, and the
 * exact expected and captured images. An approval applies to one fingerprint,
 * so a push that changes any difference needs a new approval. Returns null
 * when there are no differences.
 */
function differenceFingerprint(platforms) {
  const lines = [];
  for (const {platform, environmentKey, baselineSha, results} of platforms) {
    for (const result of results) {
      if (result.status === 'unchanged') {
        continue;
      }
      lines.push(
        [
          platform,
          environmentKey,
          baselineSha ?? '',
          result.id,
          result.status,
          result.expected?.sha256 ?? '',
          result.captured?.sha256 ?? '',
        ].join('\t'),
      );
    }
  }
  if (lines.length === 0) {
    return null;
  }
  return sha256(Buffer.from(lines.sort().join('\n'))).slice(0, 16);
}

/**
 * The approval gate passes when there is nothing to approve, or when the
 * approval label is present and an approval was recorded for this exact
 * fingerprint.
 */
function gateDecision({fingerprint, labelPresent, approval}) {
  if (fingerprint == null) {
    return {conclusion: 'success', summary: 'No visual differences.'};
  }
  if (labelPresent && approval?.fingerprint === fingerprint) {
    return {
      conclusion: 'success',
      summary: `Visual differences approved by @${approval.approver}.`,
    };
  }
  if (labelPresent) {
    return {
      conclusion: 'failure',
      summary: `The visual differences changed after approval. A maintainer must review the new report and re-apply \`${APPROVAL_LABEL}\`.`,
      staleLabel: true,
    };
  }
  return {
    conclusion: 'failure',
    summary: `Visual differences need maintainer approval. Review the report, then apply \`${APPROVAL_LABEL}\`.`,
  };
}

module.exports = {
  APPROVAL_LABEL,
  APPROVER_PERMISSIONS,
  CHECK_NAME_PREFIX,
  GATE_CHECK_NAME,
  differenceFingerprint,
  gateDecision,
};
