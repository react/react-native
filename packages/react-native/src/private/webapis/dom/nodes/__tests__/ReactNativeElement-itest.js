/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableFabricCommitBranching:*
 * @fantom_flags enableNativeEventTargetEventDispatching:true
 * @fantom_flags enableImperativeEvents:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../__tests__/utilities/ensureInstance';
import TextInputState from '../../../../../../Libraries/Components/TextInput/TextInputState';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {ScrollView, Text, TextInput, View} from 'react-native';
import {
  NativeText,
  NativeVirtualText,
} from 'react-native/Libraries/Text/TextNativeComponent';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';
import Event from 'react-native/src/private/webapis/dom/events/Event';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import ReadOnlyElement from 'react-native/src/private/webapis/dom/nodes/ReadOnlyElement';
import ReadOnlyNode from 'react-native/src/private/webapis/dom/nodes/ReadOnlyNode';
import HTMLCollection from 'react-native/src/private/webapis/dom/oldstylecollections/HTMLCollection';
import NodeList from 'react-native/src/private/webapis/dom/oldstylecollections/NodeList';

function ensureReactNativeElement(value: unknown): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

// The public imperative EventTarget API is not part of the static type of this
// final class (it is only present at runtime, gated by feature flags), so we
// cast to an interface with optional members to inspect/use it without Flow
// errors. Optional members make this a valid upcast and let us assert both
// presence (`'function'`) and absence (`'undefined'`).
type MaybeEventTarget = interface {
  addEventListener?: (type: string, callback: (event: Event) => void) => void,
  removeEventListener?: (
    type: string,
    callback: (event: Event) => void,
  ) => void,
  dispatchEvent?: (event: Event) => boolean,
};

/* eslint-disable no-bitwise */

describe('ReactNativeElement', () => {
  it('should be used to create public instances', () => {
    const ref = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={ref} />);
    });

    expect(ref.current).toBeInstanceOf(ReactNativeElement);
  });

  describe('extends `ReadOnlyNode`', () => {
    it('should be an instance of `ReadOnlyNode`', () => {
      const ref = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={ref} />);
      });

      expect(ref.current).toBeInstanceOf(ReadOnlyNode);
    });

    describe('nodeType', () => {
      it('returns ReadOnlyNode.ELEMENT_NODE', () => {
        const parentRef = createRef<HostInstance>();
        const childNodeARef = createRef<HostInstance>();
        const childNodeBRef = createRef<HostInstance>();
        const childNodeCRef = createRef<HostInstance>();

        // Initial render with 3 children
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View key="childA" ref={childNodeARef} />
              <View key="childB" ref={childNodeBRef} />
              <View key="childC" ref={childNodeCRef} />
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNodeA = ensureReactNativeElement(childNodeARef.current);
        const childNodeB = ensureReactNativeElement(childNodeBRef.current);
        const childNodeC = ensureReactNativeElement(childNodeCRef.current);

        expect(parentNode.nodeType).toBe(ReadOnlyNode.ELEMENT_NODE);
        expect(childNodeA.nodeType).toBe(ReadOnlyNode.ELEMENT_NODE);
        expect(childNodeB.nodeType).toBe(ReadOnlyNode.ELEMENT_NODE);
        expect(childNodeC.nodeType).toBe(ReadOnlyNode.ELEMENT_NODE);
      });
    });

    describe('nodeValue', () => {
      it('returns null', () => {
        const parentRef = createRef<HostInstance>();
        const childNodeARef = createRef<HostInstance>();
        const childNodeBRef = createRef<HostInstance>();
        const childNodeCRef = createRef<HostInstance>();

        // Initial render with 3 children
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View key="childA" ref={childNodeARef} />
              <View key="childB" ref={childNodeBRef} />
              <View key="childC" ref={childNodeCRef} />
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNodeA = ensureReactNativeElement(childNodeARef.current);
        const childNodeB = ensureReactNativeElement(childNodeBRef.current);
        const childNodeC = ensureReactNativeElement(childNodeCRef.current);

        expect(parentNode.nodeValue).toBe(null);
        expect(childNodeA.nodeValue).toBe(null);
        expect(childNodeB.nodeValue).toBe(null);
        expect(childNodeC.nodeValue).toBe(null);
      });
    });

    describe('childNodes / hasChildNodes()', () => {
      it('returns updated child nodes information', () => {
        const parentRef = createRef<HostInstance>();
        const childNodeARef = createRef<HostInstance>();
        const childNodeBRef = createRef<HostInstance>();
        const childNodeCRef = createRef<HostInstance>();

        // Initial render with 3 children
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View key="childA" ref={childNodeARef} />
              <View key="childB" ref={childNodeBRef} />
              <View key="childC" ref={childNodeCRef} />
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNodeA = ensureReactNativeElement(childNodeARef.current);
        const childNodeB = ensureReactNativeElement(childNodeBRef.current);
        const childNodeC = ensureReactNativeElement(childNodeCRef.current);

        const childNodes = parentNode.childNodes;
        expect(childNodes).toBeInstanceOf(NodeList);
        expect(childNodes.length).toBe(3);
        expect(childNodes[0]).toBe(childNodeA);
        expect(childNodes[1]).toBe(childNodeB);
        expect(childNodes[2]).toBe(childNodeC);

        expect(parentNode.hasChildNodes()).toBe(true);

        // Remove one of the children
        Fantom.runTask(() => {
          root.render(
            <View key="parent">
              <View key="childA" />
              <View key="childB" />
            </View>,
          );
        });

        const childNodesAfterUpdate = parentNode.childNodes;
        expect(childNodesAfterUpdate).toBeInstanceOf(NodeList);
        expect(childNodesAfterUpdate.length).toBe(2);
        expect(childNodesAfterUpdate[0]).toBe(childNodeA);
        expect(childNodesAfterUpdate[1]).toBe(childNodeB);

        expect(parentNode.hasChildNodes()).toBe(true);

        // Unmount node
        Fantom.runTask(() => {
          root.render(<></>);
        });

        const childNodesAfterUnmount = parentNode.childNodes;
        expect(childNodesAfterUnmount).toBeInstanceOf(NodeList);
        expect(childNodesAfterUnmount.length).toBe(0);

        expect(parentNode.hasChildNodes()).toBe(false);
      });
    });

    describe('getRootNode()', () => {
      // This is the desired implementation (not implemented yet).
      it('returns a root node representing the document', () => {
        const parentANodeRef = createRef<HostInstance>();
        const parentBNodeRef = createRef<HostInstance>();
        const childANodeRef = createRef<HostInstance>();
        const childBNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <>
              <View key="parentA" ref={parentANodeRef}>
                <View key="childA" ref={childANodeRef} />
              </View>
              <View key="parentB" ref={parentBNodeRef}>
                <View key="childB" ref={childBNodeRef} />
              </View>
            </>,
          );
        });

        const parentANode = ensureReactNativeElement(parentANodeRef.current);
        const childANode = ensureReactNativeElement(childANodeRef.current);
        const parentBNode = ensureReactNativeElement(parentBNodeRef.current);
        const childBNode = ensureReactNativeElement(childBNodeRef.current);

        expect(childANode.getRootNode()).toBe(childBNode.getRootNode());
        const document = childANode.getRootNode();

        expect(document.childNodes.length).toBe(1);
        expect(document.childNodes[0]).toBeInstanceOf(ReactNativeElement);

        const documentElement = document.childNodes[0];
        expect(documentElement.childNodes[0]).toBeInstanceOf(
          ReactNativeElement,
        );
        expect(documentElement.childNodes[0]).toBe(parentANode);
        expect(documentElement.childNodes[1]).toBe(parentBNode);

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="parentA">
                <View key="childA" />
              </View>
            </>,
          );
        });

        expect(parentANode.getRootNode()).toBe(document);
        expect(childANode.getRootNode()).toBe(document);

        // The root node of a disconnected node is itself
        expect(parentBNode.getRootNode()).toBe(parentBNode);
        expect(childBNode.getRootNode()).toBe(childBNode);
      });
    });

    describe('firstChild / lastChild / previousSibling / nextSibling / parentNode / parentElement', () => {
      it('return updated relative nodes', () => {
        const parentRef = createRef<HostInstance>();
        const childNodeARef = createRef<HostInstance>();
        const childNodeBRef = createRef<HostInstance>();
        const childNodeCRef = createRef<HostInstance>();

        // Initial render with 3 children
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View key="childA" ref={childNodeARef} />
              <View key="childB" ref={childNodeBRef} />
              <View key="childC" ref={childNodeCRef} />
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNodeA = ensureReactNativeElement(childNodeARef.current);
        const childNodeB = ensureReactNativeElement(childNodeBRef.current);
        const childNodeC = ensureReactNativeElement(childNodeCRef.current);

        expect(parentNode.isConnected).toBe(true);
        expect(parentNode.firstChild).toBe(childNodeA);
        expect(parentNode.lastChild).toBe(childNodeC);
        expect(parentNode.previousSibling).toBe(null);
        expect(parentNode.nextSibling).toBe(null);

        expect(childNodeA.isConnected).toBe(true);
        expect(childNodeA.firstChild).toBe(null);
        expect(childNodeA.lastChild).toBe(null);
        expect(childNodeA.previousSibling).toBe(null);
        expect(childNodeA.nextSibling).toBe(childNodeB);
        expect(childNodeA.parentNode).toBe(parentNode);
        expect(childNodeA.parentElement).toBe(parentNode);

        expect(childNodeB.isConnected).toBe(true);
        expect(childNodeB.firstChild).toBe(null);
        expect(childNodeB.lastChild).toBe(null);
        expect(childNodeB.previousSibling).toBe(childNodeA);
        expect(childNodeB.nextSibling).toBe(childNodeC);
        expect(childNodeB.parentNode).toBe(parentNode);
        expect(childNodeB.parentElement).toBe(parentNode);

        expect(childNodeC.isConnected).toBe(true);
        expect(childNodeC.firstChild).toBe(null);
        expect(childNodeC.lastChild).toBe(null);
        expect(childNodeC.previousSibling).toBe(childNodeB);
        expect(childNodeC.nextSibling).toBe(null);
        expect(childNodeC.parentNode).toBe(parentNode);
        expect(childNodeC.parentElement).toBe(parentNode);

        // Remove one of the children
        Fantom.runTask(() => {
          root.render(
            <View key="parent">
              <View key="childA" />
              <View key="childB" />
            </View>,
          );
        });

        expect(parentNode.isConnected).toBe(true);
        expect(parentNode.firstChild).toBe(childNodeA);
        expect(parentNode.lastChild).toBe(childNodeB);
        expect(parentNode.previousSibling).toBe(null);
        expect(parentNode.nextSibling).toBe(null);

        expect(childNodeA.isConnected).toBe(true);
        expect(childNodeA.firstChild).toBe(null);
        expect(childNodeA.lastChild).toBe(null);
        expect(childNodeA.previousSibling).toBe(null);
        expect(childNodeA.nextSibling).toBe(childNodeB);
        expect(childNodeA.parentNode).toBe(parentNode);
        expect(childNodeA.parentElement).toBe(parentNode);

        expect(childNodeB.isConnected).toBe(true);
        expect(childNodeB.firstChild).toBe(null);
        expect(childNodeB.lastChild).toBe(null);
        expect(childNodeB.previousSibling).toBe(childNodeA);
        expect(childNodeB.nextSibling).toBe(null);
        expect(childNodeB.parentNode).toBe(parentNode);
        expect(childNodeB.parentElement).toBe(parentNode);

        // Disconnected
        expect(childNodeC.isConnected).toBe(false);
        expect(childNodeC.firstChild).toBe(null);
        expect(childNodeC.lastChild).toBe(null);
        expect(childNodeC.previousSibling).toBe(null);
        expect(childNodeC.nextSibling).toBe(null);
        expect(childNodeC.parentNode).toBe(null);
        expect(childNodeC.parentElement).toBe(null);

        // Unmount node
        Fantom.runTask(() => {
          root.render(<></>);
        });

        // Disconnected
        expect(parentNode.isConnected).toBe(false);
        expect(parentNode.firstChild).toBe(null);
        expect(parentNode.lastChild).toBe(null);
        expect(parentNode.previousSibling).toBe(null);
        expect(parentNode.nextSibling).toBe(null);
        expect(parentNode.parentNode).toBe(null);
        expect(parentNode.parentElement).toBe(null);

        // Disconnected
        expect(childNodeA.isConnected).toBe(false);
        expect(childNodeA.firstChild).toBe(null);
        expect(childNodeA.lastChild).toBe(null);
        expect(childNodeA.previousSibling).toBe(null);
        expect(childNodeA.nextSibling).toBe(null);
        expect(childNodeA.parentNode).toBe(null);
        expect(childNodeA.parentElement).toBe(null);

        // Disconnected
        expect(childNodeB.isConnected).toBe(false);
        expect(childNodeB.firstChild).toBe(null);
        expect(childNodeB.lastChild).toBe(null);
        expect(childNodeB.previousSibling).toBe(null);
        expect(childNodeB.nextSibling).toBe(null);
        expect(childNodeB.parentNode).toBe(null);
        expect(childNodeB.parentElement).toBe(null);

        // Disconnected
        expect(childNodeC.isConnected).toBe(false);
        expect(childNodeC.firstChild).toBe(null);
        expect(childNodeC.lastChild).toBe(null);
        expect(childNodeC.previousSibling).toBe(null);
        expect(childNodeC.nextSibling).toBe(null);
        expect(childNodeC.parentNode).toBe(null);
        expect(childNodeC.parentElement).toBe(null);
      });
    });

    describe('compareDocumentPosition / contains', () => {
      it('handles containment, order and connection', () => {
        const parentRef = createRef<HostInstance>();
        const childNodeARef = createRef<HostInstance>();
        const childNodeAARef = createRef<HostInstance>();
        const childNodeBRef = createRef<HostInstance>();
        const childNodeBBRef = createRef<HostInstance>();

        // Initial render with 2 children
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View key="childA" ref={childNodeARef}>
                <View key="childAA" ref={childNodeAARef} />
              </View>
              <View key="childB" ref={childNodeBRef}>
                <View key="childBB" ref={childNodeBBRef} />
              </View>
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNodeA = ensureReactNativeElement(childNodeARef.current);
        const childNodeAA = ensureReactNativeElement(childNodeAARef.current);
        const childNodeB = ensureReactNativeElement(childNodeBRef.current);
        const childNodeBB = ensureReactNativeElement(childNodeBBRef.current);

        // Node/self
        expect(parentNode.compareDocumentPosition(parentNode)).toBe(0);
        expect(parentNode.contains(parentNode)).toBe(true);
        // Parent/child
        expect(parentNode.compareDocumentPosition(childNodeA)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
            ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(parentNode.contains(childNodeA)).toBe(true);
        // Child/parent
        expect(childNodeA.compareDocumentPosition(parentNode)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
            ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
        );
        expect(childNodeA.contains(parentNode)).toBe(false);
        // Grandparent/grandchild
        expect(parentNode.compareDocumentPosition(childNodeAA)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
            ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(parentNode.contains(childNodeAA)).toBe(true);
        // Grandchild/grandparent
        expect(childNodeAA.compareDocumentPosition(parentNode)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
            ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
        );
        expect(childNodeAA.contains(parentNode)).toBe(false);
        // Sibling/sibling
        expect(childNodeA.compareDocumentPosition(childNodeB)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(childNodeA.contains(childNodeB)).toBe(false);
        // Sibling/sibling
        expect(childNodeB.compareDocumentPosition(childNodeA)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
        );
        expect(childNodeB.contains(childNodeA)).toBe(false);
        // Cousing/cousing
        expect(childNodeAA.compareDocumentPosition(childNodeBB)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(childNodeAA.contains(childNodeBB)).toBe(false);
        // Cousing/cousing
        expect(childNodeBB.compareDocumentPosition(childNodeAA)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
        );
        expect(childNodeBB.contains(childNodeAA)).toBe(false);

        // Remove one of the children
        Fantom.runTask(() => {
          root.render(
            <View key="parent">
              <View key="childA" />
              <View key="childB" />
            </View>,
          );
        });

        // Node/disconnected
        expect(parentNode.compareDocumentPosition(childNodeAA)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(parentNode.contains(childNodeAA)).toBe(false);
        // Disconnected/node
        expect(childNodeAA.compareDocumentPosition(parentNode)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(childNodeAA.contains(parentNode)).toBe(false);
        // Disconnected/disconnected
        expect(childNodeAA.compareDocumentPosition(childNodeBB)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(childNodeAA.contains(childNodeBB)).toBe(false);
        // Disconnected/disconnected
        expect(childNodeBB.compareDocumentPosition(childNodeAA)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(childNodeBB.contains(childNodeAA)).toBe(false);
        // Disconnected/self
        expect(childNodeBB.compareDocumentPosition(childNodeBB)).toBe(0);
        expect(childNodeBB.contains(childNodeBB)).toBe(true);

        const altParentNodeRef = createRef<HostInstance>();

        // Similar structure in a different tree
        const root2 = Fantom.createRoot();
        Fantom.runTask(() => {
          root2.render(
            <View key="altParent" ref={altParentNodeRef}>
              <View key="childA" />
              <View key="childB" />
            </View>,
          );
        });

        const altParentNode = ensureReactNativeElement(
          altParentNodeRef.current,
        );

        // Node/same position in different tree
        expect(altParentNode.compareDocumentPosition(parentNode)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(parentNode.compareDocumentPosition(altParentNode)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(parentNode.contains(altParentNode)).toBe(false);
        expect(altParentNode.contains(parentNode)).toBe(false);

        // Node/child position in different tree
        expect(altParentNode.compareDocumentPosition(childNodeA)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(childNodeA.compareDocumentPosition(altParentNode)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(altParentNode.contains(childNodeA)).toBe(false);
        expect(childNodeA.contains(altParentNode)).toBe(false);

        // Unmounted root
        Fantom.runTask(() => {
          root.destroy();
        });

        expect(parentNode.compareDocumentPosition(parentNode)).toBe(0);
        expect(parentNode.contains(parentNode)).toBe(true);

        expect(parentNode.compareDocumentPosition(childNodeA)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
        expect(parentNode.compareDocumentPosition(altParentNode)).toBe(
          ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED,
        );
      });
    });
  });

  describe('extends `ReadOnlyElement`', () => {
    it('should be an instance of `ReadOnlyElement`', () => {
      const ref = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={ref} />);
      });

      expect(ref.current).toBeInstanceOf(ReadOnlyElement);
    });

    describe('children / childElementCount', () => {
      it('return updated element children information', () => {
        const parentRef = createRef<HostInstance>();
        const childElementARef = createRef<HostInstance>();
        const childElementBRef = createRef<HostInstance>();
        const childElementCRef = createRef<HostInstance>();

        // Initial render with 3 children
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View key="childA" ref={childElementARef} />
              <View key="childB" ref={childElementBRef} />
              <View key="childC" ref={childElementCRef} />
            </View>,
          );
        });

        const parentElement = ensureReactNativeElement(parentRef.current);
        const childElementA = ensureReactNativeElement(
          childElementARef.current,
        );
        const childElementB = ensureReactNativeElement(
          childElementBRef.current,
        );
        const childElementC = ensureReactNativeElement(
          childElementCRef.current,
        );

        const children = parentElement.children;
        expect(children).toBeInstanceOf(HTMLCollection);
        expect(children.length).toBe(3);
        expect(children[0]).toBe(childElementA);
        expect(children[1]).toBe(childElementB);
        expect(children[2]).toBe(childElementC);

        expect(parentElement.childElementCount).toBe(3);

        // Remove one of the children
        Fantom.runTask(() => {
          root.render(
            <View key="parent">
              <View key="childA" />
              <View key="childB" />
            </View>,
          );
        });

        const childrenAfterUpdate = parentElement.children;
        expect(childrenAfterUpdate).toBeInstanceOf(HTMLCollection);
        expect(childrenAfterUpdate.length).toBe(2);
        expect(childrenAfterUpdate[0]).toBe(childElementA);
        expect(childrenAfterUpdate[1]).toBe(childElementB);

        expect(parentElement.childElementCount).toBe(2);

        // Unmount node
        Fantom.runTask(() => {
          root.render(<></>);
        });

        const childrenAfterUnmount = parentElement.children;
        expect(childrenAfterUnmount).toBeInstanceOf(HTMLCollection);
        expect(childrenAfterUnmount.length).toBe(0);

        expect(parentElement.childElementCount).toBe(0);
      });
    });

    describe('firstElementChild / lastElementChild / previousElementSibling / nextElementSibling', () => {
      it('return updated relative elements', () => {
        const parentRef = createRef<HostInstance>();
        const childElementARef = createRef<HostInstance>();
        const childElementBRef = createRef<HostInstance>();
        const childElementCRef = createRef<HostInstance>();

        // Initial render with 3 children
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View key="childA" ref={childElementARef} />
              <View key="childB" ref={childElementBRef} />
              <View key="childC" ref={childElementCRef} />
            </View>,
          );
        });

        const parentElement = ensureReactNativeElement(parentRef.current);
        const childElementA = ensureReactNativeElement(
          childElementARef.current,
        );
        const childElementB = ensureReactNativeElement(
          childElementBRef.current,
        );
        const childElementC = ensureReactNativeElement(
          childElementCRef.current,
        );

        expect(parentElement.firstElementChild).toBe(childElementA);
        expect(parentElement.lastElementChild).toBe(childElementC);
        expect(parentElement.previousElementSibling).toBe(null);
        expect(parentElement.nextElementSibling).toBe(null);

        expect(childElementA.firstElementChild).toBe(null);
        expect(childElementA.lastElementChild).toBe(null);
        expect(childElementA.previousElementSibling).toBe(null);
        expect(childElementA.nextElementSibling).toBe(childElementB);

        expect(childElementB.firstElementChild).toBe(null);
        expect(childElementB.lastElementChild).toBe(null);
        expect(childElementB.previousElementSibling).toBe(childElementA);
        expect(childElementB.nextElementSibling).toBe(childElementC);

        expect(childElementC.firstElementChild).toBe(null);
        expect(childElementC.lastElementChild).toBe(null);
        expect(childElementC.previousElementSibling).toBe(childElementB);
        expect(childElementC.nextElementSibling).toBe(null);

        // Remove one of the children
        Fantom.runTask(() => {
          root.render(
            <View key="parent">
              <View key="childA" />
              <View key="childB" />
            </View>,
          );
        });

        expect(parentElement.firstElementChild).toBe(childElementA);
        expect(parentElement.lastElementChild).toBe(childElementB);
        expect(parentElement.previousElementSibling).toBe(null);
        expect(parentElement.nextElementSibling).toBe(null);

        expect(childElementA.firstElementChild).toBe(null);
        expect(childElementA.lastElementChild).toBe(null);
        expect(childElementA.previousElementSibling).toBe(null);
        expect(childElementA.nextElementSibling).toBe(childElementB);

        expect(childElementB.firstElementChild).toBe(null);
        expect(childElementB.lastElementChild).toBe(null);
        expect(childElementB.previousElementSibling).toBe(childElementA);
        expect(childElementB.nextElementSibling).toBe(null);

        // Disconnected
        expect(childElementC.firstElementChild).toBe(null);
        expect(childElementC.lastElementChild).toBe(null);
        expect(childElementC.previousElementSibling).toBe(null);
        expect(childElementC.nextElementSibling).toBe(null);

        // Unmount node
        Fantom.runTask(() => {
          root.render(<></>);
        });

        // Disconnected
        expect(parentElement.firstElementChild).toBe(null);
        expect(parentElement.lastElementChild).toBe(null);
        expect(parentElement.previousElementSibling).toBe(null);
        expect(parentElement.nextElementSibling).toBe(null);

        // Disconnected
        expect(childElementA.firstElementChild).toBe(null);
        expect(childElementA.lastElementChild).toBe(null);
        expect(childElementA.previousElementSibling).toBe(null);
        expect(childElementA.nextElementSibling).toBe(null);

        // Disconnected
        expect(childElementB.firstElementChild).toBe(null);
        expect(childElementB.lastElementChild).toBe(null);
        expect(childElementB.previousElementSibling).toBe(null);
        expect(childElementB.nextElementSibling).toBe(null);

        // Disconnected
        expect(childElementC.firstElementChild).toBe(null);
        expect(childElementC.lastElementChild).toBe(null);
        expect(childElementC.previousElementSibling).toBe(null);
        expect(childElementC.nextElementSibling).toBe(null);
      });
    });

    describe('textContent', () => {
      it('should return the concatenated values of all its text node descendants (using DFS)', () => {
        const parentRef = createRef<HostInstance>();
        const childNodeARef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <NativeText>Hello </NativeText>
              <View key="childA" ref={childNodeARef}>
                <NativeText>world!</NativeText>
              </View>
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNodeA = ensureReactNativeElement(childNodeARef.current);

        expect(parentNode.textContent).toBe('Hello world!');
        expect(childNodeA.textContent).toBe('world!');

        const childNodeBRef = createRef<HostInstance>();
        Fantom.runTask(() => {
          root.render(
            <View key="parent">
              <NativeText>Hello </NativeText>
              <View key="childA">
                <NativeText>world </NativeText>
              </View>
              <View key="childB" ref={childNodeBRef}>
                <View key="childBB">
                  <NativeText>
                    again
                    <NativeVirtualText> and again!</NativeVirtualText>
                  </NativeText>
                </View>
              </View>
            </View>,
          );
        });

        const childNodeB = ensureReactNativeElement(childNodeBRef.current);

        expect(parentNode.textContent).toBe('Hello world again and again!');
        expect(childNodeA.textContent).toBe('world ');
        expect(childNodeB.textContent).toBe('again and again!');
      });
    });

    describe('getBoundingClientRect', () => {
      it('returns a DOMRect with its size and position, or an empty DOMRect when disconnected', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View
              key="parent"
              style={{
                position: 'absolute',
                left: 5.1,
                top: 10.2,
                width: 50.3,
                height: 100.4,
              }}
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        const boundingClientRect = element.getBoundingClientRect();
        expect(boundingClientRect).toBeInstanceOf(DOMRect);
        expect(boundingClientRect.x).toBe(5);
        expect(boundingClientRect.y).toBeCloseTo(10.33);
        expect(boundingClientRect.width).toBeCloseTo(50.33);
        expect(boundingClientRect.height).toBeCloseTo(100.33);

        Fantom.runTask(() => {
          root.render(<View key="otherParent" />);
        });

        const boundingClientRectAfterUnmount = element.getBoundingClientRect();
        expect(boundingClientRectAfterUnmount).toBeInstanceOf(DOMRect);
        expect(boundingClientRectAfterUnmount.x).toBe(0);
        expect(boundingClientRectAfterUnmount.y).toBe(0);
        expect(boundingClientRectAfterUnmount.width).toBe(0);
        expect(boundingClientRectAfterUnmount.height).toBe(0);
      });

      it('returns a DOMRect with its size and position respecting viewport offsets', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportOffsetX: 111,
          viewportOffsetY: 222,
        });

        Fantom.runTask(() => {
          root.render(
            <View
              key="parent"
              style={{
                position: 'absolute',
                left: 5.1,
                top: 10.2,
                width: 50.3,
                height: 100.4,
              }}
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        const boundingClientRect = element.getBoundingClientRect();
        expect(boundingClientRect).toBeInstanceOf(DOMRect);
        expect(boundingClientRect.x).toBe(116);
        expect(boundingClientRect.y).toBeCloseTo(232.33);
        expect(boundingClientRect.width).toBeCloseTo(50.33);
        expect(boundingClientRect.height).toBeCloseTo(100.33);
      });

      it('returns a DOMRect for Text elements', () => {
        const textRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{
                position: 'absolute',
                left: 10,
                top: 20,
              }}>
              <Text
                style={{
                  width: 100,
                  height: 50,
                }}
                ref={textRef}>
                Hello World
              </Text>
            </View>,
          );
        });

        const textElement = ensureReactNativeElement(textRef.current);

        // Text element should have a valid bounding rect
        const textBoundingRect = textElement.getBoundingClientRect();
        expect(textBoundingRect).toBeInstanceOf(DOMRect);
        expect(textBoundingRect.width).toBe(100);
        expect(textBoundingRect.height).toBe(50);

        // After unmounting, should return empty DOMRect
        Fantom.runTask(() => {
          root.render(<View key="otherParent" />);
        });

        const textBoundingRectAfterUnmount =
          textElement.getBoundingClientRect();
        expect(textBoundingRectAfterUnmount).toBeInstanceOf(DOMRect);
        expect(textBoundingRectAfterUnmount.x).toBe(0);
        expect(textBoundingRectAfterUnmount.y).toBe(0);
        expect(textBoundingRectAfterUnmount.width).toBe(0);
        expect(textBoundingRectAfterUnmount.height).toBe(0);
      });

      it('returns a DOMRect for nested Text elements', () => {
        const outerTextRef = createRef<HostInstance>();
        const nestedTextRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{
                position: 'absolute',
                left: 10,
                top: 20,
              }}>
              <Text
                style={{
                  width: 100,
                  height: 50,
                }}
                ref={outerTextRef}>
                Hello
                <Text ref={nestedTextRef}> World</Text>
              </Text>
            </View>,
          );
        });

        const outerTextElement = ensureReactNativeElement(outerTextRef.current);
        const nestedTextElement = ensureReactNativeElement(
          nestedTextRef.current,
        );

        // Outer text element should have a valid bounding rect
        const outerTextBoundingRect = outerTextElement.getBoundingClientRect();
        expect(outerTextBoundingRect).toBeInstanceOf(DOMRect);
        expect(outerTextBoundingRect.width).toBe(100);
        expect(outerTextBoundingRect.height).toBe(50);

        // Nested text (virtual text) returns a DOMRect with zero values
        // since it doesn't have its own independent layout
        const nestedTextBoundingRect =
          nestedTextElement.getBoundingClientRect();
        expect(nestedTextBoundingRect).toBeInstanceOf(DOMRect);
        expect(nestedTextBoundingRect.x).toBe(0);
        expect(nestedTextBoundingRect.y).toBe(0);
        expect(nestedTextBoundingRect.width).toBe(0);
        expect(nestedTextBoundingRect.height).toBe(0);

        // After unmounting, both should return empty DOMRects
        Fantom.runTask(() => {
          root.render(<View key="otherParent" />);
        });

        const outerTextBoundingRectAfterUnmount =
          outerTextElement.getBoundingClientRect();
        expect(outerTextBoundingRectAfterUnmount).toBeInstanceOf(DOMRect);
        expect(outerTextBoundingRectAfterUnmount.x).toBe(0);
        expect(outerTextBoundingRectAfterUnmount.y).toBe(0);
        expect(outerTextBoundingRectAfterUnmount.width).toBe(0);
        expect(outerTextBoundingRectAfterUnmount.height).toBe(0);

        const nestedTextBoundingRectAfterUnmount =
          nestedTextElement.getBoundingClientRect();
        expect(nestedTextBoundingRectAfterUnmount).toBeInstanceOf(DOMRect);
        expect(nestedTextBoundingRectAfterUnmount.x).toBe(0);
        expect(nestedTextBoundingRectAfterUnmount.y).toBe(0);
        expect(nestedTextBoundingRectAfterUnmount.width).toBe(0);
        expect(nestedTextBoundingRectAfterUnmount.height).toBe(0);
      });
    });

    describe('scrollLeft / scrollTop', () => {
      it('return the scroll position on each axis', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              key="parent"
              contentOffset={{x: 5.1, y: 10.2}}
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.scrollLeft).toBeCloseTo(5.1);
        expect(element.scrollTop).toBeCloseTo(10.2);

        Fantom.runTask(() => {
          root.render(<View key="otherParent" />);
        });

        expect(element.scrollLeft).toBe(0);
        expect(element.scrollTop).toBe(0);
      });
    });

    describe('scrollWidth / scrollHeight', () => {
      it('return the scroll size on each axis', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              key="parent"
              style={{width: 100, height: 100}}
              ref={elementRef}>
              <View style={{width: 200, height: 1500}} />
            </ScrollView>,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.scrollWidth).toBe(200);
        expect(element.scrollHeight).toBe(1500);

        Fantom.runTask(() => {
          root.render(<View key="otherParent" />);
        });

        expect(element.scrollWidth).toBe(0);
        expect(element.scrollHeight).toBe(0);
      });
    });

    describe('clientWidth / clientHeight', () => {
      it('return the inner size of the node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View
              key="parent"
              style={{
                width: 200,
                height: 250,
              }}
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.clientWidth).toBe(200);
        expect(element.clientHeight).toBe(250);

        Fantom.runTask(() => {
          root.render(<View key="otherParent" />);
        });

        expect(element.clientWidth).toBe(0);
        expect(element.clientHeight).toBe(0);
      });
    });

    describe('clientLeft / clientTop', () => {
      it('return the border size of the node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View
              key="parent"
              style={{
                borderTopWidth: 250,
                borderLeftWidth: 200,
              }}
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.clientLeft).toBe(200);
        expect(element.clientTop).toBe(250);

        Fantom.runTask(() => {
          root.render(<View key="otherParent" />);
        });

        expect(element.clientLeft).toBe(0);
        expect(element.clientTop).toBe(0);
      });
    });

    describe('id', () => {
      it('returns the current `id` prop from the node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View
              key="parent"
              id="<react-native-element-id>"
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.id).toBe('<react-native-element-id>');
      });

      it('returns the current `nativeID` prop from the node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View
              key="parent"
              nativeID="<react-native-element-id>"
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.id).toBe('<react-native-element-id>');
      });
    });

    describe('tagName', () => {
      it('returns the normalized tag name for the node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<View ref={elementRef} />);
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.tagName).toBe('RN:View');
      });
    });
  });

  describe('extends `ReactNativeElement`', () => {
    it('should be an instance of `ReactNativeElement`', () => {
      const ref = createRef<HostInstance>();

      // Initial render with 3 children
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={ref} />);
      });

      const node = ensureReactNativeElement(ref.current);
      expect(node).toBeInstanceOf(ReactNativeElement);
    });

    describe('offsetWidth / offsetHeight', () => {
      it('return the rounded width and height, or 0 when disconnected', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View
              key="parent"
              style={{
                position: 'absolute',
                left: 5.1,
                top: 10.2,
                width: 50.3,
                height: 100.5,
              }}
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.offsetWidth).toBe(50);
        expect(element.offsetHeight).toBe(100);

        Fantom.runTask(() => {
          root.render(<View key="otherParent" />);
        });

        expect(element.offsetWidth).toBe(0);
        expect(element.offsetHeight).toBe(0);
      });
    });

    describe('offsetParent / offsetTop / offsetLeft', () => {
      it('return the rounded offset values and the parent, or null and zeros when disconnected or hidden', () => {
        const parentRef = createRef<HostInstance>();
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View
                key="child"
                style={{marginTop: 10.6, marginLeft: 5.1}}
                ref={elementRef}
              />
            </View>,
          );
        });

        const parentElement = ensureReactNativeElement(parentRef.current);
        const element = ensureReactNativeElement(elementRef.current);

        expect(element.offsetTop).toBe(11);
        expect(element.offsetLeft).toBe(5);
        expect(element.offsetParent).toBe(parentElement);

        expect(parentElement.offsetParent).toBe(root.document.documentElement);

        Fantom.runTask(() => {
          root.render(
            <View key="parent" style={{display: 'none'}}>
              <View key="child" style={{marginTop: 10.6, marginLeft: 5.1}} />
            </View>,
          );
        });

        expect(element.offsetTop).toBe(0);
        expect(element.offsetLeft).toBe(0);
        expect(element.offsetParent).toBe(null);

        Fantom.runTask(() => {
          root.render(<View key="parent" />);
        });

        expect(element.offsetTop).toBe(0);
        expect(element.offsetLeft).toBe(0);
        expect(element.offsetParent).toBe(null);
      });

      it('return the rounded offset values from the parent with view offsets', () => {
        const parentRef = createRef<HostInstance>();
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportOffsetX: 111,
          viewportOffsetY: 222,
        });

        Fantom.runTask(() => {
          root.render(
            <View key="parent" ref={parentRef}>
              <View
                key="child"
                style={{marginTop: 10.6, marginLeft: 5.1}}
                ref={elementRef}
              />
            </View>,
          );
        });

        const parentElement = ensureReactNativeElement(parentRef.current);
        const element = ensureReactNativeElement(elementRef.current);

        expect(element.offsetTop).toBe(11);
        expect(element.offsetLeft).toBe(5);
        expect(element.offsetParent).toBe(parentElement);

        expect(parentElement.offsetParent).toBe(root.document.documentElement);
      });

      it('return the rounded offset values from the root with view offsets', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportOffsetX: 111,
          viewportOffsetY: 222,
        });

        Fantom.runTask(() => {
          root.render(
            <View
              key="child"
              style={{marginTop: 10.6, marginLeft: 5.1}}
              ref={elementRef}
            />,
          );
        });

        const element = ensureReactNativeElement(elementRef.current);

        expect(element.offsetTop).toBe(11);
        expect(element.offsetLeft).toBe(5);
      });
    });
  });

  describe('legacy methods', () => {
    describe('blur', () => {
      test('blur() invokes TextInputState', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput ref={nodeRef} />);
        });

        const node = ensureReactNativeElement(nodeRef.current);

        const blurTextInput = jest.fn();

        // We don't support view commands in Fantom yet, so we have to mock this.
        TextInputState.blurTextInput = blurTextInput;

        Fantom.runTask(() => {
          node.blur();
        });

        expect(blurTextInput).toHaveBeenCalledTimes(1);
        expect(blurTextInput.mock.calls).toEqual([[node]]);
      });
    });

    describe('focus', () => {
      test('focus() invokes TextInputState', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput ref={ref} />);
        });

        const node = ensureReactNativeElement(ref.current);

        const focusTextInput = jest.fn();

        // We don't support view commands in Fantom yet, so we have to mock this.
        TextInputState.focusTextInput = focusTextInput;

        Fantom.runTask(() => {
          node.focus();
        });

        expect(focusTextInput).toHaveBeenCalledTimes(1);
        expect(focusTextInput.mock.calls).toEqual([[node]]);
      });
    });

    describe('measure', () => {
      it('component.measure(...) invokes callback', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={ref}
            />,
          );
        });

        const node = ensureReactNativeElement(ref.current);

        const callback = jest.fn();
        node.measure(callback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls).toEqual([[10, 10, 100, 100, 10, 10]]);
      });

      it('unmounted.measure(...) does nothing', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={ref}
            />,
          );
        });

        const node = ensureReactNativeElement(ref.current);

        Fantom.runTask(() => {
          root.render(<></>);
        });

        const callback = jest.fn();
        node.measure(callback);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('measureInWindow', () => {
      it('component.measureInWindow(...) invokes callback', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={ref}
            />,
          );
        });

        const node = ensureReactNativeElement(ref.current);

        const callback = jest.fn();
        node.measureInWindow(callback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls).toEqual([[10, 10, 100, 100]]);
      });

      it('unmounted.measureInWindow(...) does nothing', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={ref}
            />,
          );
        });

        const node = ensureReactNativeElement(ref.current);

        Fantom.runTask(() => {
          root.render(<></>);
        });

        const callback = jest.fn();
        node.measureInWindow(callback);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('measureLayout', () => {
      it('component.measureLayout(component, ...) invokes callback', () => {
        const root = Fantom.createRoot();
        const parentRef = createRef<HostInstance>();
        const childRef = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={parentRef}>
              <View
                style={{width: 10, height: 10, left: 20, top: 20}}
                ref={childRef}
              />
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNode = ensureReactNativeElement(childRef.current);

        const callback = jest.fn();
        childNode.measureLayout(parentNode, callback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls).toEqual([[20, 20, 10, 10]]);
      });

      it('unmounted.measureLayout(component, ...) does nothing', () => {
        const root = Fantom.createRoot();
        const parentRef = createRef<HostInstance>();
        const childRef = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={parentRef}>
              <View
                style={{width: 10, height: 10, left: 20, top: 20}}
                ref={childRef}
              />
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNode = ensureReactNativeElement(childRef.current);

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100, left: 10, top: 10}} />,
          );
        });

        const callback = jest.fn();
        childNode.measureLayout(parentNode, callback);

        expect(callback).not.toHaveBeenCalled();
      });

      it('component.measureLayout(unmounted, ...) does nothing', () => {
        const root = Fantom.createRoot();
        const parentRef = createRef<HostInstance>();
        const childRef = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={parentRef}>
              <View
                style={{width: 10, height: 10, left: 20, top: 20}}
                ref={childRef}
              />
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNode = ensureReactNativeElement(childRef.current);

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100, left: 10, top: 10}} />,
          );
        });

        const callback = jest.fn();
        parentNode.measureLayout(childNode, callback);

        expect(callback).not.toHaveBeenCalled();
      });

      it('unmounted.measureLayout(unmounted, ...) does nothing', () => {
        const root = Fantom.createRoot();
        const parentRef = createRef<HostInstance>();
        const childRef = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View
              style={{width: 100, height: 100, left: 10, top: 10}}
              ref={parentRef}>
              <View
                style={{width: 10, height: 10, left: 20, top: 20}}
                ref={childRef}
              />
            </View>,
          );
        });

        const parentNode = ensureReactNativeElement(parentRef.current);
        const childNode = ensureReactNativeElement(childRef.current);

        Fantom.runTask(() => {
          root.render(<></>);
        });

        const callback = jest.fn();
        childNode.measureLayout(parentNode, callback);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('setNativeProps', () => {
      it('should propagate changes to the host component', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(<View ref={nodeRef} testID="first test id" />);
        });

        expect(
          root
            .getRenderedOutput({
              props: ['testID'],
            })
            .toJSX(),
        ).toEqual(<rn-view testID={'first test id'} />);

        const element = ensureReactNativeElement(nodeRef.current);

        Fantom.runTask(() => {
          element.setNativeProps({testID: 'second test id'});
        });

        expect(
          root
            .getRenderedOutput({
              props: ['testID'],
            })
            .toJSX(),
        ).toEqual(<rn-view testID={'second test id'} />);
      });
    });
  });

  describe('imperative EventTarget API', () => {
    // These tests run with `enableNativeEventTargetEventDispatching:true` and
    // `enableImperativeEvents:*` (see the `@fantom_flags` pragmas). The public
    // EventTarget API is gated behind `enableImperativeEvents`: when it is off
    // the methods are removed from this final class, when it is on they are
    // available.
    const {isOSS} = Fantom.getConstants();

    if (!ReactNativeFeatureFlags.enableImperativeEvents()) {
      describe('when `enableImperativeEvents` is off (default)', () => {
        it('removes the public EventTarget methods', () => {
          const ref = createRef<HostInstance>();
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View ref={ref} />);
          });

          const element = ensureReactNativeElement(
            ref.current,
          ) as MaybeEventTarget;
          expect(typeof element.addEventListener).toBe('undefined');
          expect(typeof element.removeEventListener).toBe('undefined');
          expect(typeof element.dispatchEvent).toBe('undefined');
        });

        // Removing the public API must not affect native/prop event delivery,
        // which goes through the internal (symbol-keyed) dispatch path.
        (isOSS ? it.skip : it)(
          'still delivers native events to prop handlers',
          () => {
            const ref = createRef<HostInstance>();
            const onPointerUp = jest.fn();
            const root = Fantom.createRoot();

            Fantom.runTask(() => {
              root.render(<View ref={ref} onPointerUp={onPointerUp} />);
            });

            expect(onPointerUp).toHaveBeenCalledTimes(0);

            Fantom.dispatchNativeEvent(
              ref,
              'onPointerUp',
              {x: 0, y: 0},
              {
                category: Fantom.NativeEventCategory.Discrete,
              },
            );

            expect(onPointerUp).toHaveBeenCalledTimes(1);
          },
        );
      });
    }

    if (ReactNativeFeatureFlags.enableImperativeEvents()) {
      describe('when `enableImperativeEvents` is on', () => {
        it('exposes the public EventTarget methods', () => {
          const ref = createRef<HostInstance>();
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View ref={ref} />);
          });

          const element = ensureReactNativeElement(
            ref.current,
          ) as MaybeEventTarget;
          expect(typeof element.addEventListener).toBe('function');
          expect(typeof element.removeEventListener).toBe('function');
          expect(typeof element.dispatchEvent).toBe('function');
        });

        it('round-trips a listener via `addEventListener` + `dispatchEvent`', () => {
          const ref = createRef<HostInstance>();
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View ref={ref} />);
          });

          const element = ensureReactNativeElement(
            ref.current,
          ) as MaybeEventTarget;
          const listener = jest.fn();

          element.addEventListener?.('custom', listener);
          const result = element.dispatchEvent?.(new Event('custom'));

          expect(listener).toHaveBeenCalledTimes(1);
          expect(result).toBe(true);

          element.removeEventListener?.('custom', listener);
          element.dispatchEvent?.(new Event('custom'));

          expect(listener).toHaveBeenCalledTimes(1);
        });
      });
    }
  });

  describe('global constructors', () => {
    it('throws when constructing HTMLElement', () => {
      expect(() => new HTMLElement()).toThrow(
        "Failed to construct 'HTMLElement': Nodes cannot be imperatively created in React Native",
      );
    });

    it('throws when constructing Element', () => {
      expect(() => new Element()).toThrow(
        "Failed to construct 'Element': Illegal constructor",
      );
    });
  });
});
