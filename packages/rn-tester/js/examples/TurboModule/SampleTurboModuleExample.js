/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventSubscription, RootTag} from 'react-native';

import RNTesterText from '../../components/RNTesterText';
import styles from './TurboModuleExampleCommon';
import * as React from 'react';
import {FlatList, RootTagContext, TouchableOpacity, View} from 'react-native';
import NativeSampleTurboModule from 'react-native/Libraries/TurboModule/samples/NativeSampleTurboModule';
import {EnumInt} from 'react-native/Libraries/TurboModule/samples/NativeSampleTurboModule';

type State = {
  testResults: {
    [string]: {
      type: string,
      value: unknown,
      ...
    },
    ...
  },
};

type Examples =
  | 'callback'
  | 'getArray'
  | 'getBool'
  | 'getConstants'
  | 'getCustomEnum'
  | 'getCustomHostObject'
  | 'getBinaryTreeNode'
  | 'getGraphNode'
  | 'getNumEnum'
  | 'getStrEnum'
  | 'getMap'
  | 'getNumber'
  | 'getObject'
  | 'getSet'
  | 'getString'
  | 'getUnion'
  | 'getValue'
  | 'promise'
  | 'rejectPromise'
  | 'voidFunc'
  | 'setMenuItem'
  | 'optionalArgs'
  | 'emitDeviceEvent';

type ErrorExamples =
  | 'voidFuncThrows'
  | 'getObjectThrows'
  | 'promiseThrows'
  | 'voidFuncAssert'
  | 'getObjectAssert'
  | 'promiseAssert';

class SampleTurboModuleExample extends React.Component<{}, State> {
  static contextType: React.Context<RootTag> = RootTagContext;
  eventSubscriptions: EventSubscription[] = [];

  state: State = {
    testResults: {},
  };

  // Add calls to methods in TurboModule here
  // $FlowFixMe[missing-local-annot]
  _tests = {
    callback: () =>
      NativeSampleTurboModule.getValueWithCallback(callbackValue =>
        this._setResult('callback', callbackValue),
      ),
    promise: () =>
      NativeSampleTurboModule.getValueWithPromise(false).then(valuePromise =>
        this._setResult('promise', valuePromise),
      ),
    rejectPromise: () =>
      NativeSampleTurboModule.getValueWithPromise(true)
        .then(() => {})
        .catch(e => {
          this._setResult('rejectPromise', e.message);
        }),
    getConstants: () => NativeSampleTurboModule.getConstants(),
    voidFunc: () => NativeSampleTurboModule.voidFunc(),
    getBool: () => NativeSampleTurboModule.getBool(true),
    getEnum: () =>
      NativeSampleTurboModule.getEnum
        ? NativeSampleTurboModule.getEnum(EnumInt.A)
        : null,
    getNumber: () => NativeSampleTurboModule.getNumber(99.95),
    getString: () => NativeSampleTurboModule.getString('Hello'),
    getArray: () =>
      NativeSampleTurboModule.getArray([
        {a: 1, b: 'foo'},
        {a: 2, b: 'bar'},
        null,
      ]),
    getObject: () =>
      NativeSampleTurboModule.getObject({a: 1, b: 'foo', c: null}),
    getUnsafeObject: () =>
      NativeSampleTurboModule.getObject({a: 1, b: 'foo', c: null}),
    getRootTag: () => NativeSampleTurboModule.getRootTag(this.context),
    getValue: () =>
      NativeSampleTurboModule.getValue(5, 'test', {a: 1, b: 'foo'}),
  };

  // $FlowFixMe[missing-local-annot]
  _errorTests = {
    voidFuncThrows: () => {
      try {
        NativeSampleTurboModule.voidFuncThrows?.();
      } catch (e) {
        console.error(e);
        return e.message;
      }
    },
    getObjectThrows: () => {
      try {
        NativeSampleTurboModule.getObjectThrows?.({a: 1, b: 'foo', c: null});
      } catch (e) {
        console.error(e);
        return e.message;
      }
    },
    promiseThrows: () => {
      NativeSampleTurboModule.promiseThrows?.()
        .then(() => {})
        .catch(e => {
          console.error(e);
        });
    },
    voidFuncAssert: () => {
      try {
        NativeSampleTurboModule.voidFuncAssert?.();
      } catch (e) {
        console.error(e);
        return e.message;
      }
    },
    getObjectAssert: () => {
      try {
        NativeSampleTurboModule.getObjectAssert?.({a: 1, b: 'foo', c: null});
      } catch (e) {
        console.error(e);
        return e.message;
      }
    },
    promiseAssert: () => {
      NativeSampleTurboModule.promiseAssert?.()
        .then(() => {})
        .catch(e => {
          console.error(e);
        });
    },
    installJSIBindings: () => {
      return global.__SampleTurboModuleJSIBindings;
    },
  };

  _setResult(
    name: Examples | ErrorExamples,
    result:
      | $FlowFixMe
      | void
      | RootTag
      | Promise<unknown>
      | number
      | string
      | boolean
      | {const1: boolean, const2: number, const3: string}
      | Array<$FlowFixMe>,
  ) {
    this.setState(({testResults}) => ({
      /* $FlowFixMe[cannot-spread-indexer] (>=0.122.0 site=react_native_fb)
       * This comment suppresses an error found when Flow v0.122.0 was
       * deployed. To see the error, delete this comment and run Flow. */
      testResults: {
        ...testResults,
        /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb)
         * This comment suppresses an error found when Flow v0.111 was
         * deployed. To see the error, delete this comment and run Flow. */
        [name]: {value: result, type: typeof result},
      },
    }));
  }

  _renderResult(name: string): React.Node {
    const result = this.state.testResults[name] || {};
    return (
      <View style={styles.result}>
        <RNTesterText style={[styles.value]}>
          {JSON.stringify(result.value)}
        </RNTesterText>
        <RNTesterText style={[styles.type]}>{result.type}</RNTesterText>
      </View>
    );
  }

  componentDidMount(): void {
    if (global.__turboModuleProxy == null && global.RN$Bridgeless == null) {
      throw new Error(
        'Cannot load this example because TurboModule is not configured.',
      );
    }

    // Lazily load the module
    NativeSampleTurboModule.getConstants();
    if (global.__SampleTurboModuleJSIBindings !== 'Hello JSI!') {
      throw new Error(
        'The JSI bindings for SampleTurboModule are not installed.',
      );
    }
    this.eventSubscriptions.push(
      NativeSampleTurboModule.onPress(value => console.log('onPress: ()')),
    );
    this.eventSubscriptions.push(
      NativeSampleTurboModule.onClick(value =>
        console.log(`onClick: (${value})`),
      ),
    );
    this.eventSubscriptions.push(
      NativeSampleTurboModule.onChange(value =>
        console.log(`onChange: (${JSON.stringify(value)})`),
      ),
    );
    this.eventSubscriptions.push(
      NativeSampleTurboModule.onSubmit(value =>
        console.log(`onSubmit: (${JSON.stringify(value)})`),
      ),
    );
  }

  componentWillUnmount() {
    for (const subscription of this.eventSubscriptions) {
      subscription.remove();
    }
  }

  render(): React.Node {
    return (
      <View style={styles.container}>
        <View style={styles.item}>
          <TouchableOpacity
            style={[styles.column, styles.button]}
            onPress={() =>
              Object.keys(this._tests).forEach(item =>
                // $FlowFixMe[incompatible-type]
                this._setResult(item, this._tests[item]()),
              )
            }>
            <RNTesterText style={styles.buttonTextLarge}>
              Run all tests
            </RNTesterText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.setState({testResults: {}})}
            style={[styles.column, styles.button]}>
            <RNTesterText style={styles.buttonTextLarge}>
              Clear results
            </RNTesterText>
          </TouchableOpacity>
        </View>
        <FlatList
          // $FlowFixMe[incompatible-type]
          data={Object.keys(this._tests)}
          keyExtractor={item => item}
          renderItem={({item}: {item: Examples, ...}) => (
            <View style={styles.item}>
              <TouchableOpacity
                style={[styles.column, styles.button]}
                onPress={e => this._setResult(item, this._tests[item]())}>
                <RNTesterText style={styles.buttonText}>{item}</RNTesterText>
              </TouchableOpacity>
              <View style={[styles.column]}>{this._renderResult(item)}</View>
            </View>
          )}
        />
        <View style={styles.item}>
          <RNTesterText style={styles.buttonTextLarge}>
            Report errors tests
          </RNTesterText>
        </View>
        <FlatList
          // $FlowFixMe[incompatible-type]
          data={Object.keys(this._errorTests)}
          keyExtractor={item => item}
          renderItem={({item}: {item: ErrorExamples, ...}) => (
            <View style={styles.item}>
              <TouchableOpacity
                style={[styles.column, styles.button]}
                onPress={e => this._setResult(item, this._errorTests[item]())}>
                <RNTesterText style={styles.buttonText}>{item}</RNTesterText>
              </TouchableOpacity>
              <View style={[styles.column]}>{this._renderResult(item)}</View>
            </View>
          )}
        />
      </View>
    );
  }
}

module.exports = SampleTurboModuleExample;
