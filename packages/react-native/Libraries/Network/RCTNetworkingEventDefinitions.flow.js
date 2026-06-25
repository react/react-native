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

export type RCTNetworkingEventDefinitions = Readonly<{
  didSendNetworkData: [
    [
      number, // requestId
      number, // progress
      number, // total
    ],
  ],
  didReceiveNetworkResponse: [
    [
      number, // requestId
      number, // status
      ?{[string]: string}, // responseHeaders
      ?string, // responseURL
    ],
  ],
  didReceiveNetworkData: [
    [
      number, // requestId
      string, // response
    ],
  ],
  didReceiveNetworkIncrementalData: [
    [
      number, // requestId
      string, // responseText
      number, // progress
      number, // total
    ],
  ],
  didReceiveNetworkDataProgress: [
    [
      number, // requestId
      number, // loaded
      number, // total
    ],
  ],
  didCompleteNetworkResponse: [
    [
      number, // requestId
      string, // error
      boolean, // timeOutError
    ],
  ],
}>;
