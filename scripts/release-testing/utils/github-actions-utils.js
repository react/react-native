#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const fetch = require('node-fetch');
const {execSync: exec} = require('node:child_process');
const {styleText} = require('node:util');

/*::
type CIHeaders = {
  Authorization: string,
  Accept: string,
  'X-GitHub-Api-Version': string
}

type WorkflowRun = {
  id: number,
  name: string,
  run_number: number,
  status: "queued" | "in_progress" | "completed",
  workflow_id: number,
  url: string,
  created_at: string,
  conclusion: "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required" | null,
  head_commit: {
    author: {
      name: string,
    },
    message: string,
    ...
  };
  triggering_actor: {
    login: string,
    ...
  };
  run_started_at: string,
};


type Artifact = {
  id: number,
  name: string,
  url: string,
  archive_download_url: string,
}

type WorkflowRuns = {
  total_count: number,
  workflow_runs: Array<WorkflowRun>,
}

type Artifacts = {
  total_count: number,
  artifacts: Array<Artifact>,
}
*/

let token;
let ciHeaders;
let artifacts;
let branch;
let baseTemporaryPath;

const reactNativeRepo = 'https://api.github.com/repos/facebook/react-native/';
const reactNativeActionsURL = `${reactNativeRepo}actions/runs`;

async function _getActionRunsOnBranch() /*: Promise<WorkflowRuns> */ {
  const url = `${reactNativeActionsURL}?branch=${branch}&per_page=100`;
  const options = {
    method: 'GET',
    headers: ciHeaders,
  };

  // $FlowFixMe[prop-missing] Conflicting .flowconfig in Meta's monorepo
  // $FlowFixMe[incompatible-type]
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(JSON.stringify(await response.json()));
  }

  const body = await response
    .json /*::<WorkflowRuns>*/
    ();
  return body;
}

async function _getArtifacts(run_id /*: number */) /*: Promise<Artifacts> */ {
  const url = `${reactNativeActionsURL}/${run_id}/artifacts?per_page=100`;
  const options = {
    method: 'GET',
    headers: ciHeaders,
  };

  // $FlowFixMe[prop-missing] Conflicting .flowconfig in Meta's monorepo
  // $FlowFixMe[incompatible-type]
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(JSON.stringify(await response.json()));
  }

  const body = await response
    .json /*::<Artifacts>*/
    ();
  return body;
}

function quote(text /*: string*/, prefix /*: string */ = ' > ') {
  return text
    .split('\n')
    .map(line => prefix + line)
    .join('\n');
}

// === Public Interface === //
async function initialize(
  ciToken /*: string */,
  baseTempPath /*: string */,
  branchName /*: string */,
  useLastSuccessfulPipeline /*: boolean */ = false,
) {
  console.info('Getting GHA information');
  baseTemporaryPath = baseTempPath;
  exec(`mkdir -p ${baseTemporaryPath}`);

  branch = branchName;

  token = ciToken;
  ciHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const testAllWorkflows = (await _getActionRunsOnBranch()).workflow_runs
    .filter(w => w.name === 'Test All')
    .sort((a, b) => {
      // Date.getTime is needed to make Flow happy with arithmetic
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  if (testAllWorkflows.length === 0) {
    console.error('No Test-All workflow found');
    process.exit(1);
  }

  console.log(`\nUsing github workflow run ${testAllWorkflows[0].run_number}`);
  console.log(
    `https://github.com/facebook/react-native/actions/runs/${testAllWorkflows[0].id}\n`,
  );

  let workflow = testAllWorkflows[0];
  if (useLastSuccessfulPipeline) {
    workflow =
      testAllWorkflows.find(
        wf => wf.status === 'completed' && wf.conclusion === 'success',
      ) ?? workflow;
  }

  const commit = workflow.head_commit;
  const hours =
    (new Date().getTime() - new Date(workflow.run_started_at).getTime()) /
    (60 * 60 * 1000);
  const started_by = workflow.triggering_actor.login;

  console.log(
    styleText(
      'green',
      `The artifact being used is from a workflow started ${styleText(['bold', 'magentaBright'], hours.toFixed(0))} hours ago by ${styleText(['bold', 'magentaBright'], started_by)}:

Author: ${styleText('bold', commit.author.name)}
Message:
${styleText('magentaBright', quote(commit.message))}
  `,
    ),
  );

  artifacts = await _getArtifacts(workflow.id);
}

function downloadArtifact(
  artifactURL /*: string */,
  destination /*: string */,
) {
  exec(`rm -rf ${destination}`);

  const command = `curl ${artifactURL} \
    -Lo ${destination} \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${token}" \
    -H "X-GitHub-Api-Version: 2022-11-28"`;

  exec(command, {stdio: 'inherit'});
}

async function artifactURLForRNTesterAPK(
  emulatorArch /*: string */,
) /*: Promise<string> */ {
  return getArtifactURL('rntester-debug');
}

async function artifactURLForHermesRNTesterApp() /*: Promise<string> */ {
  return getArtifactURL('RNTesterApp-NewArch-Debug');
}

async function artifactURLForMavenLocal() /*: Promise<string> */ {
  return getArtifactURL('maven-local');
}

async function getArtifactURL(
  artifactName /*: string */,
) /*: Promise<string> */ {
  const filteredUrls = artifacts.artifacts.filter(a => a.name === artifactName);

  if (filteredUrls.length === 0) {
    console.error(
      `No artifact found with name ${artifactName}.\n\nAvailable artifacts: ${artifacts.artifacts.map(a => a.name).join('  ')}`,
    );
    process.exit(1);
  }
  return filteredUrls[0].archive_download_url;
}

async function artifactURLHermesDebug() /*: Promise<string> */ {
  return getArtifactURL('hermes-darwin-bin-Debug');
}

async function artifactURLForReactNative() /*: Promise<string> */ {
  return getArtifactURL('react-native-package');
}

function baseTmpPath() /*: string */ {
  return baseTemporaryPath;
}

module.exports = {
  initialize,
  downloadArtifact,
  artifactURLForRNTesterAPK,
  artifactURLForHermesRNTesterApp,
  artifactURLForMavenLocal,
  artifactURLHermesDebug,
  artifactURLForReactNative,
  baseTmpPath,
};
