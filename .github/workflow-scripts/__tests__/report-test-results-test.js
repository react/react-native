/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {recordJobFailure, reportTestResults} = require('../report-test-results');

const context = {
  serverUrl: 'https://github.com',
  repo: {owner: 'react', repo: 'react-native'},
  runId: 40446700902,
  job: 'test',
};
const jobUrl =
  'https://github.com/react/react-native/actions/runs/40446700902/job/122302861049';
const failedTest = {outcome: 'failure', conclusion: 'success'};

function createCore() {
  const core = {
    setOutput: jest.fn(),
    setFailed: jest.fn(),
    warning: jest.fn(),
    summary: {addRaw: jest.fn(), write: jest.fn().mockResolvedValue(undefined)},
  };
  core.summary.addRaw.mockReturnValue(core.summary);
  return core;
}

function createGithub(jobs) {
  return {
    paginate: jest.fn().mockResolvedValue(jobs),
    rest: {actions: {listJobsForWorkflowRunAttempt: jest.fn()}},
  };
}

function job(name, url = jobUrl) {
  return {name, html_url: url, runner_name: 'runner', status: 'in_progress'};
}

function recordArguments(core, github, steps = {'run-tests': failedTest}) {
  return {
    context,
    core,
    github,
    steps,
    flavor: 'debug',
    runnerName: 'runner',
    attempt: 2,
    jobStatus: 'success',
  };
}

async function render(needs, failOnError = true) {
  const core = createCore();
  await reportTestResults({context, core, needs, failOnError, attempt: 3});
  return core;
}

describe('test job failure recording', () => {
  it('records tolerated test failures with their exact job name and log link', async () => {
    const core = createCore();
    const name = 'test_e2e_android_rntester_retry_2 / test (debug)';
    const github = createGithub([job(name)]);
    await recordJobFailure(recordArguments(core, github));
    expect(core.setOutput).toHaveBeenCalledWith('status', 'failure');
    expect(core.setOutput).toHaveBeenCalledWith(
      'failure-debug',
      JSON.stringify({name, url: jobUrl, steps: ['run-tests']}),
    );
    expect(github.paginate).toHaveBeenCalledWith(
      github.rest.actions.listJobsForWorkflowRunAttempt,
      {
        owner: 'react',
        repo: 'react-native',
        run_id: context.runId,
        attempt_number: 2,
        per_page: 100,
      },
    );
  });

  it('records failures in steps without an explicit id using the job status and API', async () => {
    const core = createCore();
    const github = createGithub([
      {
        ...job('template / build (Debug)'),
        steps: [{name: 'Build the app', conclusion: 'failure'}],
      },
    ]);
    await recordJobFailure({
      ...recordArguments(core, github, {}),
      context: {...context, job: 'build'},
      flavor: 'Debug',
      jobStatus: 'failure',
    });
    expect(JSON.parse(core.setOutput.mock.calls[1][1])).toEqual({
      name: 'template / build (Debug)',
      url: jobUrl,
      steps: ['Build the app'],
    });
  });

  it('does not overwrite matrix failures when another configuration passes', async () => {
    const core = createCore();
    const github = createGithub([]);
    await recordJobFailure(
      recordArguments(core, github, {
        'run-tests': {outcome: 'success', conclusion: 'success'},
      }),
    );
    expect(core.setOutput).not.toHaveBeenCalled();
    expect(github.paginate).not.toHaveBeenCalled();
  });

  it('ignores tolerated state-download failures when tests pass', async () => {
    const core = createCore();
    const github = createGithub([]);
    await recordJobFailure(
      recordArguments(core, github, {
        download: {outcome: 'failure', conclusion: 'success'},
        'run-tests': {outcome: 'success', conclusion: 'success'},
      }),
    );
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  it.each(['failure', 'cancelled'])(
    'records an upstream step with outcome %s',
    async outcome => {
      const core = createCore();
      const github = createGithub([job('test (debug)')]);
      await recordJobFailure(
        recordArguments(core, github, {
          setup: {outcome, conclusion: outcome},
          'run-tests': {outcome: 'skipped', conclusion: 'skipped'},
        }),
      );
      expect(JSON.parse(core.setOutput.mock.calls[1][1]).steps).toEqual([
        'setup',
      ]);
    },
  );

  it('preserves the failure when the API lookup fails', async () => {
    const core = createCore();
    const github = createGithub([]);
    github.paginate.mockRejectedValue(new Error('permission denied'));
    await recordJobFailure(recordArguments(core, github));
    expect(core.setOutput).toHaveBeenCalledWith('status', 'failure');
    expect(JSON.parse(core.setOutput.mock.calls[1][1])).toEqual({
      name: 'test (debug)',
      url: `${context.serverUrl}/react/react-native/actions/runs/${context.runId}/attempts/2`,
      steps: ['run-tests'],
    });
    expect(core.warning).toHaveBeenCalled();
  });

  it.each(['debug', 'release'])(
    'identifies the %s job when concurrent matrix jobs share a runner name',
    async flavor => {
      const core = createCore();
      const name = `caller / test (${flavor})`;
      const url = `${jobUrl}-${flavor}`;
      const github = createGithub([
        job('caller / test (release)', `${jobUrl}-release`),
        job('caller / test (debug)', `${jobUrl}-debug`),
      ]);
      await recordJobFailure({...recordArguments(core, github), flavor});
      expect(core.setOutput).toHaveBeenCalledWith(
        `failure-${flavor}`,
        JSON.stringify({name, url, steps: ['run-tests']}),
      );
      expect(core.warning).not.toHaveBeenCalled();
    },
  );

  it('distinguishes build and test jobs on the same runner', async () => {
    const core = createCore();
    const github = createGithub([
      job('caller / test (debug)'),
      job('caller / build (debug)', `${jobUrl}-build`),
    ]);
    await recordJobFailure({
      ...recordArguments(core, github, {}),
      context: {...context, job: 'build'},
      jobStatus: 'failure',
    });
    expect(JSON.parse(core.setOutput.mock.calls[1][1])).toEqual({
      name: 'caller / build (debug)',
      url: `${jobUrl}-build`,
      steps: ['job failure'],
    });
  });

  it('does not link a completed retry when the current job is not listed', async () => {
    const core = createCore();
    const github = createGithub([
      {...job('earlier / test (debug)'), status: 'completed'},
    ]);
    await recordJobFailure(recordArguments(core, github));
    expect(JSON.parse(core.setOutput.mock.calls[1][1]).url).toBe(
      `${context.serverUrl}/react/react-native/actions/runs/${context.runId}/attempts/2`,
    );
    expect(core.warning).toHaveBeenCalled();
  });

  it('selects only the current job on a reused runner', async () => {
    const core = createCore();
    const github = createGithub([
      {...job('earlier / test (debug)'), status: 'completed'},
      job('current / test (debug)'),
      {...job('other / test (debug)'), runner_name: 'other-runner'},
    ]);
    await recordJobFailure(recordArguments(core, github));
    expect(JSON.parse(core.setOutput.mock.calls[1][1]).name).toBe(
      'current / test (debug)',
    );
  });

  it('falls back rather than linking to an ambiguous job', async () => {
    const core = createCore();
    const github = createGithub([
      job('first / test (debug)'),
      job('second / test (debug)'),
    ]);
    await recordJobFailure(recordArguments(core, github));
    expect(JSON.parse(core.setOutput.mock.calls[1][1]).name).toBe(
      'test (debug)',
    );
    expect(core.warning).toHaveBeenCalled();
  });

  it('normalises iOS matrix names and supports non-matrix jobs', async () => {
    const core = createCore();
    const args = recordArguments(
      core,
      createGithub([job('caller / test (Release)'), job('caller / test')]),
    );
    await recordJobFailure({...args, flavor: 'Release'});
    expect(core.setOutput.mock.calls[1][0]).toBe('failure-release');
    expect(JSON.parse(core.setOutput.mock.calls[1][1]).name).toBe(
      'caller / test (Release)',
    );
    await recordJobFailure({...args, flavor: undefined});
    expect(core.setOutput.mock.calls[3][0]).toBe('failure');
    expect(JSON.parse(core.setOutput.mock.calls[3][1]).name).toBe(
      'caller / test',
    );
  });
});

describe('test report jobs', () => {
  it('reports both failing configurations even though their job conclusion is success', async () => {
    const debug = {
      name: 'test / test (debug)',
      url: jobUrl,
      steps: ['run-tests'],
    };
    const release = {
      ...debug,
      name: 'test / test (release)',
      url: `${jobUrl}-release`,
    };
    const core = await render({
      test: {
        result: 'success',
        outputs: {
          status: 'failure',
          'failure-debug': JSON.stringify(debug),
          'failure-release': JSON.stringify(release),
        },
      },
    });
    expect(core.setOutput).toHaveBeenCalledWith('status', 'failure');
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining(debug.name),
    );
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining(release.name),
    );
    const summary = core.summary.addRaw.mock.calls[0][0];
    expect(summary).toContain(`](${debug.url})`);
    expect(summary).toContain(`](${release.url})`);
  });

  it('does not hide an unrecorded setup failure behind another matrix failure', async () => {
    const core = await render({
      test: {
        result: 'failure',
        outputs: {
          status: 'failure',
          'failure-release': JSON.stringify({
            name: 'test (release)',
            url: jobUrl,
            steps: ['run-tests'],
          }),
        },
      },
    });
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('test (release)'),
    );
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('test: job failure'),
    );
  });

  it('keeps intermediate retries non-fatal while reporting their failures', async () => {
    const core = await render(
      {test: {result: 'success', outputs: {status: 'failure'}}},
      false,
    );
    expect(core.setOutput).toHaveBeenCalledWith('status', 'failure');
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('test: run-tests'),
    );
  });

  it.each(['failure', 'cancelled', 'skipped'])(
    'does not report an upstream %s as success',
    async result => {
      const core = await render({test: {result, outputs: {}}});
      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining(`job ${result}`),
      );
      expect(core.setOutput).toHaveBeenCalledWith('status', 'failure');
    },
  );

  it('reports build failures and skipped dependent tests', async () => {
    const core = await render({
      build: {
        result: 'failure',
        outputs: {
          'failure-debug': JSON.stringify({
            name: 'template / build (Debug)',
            url: jobUrl,
            steps: ['build-app'],
          }),
        },
      },
      test: {result: 'skipped', outputs: {}},
    });
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('template / build (Debug)'),
    );
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('test: job skipped'),
    );
  });

  it('reports success without failing or warning', async () => {
    const core = await render({
      test: {
        result: 'success',
        outputs: {'failure-debug': '', 'failure-release': ''},
      },
    });
    expect(core.setOutput).toHaveBeenCalledWith('status', 'success');
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.warning).not.toHaveBeenCalled();
    expect(core.summary.write).toHaveBeenCalled();
  });

  it('escapes job and step names in the Markdown summary', async () => {
    const core = await render({
      test: {
        result: 'success',
        outputs: {
          failure: JSON.stringify({
            name: '<script> [job]',
            url: jobUrl,
            steps: ['a\nb*'],
          }),
        },
      },
    });
    expect(core.summary.addRaw.mock.calls[0][0]).toContain(
      '\\<script\\> \\[job\\]',
    );
    expect(core.summary.addRaw.mock.calls[0][0]).toContain('a b\\*');
  });
});
