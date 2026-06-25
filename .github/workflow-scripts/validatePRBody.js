/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const changelogRegex =
  /\[\s?(ANDROID|GENERAL|IOS|INTERNAL)\s?\]\s?\[\s?(BREAKING|ADDED|CHANGED|DEPRECATED|REMOVED|FIXED|SECURITY)\s?\]\s*?-?\s*?(.*)/i;

const internalChangelogRegex = /\[\s?(INTERNAL)\s?\].*/gi;

function validateChangelog(commitMsg) {
  if (!commitMsg.toLowerCase().includes('changelog:')) {
    return 'missing';
  }
  const hasValidChangelog = changelogRegex.test(commitMsg);
  const hasValidInternalChangelog = internalChangelogRegex.test(commitMsg);

  if (hasValidChangelog || hasValidInternalChangelog) {
    return 'valid';
  }

  return 'invalid';
}

function validatePRBody(prBody) {
  const body = prBody ?? '';
  const bodyLower = body.toLowerCase();
  const isFromPhabricator = bodyLower.includes('differential revision:');

  const messages = [];
  let hasFail = false;

  function addWarning(title, text) {
    messages.push(`> [!WARNING]
> **${title}**
>
> ${text}`);
  }

  function addFail(title, text) {
    hasFail = true;
    messages.push(`> [!CAUTION]
> **${title}**
>
> ${text}`);
  }

  if (!body || body.length < 50) {
    addFail('Missing Description', 'This pull request needs a description.');
  } else {
    const hasSummary =
      bodyLower.includes('## summary') || bodyLower.includes('summary:');
    if (!hasSummary && body.split('\n').length <= 2 && !isFromPhabricator) {
      addWarning(
        'Missing Summary',
        'Please add a "## Summary" section to your PR description. This is a good place to explain the motivation for making this change.',
      );
    }
  }

  if (!isFromPhabricator) {
    const hasTestPlan = ['## test plan', 'test plan:', 'tests:', 'test:'].some(
      t => bodyLower.includes(t),
    );
    if (!hasTestPlan) {
      addWarning(
        'Missing Test Plan',
        'Please add a "## Test Plan" section to your PR description. A Test Plan lets us know how these changes were tested.',
      );
    }
  }

  if (!isFromPhabricator) {
    const status = validateChangelog(body);
    const link =
      'https://reactnative.dev/contributing/changelogs-in-pull-requests';
    if (status === 'missing') {
      addFail(
        'Missing Changelog',
        `Please add a Changelog to your PR description. See [Changelog format](${link})`,
      );
    } else if (status === 'invalid') {
      addFail(
        'Invalid Changelog Format',
        `Please verify your Changelog format. See [Changelog format](${link})`,
      );
    }
  }

  return {
    message: messages.join('\n\n'),
    status: hasFail ? 'FAIL' : 'PASS',
  };
}

module.exports = validatePRBody;
