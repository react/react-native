/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

type FormDataValue = string | {name?: string, type?: string, uri: string};
type FormDataNameValuePair = [string, FormDataValue];

type Headers = {[name: string]: string, ...};
export type FormDataPart =
  | {
      string: string,
      headers: Headers,
      ...
    }
  | {
      uri: string,
      headers: Headers,
      name?: string,
      type?: string,
      ...
    };

/**
 * Encode a FormData filename compliant with RFC 2183
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition#directives
 */
function encodeFilename(filename: string): string {
  return encodeURIComponent(filename.replace(/\//g, '_'));
}

/**
 * Polyfill for XMLHttpRequest2 FormData API, allowing multipart POST requests
 * with mixed data (string, native files) to be submitted via XMLHttpRequest.
 *
 * Example:
 *
 *   var photo = {
 *     uri: uriFromCameraRoll,
 *     type: 'image/jpeg',
 *     name: 'photo.jpg',
 *   };
 *
 *   var body = new FormData();
 *   body.append('authToken', 'secret');
 *   body.append('photo', photo);
 *   body.append('title', 'A beautiful photo!');
 *
 *   xhr.open('POST', serverURL);
 *   xhr.send(body);
 */
class FormData {
  _parts: Array<FormDataNameValuePair>;

  constructor() {
    this._parts = [];
  }

  append(key: string, value: FormDataValue) {
    // The XMLHttpRequest spec doesn't specify if duplicate keys are allowed.
    // MDN says that any new values should be appended to existing values.
    // In any case, major browsers allow duplicate keys, so that's what we'll do
    // too. They'll simply get appended as additional form data parts in the
    // request body, leaving the server to deal with them.
    this._parts.push([key, value]);
  }

  getAll(key: string): Array<FormDataValue> {
    return this._parts
      .filter(([name]) => name === key)
      .map(([, value]) => value);
  }

  getParts(): Array<FormDataPart> {
    return this._parts.map(([name, value]) => {
      const contentDisposition = 'form-data; name="' + name + '"';

      const headers: Headers = {'content-disposition': contentDisposition};

      // The body part is a "blob", which in React Native just means
      // an object with a `uri` attribute. Optionally, it can also
      // have a `name` and `type` attribute to specify filename and
      // content type (cf. web Blob interface.)
      if (typeof value === 'object' && !Array.isArray(value) && value) {
        if (typeof value.name === 'string') {
          headers['content-disposition'] +=
            `; filename="${encodeFilename(value.name)}"`;
        }
        if (typeof value.type === 'string') {
          headers['content-type'] = value.type;
        }
        return {...value, headers, fieldName: name};
      }
      // Convert non-object values to strings as per FormData.append() spec
      return {string: String(value), headers, fieldName: name};
    });
  }
}

export default FormData;
