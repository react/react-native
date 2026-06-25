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

import NativeCxxModuleExample, {
  EnumInt,
  EnumNone,
} from '../../../NativeCxxModuleExample/NativeCxxModuleExample';
import RNTesterText from '../../components/RNTesterText';
import styles from './TurboModuleExampleCommon';
import * as React from 'react';
import {
  DeviceEventEmitter,
  FlatList,
  RootTagContext,
  TouchableOpacity,
  View,
} from 'react-native';

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
  | 'callbackWithSubscription'
  | 'getArray'
  | 'getArrayBuffer'
  | 'processAsyncBuffer'
  | 'getAsyncBuffer'
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
  | 'voidPromise'
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

class NativeCxxModuleExampleExample extends React.Component<{}, State> {
  static contextType: React.Context<RootTag> = RootTagContext;
  eventSubscriptions: EventSubscription[] = [];

  state: State = {
    testResults: {},
  };

  // Add calls to methods in TurboModule here
  // $FlowFixMe[missing-local-annot]
  _tests = {
    callback: () =>
      NativeCxxModuleExample?.getValueWithCallback(callbackValue =>
        this._setResult('callback', callbackValue),
      ),
    callbackWithSubscription: () => {
      const subscription =
        NativeCxxModuleExample?.setValueCallbackWithSubscription(
          callbackValue =>
            this._setResult('callbackWithSubscription', callbackValue),
        );
      if (subscription) {
        subscription();
      }
    },
    getArray: () =>
      NativeCxxModuleExample?.getArray([
        {a: 1, b: 'foo'},
        {a: 2, b: 'bar'},
        null,
      ]),
    getArrayBuffer: () => {
      const view = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = NativeCxxModuleExample?.getArrayBuffer(view.buffer);
      return new Uint8Array(buffer || []).toString();
    },
    processAsyncBuffer: async () => {
      const view = new Uint8Array([10, 20, 30, 40, 50]);
      const nativeBuffer = NativeCxxModuleExample?.createNativeBuffer(10);

      const [byteSum, zeroCopyByteSum] = await Promise.all([
        NativeCxxModuleExample?.processAsyncBuffer(view.buffer),
        nativeBuffer != null
          ? NativeCxxModuleExample?.processAsyncBuffer(nativeBuffer)
          : Promise.resolve(0),
      ]);

      this._setResult(
        'processAsyncBuffer',
        `sum=${(byteSum ?? 0) + (zeroCopyByteSum ?? 0)}`,
      );
    },
    getAsyncBuffer: () =>
      NativeCxxModuleExample?.getAsyncBuffer(10).then(buffer => {
        this._setResult('getAsyncBuffer', new Uint8Array(buffer).toString());
      }),
    getBool: () => NativeCxxModuleExample?.getBool(true),
    getConstants: () => NativeCxxModuleExample?.getConstants(),
    getCustomEnum: () => NativeCxxModuleExample?.getCustomEnum(EnumInt.IB),
    getCustomHostObject: () =>
      NativeCxxModuleExample?.consumeCustomHostObject(
        NativeCxxModuleExample?.getCustomHostObject(),
      ),
    getBinaryTreeNode: () =>
      NativeCxxModuleExample?.getBinaryTreeNode({
        left: {value: 1},
        value: 0,
        right: {value: 2},
      }),
    getGraphNode: () =>
      NativeCxxModuleExample?.getGraphNode({
        label: 'root',
        neighbors: [{label: 'left'}, {label: 'right'}],
      }),
    getNumEnum: () => NativeCxxModuleExample?.getNumEnum(EnumInt.IB),
    getStrEnum: () => NativeCxxModuleExample?.getStrEnum(EnumNone.NB),
    getNumber: () => NativeCxxModuleExample?.getNumber(99.95),
    getObject: () =>
      NativeCxxModuleExample?.getObject({a: 1, b: 'foo', c: null}),
    getSet: () => NativeCxxModuleExample?.getSet([1, 1.1, 1.1, 1.1, 2]),
    getString: () => NativeCxxModuleExample?.getString('Hello'),
    getUnion: () => NativeCxxModuleExample?.getUnion(1.44, 'Two', {low: '12'}),
    getValue: () =>
      NativeCxxModuleExample?.getValue(5, 'test', {a: 1, b: 'foo'}),
    promise: () =>
      NativeCxxModuleExample?.getValueWithPromise(false).then(valuePromise =>
        this._setResult('promise', valuePromise),
      ),
    rejectPromise: () =>
      NativeCxxModuleExample?.getValueWithPromise(true)
        .then(() => {})
        .catch(e => this._setResult('rejectPromise', e.message)),
    voidFunc: () => NativeCxxModuleExample?.voidFunc(),
    voidPromise: () =>
      NativeCxxModuleExample?.voidPromise().then(valuePromise =>
        this._setResult('voidPromise', valuePromise),
      ),
    setMenuItem: () => {
      let curValue = '';
      NativeCxxModuleExample?.setMenu({
        label: 'File',
        onPress: (value: string, flag: boolean) => {
          curValue = `${value}: ${flag.toString()}`;
          this._setResult('setMenuItem', curValue);
        },
        items: [
          {
            label: 'Open',
            onPress: (value: string, flag: boolean) => {
              this._setResult(
                'setMenuItem',
                `${curValue} - ${value}: ${flag.toString()}`,
              );
            },
          },
        ],
        shortcut: 'ctrl+shift+f',
      });
    },
    optionalArgs: () => NativeCxxModuleExample?.getWithWithOptionalArgs(),
    emitDeviceEvent: () => {
      const CUSTOM_EVENT_TYPE = 'myCustomDeviceEvent';
      DeviceEventEmitter.removeAllListeners(CUSTOM_EVENT_TYPE);
      DeviceEventEmitter.addListener(CUSTOM_EVENT_TYPE, (...args) => {
        this._setResult(
          'emitDeviceEvent',
          `${CUSTOM_EVENT_TYPE}(${args
            .map(s => (typeof s === 'object' ? JSON.stringify(s) : s))
            .join(', ')})`,
        );
      });
      NativeCxxModuleExample?.emitCustomDeviceEvent(CUSTOM_EVENT_TYPE);
    },
  };

  // $FlowFixMe[missing-local-annot]
  _errorTests = {
    voidFuncThrows: () => {
      try {
        NativeCxxModuleExample?.voidFuncThrows();
      } catch (e) {
        return e.message;
      }
    },
    getObjectThrows: () => {
      try {
        NativeCxxModuleExample?.getObjectThrows({a: 1, b: 'foo', c: null});
      } catch (e) {
        return e.message;
      }
    },
    promiseThrows: () => {
      try {
        // $FlowFixMe[unused-promise]
        NativeCxxModuleExample?.promiseThrows();
      } catch (e) {
        return e.message;
      }
    },
    voidFuncAssert: () => {
      try {
        NativeCxxModuleExample?.voidFuncAssert();
      } catch (e) {
        return e.message;
      }
    },
    getObjectAssert: () => {
      try {
        NativeCxxModuleExample?.getObjectAssert({a: 1, b: 'foo', c: null});
      } catch (e) {
        return e.message;
      }
    },
    promiseAssert: () => {
      try {
        // $FlowFixMe[unused-promise]
        NativeCxxModuleExample?.promiseAssert();
      } catch (e) {
        return e.message;
      }
    },
  };

  _setResult(
    name: Examples | ErrorExamples,
    result:
      | $FlowFixMe
      | void
      | Array<$FlowFixMe>
      | boolean
      | {const1: boolean, const2: number, const3: string}
      | number
      | {[key: string]: ?number}
      | Promise<unknown>
      | number
      | string,
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
    if (NativeCxxModuleExample) {
      this.eventSubscriptions.push(
        NativeCxxModuleExample.onPress(value => console.log('onPress: ()')),
      );
      this.eventSubscriptions.push(
        NativeCxxModuleExample.onClick(value =>
          console.log(`onClick: (${value})`),
        ),
      );
      this.eventSubscriptions.push(
        NativeCxxModuleExample.onChange(value =>
          console.log(`onChange: ${JSON.stringify(value)})`),
        ),
      );
      this.eventSubscriptions.push(
        NativeCxxModuleExample.onSubmit(value =>
          console.log(`onSubmit: (${JSON.stringify(value)})`),
        ),
      );
      this.eventSubscriptions.push(
        NativeCxxModuleExample.onEvent(value =>
          console.log(`onEvent: (${value.valueOf()})`),
        ),
      );
    }
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

module.exports = NativeCxxModuleExampleExample;
