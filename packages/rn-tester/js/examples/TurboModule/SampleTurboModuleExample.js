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
import NativeSampleTurboModule, {
  EnumInt,
} from 'react-native/Libraries/TurboModule/samples/NativeSampleTurboModule';

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
  | 'getEnum'
  | 'getCustomEnum'
  | 'getCustomHostObject'
  | 'getBinaryTreeNode'
  | 'getGraphNode'
  | 'getNumEnum'
  | 'getStrEnum'
  | 'getMap'
  | 'getNumber'
  | 'getObject'
  | 'getRootTag'
  | 'getSet'
  | 'getString'
  | 'getUnion'
  | 'getUnsafeObject'
  | 'getValue'
  | 'getArrayBuffer'
  | 'createNativeBuffer'
  | 'processAsyncBuffer'
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
  | 'promiseAssert'
  | 'installJSIBindings';

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
    getArray: () =>
      NativeSampleTurboModule.getArray([
        {a: 1, b: 'foo'},
        {a: 2, b: 'bar'},
        null,
      ]),
    getArrayBuffer: () => {
      const input = new Uint8Array([1, 2, 3, 4]);
      const result = NativeSampleTurboModule.getArrayBuffer(input.buffer);
      // The native module mutates the bytes in place and returns the same buffer,
      // but a returned ArrayBuffer is always a new JS object. Whether it aliases
      // the input bytes depends on whether the platform lent them to native or
      // copied them.
      return {
        bytes: Array.from(new Uint8Array(result)),
        isSameObject: result === input.buffer,
        aliasesInput: Array.from(input).toString() === [2, 4, 6, 8].toString(),
      };
    },
    createNativeBuffer: () =>
      NativeSampleTurboModule.createNativeBuffer(8).byteLength,
    processAsyncBuffer: () =>
      NativeSampleTurboModule.processAsyncBuffer(
        new Uint8Array([1, 2, 3]).buffer,
      ).then(length => this._setResult('processAsyncBuffer', length)),
    getBool: () => NativeSampleTurboModule.getBool(true),
    getConstants: () => NativeSampleTurboModule.getConstants(),
    getEnum: () =>
      NativeSampleTurboModule.getEnum
        ? NativeSampleTurboModule.getEnum(EnumInt.A)
        : null,
    getNumber: () => NativeSampleTurboModule.getNumber(99.95),
    getObject: () =>
      NativeSampleTurboModule.getObject({a: 1, b: 'foo', c: null}),
    getRootTag: () => NativeSampleTurboModule.getRootTag(this.context),
    getString: () => NativeSampleTurboModule.getString('Hello'),
    getUnsafeObject: () =>
      NativeSampleTurboModule.getUnsafeObject({a: 1, b: 'foo', c: null}),
    getValue: () =>
      NativeSampleTurboModule.getValue(5, 'test', {a: 1, b: 'foo'}),
    promise: () =>
      NativeSampleTurboModule.getValueWithPromise(false).then(valuePromise =>
        this._setResult('promise', valuePromise),
      ),
    rejectPromise: () =>
      NativeSampleTurboModule.getValueWithPromise(true)
        .then(() => {})
        .catch(e => this._setResult('rejectPromise', e.message)),
    voidFunc: () => NativeSampleTurboModule.voidFunc(),
  };

  // $FlowFixMe[missing-local-annot]
  _errorTests = {
    voidFuncThrows: () => {
      try {
        NativeSampleTurboModule.voidFuncThrows?.();
      } catch (e) {
        return e.message;
      }
    },
    getObjectThrows: () => {
      try {
        NativeSampleTurboModule.getObjectThrows?.({a: 1, b: 'foo', c: null});
      } catch (e) {
        return e.message;
      }
    },
    promiseThrows: () =>
      NativeSampleTurboModule.promiseThrows?.()
        .then(() => {})
        .catch(e => this._setResult('promiseThrows', e.message)),
    voidFuncAssert: () => {
      try {
        NativeSampleTurboModule.voidFuncAssert?.();
      } catch (e) {
        return e.message;
      }
    },
    getObjectAssert: () => {
      try {
        NativeSampleTurboModule.getObjectAssert?.({a: 1, b: 'foo', c: null});
      } catch (e) {
        return e.message;
      }
    },
    promiseAssert: () =>
      NativeSampleTurboModule.promiseAssert?.()
        .then(() => {})
        .catch(e => this._setResult('promiseAssert', e.message)),
    installJSIBindings: () => global.__SampleTurboModuleJSIBindings,
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
      testResults: {
        ...testResults,
        /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb)
         * This comment suppresses an error found when Flow v0.111 was
         * deployed. To see the error, delete this comment and run Flow. */
        [name]: {value: result, type: typeof result},
      },
    }));
  }

  _renderResult(name: Examples | ErrorExamples): React.Node {
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
              Run function call tests
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
