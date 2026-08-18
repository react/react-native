/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

// A simple balanced-delimiter check (an injected project must stay well-formed).
function isBalanced(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') i++;
        i++;
      }
    } else if (c === '{' || c === '(') {
      depth++;
    } else if (c === '}' || c === ')') {
      depth--;
    }
  }
  return depth === 0;
}

module.exports = {isBalanced};
