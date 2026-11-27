/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const checkForReproducer = require('../checkForReproducer');

const AUTHOR = 'issue-author';
const BOT = 'react-native-bot';
const MAINTAINER = 'some-maintainer';

function labelEvent(event, login, type, name = 'Needs: Repro') {
  return {event, label: {name}, actor: {login, type}};
}

function buildGithub({body, comments = [], timeline = []}) {
  return {
    rest: {
      issues: {
        get: jest.fn().mockResolvedValue({
          data: {
            user: {login: AUTHOR},
            created_at: '2026-01-01T00:00:00Z',
            body,
          },
        }),
        listComments: jest.fn().mockResolvedValue({data: comments}),
        listEventsForTimeline: jest.fn().mockResolvedValue({data: timeline}),
        removeLabel: jest.fn().mockResolvedValue({}),
        addLabels: jest.fn().mockResolvedValue({}),
      },
    },
  };
}

const context = {
  payload: {issue: {number: 1}},
  repo: {owner: 'react', repo: 'react-native'},
};

const REPRO_LINK = `Repro: https://github.com/${AUTHOR}/rn-repro`;

describe('checkForReproducer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds "Needs: Repro" and "Needs: Author Feedback" when no reproducer is present', async () => {
    const github = buildGithub({body: 'It crashes.'});

    await checkForReproducer(github, context);

    expect(github.rest.issues.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: ['Needs: Repro', 'Needs: Author Feedback'],
      }),
    );
    expect(github.rest.issues.removeLabel).not.toHaveBeenCalled();
  });

  it('removes "Needs: Repro" when the author links a repository they own', async () => {
    const github = buildGithub({body: REPRO_LINK});

    await checkForReproducer(github, context);

    expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Needs: Repro'}),
    );
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
  });

  it('removes "Needs: Repro" after the author edits in a reproducer, even though react-native-bot applied the label', async () => {
    const github = buildGithub({
      body: REPRO_LINK,
      timeline: [
        labelEvent('labeled', BOT, 'User', 'Needs: Author Feedback'),
        labelEvent('labeled', BOT, 'User'),
        labelEvent(
          'unlabeled',
          'github-actions[bot]',
          'Bot',
          'Needs: Author Feedback',
        ),
      ],
    });

    await checkForReproducer(github, context);

    expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Needs: Repro'}),
    );
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
  });

  it('does nothing when a maintainer has changed the "Needs: Repro" label', async () => {
    const github = buildGithub({
      body: REPRO_LINK,
      timeline: [
        labelEvent('labeled', BOT, 'User'),
        labelEvent('unlabeled', MAINTAINER, 'User'),
        labelEvent('labeled', MAINTAINER, 'User'),
      ],
    });

    await checkForReproducer(github, context);

    expect(github.rest.issues.removeLabel).not.toHaveBeenCalled();
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
  });

  it('ignores label changes on other labels when deciding whether a maintainer intervened', async () => {
    const github = buildGithub({
      body: REPRO_LINK,
      timeline: [
        labelEvent('labeled', BOT, 'User'),
        labelEvent('labeled', MAINTAINER, 'User', 'Platform: iOS'),
      ],
    });

    await checkForReproducer(github, context);

    expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Needs: Repro'}),
    );
  });

  it('accepts a reproducer link posted in a comment by its own author', async () => {
    const github = buildGithub({
      body: 'It crashes.',
      comments: [
        {
          user: {login: AUTHOR},
          body: `Here you go: https://github.com/${AUTHOR}/rn-repro`,
        },
      ],
      timeline: [labelEvent('labeled', BOT, 'User')],
    });

    await checkForReproducer(github, context);

    expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Needs: Repro'}),
    );
  });
});
