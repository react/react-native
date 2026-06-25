/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import type {RootTag} from '../../../../../Libraries/ReactNative/RootTag';
import type {ViewConfig} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type HTMLCollection from '../oldstylecollections/HTMLCollection';
import type {ReactNativeDocumentInstanceHandle} from './internals/ReactNativeDocumentInstanceHandle';

import {createHTMLCollection} from '../oldstylecollections/HTMLCollection';
import {getPublicInstanceFromInstanceHandle} from './internals/NodeInternals';
import {
  createReactNativeDocumentElementInstanceHandle,
  setNativeElementReferenceForReactNativeDocumentElementInstanceHandle,
  setPublicInstanceForReactNativeDocumentElementInstanceHandle,
} from './internals/ReactNativeDocumentElementInstanceHandle';
import {createReactNativeDocumentInstanceHandle} from './internals/ReactNativeDocumentInstanceHandle';
import ReactNativeElement from './ReactNativeElement';
import ReadOnlyElement from './ReadOnlyElement';
import ReadOnlyNode from './ReadOnlyNode';
import NativeDOM from './specs/NativeDOM';

export default class ReactNativeDocument extends ReadOnlyNode {
  _rootTag: RootTag;
  _documentElement: ReactNativeElement;

  constructor(
    rootTag: RootTag,
    instanceHandle: ReactNativeDocumentInstanceHandle,
  ) {
    super(instanceHandle, null);
    this._rootTag = rootTag;
    this._documentElement = createDocumentElement(rootTag, this);
  }

  get childElementCount(): number {
    // just `documentElement`.
    return 1;
  }

  get children(): HTMLCollection<ReadOnlyElement> {
    return createHTMLCollection([this.documentElement]);
  }

  get documentElement(): ReactNativeElement {
    return this._documentElement;
  }

  get firstElementChild(): ReadOnlyElement | null {
    return this.documentElement;
  }

  get lastElementChild(): ReadOnlyElement | null {
    return this.documentElement;
  }

  get nodeName(): string {
    return '#document';
  }

  get nodeType(): number {
    return ReadOnlyNode.DOCUMENT_NODE;
  }

  get nodeValue(): null {
    return null;
  }

  // $FlowExpectedError[incompatible-type] This is defined as returning string in Node, but it's actually null in Document.
  get textContent(): null {
    return null;
  }

  getElementById(id: string): ReadOnlyElement | null {
    const elementByIdInstanceHandle = NativeDOM.getElementById(
      this._rootTag,
      id,
    );

    if (elementByIdInstanceHandle == null) {
      return null;
    }

    const elementById = getPublicInstanceFromInstanceHandle(
      elementByIdInstanceHandle,
    );

    return elementById instanceof ReadOnlyElement ? elementById : null;
  }
}

function createDocumentElement(
  rootTag: RootTag,
  ownerDocument: ReactNativeDocument,
): ReactNativeElement {
  // In the case of the document object, React does not create an instance
  // handle for it, so we create a custom one.
  const instanceHandle = createReactNativeDocumentElementInstanceHandle();

  // $FlowExpectedError[incompatible-type]
  const rootTagIsNumber: number = rootTag;
  // $FlowExpectedError[incompatible-type]
  const viewConfig: ViewConfig = null;

  const documentElement = new ReactNativeElement(
    rootTagIsNumber,
    viewConfig,
    instanceHandle,
    ownerDocument,
  );

  // The root shadow node was created ahead of time without an instance
  // handle, so we need to link them now.
  const rootShadowNode = NativeDOM.linkRootNode(rootTag, instanceHandle);
  setNativeElementReferenceForReactNativeDocumentElementInstanceHandle(
    instanceHandle,
    rootShadowNode,
  );
  setPublicInstanceForReactNativeDocumentElementInstanceHandle(
    instanceHandle,
    documentElement,
  );

  return documentElement;
}

export function createReactNativeDocument(
  rootTag: RootTag,
): ReactNativeDocument {
  const instanceHandle = createReactNativeDocumentInstanceHandle(rootTag);
  const document = new ReactNativeDocument(rootTag, instanceHandle);
  return document;
}

export const ReactNativeDocument_public: typeof ReactNativeDocument =
  // $FlowExpectedError[incompatible-type]
  function Document() {
    throw new TypeError(
      "Failed to construct 'Document': Nodes cannot be imperatively created in React Native",
    );
  };

// $FlowExpectedError[prop-missing]
ReactNativeDocument_public.prototype = ReactNativeDocument.prototype;
