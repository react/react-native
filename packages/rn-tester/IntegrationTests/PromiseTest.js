/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import * as React from 'react';
import {useEffect, useRef} from 'react';
import {NativeModules, View} from 'react-native';

const {TestModule} = NativeModules;

function PromiseTest(): React.Node {
  const shouldResolve = useRef(false);
  const shouldReject = useRef(false);
  const shouldSucceedAsync = useRef(false);
  const shouldThrowAsync = useRef(false);

  const testShouldResolve = () => {
    return TestModule.shouldResolve()
      .then(() => {
        shouldResolve.current = true;
      })
      .catch(() => {
        shouldResolve.current = false;
      });
  };

  const testShouldReject = () => {
    return TestModule.shouldReject()
      .then(() => {
        shouldReject.current = false;
      })
      .catch(() => {
        shouldReject.current = true;
      });
  };

  const testShouldSucceedAsync = async () => {
    try {
      await TestModule.shouldResolve();
      shouldSucceedAsync.current = true;
    } catch (e) {
      shouldSucceedAsync.current = false;
    }
  };

  const testShouldThrowAsync = async () => {
    try {
      await TestModule.shouldReject();
      shouldThrowAsync.current = false;
    } catch (e) {
      shouldThrowAsync.current = true;
    }
  };

  useEffect(() => {
    async function runTests() {
      await Promise.all([
        testShouldResolve(),
        testShouldReject(),
        testShouldSucceedAsync(),
        testShouldThrowAsync(),
      ]);

      TestModule.markTestPassed(
        shouldResolve.current &&
          shouldReject.current &&
          shouldSucceedAsync.current &&
          shouldThrowAsync.current,
      );
    }

    runTests().catch(console.error);
  }, []);

  return <View />;
}

export default PromiseTest;
