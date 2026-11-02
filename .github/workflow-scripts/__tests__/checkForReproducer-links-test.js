/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const checkForReproducer = require('../checkForReproducer');

const ISSUE_AUTHOR = 'issue-author';

function buildGithub(body) {
  return {
    rest: {
      issues: {
        get: jest.fn().mockResolvedValue({
          data: {
            user: {login: ISSUE_AUTHOR},
            created_at: '2026-10-01T00:00:00Z',
            body,
          },
        }),
        listComments: jest.fn().mockResolvedValue({data: []}),
        listEventsForTimeline: jest.fn().mockResolvedValue({data: []}),
        removeLabel: jest.fn().mockResolvedValue({}),
        addLabels: jest.fn().mockResolvedValue({}),
      },
    },
  };
}

const context = {
  repo: {owner: 'react', repo: 'react-native'},
  payload: {issue: {number: 1}},
};

describe('checkForReproducer reproducer links', () => {
  test.each([
    'https://github.com/react/react-native/pull/58972',
    'https://github.com/facebook/react-native/pull/58972',
  ])('accepts a pull request link as a reproducer: %s', async link => {
    const github = buildGithub(`Reproducer: ${link}`);

    await checkForReproducer(github, context);

    expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Needs: Repro'}),
    );
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
  });

  test.each([
    'Reproducer: https://github.com/someone-else/some-repo/pull/12',
    'It crashes when I scroll.',
  ])('asks for a reproducer when there is none: %s', async body => {
    const github = buildGithub(body);

    await checkForReproducer(github, context);

    expect(github.rest.issues.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: ['Needs: Repro', 'Needs: Author Feedback'],
      }),
    );
    expect(github.rest.issues.removeLabel).not.toHaveBeenCalled();
  });
});
