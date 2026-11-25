/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  assessPullRequest,
  parseModelDecision,
  sensitivePaths,
} = require('../metaImportRisk');

const context = {
  repo: {owner: 'react', repo: 'react-native'},
  issue: {number: 123},
  payload: {pull_request: {labels: []}},
};

function file(filename, extra = {}) {
  return {
    filename,
    status: 'modified',
    patch: '@@ -1 +1 @@\n-old\n+new',
    ...extra,
  };
}

function modelResponse(requiresMetaImport, evidenceFiles = []) {
  return {
    ok: true,
    json: async () => ({
      status: 'completed',
      output: [
        {
          content: [
            {
              type: 'output_text',
              text: JSON.stringify({
                requiresMetaImport,
                reason: 'Checked the changed behavior.',
                evidenceFiles,
              }),
            },
          ],
        },
      ],
    }),
  };
}

function assess(files, fetchImpl, overrideContext = context) {
  return assessPullRequest({
    github: {
      rest: {pulls: {listFiles: jest.fn()}},
      paginate: async () => files,
    },
    context: overrideContext,
    apiKey: 'test-key',
    fetchImpl,
  });
}

describe('sensitivePaths', () => {
  test('catches manifests, native core, Yoga and Hermes integration', () => {
    const paths = [
      'package.json',
      'packages/react-native/package.json',
      'yarn.lock',
      'packages/react-native/ReactCommon/yoga/yoga/YGNode.cpp',
      'packages/react-native/ReactAndroid/src/main/java/Module.java',
      'packages/react-native/ReactApple/React/Foo.mm',
      'packages/react-native/sdks/hermes-engine/version.properties',
      'packages/react-native/scripts/hermes/hermes-utils.js',
    ];
    expect(sensitivePaths(paths.map(path => file(path)))).toEqual(paths);
  });

  test('does not force ordinary JS, Markdown or workflow-only changes', () => {
    expect(
      sensitivePaths(
        [
          'packages/react-native/Libraries/Text/Text.js',
          'packages/react-native/ReactCommon/__docs__/README.md',
          '.github/workflows/test-all.yml',
        ].map(path => file(path)),
      ),
    ).toEqual([]);
  });

  test('checks the old path when a sensitive file is renamed', () => {
    expect(
      sensitivePaths([file('notes.txt', {previous_filename: 'yarn.lock'})]),
    ).toEqual(['yarn.lock']);
  });
});

describe('parseModelDecision', () => {
  test('accepts a grounded decision', () => {
    const response = modelResponse(true, ['src/changed.js']);
    return response.json().then(data => {
      expect(parseModelDecision(data, new Set(['src/changed.js']))).toEqual({
        requiresMetaImport: true,
        reason: 'Checked the changed behavior.',
        evidenceFiles: ['src/changed.js'],
      });
    });
  });

  test('rejects an ungrounded high-risk decision', () => {
    expect(() =>
      parseModelDecision(
        {
          output_text: JSON.stringify({
            requiresMetaImport: true,
            reason: 'Risky.',
            evidenceFiles: ['not-in-the-pr.js'],
          }),
        },
        new Set(['src/changed.js']),
      ),
    ).toThrow('invalid risk decision');
  });
});

describe('assessPullRequest', () => {
  test('classifies a low-risk JS change after the AI pass', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(modelResponse(false));
    expect(await assess([file('src/example.js')], fetchImpl)).toMatchObject({
      status: 'low',
      aiComplete: true,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.meta.ai/v1/responses',
      expect.objectContaining({
        headers: expect.objectContaining({Authorization: 'Bearer test-key'}),
      }),
    );
  });

  test('can escalate a workflow-only change when the model finds a concrete risk', async () => {
    const path = '.github/workflows/test-all.yml';
    expect(
      await assess([file(path)], async () => modelResponse(true, [path])),
    ).toMatchObject({status: 'high', aiComplete: true});
  });

  test('never downgrades a sensitive path based on model output', async () => {
    expect(
      await assess(
        [file('packages/react-native/ReactCommon/yoga/yoga/YGNode.cpp')],
        async () => modelResponse(false),
      ),
    ).toMatchObject({status: 'high', aiComplete: true});
  });

  test('honors a high-risk label on otherwise low-risk files', async () => {
    const labeled = {
      ...context,
      payload: {pull_request: {labels: [{name: 'high-risk'}]}},
    };
    expect(
      await assess(
        [file('README.md')],
        async () => modelResponse(false),
        labeled,
      ),
    ).toMatchObject({status: 'high', aiComplete: true});
  });

  test('requests review and reports incomplete coverage on model failure', async () => {
    expect(
      await assess([file('src/example.js')], async () => {
        throw new Error('Network failure');
      }),
    ).toEqual({status: 'unknown', aiComplete: false});
    expect(
      await assess([file('package.json')], async () => {
        throw new Error('Network failure');
      }),
    ).toEqual({status: 'high', aiComplete: false});
  });

  test('treats missing patches and capped file listings as incomplete', async () => {
    const fetchImpl = jest.fn();
    expect(
      await assess([file('image.png', {patch: undefined})], fetchImpl),
    ).toEqual({
      status: 'unknown',
      aiComplete: false,
    });
    expect(
      await assess(Array(3000).fill(file('README.md')), fetchImpl),
    ).toEqual({
      status: 'unknown',
      aiComplete: false,
    });
    expect(
      await assess([file('src/large.js', {changes: 500})], fetchImpl),
    ).toEqual({status: 'unknown', aiComplete: false});
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
