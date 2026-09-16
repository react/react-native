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

import typeof BlobT from '../Blob/Blob';
import type {BlobData} from '../Blob/BlobTypes';
import type {FormDataPart} from './FormData';
import typeof FormDataT from './FormData';

const Blob: BlobT = require('../Blob/Blob').default;
const binaryToBase64 = require('../Utilities/binaryToBase64').default;
const FormData: FormDataT = require('./FormData').default;

type URIRequestBody = Readonly<{
  uri: string,
  string?: string,
  blob?: BlobData,
  formData?: Array<FormDataPart>,
  base64?: string,
  ...
}>;

export type RequestBody =
  string | Blob | FormData | URIRequestBody | ArrayBuffer | $ArrayBufferView;

type RequestBodyResult = Readonly<{
  string?: string,
  blob?: BlobData,
  formData?: Array<FormDataPart>,
  base64?: string,
  uri?: string,
  ...
}>;

declare function isArrayBufferView(
  body: unknown,
): implies body is $ArrayBufferView;
function isArrayBufferView(body: unknown) {
  return ArrayBuffer.isView(body);
}

declare function isObjectRequestBody(
  body: unknown,
): implies body is RequestBodyResult;
function isObjectRequestBody(body: unknown) {
  return body != null && typeof body === 'object';
}

function convertRequestBody(body: ?RequestBody): ?RequestBodyResult {
  if (typeof body === 'string') {
    return {string: body};
  }
  if (body instanceof Blob) {
    return {blob: body.data};
  }
  if (body instanceof FormData) {
    return {formData: body.getParts()};
  }
  if (body instanceof ArrayBuffer || isArrayBufferView(body)) {
    return {base64: binaryToBase64(body)};
  }
  if (isObjectRequestBody(body)) {
    return body;
  }
  return null;
}

export default convertRequestBody;
