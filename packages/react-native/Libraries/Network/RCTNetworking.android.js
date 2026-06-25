/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';
import type {RequestBody} from './convertRequestBody';
import type {RCTNetworkingEventDefinitions} from './RCTNetworkingEventDefinitions.flow';
import type {NativeResponseType} from './XMLHttpRequest';

// Do not require the native RCTNetworking module directly! Use this wrapper module instead.
// It will add the necessary requestId, so that you don't have to generate it yourself.
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import Platform from '../Utilities/Platform';
import convertRequestBody from './convertRequestBody';
import NativeNetworkingAndroid from './NativeNetworkingAndroid';

type Header = [string, string];

// Convert FormData headers to arrays, which are easier to consume in
// native on Android.
function convertHeadersMapToArray(headers: Object): Array<Header> {
  const headerArray: Array<Header> = [];
  for (const name in headers) {
    headerArray.push([name, headers[name]]);
  }
  return headerArray;
}

let _requestId = 1;
function generateRequestId(): number {
  return _requestId++;
}

const emitter = new NativeEventEmitter<$FlowFixMe>(
  // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
  // If you want to use the native module on other platforms, please remove this condition and test its behavior
  Platform.OS !== 'ios' ? null : NativeNetworkingAndroid,
);

/**
 * This object is a wrapper around the native RCTNetworking module. It adds a necessary unique
 * requestId to each network request that can be used to abort that request later on.
 */
const RCTNetworking = {
  addListener<K extends keyof RCTNetworkingEventDefinitions>(
    eventType: K,
    listener: (...RCTNetworkingEventDefinitions[K]) => unknown,
    context?: unknown,
  ): EventSubscription {
    // $FlowFixMe[incompatible-type]
    return emitter.addListener(eventType, listener, context);
  },

  sendRequest(
    method: string,
    trackingName: string | void,
    url: string,
    headers: Object,
    data: RequestBody,
    responseType: NativeResponseType,
    incrementalUpdates: boolean,
    timeout: number,
    callback: (requestId: number) => unknown,
    withCredentials: boolean,
  ) {
    const body = convertRequestBody(data);
    if (body && body.formData) {
      body.formData = body.formData.map(part => ({
        ...part,
        headers: convertHeadersMapToArray(part.headers),
      }));
    }
    const requestId = generateRequestId();
    const devToolsRequestId =
      global.__NETWORK_REPORTER__?.createDevToolsRequestId();
    NativeNetworkingAndroid.sendRequest(
      method,
      url,
      requestId,
      convertHeadersMapToArray(headers),
      {...body, trackingName, devToolsRequestId},
      responseType,
      incrementalUpdates,
      timeout,
      withCredentials,
    );
    callback(requestId);
  },

  abortRequest(requestId: number) {
    NativeNetworkingAndroid.abortRequest(requestId);
  },

  clearCookies(callback: (result: boolean) => void) {
    NativeNetworkingAndroid.clearCookies(callback);
  },
};

export default RCTNetworking;
