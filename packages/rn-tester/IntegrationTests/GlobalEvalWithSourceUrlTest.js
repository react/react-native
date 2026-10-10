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

import * as React from 'react';
import {useEffect} from 'react';
import {NativeModules, View} from 'react-native';

const {TestModule} = NativeModules;

type ErrorWithEngine = Error &
  interface {
    jsEngine?: string,
  };

function getFirstStackFrameFile(stack?: string): ?string {
  if (stack == null) {
    return null;
  }
  for (const line of stack.split('\n')) {
    const match = line.match(/(?:\(|@|\s)(https?:\/\/.*?):\d+:\d+\)?$/);
    if (match != null) {
      return match[1];
    }
  }
  return null;
}

function GlobalEvalWithSourceUrlTest(): React.Node {
  useEffect(() => {
    if (typeof global.globalEvalWithSourceUrl !== 'function') {
      throw new Error(
        'Expected to find globalEvalWithSourceUrl function on global object but found ' +
          typeof global.globalEvalWithSourceUrl,
      );
    }
    const value = global.globalEvalWithSourceUrl('42');
    if (value !== 42) {
      throw new Error(
        'Expected globalEvalWithSourceUrl(expression) to return a value',
      );
    }
    let syntaxError: ?ErrorWithEngine;
    try {
      global.globalEvalWithSourceUrl('{');
    } catch (e) {
      syntaxError = e;
    }
    if (!syntaxError) {
      throw new Error(
        'Expected globalEvalWithSourceUrl to throw on a syntax error',
      );
    }
    // Hermes throws an Error instead of a SyntaxError
    // https://github.com/facebook/hermes/issues/400
    if (
      syntaxError.jsEngine !== 'hermes' &&
      !(syntaxError instanceof SyntaxError)
    ) {
      throw new Error(
        'Expected globalEvalWithSourceUrl to throw SyntaxError on a syntax error',
      );
    }
    const url = 'http://example.com/foo.js';
    let error;
    try {
      global.globalEvalWithSourceUrl('throw new Error()', url);
    } catch (e) {
      error = e;
    }
    if (!error) {
      throw new Error(
        'Expected globalEvalWithSourceUrl to throw an Error object',
      );
    }
    const firstStackFrameFile = getFirstStackFrameFile(error.stack);
    if (firstStackFrameFile !== url) {
      throw new Error(
        `Expected first eval stack frame to be in ${url} but found ${String(firstStackFrameFile)}`,
      );
    }
    TestModule.markTestCompleted();
  }, []);

  return <View />;
}

export default GlobalEvalWithSourceUrlTest;
