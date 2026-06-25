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

import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import {type EventSubscription} from '../vendor/emitter/EventEmitter';
import convertRequestBody, {type RequestBody} from './convertRequestBody';
import NativeNetworkingIOS from './NativeNetworkingIOS';
import {type RCTNetworkingEventDefinitions} from './RCTNetworkingEventDefinitions.flow';
import {type NativeResponseType} from './XMLHttpRequest';

const RCTNetworking = {
  addListener<K extends keyof RCTNetworkingEventDefinitions>(
    eventType: K,
    listener: (...RCTNetworkingEventDefinitions[K]) => unknown,
    context?: unknown,
  ): EventSubscription {
    // $FlowFixMe[incompatible-type]
    return RCTDeviceEventEmitter.addListener(eventType, listener, context);
  },

  sendRequest(
    method: string,
    trackingName: string | void,
    url: string,
    headers: {...},
    data: RequestBody,
    responseType: NativeResponseType,
    incrementalUpdates: boolean,
    timeout: number,
    callback: (requestId: number) => void,
    withCredentials: boolean,
  ) {
    const body = convertRequestBody(data);
    const devToolsRequestId =
      global.__NETWORK_REPORTER__?.createDevToolsRequestId();
    NativeNetworkingIOS.sendRequest(
      {
        method,
        url,
        data: {...body, trackingName},
        headers,
        responseType,
        incrementalUpdates,
        timeout,
        withCredentials,
        unstable_devToolsRequestId: devToolsRequestId,
      },
      callback,
    );
  },

  abortRequest(requestId: number) {
    NativeNetworkingIOS.abortRequest(requestId);
  },

  clearCookies(callback: (result: boolean) => void) {
    NativeNetworkingIOS.clearCookies(callback);
  },
};

export default RCTNetworking;
