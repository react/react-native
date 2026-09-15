/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const NEEDS_REPRO_LABEL = 'Needs: Repro';
const NEEDS_AUTHOR_FEEDBACK_LABEL = 'Needs: Author Feedback';
const SKIP_ISSUES_OLDER_THAN = '2023-07-01T00:00:00Z';
// The account this workflow runs as; a user account, so actor.type is 'User'.
const REACT_NATIVE_BOT_LOGIN = 'react-native-bot';

module.exports = async (github, context) => {
  const issueData = {
    issue_number: context.payload.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  };

  const issue = await github.rest.issues.get(issueData);
  const comments = await github.rest.issues.listComments(issueData);
  const author = issue.data.user.login;

  const issueDate = issue.data.created_at;
  if (isDateBefore(issueDate, SKIP_ISSUES_OLDER_THAN)) {
    return;
  }

  const maintainerChangedLabel = await hasMaintainerChangedLabel(
    github,
    issueData,
    author,
  );

  if (maintainerChangedLabel) {
    return;
  }

  const entities = [issue.data, ...comments.data];

  // Look for Snack or a GH repo associated with the user that added an issue or comment
  const hasValidReproducer = entities.some(entity => {
    const hasPullRequestRepoLink = containsPattern(
      entity.body,
      `https?:\/\/github\.com\/facebook\/react-native\/pull\/\d+\/?`,
    );

    const hasExpoSnackLink = containsPattern(
      entity.body,
      `https?:\\/\\/snack\\.expo\\.dev\\/[^\\s)\\]]+`,
    );

    const hasGithubRepoLink = containsPattern(
      entity.body,
      `https?:\\/\\/github\\.com\\/(${entity.user.login})\\/[^/]+\\/?\\s?`,
    );
    return hasPullRequestRepoLink || hasExpoSnackLink || hasGithubRepoLink;
  });

  if (hasValidReproducer) {
    try {
      await github.rest.issues.removeLabel({
        ...issueData,
        name: NEEDS_REPRO_LABEL,
      });
    } catch (error) {
      if (!/Label does not exist/.test(error.message)) {
        throw error;
      }
    }
  } else {
    await github.rest.issues.addLabels({
      ...issueData,
      labels: [NEEDS_REPRO_LABEL, NEEDS_AUTHOR_FEEDBACK_LABEL],
    });
  }
};

function containsPattern(body, pattern) {
  const regexp = new RegExp(pattern, 'gm');
  return body.search(regexp) !== -1;
}

// Prevents the bot from responding when a maintainer has changed the
// 'Needs: Repro' label. Events from GitHub Apps and react-native-bot itself
// are automation, not maintainer decisions.
async function hasMaintainerChangedLabel(github, issueData, author) {
  const timeline = await github.rest.issues.listEventsForTimeline(issueData);

  const labeledEvents = timeline.data.filter(
    event => event.event === 'labeled' || event.event === 'unlabeled',
  );
  const maintainerEvents = labeledEvents.filter(
    event =>
      event.actor.type !== 'Bot' &&
      event.actor.login !== REACT_NATIVE_BOT_LOGIN,
  );

  return maintainerEvents.some(
    event =>
      event.actor.login !== author && event.label.name === NEEDS_REPRO_LABEL,
  );
}

function isDateBefore(firstDate, secondDate) {
  const date1 = new Date(firstDate);
  const date2 = new Date(secondDate);

  return date1.getTime() < date2.getTime();
}
