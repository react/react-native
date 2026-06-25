/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags fixMappingOfEventPrioritiesBetweenFabricAndReact:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {type PointerEvent, View} from 'react-native';
import * as FabricUIManager from 'react-native/Libraries/ReactNative/FabricUIManager';

const UIManager = nullthrows(FabricUIManager.getFabricUIManager());

describe('Event Dispatching', () => {
  // The OSS renderer hasn't been synced yet to have these changes
  // TODO(next-major) Remove this condition
  if (!Fantom.getConstants().isOSS) {
    it('provides the native event timeStamp (camel case) when available', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      const onPointerUp = jest.fn((e: PointerEvent) => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={onPointerUp} />);
      });

      expect(onPointerUp).toHaveBeenCalledTimes(0);

      const NATIVE_EVENT_TIMESTAMP = 1234;

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0, timeStamp: NATIVE_EVENT_TIMESTAMP},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(onPointerUp).toHaveBeenCalledTimes(1);
      expect(onPointerUp.mock.calls[0][0].timeStamp).toBe(
        NATIVE_EVENT_TIMESTAMP,
      );
    });

    it('provides a default timeStamp when the native event timeStamp is NOT available', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      const onPointerUp = jest.fn((e: PointerEvent) => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={onPointerUp} />);
      });

      expect(onPointerUp).toHaveBeenCalledTimes(0);

      const lowerBound = performance.now();

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      const upperBound = performance.now();

      expect(onPointerUp).toHaveBeenCalledTimes(1);
      expect(onPointerUp.mock.calls[0][0].timeStamp).toBeGreaterThanOrEqual(
        lowerBound,
      );
      expect(onPointerUp.mock.calls[0][0].timeStamp).toBeLessThanOrEqual(
        upperBound,
      );
    });

    it('exposes dispatched events in the global scope', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      let globalEventIsDispatchedEvent: boolean = false;

      const onPointerUp = jest.fn((e: PointerEvent) => {
        globalEventIsDispatchedEvent = global.event === e;
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={onPointerUp} />);
      });

      const globalEventValueBeforeDispatch = {type: 'some-event'};
      global.event = globalEventValueBeforeDispatch;

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
      expect(globalEventIsDispatchedEvent).toBe(true);
      expect(global.event).toBe(globalEventValueBeforeDispatch);
    });
  }

  it('dispatches events with discrete priority', () => {
    const root = Fantom.createRoot();

    const ref = React.createRef<React.ElementRef<typeof View>>();

    let onPointerUpPriority;

    const onPointerUp = jest.fn((event: unknown) => {
      onPointerUpPriority = UIManager.unstable_getCurrentEventPriority();
    });

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
    expect(onPointerUpPriority).toBe(UIManager.unstable_DiscreteEventPriority);
  });

  it('dispatches pointer capture events', () => {
    const root = Fantom.createRoot();

    const ref = React.createRef<React.ElementRef<typeof View>>();
    const order: Array<string> = [];

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onGotPointerCaptureCapture={() => {
            order.push('got-capture');
          }}
          onGotPointerCapture={() => {
            order.push('got-bubble');
          }}
          onLostPointerCaptureCapture={() => {
            order.push('lost-capture');
          }}
          onLostPointerCapture={() => {
            order.push('lost-bubble');
          }}
        />,
      );
    });

    Fantom.dispatchNativeEvent(
      ref,
      'onGotPointerCapture',
      {pointerId: 1},
      {
        category: Fantom.NativeEventCategory.Discrete,
      },
    );

    Fantom.dispatchNativeEvent(
      ref,
      'onLostPointerCapture',
      {pointerId: 1},
      {
        category: Fantom.NativeEventCategory.Discrete,
      },
    );

    expect(order).toEqual([
      'got-capture',
      'got-bubble',
      'lost-capture',
      'lost-bubble',
    ]);
  });

  it('dispatches events with continuous priority', () => {
    const root = Fantom.createRoot();

    const ref = React.createRef<React.ElementRef<typeof View>>();

    let onPointerMovePriority;

    const onPointerMove = jest.fn((event: unknown) => {
      onPointerMovePriority = UIManager.unstable_getCurrentEventPriority();
    });

    Fantom.runTask(() => {
      root.render(<View ref={ref} onPointerMove={onPointerMove} />);
    });

    expect(onPointerMove).toHaveBeenCalledTimes(0);

    Fantom.dispatchNativeEvent(
      ref,
      'onPointerMove',
      {x: 0, y: 0},
      {
        category: Fantom.NativeEventCategory.Continuous,
      },
    );

    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(onPointerMovePriority).toBe(
      UIManager.unstable_ContinuousEventPriority,
    );
  });

  it('dispatches events with idle priority', () => {
    const root = Fantom.createRoot();

    const ref = React.createRef<React.ElementRef<typeof View>>();

    let onPointerMovePriority;

    const onPointerMove = jest.fn((event: unknown) => {
      onPointerMovePriority = UIManager.unstable_getCurrentEventPriority();
    });

    Fantom.runTask(() => {
      root.render(<View ref={ref} onPointerMove={onPointerMove} />);
    });

    expect(onPointerMove).toHaveBeenCalledTimes(0);

    Fantom.dispatchNativeEvent(
      ref,
      'onPointerMove',
      {x: 0, y: 0},
      {
        // This is not the intrinsic category of this event,
        // but we don't currently dispatch any idle events on View and need a real prop for testing.
        category: Fantom.NativeEventCategory.Idle,
      },
    );

    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(onPointerMovePriority).toBe(UIManager.unstable_IdleEventPriority);
  });

  describe('when using ContinuousStart and ContinuousEnd', () => {
    it('uses discrete event priority for both ContinousStart and ContinuousEnd', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      let onPointerEnterPriority;
      let onPointerLeavePriority;

      const onPointerEnter = jest.fn((event: unknown) => {
        onPointerEnterPriority = UIManager.unstable_getCurrentEventPriority();
      });
      const onPointerLeave = jest.fn((event: unknown) => {
        onPointerLeavePriority = UIManager.unstable_getCurrentEventPriority();
      });

      Fantom.runTask(() => {
        root.render(
          <View
            ref={ref}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          />,
        );
      });

      expect(onPointerEnter).toHaveBeenCalledTimes(0);
      expect(onPointerLeave).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerEnter',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousStart,
        },
      );

      expect(onPointerEnter).toHaveBeenCalledTimes(1);
      expect(onPointerLeave).toHaveBeenCalledTimes(0);
      expect(onPointerEnterPriority).toBe(
        UIManager.unstable_DiscreteEventPriority,
      );

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerLeave',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousEnd,
        },
      );

      expect(onPointerEnter).toHaveBeenCalledTimes(1);
      expect(onPointerLeave).toHaveBeenCalledTimes(1);
      expect(onPointerLeavePriority).toBe(
        UIManager.unstable_DiscreteEventPriority,
      );
    });

    it('uses continuous event priority for unspecified events between ContinuousStart and ContinuousEnd, and default outside of them', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      let onPointerMovePriority;
      const onPointerMove = jest.fn((event: unknown) => {
        onPointerMovePriority = UIManager.unstable_getCurrentEventPriority();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerMove',
        {x: 0, y: 1},
        {
          category: Fantom.NativeEventCategory.Unspecified,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      expect(onPointerMovePriority).toBe(
        UIManager.unstable_DefaultEventPriority,
      );

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerEnter',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousStart,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(1);

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerMove',
        {x: 0, y: 1},
        {
          category: Fantom.NativeEventCategory.Unspecified,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(2);
      expect(onPointerMovePriority).toBe(
        UIManager.unstable_ContinuousEventPriority,
      );

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerLeave',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousEnd,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(2);

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerMove',
        {x: 0, y: 1},
        {
          category: Fantom.NativeEventCategory.Unspecified,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(3);
      expect(onPointerMovePriority).toBe(
        UIManager.unstable_DefaultEventPriority,
      );
    });

    it('preserves explicitly set priorities between ContinuousStart and ContinuousEnd', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      let onPointerMovePriority;
      const onPointerMove = jest.fn((event: unknown) => {
        onPointerMovePriority = UIManager.unstable_getCurrentEventPriority();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerEnter',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousStart,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerMove',
        {x: 0, y: 1},
        {
          category: Fantom.NativeEventCategory.Idle,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      expect(onPointerMovePriority).toBe(UIManager.unstable_IdleEventPriority);
    });
  });

  describe('unique events', () => {
    it('are combined and only the last consecutive one is dispatched', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      const onPointerMove = jest.fn(e => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 1, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 1, y: 1},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      expect(onPointerMove.mock.lastCall[0].nativeEvent.x).toBe(1);
      expect(onPointerMove.mock.lastCall[0].nativeEvent.y).toBe(1);
    });

    it('are combined if there are different event types in between for a different target', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();
      const otherRef = React.createRef<React.ElementRef<typeof View>>();

      const onPointerMove = jest.fn(e => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(
          <>
            <View ref={ref} onPointerMove={onPointerMove} />
            <View ref={otherRef} />
          </>,
        );
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          otherRef,
          'onScroll',
          {x: 1, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 1, y: 1},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      expect(onPointerMove.mock.lastCall[0].nativeEvent.x).toBe(1);
      expect(onPointerMove.mock.lastCall[0].nativeEvent.y).toBe(1);
    });

    it('are NOT combined if there are different event types in between for the same target', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      const onPointerMove = jest.fn(e => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          ref,
          'onScroll',
          {x: 1, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 1, y: 1},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onPointerMove).toHaveBeenCalledTimes(2);
    });

    it('are NOT combined with the same type if it is non-unique', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      const onPointerMove = jest.fn(e => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 1, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
          },
        );

        Fantom.enqueueNativeEvent(
          ref,
          'onPointerMove',
          {x: 1, y: 1},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onPointerMove).toHaveBeenCalledTimes(3);

      expect(onPointerMove.mock.calls[0][0].nativeEvent.x).toBe(0);
      expect(onPointerMove.mock.calls[0][0].nativeEvent.y).toBe(0);

      expect(onPointerMove.mock.calls[1][0].nativeEvent.x).toBe(1);
      expect(onPointerMove.mock.calls[1][0].nativeEvent.y).toBe(0);

      expect(onPointerMove.mock.calls[2][0].nativeEvent.x).toBe(1);
      expect(onPointerMove.mock.calls[2][0].nativeEvent.y).toBe(1);
    });
  });
});
