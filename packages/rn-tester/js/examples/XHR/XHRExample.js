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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

const XHRExampleAbortController = require('./XHRExampleAbortController');
const XHRExampleBinaryUpload = require('./XHRExampleBinaryUpload');
const XHRExampleDownload = require('./XHRExampleDownload');
const XHRExampleFetch = require('./XHRExampleFetch');
const XHRExampleHeaders = require('./XHRExampleHeaders');
const XHRExampleOnTimeOut = require('./XHRExampleOnTimeOut');
const React = require('react');

exports.framework = 'React';
exports.title = 'XMLHttpRequest';
exports.category = 'Basic';
exports.description = ('Example that demonstrates upload and download ' +
  'requests using XMLHttpRequest.') as string;
exports.examples = [
  {
    title: 'File Download',
    render(): React.Node {
      return <XHRExampleDownload />;
    },
  },
  {
    title: 'multipart/form-data Upload',
    render(): React.Node {
      return <XHRExampleBinaryUpload />;
    },
  },
  {
    title: 'Fetch Test',
    render(): React.Node {
      return <XHRExampleFetch />;
    },
  },
  {
    title: 'Headers',
    render(): React.Node {
      return <XHRExampleHeaders />;
    },
  },
  {
    title: 'Time Out Test',
    render(): React.Node {
      return <XHRExampleOnTimeOut />;
    },
  },
  {
    title: 'Abort Test',
    render(): React.Node {
      return <XHRExampleAbortController />;
    },
  },
] as Array<RNTesterModuleExample>;
