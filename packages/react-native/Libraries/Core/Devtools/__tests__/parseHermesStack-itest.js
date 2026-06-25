/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

const parseHermesStack = require('../parseHermesStack').default;

describe('parseHermesStack', () => {
  test('bytecode location', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at global (address at unknown:1:9)',
          '    at foo$bar (address at /js/foo.hbc:10:1234)',
        ].join('\n'),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "entries": Array [
          Object {
            "functionName": "global",
            "location": Object {
              "line1Based": 1,
              "sourceUrl": "unknown",
              "type": "BYTECODE",
              "virtualOffset0Based": 9,
            },
            "type": "FRAME",
          },
          Object {
            "functionName": "foo$bar",
            "location": Object {
              "line1Based": 10,
              "sourceUrl": "/js/foo.hbc",
              "type": "BYTECODE",
              "virtualOffset0Based": 1234,
            },
            "type": "FRAME",
          },
        ],
        "message": "TypeError: undefined is not a function",
      }
    `);
  });

  test('internal bytecode location', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at internal (address at InternalBytecode.js:1:9)',
          '    at notInternal (address at /js/InternalBytecode.js:10:1234)',
        ].join('\n'),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "entries": Array [
          Object {
            "functionName": "internal",
            "location": Object {
              "line1Based": 1,
              "sourceUrl": "InternalBytecode.js",
              "type": "INTERNAL_BYTECODE",
              "virtualOffset0Based": 9,
            },
            "type": "FRAME",
          },
          Object {
            "functionName": "notInternal",
            "location": Object {
              "line1Based": 10,
              "sourceUrl": "/js/InternalBytecode.js",
              "type": "BYTECODE",
              "virtualOffset0Based": 1234,
            },
            "type": "FRAME",
          },
        ],
        "message": "TypeError: undefined is not a function",
      }
    `);
  });

  test('source location', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at global (unknown:1:9)',
          '    at foo$bar (/js/foo.js:10:1234)',
        ].join('\n'),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "entries": Array [
          Object {
            "functionName": "global",
            "location": Object {
              "column1Based": 9,
              "line1Based": 1,
              "sourceUrl": "unknown",
              "type": "SOURCE",
            },
            "type": "FRAME",
          },
          Object {
            "functionName": "foo$bar",
            "location": Object {
              "column1Based": 1234,
              "line1Based": 10,
              "sourceUrl": "/js/foo.js",
              "type": "SOURCE",
            },
            "type": "FRAME",
          },
        ],
        "message": "TypeError: undefined is not a function",
      }
    `);
  });

  test('tolerate empty filename', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at global (unknown:1:9)',
          '    at foo$bar (:10:1234)',
        ].join('\n'),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "entries": Array [
          Object {
            "functionName": "global",
            "location": Object {
              "column1Based": 9,
              "line1Based": 1,
              "sourceUrl": "unknown",
              "type": "SOURCE",
            },
            "type": "FRAME",
          },
          Object {
            "functionName": "foo$bar",
            "location": Object {
              "column1Based": 1234,
              "line1Based": 10,
              "sourceUrl": "",
              "type": "SOURCE",
            },
            "type": "FRAME",
          },
        ],
        "message": "TypeError: undefined is not a function",
      }
    `);
  });

  test('skipped frames', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at global (unknown:1:9)',
          '    ... skipping 50 frames',
          '    at foo$bar (/js/foo.js:10:1234)',
        ].join('\n'),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "entries": Array [
          Object {
            "functionName": "global",
            "location": Object {
              "column1Based": 9,
              "line1Based": 1,
              "sourceUrl": "unknown",
              "type": "SOURCE",
            },
            "type": "FRAME",
          },
          Object {
            "count": 50,
            "type": "SKIPPED",
          },
          Object {
            "functionName": "foo$bar",
            "location": Object {
              "column1Based": 1234,
              "line1Based": 10,
              "sourceUrl": "/js/foo.js",
              "type": "SOURCE",
            },
            "type": "FRAME",
          },
        ],
        "message": "TypeError: undefined is not a function",
      }
    `);
  });

  test('ignore frames that are part of message', () => {
    expect(
      parseHermesStack(
        [
          'The next line is not a stack frame',
          '    at bogus (filename:1:2)',
          '    but the real stack trace follows below.',
          '    at foo$bar (/js/foo.js:10:1234)',
        ].join('\n'),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "entries": Array [
          Object {
            "functionName": "foo$bar",
            "location": Object {
              "column1Based": 1234,
              "line1Based": 10,
              "sourceUrl": "/js/foo.js",
              "type": "SOURCE",
            },
            "type": "FRAME",
          },
        ],
        "message": "The next line is not a stack frame
          at bogus (filename:1:2)
          but the real stack trace follows below.",
      }
    `);
  });
});
