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

jest.unmock('../NativeModules');

let BatchedBridge;
let NativeModules;

const MODULE_IDS = 0;
const METHOD_IDS = 1;
const PARAMS = 2;
const CALL_ID = 3;

const assertQueue = (
  flushedQueue: null | [Array<number>, Array<number>, Array<unknown>, number],
  index: number,
  moduleID: number,
  methodID: number,
  params: ReadonlyArray<unknown>,
) => {
  if (flushedQueue == null) {
    throw new Error('Expected `flushedQueue` to be non-null');
  }
  expect(flushedQueue[MODULE_IDS][index]).toEqual(moduleID);
  expect(flushedQueue[METHOD_IDS][index]).toEqual(methodID);
  expect(flushedQueue[PARAMS][index]).toEqual(params);
};

// Important things to test:
//
// [x] Calling remote method actually queues it up on the BatchedBridge
//
// [x] Both error and success callbacks are invoked.
//
// [x] When simulating an error callback from remote method, both error and
// success callbacks are cleaned up.
//
// [ ] Remote invocation throws if not supplying an error callback.
describe('MessageQueue', function () {
  beforeEach(function () {
    jest.resetModules();

    global.__fbBatchedBridgeConfig = require('../__mocks__/MessageQueueTestConfig');
    BatchedBridge = require('../BatchedBridge').default;
    NativeModules = require('../NativeModules').default;
  });

  it('should generate native modules', () => {
    NativeModules.RemoteModule1.remoteMethod('foo');
    const flushedQueue = BatchedBridge.flushedQueue();
    assertQueue(flushedQueue, 0, 0, 0, ['foo']);
  });

  it('should make round trip and clear memory', function () {
    const onFail = jest.fn();
    const onSucc = jest.fn();

    // Perform communication
    NativeModules.RemoteModule1.promiseMethod(
      'paloAlto',
      'menloPark',
      onFail,
      onSucc,
    );
    NativeModules.RemoteModule2.promiseMethod('mac', 'windows', onFail, onSucc);

    const resultingRemoteInvocations = BatchedBridge.flushedQueue();
    if (resultingRemoteInvocations == null) {
      throw new Error('Expected `resultingRemoteInvocations` to be non-null');
    }

    // As always, the message queue has four fields
    expect(resultingRemoteInvocations.length).toBe(4);
    expect(resultingRemoteInvocations[MODULE_IDS].length).toBe(2);
    expect(resultingRemoteInvocations[METHOD_IDS].length).toBe(2);
    expect(resultingRemoteInvocations[PARAMS].length).toBe(2);
    expect(typeof resultingRemoteInvocations[CALL_ID]).toEqual('number');

    expect(resultingRemoteInvocations[0][0]).toBe(0); // `RemoteModule1`
    expect(resultingRemoteInvocations[1][0]).toBe(1); // `promiseMethod`
    expect([
      // the arguments
      // $FlowFixMe[incompatible-use]
      resultingRemoteInvocations[2][0][0],
      // $FlowFixMe[incompatible-use]
      resultingRemoteInvocations[2][0][1],
    ]).toEqual(['paloAlto', 'menloPark']);
    // Callbacks ids are tacked onto the end of the remote arguments.
    // $FlowFixMe[incompatible-use]
    const firstFailCBID = resultingRemoteInvocations[2][0][2];
    // $FlowFixMe[incompatible-use]
    const firstSuccCBID = resultingRemoteInvocations[2][0][3];

    expect(resultingRemoteInvocations[0][1]).toBe(1); // `RemoteModule2`
    expect(resultingRemoteInvocations[1][1]).toBe(1); // `promiseMethod`
    expect([
      // the arguments
      // $FlowFixMe[incompatible-use]
      resultingRemoteInvocations[2][1][0],
      // $FlowFixMe[incompatible-use]
      resultingRemoteInvocations[2][1][1],
    ]).toEqual(['mac', 'windows']);
    // $FlowFixMe[incompatible-use]
    const secondFailCBID = resultingRemoteInvocations[2][1][2];
    // $FlowFixMe[incompatible-use]
    const secondSuccCBID = resultingRemoteInvocations[2][1][3];

    // Handle the first remote invocation by signaling failure.
    BatchedBridge.__invokeCallback(firstFailCBID, ['firstFailure']);
    // The failure callback was already invoked, the success is no longer valid
    expect(function () {
      BatchedBridge.__invokeCallback(firstSuccCBID, ['firstSucc']);
    }).toThrow();
    expect(onFail.mock.calls.length).toBe(1);
    expect(onSucc.mock.calls.length).toBe(0);

    // Handle the second remote invocation by signaling success.
    BatchedBridge.__invokeCallback(secondSuccCBID, ['secondSucc']);
    // The success callback was already invoked, the fail cb is no longer valid
    expect(function () {
      BatchedBridge.__invokeCallback(secondFailCBID, ['secondFail']);
    }).toThrow();
    expect(onFail.mock.calls.length).toBe(1);
    expect(onSucc.mock.calls.length).toBe(1);
  });

  it('promise-returning methods (type=promise)', async function () {
    // Perform communication
    const promise1 = NativeModules.RemoteModule1.promiseReturningMethod(
      'paloAlto',
      'menloPark',
    );
    const promise2 = NativeModules.RemoteModule2.promiseReturningMethod(
      'mac',
      'windows',
    );

    const resultingRemoteInvocations = BatchedBridge.flushedQueue();
    if (resultingRemoteInvocations == null) {
      throw new Error('Expected `resultingRemoteInvocations` to be non-null');
    }

    // As always, the message queue has four fields
    expect(resultingRemoteInvocations.length).toBe(4);
    expect(resultingRemoteInvocations[MODULE_IDS].length).toBe(2);
    expect(resultingRemoteInvocations[METHOD_IDS].length).toBe(2);
    expect(resultingRemoteInvocations[PARAMS].length).toBe(2);
    expect(typeof resultingRemoteInvocations[CALL_ID]).toEqual('number');

    expect(resultingRemoteInvocations[0][0]).toBe(0); // `RemoteModule1`
    expect(resultingRemoteInvocations[1][0]).toBe(2); // `promiseReturningMethod`
    expect([
      // the arguments
      // $FlowFixMe[incompatible-use]
      resultingRemoteInvocations[2][0][0],
      // $FlowFixMe[incompatible-use]
      resultingRemoteInvocations[2][0][1],
    ]).toEqual(['paloAlto', 'menloPark']);
    // For promise-returning methods, the order of callbacks is flipped from
    // regular async methods.
    // $FlowFixMe[incompatible-use]
    const firstSuccCBID = resultingRemoteInvocations[2][0][2];
    // $FlowFixMe[incompatible-use]
    const firstFailCBID = resultingRemoteInvocations[2][0][3];

    expect(resultingRemoteInvocations[0][1]).toBe(1); // `RemoteModule2`
    expect(resultingRemoteInvocations[1][1]).toBe(2); // `promiseReturningMethod`
    expect([
      // the arguments
      // $FlowFixMe[incompatible-use]
      resultingRemoteInvocations[2][1][0],
      // $FlowFixMe[incompatible-use]
      resultingRemoteInvocations[2][1][1],
    ]).toEqual(['mac', 'windows']);
    // $FlowFixMe[incompatible-use]
    const secondSuccCBID = resultingRemoteInvocations[2][1][2];
    // $FlowFixMe[incompatible-use]
    const secondFailCBID = resultingRemoteInvocations[2][1][3];

    // Handle the first remote invocation by signaling failure.
    BatchedBridge.__invokeCallback(firstFailCBID, [{message: 'firstFailure'}]);
    // The failure callback was already invoked, the success is no longer valid
    expect(function () {
      BatchedBridge.__invokeCallback(firstSuccCBID, ['firstSucc']);
    }).toThrow();
    await expect(promise1).rejects.toBeInstanceOf(Error);
    await expect(promise1).rejects.toMatchObject({message: 'firstFailure'});

    // Handle the second remote invocation by signaling success.
    BatchedBridge.__invokeCallback(secondSuccCBID, ['secondSucc']);
    // The success callback was already invoked, the fail cb is no longer valid
    expect(function () {
      BatchedBridge.__invokeCallback(secondFailCBID, ['secondFail']);
    }).toThrow();
    await promise2;
  });

  describe('sync methods', () => {
    afterEach(function () {
      delete global.nativeCallSyncHook;
    });

    it('throwing an exception', function () {
      global.nativeCallSyncHook = jest.fn(() => {
        throw new Error('firstFailure');
      });

      let error;
      try {
        NativeModules.RemoteModule1.syncMethod('paloAlto', 'menloPark');
      } catch (e) {
        error = e;
      }

      expect(global.nativeCallSyncHook).toBeCalledTimes(1);
      expect(global.nativeCallSyncHook).toBeCalledWith(
        0, // `RemoteModule1`
        3, // `syncMethod`
        ['paloAlto', 'menloPark'],
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({
        message: 'firstFailure',
      });
    });

    it('returning a value', function () {
      global.nativeCallSyncHook = jest.fn(() => {
        return 'secondSucc';
      });

      const result = NativeModules.RemoteModule2.syncMethod('mac', 'windows');

      expect(global.nativeCallSyncHook).toBeCalledTimes(1);
      expect(global.nativeCallSyncHook).toBeCalledWith(
        1, // `RemoteModule2`
        3, // `syncMethod`
        ['mac', 'windows'],
      );

      expect(result).toBe('secondSucc');
    });
  });
});
