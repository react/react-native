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
import type {ExtendedExceptionData} from '../parseLogBoxLog';

const {parseLogBoxException, parseLogBoxLog} = require('../parseLogBoxLog');

describe('parseLogBoxLog', () => {
  describe('Handles component stack frames formatted as call stacks in JSC', () => {
    // In new versions of React, the component stack frame format changed to match call stacks.
    it('detects a component stack in an interpolated warning', () => {
      expect(
        parseLogBoxLog([
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s%s',
          '\n\nCheck the render method of `MyComponent`.',
          '\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStack: [
          {
            arguments: [],
            methodName: 'MyComponent',
            file: '/path/to/filename.js',
            lineNumber: 1,
            column: 1,
          },
          {
            arguments: [],
            methodName: 'forEach',
            file: '[native code]',
            lineNumber: null,
            column: null,
          },
          {
            arguments: [],
            methodName: 'MyAppComponent',
            file: '/path/to/app.js',
            lineNumber: 100,
            column: 19,
          },
        ],
        category:
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?﻿%s',
        message: {
          content:
            'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?\n\nCheck the render method of `MyComponent`.',
          substitutions: [
            {
              length: 43,
              offset: 120,
            },
          ],
        },
      });
    });

    it('detects a component stack in the first argument', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStack: [
          {
            arguments: [],
            methodName: 'MyComponent',
            file: '/path/to/filename.js',
            lineNumber: 1,
            column: 1,
          },
          {
            arguments: [],
            methodName: 'forEach',
            file: '[native code]',
            lineNumber: null,
            column: null,
          },
          {
            arguments: [],
            methodName: 'MyAppComponent',
            file: '/path/to/app.js',
            lineNumber: 100,
            column: 19,
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack for ts, tsx, jsx, and js files', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message\nMyTSComponent@/path/to/MyTSComponent.ts:1:1\nMyTSXComponent@/path/to/MyTSXComponent.tsx:2:1\nMyJSXComponent@/path/to/MyJSXComponent.jsx:3:1\nMyJSComponent@/path/to/MyJSComponent.js:4:1',
        ]),
      ).toEqual({
        componentStack: [
          {
            arguments: [],
            methodName: 'MyTSComponent',
            file: '/path/to/MyTSComponent.ts',
            lineNumber: 1,
            column: 0,
          },
          {
            arguments: [],
            methodName: 'MyTSXComponent',
            file: '/path/to/MyTSXComponent.tsx',
            lineNumber: 2,
            column: 0,
          },
          {
            arguments: [],
            methodName: 'MyJSXComponent',
            file: '/path/to/MyJSXComponent.jsx',
            lineNumber: 3,
            column: 0,
          },
          {
            arguments: [],
            methodName: 'MyJSComponent',
            file: '/path/to/MyJSComponent.js',
            lineNumber: 4,
            column: 0,
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the second argument', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message',
          '\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStack: [
          {
            arguments: [],
            methodName: 'MyComponent',
            file: '/path/to/filename.js',
            lineNumber: 1,
            column: 1,
          },
          {
            arguments: [],
            methodName: 'forEach',
            file: '[native code]',
            lineNumber: null,
            column: null,
          },
          {
            arguments: [],
            methodName: 'MyAppComponent',
            file: '/path/to/app.js',
            lineNumber: 100,
            column: 19,
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the nth argument', () => {
      expect(
        parseLogBoxLog([
          'Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.%s',
          '\n\nCheck the render method of `MyOtherComponent`.',
          '',
          '\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStack: [
          {
            arguments: [],
            methodName: 'MyComponent',
            file: '/path/to/filename.js',
            lineNumber: 1,
            column: 1,
          },
          {
            arguments: [],
            methodName: 'forEach',
            file: '[native code]',
            lineNumber: null,
            column: null,
          },
          {
            arguments: [],
            methodName: 'MyAppComponent',
            file: '/path/to/app.js',
            lineNumber: 100,
            column: 19,
          },
        ],
        category:
          'Each child in a list should have a unique "key" prop.﻿%s﻿%s See https://fb.me/react-warning-keys for more information.',
        message: {
          content:
            'Each child in a list should have a unique "key" prop.\n\nCheck the render method of `MyOtherComponent`. See https://fb.me/react-warning-keys for more information.',
          substitutions: [
            {
              length: 48,
              offset: 53,
            },
            {
              length: 0,
              offset: 101,
            },
          ],
        },
      });
    });

    it('parses an error log with `error.componentStack`', () => {
      const error: ExtendedExceptionData = {
        id: 0,
        isFatal: false,
        isComponentError: false,
        message: '### Error',
        originalMessage: '### Error',
        name: '',
        componentStack:
          '\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      };

      expect(parseLogBoxException(error)).toEqual({
        level: 'error',
        category: '### Error',
        isComponentError: false,
        message: {
          content: '### Error',
          substitutions: [],
        },
        componentStack: [
          {
            arguments: [],
            methodName: 'MyComponent',
            file: '/path/to/filename.js',
            lineNumber: 1,
            column: 1,
          },
          {
            arguments: [],
            methodName: 'forEach',
            file: '[native code]',
            lineNumber: null,
            column: null,
          },
          {
            arguments: [],
            methodName: 'MyAppComponent',
            file: '/path/to/app.js',
            lineNumber: 100,
            column: 19,
          },
        ],
        extraData: undefined,
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      });
    });

    it('parses an error log with a component stack in the message', () => {
      const error: ExtendedExceptionData = {
        id: 0,
        isFatal: false,
        isComponentError: false,
        message:
          'Some kind of message\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        originalMessage:
          'Some kind of message\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        name: '',
        componentStack: null,
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      };
      expect(parseLogBoxException(error)).toEqual({
        level: 'error',
        isComponentError: false,
        stack: [
          {
            collapse: false,
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
          },
        ],
        componentStack: [
          {
            arguments: [],
            methodName: 'MyComponent',
            file: '/path/to/filename.js',
            lineNumber: 1,
            column: 1,
          },
          {
            arguments: [],
            methodName: 'forEach',
            file: '[native code]',
            lineNumber: null,
            column: null,
          },
          {
            arguments: [],
            methodName: 'MyAppComponent',
            file: '/path/to/app.js',
            lineNumber: 100,
            column: 19,
          },
        ],
        extraData: undefined,
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });
  });
});
