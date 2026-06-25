/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableNativeEventTargetEventDispatching:true
 * @fantom_flags enableImperativeEvents:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import invariant from 'invariant';
import * as React from 'react';
import {createRef} from 'react';
import {NativeText} from 'react-native/Libraries/Text/TextNativeComponent';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import ReadOnlyNode from 'react-native/src/private/webapis/dom/nodes/ReadOnlyNode';
import ReadOnlyText from 'react-native/src/private/webapis/dom/nodes/ReadOnlyText';

function ensureReadOnlyText(value: unknown): ReadOnlyText {
  return ensureInstance(value, ReadOnlyText);
}

function ensureReadOnlyNode(value: unknown): ReadOnlyNode {
  return ensureInstance(value, ReadOnlyNode);
}

function ensureReactNativeElement(value: unknown): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

// The public imperative EventTarget API is not part of the static type of this
// final class (it is only present at runtime, gated by feature flags), so we
// cast to an interface with optional members to inspect it without Flow errors.
// Optional members make this a valid upcast and let us assert both presence
// (`'function'`) and absence (`'undefined'`).
type MaybeEventTarget = interface {
  addEventListener?: unknown,
  removeEventListener?: unknown,
  dispatchEvent?: unknown,
};

describe('ReadOnlyText', () => {
  it('should be used to create public text instances', () => {
    const parentNodeRef = createRef<HostInstance>();

    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
    });

    const parentNode = ensureReadOnlyNode(parentNodeRef.current);
    const textNode = parentNode.childNodes[0];

    expect(textNode).toBeInstanceOf(ReadOnlyText);
  });

  describe('extends `ReadOnlyNode`', () => {
    describe('nodeName', () => {
      it('returns "#text"', () => {
        const parentNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode = ensureReadOnlyNode(parentNodeRef.current);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeName).toBe('#text');
      });
    });

    describe('nodeType', () => {
      it('returns ReadOnlyNode.TEXT_NODE', () => {
        const parentNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode = ensureReadOnlyNode(parentNodeRef.current);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeType).toBe(ReadOnlyNode.TEXT_NODE);
      });
    });

    describe('nodeValue / textContent', () => {
      it('returns the string data contained in the node', () => {
        const parentNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode = ensureReadOnlyNode(parentNodeRef.current);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeValue).toBe('Some text');
        expect(textNode.textContent).toBe('Some text');
      });
    });

    describe('traversal', () => {
      it('only preserves text nodes when their contents do not change', () => {
        const parentElementRef = createRef<HostInstance>();
        const childElementARef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <NativeText key="parent" ref={parentElementRef}>
              Text A
              <NativeText key="childA" ref={childElementARef} />
              Text B
            </NativeText>,
          );
        });

        const parentElement: ReactNativeElement = ensureReactNativeElement(
          parentElementRef.current,
        );
        const childElementA: ReactNativeElement = ensureReactNativeElement(
          childElementARef.current,
        );

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        expect(childTextA.textContent).toBe('Text A');
        const childTextB = parentElement.childNodes[2];
        invariant(
          childTextB instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        expect(childTextB.textContent).toBe('Text B');

        // Validate structure
        expect(parentElement.childNodes.length).toBe(3);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).toBe(childTextB);

        // Change contents of the second text only
        Fantom.runTask(() => {
          root.render(
            <NativeText key="parent" ref={parentElementRef}>
              Text A
              <NativeText key="childA" ref={childElementARef} />
              Text B modified
            </NativeText>,
          );
        });

        expect(parentElement.childNodes.length).toBe(3);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).not.toBe(childTextB);
        expect(parentElement.childNodes[2]).toBeInstanceOf(ReadOnlyText);
        expect(ensureReadOnlyText(parentElement.childNodes[2]).data).toBe(
          'Text B modified',
        );
        expect(childTextB.isConnected).toBe(false);
      });
    });
  });

  describe('extends `ReadOnlyCharacterData`', () => {
    describe('data / length', () => {
      it('returns the string data and its length, respectively', () => {
        const parentNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode: ReadOnlyNode = ensureReadOnlyNode(
          parentNodeRef.current,
        );
        const textNode = ensureReadOnlyText(parentNode.childNodes[0]);

        expect(textNode.data).toBe('Some text');
        expect(textNode.length).toBe('Some text'.length);
      });
    });

    describe('previousElementSibling / nextElementSibling', () => {
      it('return updated relative elements', () => {
        const parentElementRef = createRef<HostInstance>();
        const childElementARef = createRef<HostInstance>();
        const childElementBRef = createRef<HostInstance>();
        const childElementCRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <NativeText key="parent" ref={parentElementRef}>
              Text A
              <NativeText key="childA" ref={childElementARef} />
              Text B
              <NativeText key="childB" ref={childElementBRef} />
              Text C
              <NativeText key="childC" ref={childElementCRef} />
              Text D
            </NativeText>,
          );
        });

        const parentElement = ensureReactNativeElement(
          parentElementRef.current,
        );
        const childElementA = ensureReactNativeElement(
          childElementARef.current,
        );
        const childElementB = ensureReactNativeElement(
          childElementBRef.current,
        );
        const childElementC = ensureReactNativeElement(
          childElementCRef.current,
        );

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextB = parentElement.childNodes[2];
        invariant(
          childTextB instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextC = parentElement.childNodes[4];
        invariant(
          childTextC instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextD = parentElement.childNodes[6];
        invariant(
          childTextD instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );

        // Validate structure
        expect(parentElement.childNodes.length).toBe(7);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).toBe(childTextB);
        expect(parentElement.childNodes[3]).toBe(childElementB);
        expect(parentElement.childNodes[4]).toBe(childTextC);
        expect(parentElement.childNodes[5]).toBe(childElementC);
        expect(parentElement.childNodes[6]).toBe(childTextD);

        expect(childTextA.previousElementSibling).toBe(null);
        expect(childTextA.nextElementSibling).toBe(childElementA);

        expect(childTextB.previousElementSibling).toBe(childElementA);
        expect(childTextB.nextElementSibling).toBe(childElementB);

        expect(childTextC.previousElementSibling).toBe(childElementB);
        expect(childTextC.nextElementSibling).toBe(childElementC);

        expect(childTextD.previousElementSibling).toBe(childElementC);
        expect(childTextD.nextElementSibling).toBe(null);
      });
    });

    describe('substringData', () => {
      it('returns a slice of the text content', () => {
        const parentElementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <NativeText key="parent" ref={parentElementRef}>
              Text A
            </NativeText>,
          );
        });

        const parentElement = ensureReactNativeElement(
          parentElementRef.current,
        );

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );

        expect(childTextA.substringData(0, 1)).toBe('T');
        expect(childTextA.substringData(0, 5)).toBe('Text ');
        // Count > length
        expect(childTextA.substringData(0, 10)).toBe('Text A');
        // Count = length
        expect(childTextA.substringData(0, 6)).toBe('Text A');
        expect(childTextA.substringData(0, 0)).toBe('');
        // Negative count
        expect(childTextA.substringData(0, -1)).toBe('Text A');
        expect(childTextA.substringData(0, -10)).toBe('Text A');

        expect(childTextA.substringData(1, 3)).toBe('ext');
        expect(childTextA.substringData(5, 1)).toBe('A');
        // Offset + count > length
        expect(childTextA.substringData(5, 2)).toBe('A');
        // Offset = length
        expect(childTextA.substringData(6, 1)).toBe('');
        // Offset = length & negative count
        expect(childTextA.substringData(6, -1)).toBe('');
        // Negative count
        expect(childTextA.substringData(5, -1)).toBe('A');

        // Out of bounds offset
        expect(() => {
          childTextA.substringData(-1, 0);
        }).toThrow();
        expect(() => {
          childTextA.substringData(7, 0);
        }).toThrow();
      });
    });
  });

  describe('imperative EventTarget API', () => {
    // These tests run with `enableNativeEventTargetEventDispatching:true` and
    // `enableImperativeEvents:*` (see the `@fantom_flags` pragmas). The public
    // EventTarget API is gated behind `enableImperativeEvents`: when it is off
    // the methods are removed from this final class, when it is on they are
    // available.
    if (!ReactNativeFeatureFlags.enableImperativeEvents()) {
      it('removes the public EventTarget methods when `enableImperativeEvents` is off (default)', () => {
        const parentNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode = ensureReadOnlyNode(parentNodeRef.current);
        const textNode = ensureReadOnlyText(
          parentNode.childNodes[0],
        ) as MaybeEventTarget;

        expect(typeof textNode.addEventListener).toBe('undefined');
        expect(typeof textNode.removeEventListener).toBe('undefined');
        expect(typeof textNode.dispatchEvent).toBe('undefined');
      });
    }

    if (ReactNativeFeatureFlags.enableImperativeEvents()) {
      it('exposes the public EventTarget methods when `enableImperativeEvents` is on', () => {
        const parentNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode = ensureReadOnlyNode(parentNodeRef.current);
        const textNode = ensureReadOnlyText(
          parentNode.childNodes[0],
        ) as MaybeEventTarget;

        expect(typeof textNode.addEventListener).toBe('function');
        expect(typeof textNode.removeEventListener).toBe('function');
        expect(typeof textNode.dispatchEvent).toBe('function');
      });
    }
  });

  describe('global constructors', () => {
    it('throws when constructing Text', () => {
      expect(() => new Text()).toThrow(
        "Failed to construct 'Text': Nodes cannot be imperatively created in React Native",
      );
    });

    it('throws when constructing CharacterData', () => {
      expect(() => new CharacterData()).toThrow(
        "Failed to construct 'CharacterData': Illegal constructor",
      );
    });

    it('throws when constructing Node', () => {
      expect(() => new Node()).toThrow(
        "Failed to construct 'Node': Illegal constructor",
      );
    });

    it('public stubs preserve `instanceof` against real instances', () => {
      // The public stubs alias their prototype to the real class so that
      // `instanceof` against the global still works for instances obtained
      // from refs/observer callbacks.
      const parentNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
      });

      const parentNode = ensureReadOnlyNode(parentNodeRef.current);
      const textNode = parentNode.childNodes[0];

      expect(textNode instanceof Node).toBe(true);
      expect(textNode instanceof CharacterData).toBe(true);
      expect(textNode instanceof Text).toBe(true);
    });
  });

  describe('Node static constants on the global', () => {
    // The public `Node` stub also exposes the node-type and document-position
    // constants from the spec so callers can read them off the global.
    it('exposes node-type constants', () => {
      expect(Node.ELEMENT_NODE).toBe(1);
      expect(Node.ATTRIBUTE_NODE).toBe(2);
      expect(Node.TEXT_NODE).toBe(3);
      expect(Node.CDATA_SECTION_NODE).toBe(4);
      expect(Node.PROCESSING_INSTRUCTION_NODE).toBe(7);
      expect(Node.COMMENT_NODE).toBe(8);
      expect(Node.DOCUMENT_NODE).toBe(9);
      expect(Node.DOCUMENT_TYPE_NODE).toBe(10);
      expect(Node.DOCUMENT_FRAGMENT_NODE).toBe(11);
    });

    it('exposes document-position constants', () => {
      expect(Node.DOCUMENT_POSITION_DISCONNECTED).toBe(1);
      expect(Node.DOCUMENT_POSITION_PRECEDING).toBe(2);
      expect(Node.DOCUMENT_POSITION_FOLLOWING).toBe(4);
      expect(Node.DOCUMENT_POSITION_CONTAINS).toBe(8);
      expect(Node.DOCUMENT_POSITION_CONTAINED_BY).toBe(16);
      expect(Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC).toBe(32);
    });
  });
});
