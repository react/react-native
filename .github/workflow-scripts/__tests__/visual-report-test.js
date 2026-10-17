/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {
  APPROVAL_LABEL,
  differenceFingerprint,
  gateDecision,
} = require('../visual/approval');
const {environmentKey, sha256} = require('../visual/manifest');
const {
  COMMENT_MARKER,
  renderCheckOutput,
  renderPullRequestComment,
} = require('../visual/report');
const {
  approvalKey,
  baselinePrefix,
  publicUrl,
  reportPrefix,
} = require('../visual/storage');
const {SHA_A, SHA_B} = require('./__fixtures__/visual');

describe('visual reports and approval', () => {
  describe('storage keys', () => {
    test('builds write-once keys', () => {
      expect(baselinePrefix('ios-x-0123abcd', SHA_A)).toBe(
        `baselines/ios-x-0123abcd/${SHA_A}`,
      );
      expect(
        reportPrefix({prNumber: 12, headSha: SHA_A, runId: 34, runAttempt: 2}),
      ).toBe(`reports/pull/12/${SHA_A}/34-2`);
      expect(
        reportPrefix({
          prNumber: null,
          headSha: SHA_A,
          runId: 34,
          runAttempt: 1,
        }),
      ).toBe(`reports/main/${SHA_A}/34-1`);
      expect(approvalKey(12, '0123456789abcdef')).toBe(
        'approvals/pull/12/0123456789abcdef.json',
      );
    });

    test.each([
      [() => baselinePrefix('k', 'main')],
      [
        () =>
          reportPrefix({prNumber: -1, headSha: SHA_A, runId: 1, runAttempt: 1}),
      ],
      [
        () =>
          reportPrefix({
            prNumber: 1,
            headSha: SHA_A,
            runId: 1.5,
            runAttempt: 1,
          }),
      ],
      [() => approvalKey(1, '../x')],
    ])('rejects invalid input', build => {
      expect(build).toThrow('Invalid');
    });

    test('encodes each path segment of public URLs', () => {
      expect(publicUrl('https://cdn.example/bucket/', 'a b/c#d.png')).toBe(
        'https://cdn.example/bucket/a%20b/c%23d.png',
      );
    });
  });

  describe('approval', () => {
    const platform = results => ({
      platform: 'ios',
      environmentKey: 'ios-x-0123abcd',
      baselineSha: SHA_B,
      results,
    });
    const changed = sha => ({
      id: 'a/b/c',
      status: 'changed',
      expected: {sha256: 'e'},
      captured: {sha256: sha},
    });

    test('has no fingerprint without differences', () => {
      expect(
        differenceFingerprint([platform([{id: 'a/b/c', status: 'unchanged'}])]),
      ).toBeNull();
    });

    test('fingerprints the exact captured images', () => {
      const first = differenceFingerprint([platform([changed('1')])]);
      expect(first).toMatch(/^[0-9a-f]{16}$/);
      expect(differenceFingerprint([platform([changed('1')])])).toBe(first);
      expect(differenceFingerprint([platform([changed('2')])])).not.toBe(first);
    });

    test.each([
      [null, false, null, 'success', false],
      ['f', false, null, 'failure', false],
      ['f', true, {fingerprint: 'f', approver: 'x'}, 'success', false],
      ['f', true, {fingerprint: 'g', approver: 'x'}, 'failure', true],
      ['f', true, null, 'failure', true],
    ])(
      'gate for fingerprint %s, label %s, approval %j',
      (fingerprint, labelPresent, approval, conclusion, staleLabel) => {
        const decision = gateDecision({fingerprint, labelPresent, approval});
        expect(decision.conclusion).toBe(conclusion);
        expect(decision.staleLabel ?? false).toBe(staleLabel);
        if (conclusion === 'failure' && !staleLabel) {
          expect(decision.summary).toContain(APPROVAL_LABEL);
        }
      },
    );
  });

  describe('renderPullRequestComment', () => {
    const changed = id => ({
      id,
      status: 'changed',
      diffPixels: 3,
      diffRatio: 0.03,
      expected: {},
      captured: {},
      hasDiffImage: true,
    });
    const platform = (name, results, error = null) => ({
      platform: name,
      environmentKey: `${name}-x-0123abcd`,
      baseline: {sha: SHA_B, distance: 0},
      results,
      error,
      checkUrl: `https://github.example/checks/${name}`,
      imageUrl: (kind, id) => `https://cdn.example/${name}/${kind}/${id}.png`,
    });

    test('shows each diff with expected and captured collapsed', () => {
      const body = renderPullRequestComment({
        platforms: [
          platform('android', [
            {id: 'a/b/same', status: 'unchanged'},
            changed('a/b/changed'),
          ]),
          platform('ios', [{id: 'a/b/new', status: 'added', captured: {}}]),
        ],
        headSha: SHA_A,
        gateSummary: 'Needs approval.',
      });
      expect(body.startsWith(COMMENT_MARKER)).toBe(true);
      expect(body).toContain(
        '**2 visual difference(s)** at `aaaaaaaaaaaa`. Needs approval.',
      );
      expect(body).toContain(
        '### android `a/b/changed`: Changed, 3 px (3.000%)',
      );
      expect(body).toContain(
        '<img src="https://cdn.example/android/diff/a/b/changed.png" width="360" alt="diff">',
      );
      expect(body).toContain(
        '<details><summary>Expected and Captured</summary>',
      );
      expect(body).toContain('### ios `a/b/new`: New');
      expect(body).toContain('<details open><summary>Captured</summary>');
      expect(body).not.toContain('a/b/same');
    });

    test('lists tests beyond the limit by name', () => {
      const results = Array.from({length: 23}, (_, index) =>
        changed(`a/b/test-${String(index).padStart(2, '0')}`),
      );
      const body = renderPullRequestComment({
        platforms: [platform('android', results)],
        headSha: SHA_A,
        gateSummary: '',
      });
      expect(body).toContain('3 more:');
      expect(body).toContain(
        '- android `a/b/test-22`: Changed, 3 px (3.000%), [check run](https://github.example/checks/android)',
      );
      expect(body).not.toContain('android/diff/a/b/test-20.png');
    });

    test('reports errors and the absence of differences', () => {
      const body = renderPullRequestComment({
        platforms: [
          platform('android', [{id: 'a/b/same', status: 'unchanged'}]),
          platform('ios', [], {title: 'no baseline for this environment'}),
        ],
        headSha: SHA_A,
        gateSummary: 'No visual differences.',
      });
      expect(body).toContain('No visual differences at `aaaaaaaaaaaa`.');
      expect(body).toContain(
        '**ios:** [no baseline for this environment](https://github.example/checks/ios)',
      );
    });
  });

  describe('renderCheckOutput', () => {
    test('links expected, captured and diff images for each difference', () => {
      const output = renderCheckOutput({
        platform: 'android',
        environmentKey: 'android-x-0123abcd',
        baseline: {sha: SHA_B, distance: 2},
        results: [
          {id: 'a/b/same', status: 'unchanged'},
          {
            id: 'a/b/changed',
            status: 'changed',
            diffPixels: 3,
            diffRatio: 0.03,
            expected: {},
            captured: {},
            hasDiffImage: true,
          },
        ],
        imageUrl: (kind, id) => `https://cdn.example/${kind}/${id}.png`,
        error: null,
      });
      expect(output.title).toBe('android: 1 visual difference(s)');
      expect(output.summary).toContain('2 commit(s) earlier');
      expect(output.text).toContain(
        'https://cdn.example/expected/a/b/changed.png',
      );
      expect(output.text).toContain(
        'https://cdn.example/captured/a/b/changed.png',
      );
      expect(output.text).toContain('3 px (3.000%)');
      expect(output.images).toEqual([
        expect.objectContaining({
          image_url: 'https://cdn.example/diff/a/b/changed.png',
        }),
      ]);
    });
  });
});
