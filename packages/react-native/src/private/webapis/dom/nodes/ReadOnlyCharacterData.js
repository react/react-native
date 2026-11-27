/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type ReadOnlyElement from './ReadOnlyElement';

import {getNativeTextReference} from './internals/NodeInternals';
import {getElementSibling} from './internals/Traversal';
import ReadOnlyNode from './ReadOnlyNode';
import NativeDOM from './specs/NativeDOM';

export default class ReadOnlyCharacterData extends ReadOnlyNode {
  // $FlowFixMe[unsafe-getters-setters]
  get nextElementSibling(): ReadOnlyElement | null {
    return getElementSibling(this, 'next');
  }

  // $FlowFixMe[unsafe-getters-setters]
  get previousElementSibling(): ReadOnlyElement | null {
    return getElementSibling(this, 'previous');
  }

  // $FlowFixMe[unsafe-getters-setters]
  get data(): string {
    const node = getNativeTextReference(this);

    if (node != null) {
      return NativeDOM.getTextContent(node);
    }

    return '';
  }

  // $FlowFixMe[unsafe-getters-setters]
  get length(): number {
    return this.data.length;
  }

  /**
   * @override
   */
  // $FlowFixMe[unsafe-getters-setters]
  get textContent(): string {
    return this.data;
  }

  /**
   * @override
   */
  // $FlowFixMe[unsafe-getters-setters]
  get nodeValue(): string {
    return this.data;
  }

  substringData(offset: number, count: number): string {
    const data = this.data;
    if (offset < 0) {
      throw new TypeError(
        `Failed to execute 'substringData' on 'CharacterData': The offset ${offset} is negative.`,
      );
    }
    if (offset > data.length) {
      throw new TypeError(
        `Failed to execute 'substringData' on 'CharacterData': The offset ${offset} is greater than the node's length (${data.length}).`,
      );
    }
    let adjustedCount = count < 0 || count > data.length ? data.length : count;
    return data.slice(offset, offset + adjustedCount);
  }
}

export const ReadOnlyCharacterData_public: typeof ReadOnlyCharacterData =
  // $FlowExpectedError[incompatible-type]
  function CharacterData() {
    throw new TypeError(
      "Failed to construct 'CharacterData': Illegal constructor",
    );
  };

ReadOnlyCharacterData_public.prototype = ReadOnlyCharacterData.prototype;
