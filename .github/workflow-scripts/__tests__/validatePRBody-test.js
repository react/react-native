/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const validatePRBody = require('../validatePRBody');

function prBody(changelog) {
  return `## Summary

Explain why the change is needed.

${changelog}

## Test Plan

Run the unit tests.`;
}

describe('validatePRBody changelog headings', () => {
  it.each(['## Changelog', '## Changelog:'])(
    'accepts %s with a tagged entry',
    heading => {
      expect(
        validatePRBody(prBody(`${heading}\n\n[GENERAL] [FIXED] - Fix a bug`)),
      ).toEqual({message: '', status: 'PASS'});
    },
  );

  it('accepts a heading without a colon with CRLF line endings', () => {
    const body = prBody('## Changelog\n\n[INTERNAL] [FIXED] - Fix CI');
    expect(validatePRBody(body.replace(/\n/g, '\r\n'))).toEqual({
      message: '',
      status: 'PASS',
    });
  });

  it('accepts consecutive internal changelogs consistently', () => {
    const body = prBody('## Changelog\n\n[INTERNAL] [FIXED] - Fix CI');
    expect(validatePRBody(body).status).toBe('PASS');
    expect(validatePRBody(body).status).toBe('PASS');
  });

  it('still requires a tagged entry', () => {
    expect(validatePRBody(prBody('## Changelog\n\nNo tags')).message).toContain(
      'Invalid Changelog Format',
    );
  });

  it('does not treat an unmarked Changelog line as a heading', () => {
    expect(
      validatePRBody(prBody('Changelog\n\n[GENERAL] [FIXED] - Fix a bug'))
        .message,
    ).toContain('Missing Changelog');
  });
});
