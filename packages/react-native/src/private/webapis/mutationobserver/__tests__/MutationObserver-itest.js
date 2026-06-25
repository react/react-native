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
import type MutationObserverType from 'react-native/src/private/webapis/mutationobserver/MutationObserver';
import type MutationRecordType from 'react-native/src/private/webapis/mutationobserver/MutationRecord';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import {createShadowNodeReferenceCountingRef} from '../../../__tests__/utilities/ShadowNodeReferenceCounter';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';
import setUpMutationObserver from 'react-native/src/private/setup/setUpMutationObserver';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

declare const MutationObserver: Class<MutationObserverType>;
declare const MutationRecord: Class<MutationRecordType>;

setUpMutationObserver();

function ensureReactNativeElement(value: unknown): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

function ensureMutationRecordArray(
  value: unknown,
): ReadonlyArray<MutationRecord> {
  return ensureInstance(value, Array).map((element: unknown) =>
    ensureInstance(element, MutationRecord),
  );
}

describe('MutationObserver', () => {
  describe('constructor(callback)', () => {
    it('should throw if `callback` is not provided', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new MutationObserver();
      }).toThrow(
        "Failed to construct 'MutationObserver': 1 argument required, but only 0 present.",
      );
    });

    it('should throw if `callback` is not a function', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new MutationObserver('not a function!');
      }).toThrow(
        "Failed to construct 'MutationObserver': parameter 1 is not of type 'Function'.",
      );
    });
  });

  describe('observe(target, {childList: boolean, subtree: boolean})', () => {
    it('should throw if `target` is not a `ReactNativeElement`', () => {
      const observer = new MutationObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        observer.observe('something');
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    });

    it('should throw if the `childList` option is not provided', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      expect(() => {
        const observer = new MutationObserver(() => {});
        observer.observe(node);
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': The options object must set 'childList' to true.",
      );

      expect(() => {
        const observer = new MutationObserver(() => {});
        // $FlowExpectedError[incompatible-type]
        observer.observe(node, {childList: false});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': The options object must set 'childList' to true.",
      );

      expect(() => {
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true});
      }).not.toThrow();

      expect(() => {
        const observer = new MutationObserver(() => {});
        // $FlowExpectedError[incompatible-type]
        observer.observe(node, {childList: 1});
      }).not.toThrow();
    });

    it('should throw if the `attributes` option is provided', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      expect(() => {
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true, attributes: true});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': attributes is not supported",
      );
    });

    it('should throw if the `attributeFilter` option is provided', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      expect(() => {
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true, attributeFilter: []});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': attributeFilter is not supported",
      );
    });

    it('should throw if the `attributeOldValue` option is provided', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      expect(() => {
        const observer = new MutationObserver(() => {});
        // $FlowExpected
        observer.observe(node, {childList: true, attributeOldValue: true});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': attributeOldValue is not supported",
      );
    });

    it('should throw if the `characterData` option is provided', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      expect(() => {
        const observer = new MutationObserver(() => {});
        observer.observe(node, {childList: true, characterData: true});
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': characterData is not supported",
      );
    });

    it('should throw if the `characterDataOldValue` option is provided', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      expect(() => {
        const observer = new MutationObserver(() => {});
        observer.observe(node, {
          childList: true,
          characterDataOldValue: true,
        });
      }).toThrow(
        "Failed to execute 'observe' on 'MutationObserver': characterDataOldValue is not supported",
      );
    });

    it('should ignore calls to observe disconnected targets', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View key="node1" ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(node.isConnected).toBe(false);

      const observerCallback = () => {};
      const observer = new MutationObserver(observerCallback);

      expect(() => {
        observer.observe(node, {childList: true});
      }).not.toThrow();
    });

    it('should report direct children added to and removed from an observed node (childList: true, subtree: false) ', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View key="node1" ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      const observerCallbackCallArgs = [];
      const observerCallback = (...args: ReadonlyArray<unknown>) => {
        observerCallbackCallArgs.push(args);
      };
      const observer = new MutationObserver(observerCallback);
      observer.observe(node, {childList: true});

      // Does not report anything initially
      expect(observerCallbackCallArgs.length).toBe(0);

      const childNode1Ref = createRef<HostInstance>();
      const childNode2Ref = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" ref={childNode1Ref} />
            <View key="node1-2" ref={childNode2Ref} />
          </View>,
        );
      });

      const childNode1 = ensureReactNativeElement(childNode1Ref.current);
      const childNode2 = ensureReactNativeElement(childNode2Ref.current);

      expect(observerCallbackCallArgs.length).toBe(1);
      const firstCall = nullthrows(observerCallbackCallArgs.at(-1));
      expect(firstCall.length).toBe(2);

      const firstRecords = ensureMutationRecordArray(firstCall[0]);
      expect(firstRecords).toBeInstanceOf(Array);
      expect(firstRecords.length).toBe(1);
      expect(firstRecords[0]).toBeInstanceOf(MutationRecord);

      const firstRecord = firstRecords[0];
      expect(firstRecord.type).toBe('childList');
      expect(firstRecord.target).toBe(node);
      expect(firstRecord.addedNodes).toBeInstanceOf(NodeList);
      expect(firstRecord.addedNodes[0]).toBe(childNode1);
      expect(firstRecord.addedNodes[1]).toBe(childNode2);
      expect(firstRecord.removedNodes).toBeInstanceOf(NodeList);
      expect(firstRecord.removedNodes.length).toBe(0);

      expect(firstCall[1]).toBe(observer);

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-2" />
          </View>,
        );
      });

      expect(observerCallbackCallArgs.length).toBe(2);
      const secondCall = nullthrows(observerCallbackCallArgs.at(-1));
      expect(secondCall.length).toBe(2);

      const secondRecords = ensureMutationRecordArray(secondCall[0]);
      expect(secondRecords.length).toBe(1);
      expect(secondRecords[0]).toBeInstanceOf(MutationRecord);

      const secondRecord = secondRecords[0];
      expect(secondRecord.type).toBe('childList');
      expect(secondRecord.target).toBe(node);
      expect(secondRecord.addedNodes).toBeInstanceOf(NodeList);
      expect([...secondRecord.addedNodes]).toEqual([]);
      expect(secondRecord.removedNodes).toBeInstanceOf(NodeList);
      expect([...secondRecord.removedNodes]).toEqual([childNode1]);

      expect(secondCall[1]).toBe(observer);
    });

    it('should NOT report changes in transitive children when `subtree` is not set to true', () => {
      const observedNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View key="node1" ref={observedNodeRef}>
            <View key="node1-1" />
          </View>,
        );
      });

      const observedNode = ensureReactNativeElement(observedNodeRef.current);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(observedNode, {childList: true});

      // Does not report anything initially
      expect(observerCallback).not.toHaveBeenCalled();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1">
              <View key="node1-1-1" />
            </View>
          </View>,
        );
      });

      expect(observerCallback).not.toHaveBeenCalled();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" />
          </View>,
        );
      });

      expect(observerCallback).not.toHaveBeenCalled();
    });

    it('should report changes in transitive children when `subtree` is set to true', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View key="node1" ref={nodeRef}>
            <View key="node1-1" />
          </View>,
        );
      });

      const node = ensureReactNativeElement(nodeRef.current);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(node, {childList: true, subtree: true});

      // Does not report anything initially
      expect(observerCallback).not.toHaveBeenCalled();

      const node111Ref = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1">
              <View key="node1-1-1" ref={node111Ref} />
            </View>
          </View>,
        );
      });

      const node111 = ensureReactNativeElement(node111Ref.current);

      expect(observerCallback).toHaveBeenCalledTimes(1);
      const firstCall = observerCallback.mock.lastCall;
      const firstRecords = ensureMutationRecordArray(firstCall[0]);
      expect(firstRecords.length).toBe(1);
      expect([...firstRecords[0].addedNodes]).toEqual([node111]);
      expect([...firstRecords[0].removedNodes]).toEqual([]);

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" />
          </View>,
        );
      });

      expect(observerCallback).toHaveBeenCalledTimes(2);
      const secondRecords = ensureMutationRecordArray(
        observerCallback.mock.lastCall[0],
      );
      expect(secondRecords.length).toBe(1);
      expect([...secondRecords[0].addedNodes]).toEqual([]);
      expect([...secondRecords[0].removedNodes]).toEqual([node111]);
    });

    it('should report changes in different parts of the subtree as separate entries (subtree = true)', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View key="node1" ref={nodeRef}>
            <View key="node1-1" />
            <View key="node1-2" />
          </View>,
        );
      });

      const node = ensureReactNativeElement(nodeRef.current);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(node, {childList: true, subtree: true});

      // Does not report anything initially
      expect(observerCallback).not.toHaveBeenCalled();

      const node111Ref = createRef<HostInstance>();
      const node121Ref = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1">
              <View key="node1-1-1" ref={node111Ref} />
            </View>
            <View key="node1-2">
              <View key="node1-2-1" ref={node121Ref} />
            </View>
          </View>,
        );
      });

      const node111 = ensureReactNativeElement(node111Ref.current);
      const node121 = ensureReactNativeElement(node121Ref.current);

      expect(observerCallback).toHaveBeenCalledTimes(1);
      const firstCall = observerCallback.mock.lastCall;
      const firstRecords = ensureMutationRecordArray(firstCall[0]);
      expect(firstRecords.length).toBe(2);
      expect([...firstRecords[0].addedNodes]).toEqual([node111]);
      expect([...firstRecords[0].removedNodes]).toEqual([]);
      expect([...firstRecords[1].addedNodes]).toEqual([node121]);
      expect([...firstRecords[1].removedNodes]).toEqual([]);

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" />
            <View key="node1-2" />
          </View>,
        );
      });

      expect(observerCallback).toHaveBeenCalledTimes(2);
      const secondCall = observerCallback.mock.lastCall;
      const secondRecords = ensureMutationRecordArray(secondCall[0]);
      expect(secondRecords.length).toBe(2);
      expect([...secondRecords[0].addedNodes]).toEqual([]);
      expect([...secondRecords[0].removedNodes]).toEqual([node111]);
      expect([...secondRecords[1].addedNodes]).toEqual([]);
      expect([...secondRecords[1].removedNodes]).toEqual([node121]);

      expect(secondCall[1]).toBe(observer);
    });

    describe('multiple observers', () => {
      it('should report changes to multiple observers observing different subtrees', () => {
        const node1Ref = createRef<HostInstance>();
        const node2Ref = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1" ref={node1Ref} />
              <View key="node2" ref={node2Ref} />
            </>,
          );
        });

        const node1 = ensureReactNativeElement(node1Ref.current);
        const node2 = ensureReactNativeElement(node2Ref.current);

        const observerCallback1 = jest.fn();
        const observer1 = new MutationObserver(observerCallback1);
        observer1.observe(node1, {childList: true, subtree: true});

        const observerCallback2 = jest.fn();
        const observer2 = new MutationObserver(observerCallback2);
        observer2.observe(node2, {childList: true, subtree: true});

        // Does not report anything initially
        expect(observerCallback1).not.toHaveBeenCalled();
        expect(observerCallback2).not.toHaveBeenCalled();

        const childNode11Ref = createRef<HostInstance>();
        const childNode21Ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1">
                <View key="node1-1" ref={childNode11Ref} />
              </View>
              <View key="node2">
                <View key="node2-1" ref={childNode21Ref} />
              </View>
            </>,
          );
        });

        const childNode11 = ensureReactNativeElement(childNode11Ref.current);
        const childNode21 = ensureReactNativeElement(childNode21Ref.current);

        expect(observerCallback1).toHaveBeenCalledTimes(1);
        const observer1Records1 = ensureMutationRecordArray(
          observerCallback1.mock.lastCall[0],
        );
        expect(observer1Records1.length).toBe(1);
        expect([...observer1Records1[0].addedNodes]).toEqual([childNode11]);
        expect([...observer1Records1[0].removedNodes]).toEqual([]);

        expect(observerCallback2).toHaveBeenCalledTimes(1);
        const observer2Records1 = ensureMutationRecordArray(
          observerCallback2.mock.lastCall[0],
        );
        expect(observer2Records1.length).toBe(1);
        expect([...observer2Records1[0].addedNodes]).toEqual([childNode21]);
        expect([...observer2Records1[0].removedNodes]).toEqual([]);

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1" />
              <View key="node2" />
            </>,
          );
        });

        expect(observerCallback1).toHaveBeenCalledTimes(2);
        const observer1Records2 = ensureMutationRecordArray(
          observerCallback1.mock.lastCall[0],
        );
        expect(observer1Records2.length).toBe(1);
        expect([...observer1Records2[0].addedNodes]).toEqual([]);
        expect([...observer1Records2[0].removedNodes]).toEqual([childNode11]);

        expect(observerCallback2).toHaveBeenCalledTimes(2);
        const observer2Records2 = ensureMutationRecordArray(
          observerCallback2.mock.lastCall[0],
        );
        expect(observer2Records2.length).toBe(1);
        expect([...observer2Records2[0].addedNodes]).toEqual([]);
        expect([...observer2Records2[0].removedNodes]).toEqual([childNode21]);
      });

      it('should report changes to multiple observers observing the same subtree', () => {
        const node1Ref = createRef<HostInstance>();
        const node2Ref = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="node1" ref={node1Ref}>
              <View key="node1-1" ref={node2Ref} />
            </View>,
          );
        });

        const node1 = ensureReactNativeElement(node1Ref.current);
        const node2 = ensureReactNativeElement(node2Ref.current);

        const observerCallback1 = jest.fn();
        const observer1 = new MutationObserver(observerCallback1);
        observer1.observe(node1, {childList: true, subtree: true});

        const observerCallback2 = jest.fn();
        const observer2 = new MutationObserver(observerCallback2);
        observer2.observe(node2, {childList: true, subtree: true});

        // Does not report anything initially
        expect(observerCallback1).not.toHaveBeenCalled();
        expect(observerCallback2).not.toHaveBeenCalled();

        const childNode111Ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View key="node1">
              <View key="node1-1">
                <View key="node-1-1-1" ref={childNode111Ref} />
              </View>
            </View>,
          );
        });

        const childNode111 = ensureReactNativeElement(childNode111Ref.current);

        expect(observerCallback1).toHaveBeenCalledTimes(1);
        const observer1Records1 = ensureMutationRecordArray(
          observerCallback1.mock.lastCall[0],
        );
        expect(observer1Records1.length).toBe(1);
        expect([...observer1Records1[0].addedNodes]).toEqual([childNode111]);
        expect([...observer1Records1[0].removedNodes]).toEqual([]);
        expect(observerCallback2).toHaveBeenCalledTimes(1);
        const observer2Records1 = ensureMutationRecordArray(
          observerCallback2.mock.lastCall[0],
        );
        expect(observer2Records1.length).toBe(1);
        expect([...observer2Records1[0].addedNodes]).toEqual([childNode111]);
        expect([...observer2Records1[0].removedNodes]).toEqual([]);

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1">
                <View key="node1-1" />
              </View>
            </>,
          );
        });

        expect(observerCallback1).toHaveBeenCalledTimes(2);
        const observer1Records2 = ensureMutationRecordArray(
          observerCallback1.mock.lastCall[0],
        );
        expect(observer1Records2.length).toBe(1);
        expect([...observer1Records2[0].addedNodes]).toEqual([]);
        expect([...observer1Records2[0].removedNodes]).toEqual([childNode111]);

        expect(observerCallback2).toHaveBeenCalledTimes(2);
        const observer2Records2 = ensureMutationRecordArray(
          observerCallback2.mock.lastCall[0],
        );
        expect(observer2Records2.length).toBe(1);
        expect([...observer2Records2[0].addedNodes]).toEqual([]);
        expect([...observer2Records2[0].removedNodes]).toEqual([childNode111]);
      });
    });

    describe('multiple observed nodes in the same observer', () => {
      it('should report changes in disjoint observations', () => {
        const node1Ref = createRef<HostInstance>();
        const node2Ref = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1" ref={node1Ref} />
              <View key="node2" ref={node2Ref} />
            </>,
          );
        });

        const node1 = ensureReactNativeElement(node1Ref.current);
        const node2 = ensureReactNativeElement(node2Ref.current);

        const observerCallback = jest.fn();
        const observer = new MutationObserver(observerCallback);
        observer.observe(node1, {childList: true, subtree: true});
        observer.observe(node2, {childList: true, subtree: true});

        // Does not report anything initially
        expect(observerCallback).not.toHaveBeenCalled();

        const childNode11Ref = createRef<HostInstance>();
        const childNode21Ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1">
                <View key="node1-1" ref={childNode11Ref} />
              </View>
              <View key="node2">
                <View key="node2-1" ref={childNode21Ref} />
              </View>
            </>,
          );
        });

        const childNode11 = ensureReactNativeElement(childNode11Ref.current);
        const childNode21 = ensureReactNativeElement(childNode21Ref.current);

        expect(observerCallback).toHaveBeenCalledTimes(1);
        const records = ensureMutationRecordArray(
          observerCallback.mock.lastCall[0],
        );
        expect(records.length).toBe(2);
        expect([...records[0].addedNodes]).toEqual([childNode11]);
        expect([...records[0].removedNodes]).toEqual([]);
        expect([...records[1].addedNodes]).toEqual([childNode21]);
        expect([...records[1].removedNodes]).toEqual([]);

        Fantom.runTask(() => {
          root.render(
            <>
              <View key="node1" />
              <View key="node2" />
            </>,
          );
        });

        expect(observerCallback).toHaveBeenCalledTimes(2);
        const records2 = ensureMutationRecordArray(
          observerCallback.mock.lastCall[0],
        );
        expect(records2.length).toBe(2);
        expect([...records2[0].addedNodes]).toEqual([]);
        expect([...records2[0].removedNodes]).toEqual([childNode11]);
        expect([...records2[1].addedNodes]).toEqual([]);
        expect([...records2[1].removedNodes]).toEqual([childNode21]);
      });

      it('should report changes in joint observations', () => {
        const node1Ref = createRef<HostInstance>();
        const node11Ref = createRef<HostInstance>();

        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <View key="node1" ref={node1Ref}>
              <View key="node1-1" ref={node11Ref} />
            </View>,
          );
        });

        const node1 = ensureReactNativeElement(node1Ref.current);
        const node11 = ensureReactNativeElement(node11Ref.current);

        const observerCallback = jest.fn();
        const observer = new MutationObserver(observerCallback);
        observer.observe(node1, {childList: true, subtree: true});
        observer.observe(node11, {childList: true, subtree: true});

        // Does not report anything initially
        expect(observerCallback).not.toHaveBeenCalled();

        const childNode111Ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View key="node1">
              <View key="node1-1">
                <View key="node1-1-1" ref={childNode111Ref} />
              </View>
            </View>,
          );
        });

        const childNode111 = ensureReactNativeElement(childNode111Ref.current);

        expect(observerCallback).toHaveBeenCalledTimes(1);
        const records = ensureMutationRecordArray(
          observerCallback.mock.lastCall[0],
        );
        expect(records.length).toBe(1);
        expect([...records[0].addedNodes]).toEqual([childNode111]);
        expect([...records[0].removedNodes]).toEqual([]);

        Fantom.runTask(() => {
          root.render(
            <View key="node1">
              <View key="node1-1" />
            </View>,
          );
        });

        expect(observerCallback).toHaveBeenCalledTimes(2);
        const records2 = ensureMutationRecordArray(
          observerCallback.mock.lastCall[0],
        );
        expect(records2.length).toBe(1);
        expect([...records2[0].addedNodes]).toEqual([]);
        expect([...records2[0].removedNodes]).toEqual([childNode111]);
      });
    });

    describe('memory handling', () => {
      it('should not retain initial children of observed targets', () => {
        const root = Fantom.createRoot();
        const observer = new MutationObserver(() => {});

        const [getReferenceCount, childRef] =
          createShadowNodeReferenceCountingRef();

        const parentRef = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(
            <View ref={parentRef}>
              <View ref={childRef} />
            </View>,
          );
        });

        Fantom.runTask(() => {
          observer.observe(ensureReactNativeElement(parentRef.current), {
            childList: true,
          });
        });

        expect(getReferenceCount()).toBeGreaterThan(0);

        Fantom.runTask(() => {
          root.render(<View />);
        });

        expect(getReferenceCount()).toBe(0);

        observer.disconnect();
      });
    });
  });

  describe('disconnect()', () => {
    it('should stop observing targets', () => {
      const observedNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View key="node1" ref={observedNodeRef} />);
      });

      const observedNode = ensureReactNativeElement(observedNodeRef.current);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(observedNode, {childList: true});

      // Does not report anything initially
      expect(observerCallback).not.toHaveBeenCalled();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-1" />
            <View key="node1-2" />
          </View>,
        );
      });

      expect(observerCallback).toHaveBeenCalledTimes(1);

      observer.disconnect();

      Fantom.runTask(() => {
        root.render(
          <View key="node1">
            <View key="node1-2" />
          </View>,
        );
      });

      expect(observerCallback).toHaveBeenCalledTimes(1);
    });

    it('should correctly unobserve targets that are disconnected after observing', () => {
      const observedNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View key="node1" ref={observedNodeRef} />);
      });

      const observedNode = ensureReactNativeElement(observedNodeRef.current);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(observedNode, {childList: true});

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(observedNode.isConnected).toBe(false);

      expect(() => {
        observer.disconnect();
      }).not.toThrow();
    });

    it('should correctly unobserve targets that are disconnected before observing', () => {
      const observedNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View key="node1" ref={observedNodeRef} />);
      });

      const observedNode = ensureReactNativeElement(observedNodeRef.current);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(observedNode.isConnected).toBe(false);

      const observerCallback = jest.fn();
      const observer = new MutationObserver(observerCallback);
      observer.observe(observedNode, {childList: true});

      expect(() => {
        observer.disconnect();
      }).not.toThrow();
    });
  });

  describe('MutationRecord global constructor', () => {
    it('throws when called', () => {
      expect(
        () =>
          // The public stub throws regardless of arguments; the real class
          // requires one so Flow needs a suppression here.
          // $FlowExpectedError[incompatible-type]
          new MutationRecord(),
      ).toThrow("Failed to construct 'MutationRecord': Illegal constructor");
    });
  });
});
