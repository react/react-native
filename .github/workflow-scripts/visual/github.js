/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

function createGitHubClient({
  token = process.env.GITHUB_TOKEN,
  repository = process.env.GITHUB_REPOSITORY,
  apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com',
} = {}) {
  if (!token || !repository) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required');
  }

  async function request(method, route, body) {
    const response = await fetch(`${apiUrl}/repos/${repository}${route}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body != null ? {'Content-Type': 'application/json'} : null),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (response.status === 404 && method === 'GET') {
      return null;
    }
    if (!response.ok) {
      throw new Error(
        `${method} ${route} failed with ${response.status}: ${await response.text()}`,
      );
    }
    return response.status === 204 ? null : response.json();
  }

  return {
    repository,

    /** Finds the open PR whose head is `headSha` in `headRepository`. */
    async findPullRequest(headSha, headRepository) {
      for (let page = 1; page <= 10; page++) {
        const pulls = await request(
          'GET',
          `/pulls?state=open&sort=updated&direction=desc&per_page=100&page=${page}`,
        );
        const match = pulls.find(
          pull =>
            pull.head.sha === headSha &&
            pull.head.repo?.full_name === headRepository,
        );
        if (match != null || pulls.length < 100) {
          return match ?? null;
        }
      }
      return null;
    },

    /** Whether `sha` is an ancestor of, or equal to, `branch`. */
    async isOnBranch(sha, branch) {
      const comparison = await request(
        'GET',
        `/compare/${sha}...${encodeURIComponent(branch)}`,
      );
      return (
        comparison != null &&
        (comparison.status === 'ahead' || comparison.status === 'identical')
      );
    },

    /** `sha` and up to `count - 1` of its ancestors, newest first. */
    async ancestry(sha, count) {
      const commits = await request(
        'GET',
        `/commits?sha=${sha}&per_page=${count}`,
      );
      return (commits ?? []).map(commit => commit.sha);
    },

    async labels(prNumber) {
      const labels = await request(
        'GET',
        `/issues/${prNumber}/labels?per_page=100`,
      );
      return (labels ?? []).map(label => label.name);
    },

    removeLabel(prNumber, label) {
      return request(
        'DELETE',
        `/issues/${prNumber}/labels/${encodeURIComponent(label)}`,
      );
    },

    comment(prNumber, body) {
      return request('POST', `/issues/${prNumber}/comments`, {body});
    },

    /** The first comment by `author` on the PR that contains `marker`. */
    async findComment(prNumber, marker, author) {
      for (let page = 1; ; page++) {
        const comments = await request(
          'GET',
          `/issues/${prNumber}/comments?per_page=100&page=${page}`,
        );
        const match = (comments ?? []).find(
          comment =>
            comment.user?.login === author && comment.body?.includes(marker),
        );
        if (match != null || (comments ?? []).length < 100) {
          return match ?? null;
        }
      }
    },

    updateComment(commentId, body) {
      return request('PATCH', `/issues/comments/${commentId}`, {body});
    },

    async permission(login) {
      const result = await request(
        'GET',
        `/collaborators/${encodeURIComponent(login)}/permission`,
      );
      return result?.permission ?? 'none';
    },

    createCheckRun({name, headSha, conclusion, output, detailsUrl}) {
      return request('POST', '/check-runs', {
        name,
        head_sha: headSha,
        status: 'completed',
        conclusion,
        output,
        details_url: detailsUrl,
      });
    },
  };
}

module.exports = {createGitHubClient};
