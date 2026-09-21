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
  | 'getStringRoundTrip'
  | 'getStringControlChars'
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

const STRING_ROUND_TRIP_ROUNDS = 200;
const STRING_ROUND_TRIP_INPUTS = [
  '',
  'a',
  'hello',
  'h\u00e9llo \u00e7\u00e3\u00f5',
  '\u65e5\u672c\u8a9e\u30c6\u30ad\u30b9\u30c8',
  '\u041f\u0440\u0438\u0432\u0435\u0442',
  '\u0645\u0631\u062d\u0628\u0627',
  '\ud83d\ude00',
  '\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66',
  '\ud83c\uddee\ud83c\uddf3',
  'e\u0301',
  'x'.repeat(255),
  'x'.repeat(256),
  'x'.repeat(257),
  '\ud83d\ude00'.repeat(200),
  'x'.repeat(5000),
  '\u65e5'.repeat(100000),
];

// Kept out of the Maestro-driven test: the demo Toast shows the input and
// uiautomator cannot serialize NUL or lone surrogates.
const CONTROL_CHAR_INPUTS = ['\ud800', '\udc00x', 'a\u0000b'];

function randomUnicodeString(): string {
  let out = '';
  const length = Math.floor(Math.random() * 3000);
  for (let i = 0; i < length; i++) {
    const kind = Math.random();
    const codePoint =
      kind < 0.4
        ? 32 + Math.floor(Math.random() * 95)
        : kind < 0.6
          ? 0x80 + Math.floor(Math.random() * 0x780)
          : kind < 0.8
            ? 0x1000 + Math.floor(Math.random() * 0xc000)
            : 0x1f300 + Math.floor(Math.random() * 0x300);
    out += String.fromCodePoint(codePoint);
  }
  return out;
}

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
    getStringRoundTrip: () => {
      const expected =
        STRING_ROUND_TRIP_ROUNDS * (STRING_ROUND_TRIP_INPUTS.length + 2);
      let pass = 0;
      let failure = '';
      for (let round = 0; round < STRING_ROUND_TRIP_ROUNDS; round++) {
        const inputs = [
          ...STRING_ROUND_TRIP_INPUTS,
          randomUnicodeString(),
          randomUnicodeString(),
        ];
        for (const input of inputs) {
          const output = NativeSampleTurboModule.getString(input);
          if (output === input) {
            pass++;
          } else if (failure === '') {
            failure = ` FAIL len ${input.length} -> ${
              output == null ? 'null' : output.length
            }`;
          }
        }
      }
      // $FlowFixMe[incompatible-call] null must round-trip as null
      const nullOk = NativeSampleTurboModule.getString(null) === null;
      return `${pass}/${expected} ok${nullOk ? '' : ' null FAIL'}${failure}`;
    },
    getStringControlChars: () =>
      CONTROL_CHAR_INPUTS.map(
        input => NativeSampleTurboModule.getString(input) === input,
      ).join(','),
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
