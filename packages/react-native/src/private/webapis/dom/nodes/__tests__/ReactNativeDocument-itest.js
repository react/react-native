/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../__tests__/utilities/ensureInstance';
import isUnreachable from '../../../../__tests__/utilities/isUnreachable';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';

describe('ReactNativeDocument', () => {
  it('is connected until the surface is destroyed', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = nullthrows(nodeRef.current);
    const document = ensureInstance(element.ownerDocument, Document);

    expect(document.isConnected).toBe(true);

    Fantom.runTask(() => {
      root.render(<></>);
    });

    expect(document.isConnected).toBe(true);

    Fantom.runTask(() => {
      root.destroy();
    });

    expect(document.isConnected).toBe(false);
  });

  it('allows traversal as a regular node', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = nullthrows(nodeRef.current);
    const document = ensureInstance(element.ownerDocument, Document);
    const documentElement = nullthrows(document.documentElement);

    expect(document.childNodes.length).toBe(1);
    expect(document.childNodes[0]).toBe(documentElement);
    expect(documentElement.parentNode).toBe(document);
    expect(documentElement.childNodes.length).toBe(1);
    expect(documentElement.childNodes[0]).toBe(element);
    expect(element.parentNode).toBe(documentElement);
  });

  it('allows traversal through document-specific methods', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = nullthrows(nodeRef.current);
    const document = ensureInstance(element.ownerDocument, Document);

    expect(document.childElementCount).toBe(1);
    expect(document.firstElementChild).toBe(document.documentElement);
    expect(document.lastElementChild).toBe(document.documentElement);
    expect(document.children).toBeInstanceOf(HTMLCollection);
    expect([...document.children]).toEqual([document.documentElement]);
  });

  it('implements the abstract methods from ReadOnlyNode', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = nullthrows(nodeRef.current);
    const document = ensureInstance(element.ownerDocument, Document);

    expect(document.nodeName).toBe('#document');
    expect(document.nodeType).toBe(Node.DOCUMENT_NODE);
    expect(document.nodeValue).toBe(null);
    expect(document.textContent).toBe(null);
  });

  it('provides a documentElement node that behaves like a regular element', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot({
      viewportWidth: 200,
      viewportHeight: 100,
      viewportOffsetX: 111,
      viewportOffsetY: 222,
    });
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = nullthrows(nodeRef.current);
    const document = ensureInstance(element.ownerDocument, Document);
    const documentElement = nullthrows(document.documentElement);

    const {x, y, width, height} = documentElement.getBoundingClientRect();

    expect(x).toBe(111);
    expect(y).toBe(222);
    expect(width).toBe(200);
    expect(height).toBe(100);

    expect(documentElement.offsetParent).toBe(null);
    expect(documentElement.offsetTop).toBe(0);
    expect(documentElement.offsetLeft).toBe(0);
  });

  it('implements compareDocumentPosition correctly', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = ensureInstance(nodeRef.current, Element);
    const document = ensureInstance(element.ownerDocument, Document);
    const documentElement = nullthrows(document.documentElement);

    /* eslint-disable no-bitwise */

    expect(document.compareDocumentPosition(document)).toBe(0);
    expect(documentElement.compareDocumentPosition(documentElement)).toBe(0);

    expect(document.compareDocumentPosition(documentElement)).toBe(
      Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(document.compareDocumentPosition(element)).toBe(
      Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(documentElement.compareDocumentPosition(document)).toBe(
      Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING,
    );
    expect(documentElement.compareDocumentPosition(element)).toBe(
      Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(element.compareDocumentPosition(document)).toBe(
      Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING,
    );
    expect(element.compareDocumentPosition(documentElement)).toBe(
      Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING,
    );
  });

  it('is released when the root is destroyed', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    let maybeWeakNode;
    let maybeWeakDocument;
    Fantom.runTask(() => {
      maybeWeakDocument = new WeakRef(
        ensureInstance(nullthrows(nodeRef.current).ownerDocument, Document),
      );
      maybeWeakNode = new WeakRef(nullthrows(nodeRef.current));
    });

    const weakDocument = nullthrows(maybeWeakDocument);
    const weakNode = nullthrows(maybeWeakNode);

    expect(isUnreachable(weakDocument)).toBe(false);
    expect(isUnreachable(weakNode)).toBe(false);

    Fantom.runTask(() => {
      root.destroy();
    });

    expect(nodeRef.current).toBe(null);
    expect(isUnreachable(weakDocument)).toBe(true);
    expect(isUnreachable(weakNode)).toBe(true);
  });

  describe('getElementById', () => {
    it('returns the first element with the given ID, doing a depth-first search', () => {
      let lastNode;
      let fooNode;
      let barFirstNode;
      let barLastNode;
      let bazNode;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View
            ref={node => {
              lastNode = node;
            }}>
            <View
              id="foo"
              key="foo"
              ref={node => {
                fooNode = node;
              }}
            />
            <View
              id="bar"
              key="bar"
              ref={node => {
                barFirstNode = node;
              }}
            />
            <View key="parent">
              <View id="bar" />
              <View
                id="baz"
                ref={node => {
                  bazNode = node;
                }}
              />
            </View>
          </View>,
        );
      });

      const element = ensureInstance(lastNode, Element);
      const document = ensureInstance(element.ownerDocument, Document);

      expect(document.getElementById('foo')).toBe(fooNode);
      expect(document.getElementById('bar')).toBe(barFirstNode);
      expect(document.getElementById('baz')).toBe(bazNode);
      expect(document.getElementById('foobar')).toBe(null);

      // Remove foo and first bar.
      Fantom.runTask(() => {
        root.render(
          <View
            ref={node => {
              lastNode = node;
            }}>
            <View key="parent">
              <View
                id="bar"
                ref={node => {
                  barLastNode = node;
                }}
              />
              <View
                id="baz"
                ref={node => {
                  bazNode = node;
                }}
              />
            </View>
          </View>,
        );
      });

      expect(document.getElementById('foo')).toBe(null);
      expect(document.getElementById('bar')).toBe(barLastNode);
      expect(document.getElementById('baz')).toBe(bazNode);

      Fantom.runTask(() => {
        root.destroy();
      });

      expect(document.getElementById('foo')).toBe(null);
      expect(document.getElementById('bar')).toBe(null);
      expect(document.getElementById('baz')).toBe(null);
    });
  });

  describe('global constructor', () => {
    it('throws when called', () => {
      expect(() => new Document()).toThrow(
        "Failed to construct 'Document': Nodes cannot be imperatively created in React Native",
      );
    });
  });
});
