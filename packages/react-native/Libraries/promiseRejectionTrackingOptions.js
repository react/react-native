/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import typeof {enable} from 'promise/setimmediate/rejection-tracking';

import ExceptionsManager from './Core/ExceptionsManager';

const rejectionTrackingOptions: NonNullable<Parameters<enable>[0]> = {
  allRejections: true,
  onHandled: id => {
    const warning =
      `Promise rejection handled (id: ${id})\n` +
      'This means you can ignore any previous messages of the form ' +
      `"Uncaught (in promise, id: ${id})"`;
    console.warn(warning);
  },
  onUnhandled: (id, rejection) => {
    let message: string;

    if (rejection === undefined) {
      message = '';
    } else if (
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      Object.prototype.toString.call(rejection) === '[object Error]'
    ) {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      message = Error.prototype.toString.call(rejection);
    } else {
      try {
        message = require('pretty-format').format(rejection);
      } catch {
        message =
          typeof rejection === 'string'
            ? rejection
            : JSON.stringify(rejection as $FlowFixMe);
      }
    }

    ExceptionsManager.handleException(
      new Error(
        `Uncaught (in promise, id: ${id})${message ? `: "${message}"` : ''}`,
        {
          cause: rejection,
        },
      ),
      false /* isFatal */,
    );
  },
};

export default rejectionTrackingOptions;
