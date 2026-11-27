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
  test('only forces manifests and lockfiles', () => {
    const paths = [
      'package.json',
      'packages/react-native/package.json',
      'yarn.lock',
    ];
    expect(sensitivePaths(paths.map(path => file(path)))).toEqual(paths);
  });

  test('does not force native, Yoga, Hermes, JS, Markdown or workflow-only changes', () => {
    expect(
      sensitivePaths(
        [
          'packages/react-native/ReactAndroid/src/main/java/Module.java',
          'packages/react-native/ReactApple/React/Foo.mm',
          'packages/react-native/ReactCommon/react/renderer/core/ShadowNode.cpp',
          'packages/react-native/ReactCommon/yoga/yoga/YGNode.cpp',
          'packages/react-native/ReactCommon/hermes/executor/HermesExecutorFactory.cpp',
          'packages/react-native/sdks/hermes-engine/version.properties',
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
      trace: {
        model: 'muse-spark-1.2',
        forcedBy: [],
        decision: {
          requiresMetaImport: false,
          reason: 'Checked the changed behavior.',
          evidenceFiles: [],
        },
      },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.meta.ai/v1/responses',
      expect.objectContaining({
        headers: expect.objectContaining({Authorization: 'Bearer test-key'}),
      }),
    );
  });

  test('does not force a native-core typo when the AI sees no behavior change', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(modelResponse(false));
    const path = 'packages/react-native/ReactAndroid/src/main/java/Module.java';
    expect(
      await assess(
        [
          file(path, {
            patch: '@@ -1 +1 @@\n-// Lyaout\n+// Layout',
            changes: 2,
          }),
        ],
        fetchImpl,
      ),
    ).toMatchObject({status: 'low', aiComplete: true});
    expect(
      JSON.parse(fetchImpl.mock.calls[0][1].body).input[1].content,
    ).toContain('// Layout');
  });

  test('can escalate behavioral native-core edits based on the AI assessment', async () => {
    const path =
      'packages/react-native/ReactCommon/react/renderer/core/ShadowNode.cpp';
    expect(
      await assess([file(path)], async () => modelResponse(true, [path])),
    ).toMatchObject({status: 'high', aiComplete: true});
  });

  test('assesses Yoga and Hermes edits instead of forcing the label', async () => {
    const yoga = 'packages/react-native/ReactCommon/yoga/yoga/YGNode.cpp';
    const hermes =
      'packages/react-native/ReactCommon/hermes/executor/HermesExecutorFactory.cpp';
    expect(
      await assess([file(yoga)], async () => modelResponse(false)),
    ).toMatchObject({status: 'low', aiComplete: true});
    expect(
      await assess([file(hermes)], async () => modelResponse(true, [hermes])),
    ).toMatchObject({status: 'high', aiComplete: true});
  });

  test('can escalate a workflow-only change when the model finds a concrete risk', async () => {
    const path = '.github/workflows/test-all.yml';
    const result = await assess([file(path)], async () =>
      modelResponse(true, [path]),
    );
    expect(result).toMatchObject({
      status: 'high',
      aiComplete: true,
      trace: {
        forcedBy: [],
        decision: {
          requiresMetaImport: true,
          reason: 'Checked the changed behavior.',
          evidenceFiles: [path],
        },
      },
    });
    expect(JSON.stringify(result.trace)).not.toContain('test-key');
    expect(JSON.stringify(result.trace)).not.toContain('@@ -1 +1 @@');
  });

  test('never downgrades a sensitive path based on model output', async () => {
    expect(
      await assess([file('packages/react-native/package.json')], async () =>
        modelResponse(false),
      ),
    ).toMatchObject({
      status: 'high',
      aiComplete: true,
      trace: {forcedBy: ['packages/react-native/package.json']},
    });
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
    ).toMatchObject({
      status: 'unknown',
      aiComplete: false,
      trace: {failure: 'model_request_failed'},
    });
    expect(
      await assess([file('package.json')], async () => {
        throw new Error('Network failure');
      }),
    ).toMatchObject({
      status: 'high',
      aiComplete: false,
      trace: {
        failure: 'model_request_failed',
        forcedBy: ['package.json'],
      },
    });
  });

  test('records a safe failure category without logging the HTTP response', async () => {
    const result = await assess([file('src/example.js')], async () => ({
      ok: false,
      status: 429,
    }));
    expect(result).toMatchObject({
      status: 'unknown',
      aiComplete: false,
      trace: {failure: 'model_http_429'},
    });
  });

  test('does not expose invalid model output in the trace', async () => {
    const result = await assess([file('src/example.js')], async () => ({
      ok: true,
      json: async () => ({output_text: 'untrusted raw model output'}),
    }));
    expect(result).toMatchObject({
      status: 'unknown',
      aiComplete: false,
      trace: {failure: 'invalid_model_decision'},
    });
    expect(JSON.stringify(result.trace)).not.toContain('untrusted raw');
  });

  test('bounds the number of evidence paths in the trace', async () => {
    const paths = Array.from({length: 11}, (_, i) => `src/file${i}.js`);
    const result = await assess(
      paths.map(path => file(path)),
      async () => modelResponse(true, paths),
    );
    expect(result.trace.decision.evidenceFiles).toHaveLength(10);
    expect(result.trace.decision.evidenceFileCount).toBe(11);
  });

  test('treats missing patches and capped file listings as incomplete', async () => {
    const fetchImpl = jest.fn();
    expect(
      await assess([file('image.png', {patch: undefined})], fetchImpl),
    ).toMatchObject({
      status: 'unknown',
      aiComplete: false,
      trace: {failure: 'missing_or_incomplete_patch'},
    });
    expect(
      await assess(Array(3000).fill(file('README.md')), fetchImpl),
    ).toMatchObject({
      status: 'unknown',
      aiComplete: false,
      trace: {failure: 'file_list_capped'},
    });
    expect(
      await assess([file('src/large.js', {changes: 500})], fetchImpl),
    ).toMatchObject({
      status: 'unknown',
      aiComplete: false,
      trace: {failure: 'missing_or_incomplete_patch'},
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
