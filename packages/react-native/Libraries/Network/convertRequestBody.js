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

export type RequestBody =
  | string
  | Blob
  | FormData
  | {uri: string, ...}
  | ArrayBuffer
  | $ArrayBufferView;

type RequestBodyResult = Readonly<{
  string?: string,
  blob?: BlobData,
  formData?: Array<FormDataPart>,
  base64?: string,
  uri?: string,
  ...
}>;

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
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    /* $FlowFixMe[incompatible-type] : no way to assert that 'body' is indeed
     * an ArrayBufferView */
    return {base64: binaryToBase64(body)};
  }
  // The only remaining runtime case is a `{uri: string, ...}` body, returned
  // as-is (matching the previous behavior). `ArrayBuffer.isView` is not a Flow
  // type guard, so Flow cannot refine the view types out of `body` here, and
  // the inexact `{uri: ...}` object is not provably a `RequestBodyResult`.
  // $FlowFixMe[class-object-subtyping]
  // $FlowFixMe[incompatible-type]
  return body;
}

export default convertRequestBody;
