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

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef, startTransition, useDeferredValue, useState} from 'react';
import {View} from 'react-native';
import {NativeEventCategory} from 'react-native/src/private/testing/fantom/specs/NativeFantom';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

function ensureReactNativeElement(value: unknown): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

describe('stale event handlers from interrupted render', () => {
  // This test demonstrates a bug where canonical.currentProps (which stores
  // event handlers) is updated during completeWork (render phase), not during
  // commit. Since the canonical object is shared between the committed fiber
  // and work-in-progress fiber, this is an eager mutation. During concurrent
  // rendering, if a render is interrupted after a component's completeWork has
  // run but before commit, events dispatched at that point read stale
  // (never-committed) handlers instead of the last committed ones.
  //
  // The test uses sibling rendering order to exploit this:
  // 1. First sibling: a View with an onPointerUp handler that captures
  //    deferredLabel. Its completeWork runs first, eagerly updating
  //    canonical.currentProps with the in-progress handler.
  // 2. Second sibling: InterruptTrigger, which dispatches a discrete event on
  //    the View during render. By this point, the View's completeWork has
  //    already updated canonical.currentProps with the new (uncommitted) handler.
  it('calls stale handler from discarded render instead of committed handler', () => {
    const root = Fantom.createRoot();
    const viewRef = createRef<HostInstance>();
    const handlerCallLog: Array<string> = [];
    let shouldDispatchDuringRender = false;

    function App({label}: {label: string}) {
      const deferredLabel = useDeferredValue(label);
      const [, setInterrupt] = useState(false);

      return (
        <>
          <View
            ref={viewRef}
            onPointerUp={() => {
              handlerCallLog.push(deferredLabel);
              // Trigger a high-priority update to interrupt the deferred render.
              setInterrupt(prev => !prev);
            }}
          />
          <InterruptTrigger label={label} deferredLabel={deferredLabel} />
        </>
      );
    }

    // This component dispatches a discrete native event during render when
    // we're in the deferred re-render (deferredLabel has caught up to label).
    // By the time this component renders, the View sibling's completeWork has
    // already eagerly updated canonical.currentProps with the in-progress
    // (not-yet-committed) handler.
    function InterruptTrigger({
      label,
      deferredLabel,
    }: {
      label: string,
      deferredLabel: string,
    }) {
      if (shouldDispatchDuringRender && deferredLabel === label) {
        shouldDispatchDuringRender = false;
        const element = ensureReactNativeElement(viewRef.current);
        Fantom.dispatchNativeEvent(
          element,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: NativeEventCategory.Discrete,
          },
        );
      }
      return null;
    }

    // Initial render: commits handler capturing deferredLabel="initial".
    Fantom.runTask(() => {
      root.render(<App label="initial" />);
    });

    shouldDispatchDuringRender = true;

    // startTransition triggers:
    // 1. First transition render: useDeferredValue("transition") returns
    //    "initial" (deferred) → commits, handler still captures "initial".
    // 2. Deferred re-render: useDeferredValue("transition") returns
    //    "transition" → View's completeWork eagerly updates
    //    canonical.currentProps with handler capturing "transition" →
    //    InterruptTrigger renders and dispatches discrete event →
    //    The stale (uncommitted) handler is called, logging "transition" →
    //    setState in the handler interrupts and discards the deferred render.
    Fantom.runTask(() => {
      startTransition(() => {
        root.render(<App label="transition" />);
      });
    });

    // CORRECT behavior: the last committed handler (capturing "initial")
    // should be called, because the deferred render hasn't committed yet.
    // expect(handlerCallLog).toEqual(['initial']);

    // ACTUAL (buggy) behavior: the stale handler from the interrupted
    // (discarded) render is called because canonical.currentProps is eagerly
    // updated during completeWork (render phase), before the commit.
    expect(handlerCallLog).toEqual(['transition']);
  });
});
