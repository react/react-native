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
import ReactNativeDocument from 'react-native/src/private/webapis/dom/nodes/ReactNativeDocument';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import ReadOnlyNode from 'react-native/src/private/webapis/dom/nodes/ReadOnlyNode';

describe('ReactNativeDocument', () => {
  it('is connected until the surface is destroyed', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = ensureInstance(nodeRef.current, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

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

    const element = ensureInstance(nodeRef.current, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

    expect(document.childNodes.length).toBe(1);
    expect(document.childNodes[0]).toBe(document.documentElement);
    expect(document.documentElement.parentNode).toBe(document);
    expect(document.documentElement.childNodes.length).toBe(1);
    expect(document.documentElement.childNodes[0]).toBe(element);
    expect(element.parentNode).toBe(document.documentElement);
  });

  it('allows traversal through document-specific methods', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = ensureInstance(nodeRef.current, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

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

    const element = ensureInstance(nodeRef.current, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

    expect(document.nodeName).toBe('#document');
    expect(document.nodeType).toBe(ReadOnlyNode.DOCUMENT_NODE);
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

    const element = ensureInstance(nodeRef.current, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);

    const {x, y, width, height} =
      document.documentElement.getBoundingClientRect();

    expect(x).toBe(111);
    expect(y).toBe(222);
    expect(width).toBe(200);
    expect(height).toBe(100);

    expect(document.documentElement.offsetParent).toBe(null);
    expect(document.documentElement.offsetTop).toBe(0);
    expect(document.documentElement.offsetLeft).toBe(0);
  });

  it('implements compareDocumentPosition correctly', () => {
    const nodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View ref={nodeRef} />);
    });

    const element = ensureInstance(nodeRef.current, ReactNativeElement);
    const document = ensureInstance(element.ownerDocument, ReactNativeDocument);
    const documentElement = document.documentElement;

    /* eslint-disable no-bitwise */

    expect(document.compareDocumentPosition(document)).toBe(0);
    expect(
      document.documentElement.compareDocumentPosition(
        document.documentElement,
      ),
    ).toBe(0);

    expect(document.compareDocumentPosition(documentElement)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
        ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(document.compareDocumentPosition(element)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
        ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(documentElement.compareDocumentPosition(document)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
        ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
    );
    expect(documentElement.compareDocumentPosition(element)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
        ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(element.compareDocumentPosition(document)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
        ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
    );
    expect(element.compareDocumentPosition(documentElement)).toBe(
      ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
        ReadOnlyNode.DOCUMENT_POSITION_PRECEDING,
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
        ensureInstance(
          ensureInstance(nodeRef.current, ReactNativeElement).ownerDocument,
          ReactNativeDocument,
        ),
      );
      maybeWeakNode = new WeakRef(
        ensureInstance(nodeRef.current, ReactNativeElement),
      );
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

      const element = ensureInstance(lastNode, ReactNativeElement);
      const document = ensureInstance(
        element.ownerDocument,
        ReactNativeDocument,
      );

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
