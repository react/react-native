/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

function runUrl(context, attempt) {
  return `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}/attempts/${attempt}`;
}

async function recordJobFailure({
  github,
  context,
  core,
  steps,
  flavor,
  runnerName,
  attempt,
  jobStatus,
}) {
  const failedSteps = Object.entries(steps)
    .filter(
      ([id, step]) =>
        ['failure', 'cancelled'].includes(step.outcome) &&
        (id === 'run-tests' || step.conclusion !== 'success'),
    )
    .map(([id]) => id);
  if (failedSteps.length === 0 && jobStatus === 'success') {
    return;
  }
  if (failedSteps.length === 0) {
    failedSteps.push(`job ${jobStatus}`);
  }

  core.setOutput('status', 'failure');
  let name = `${context.job}${flavor ? ` (${flavor})` : ''}`;
  let url = runUrl(context, attempt);
  try {
    const jobs = await github.paginate(
      github.rest.actions.listJobsForWorkflowRunAttempt,
      {
        ...context.repo,
        run_id: context.runId,
        attempt_number: attempt,
        per_page: 100,
      },
    );
    const matchingJobs = jobs.filter(
      job =>
        job.runner_name === runnerName &&
        job.status === 'in_progress' &&
        (job.name === name || job.name.endsWith(` / ${name}`)),
    );
    if (matchingJobs.length === 1) {
      name = matchingJobs[0].name;
      url = matchingJobs[0].html_url;
      const failedJobSteps = matchingJobs[0].steps
        ?.filter(step => ['failure', 'cancelled'].includes(step.conclusion))
        .map(step => step.name);
      if (failedJobSteps?.length > 0) {
        failedSteps.splice(0, failedSteps.length, ...failedJobSteps);
      }
    } else {
      core.warning(`Could not uniquely identify ${name}; linking to the run.`);
    }
  } catch (error) {
    core.warning(`Could not look up the failing job: ${error.message}`);
  }

  core.setOutput(
    flavor ? `failure-${flavor.toLowerCase()}` : 'failure',
    JSON.stringify({name, url, steps: failedSteps}),
  );
}

function escapeMarkdown(text) {
  return text.replace(/[\\`*_[\]<>\n\r]/g, character =>
    character === '\n' || character === '\r' ? ' ' : `\\${character}`,
  );
}

async function reportTestResults({context, core, needs, failOnError, attempt}) {
  const failures = [];
  const fallbackUrl = runUrl(context, attempt);
  for (const [name, job] of Object.entries(needs)) {
    const jobFailures = Object.entries(job.outputs ?? {})
      .filter(([key, value]) => key.startsWith('failure') && value)
      .map(([, value]) => JSON.parse(value));
    failures.push(...jobFailures);
    if (
      job.result !== 'success' ||
      (jobFailures.length === 0 && job.outputs?.status === 'failure')
    ) {
      failures.push({
        name,
        url: fallbackUrl,
        steps: [job.result === 'success' ? 'run-tests' : `job ${job.result}`],
      });
    }
  }

  const status = failures.length > 0 ? 'failure' : 'success';
  core.setOutput('status', status);
  const summary = [
    '## Test job results',
    '',
    failures.length === 0
      ? 'All dependent jobs passed.'
      : 'The following jobs failed:',
    '',
    ...failures.map(
      failure =>
        `- [${escapeMarkdown(failure.name)}](${failure.url}): ${failure.steps.map(escapeMarkdown).join(', ')}`,
    ),
    '',
  ].join('\n');
  await core.summary.addRaw(summary).write();

  if (failures.length > 0) {
    const message = failures
      .map(
        failure =>
          `${failure.name}: ${failure.steps.join(', ')}. Logs: ${failure.url}`,
      )
      .join('\n');
    if (failOnError) {
      core.setFailed(message);
    } else {
      core.warning(message);
    }
  }
}

module.exports = {recordJobFailure, reportTestResults};
