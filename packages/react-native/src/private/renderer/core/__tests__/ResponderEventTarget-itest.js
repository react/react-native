/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableNativeEventTargetEventDispatching:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

// Helpers for common touch event payloads
function touchStart(identifier: number = 0): {
  touches: Array<{...}>,
  changedTouches: Array<{...}>,
} {
  return {
    touches: [{identifier, pageX: 0, pageY: 0, timestamp: 0}],
    changedTouches: [{identifier, pageX: 0, pageY: 0, timestamp: 0}],
  };
}

function touchMove(identifier: number = 0): {
  touches: Array<{...}>,
  changedTouches: Array<{...}>,
} {
  return {
    touches: [{identifier, pageX: 10, pageY: 10, timestamp: 100}],
    changedTouches: [{identifier, pageX: 10, pageY: 10, timestamp: 100}],
  };
}

function touchEnd(
  identifier: number = 0,
  remainingTouches?: Array<{...}>,
): {touches: Array<{...}>, changedTouches: Array<{...}>} {
  return {
    touches: remainingTouches ?? [],
    changedTouches: [{identifier, pageX: 0, pageY: 0, timestamp: 200}],
  };
}

const {isOSS} = Fantom.getConstants();

(isOSS ? describe.skip : describe)('Responder System', () => {
  // --- Basic Grant / Release ---

  it('grants responder on touch start when onStartShouldSetResponder returns true', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={onResponderGrant}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(onResponderGrant).toHaveBeenCalledTimes(1);

    // Release responder to clean up global state
    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('does not grant responder when onStartShouldSetResponder returns false', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => false}
          onResponderGrant={onResponderGrant}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(onResponderGrant).toHaveBeenCalledTimes(0);

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('dispatches responder release on touch end', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderGrant = jest.fn();
    const onResponderRelease = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={onResponderGrant}
          onResponderRelease={onResponderRelease}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(onResponderGrant).toHaveBeenCalledTimes(1);

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(onResponderRelease).toHaveBeenCalledTimes(1);
  });

  it('dispatches responderTerminate on touch cancel', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderTerminate = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {}}
          onResponderTerminate={onResponderTerminate}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    Fantom.dispatchNativeEvent(
      ref,
      'onTouchCancel',
      {
        touches: [],
        changedTouches: [{identifier: 0, pageX: 0, pageY: 0, timestamp: 100}],
      },
      {category: Fantom.NativeEventCategory.Discrete},
    );

    expect(onResponderTerminate).toHaveBeenCalledTimes(1);
  });

  // --- Incremental Touch Events ---

  it('dispatches responderMove to the current responder', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderMove = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {}}
          onResponderMove={onResponderMove}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchMove', touchMove(), {
      category: Fantom.NativeEventCategory.Continuous,
    });

    expect(onResponderMove).toHaveBeenCalledTimes(1);

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('dispatches responderStart and responderEnd', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderStart = jest.fn();
    const onResponderEnd = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {}}
          onResponderStart={onResponderStart}
          onResponderEnd={onResponderEnd}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // responderStart is dispatched on touch start (after grant on first touch)
    expect(onResponderStart).toHaveBeenCalledTimes(1);

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(onResponderEnd).toHaveBeenCalledTimes(1);
  });

  // --- Capture Phase ---

  it('parent can capture responder via onStartShouldSetResponderCapture', () => {
    const root = Fantom.createRoot();
    const childRef = React.createRef<React.ElementRef<typeof View>>();
    const parentOnResponderGrant = jest.fn();
    const childOnResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          onStartShouldSetResponderCapture={() => true}
          onResponderGrant={parentOnResponderGrant}>
          <View
            ref={childRef}
            onStartShouldSetResponder={() => true}
            onResponderGrant={childOnResponderGrant}
          />
        </View>,
      );
    });

    Fantom.dispatchNativeEvent(childRef, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // Parent should get the grant because it captures
    expect(parentOnResponderGrant).toHaveBeenCalledTimes(1);
    expect(childOnResponderGrant).toHaveBeenCalledTimes(0);

    Fantom.dispatchNativeEvent(childRef, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('child wins in bubble phase when parent does not capture', () => {
    const root = Fantom.createRoot();
    const childRef = React.createRef<React.ElementRef<typeof View>>();
    const parentOnResponderGrant = jest.fn();
    const childOnResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          onStartShouldSetResponder={() => true}
          onResponderGrant={parentOnResponderGrant}>
          <View
            ref={childRef}
            onStartShouldSetResponder={() => true}
            onResponderGrant={childOnResponderGrant}
          />
        </View>,
      );
    });

    Fantom.dispatchNativeEvent(childRef, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // Child should get the grant (bubble phase, child is first)
    expect(childOnResponderGrant).toHaveBeenCalledTimes(1);
    expect(parentOnResponderGrant).toHaveBeenCalledTimes(0);

    Fantom.dispatchNativeEvent(childRef, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  // --- Responder Transfer / Negotiation ---

  it('negotiates responder transfer: current responder can refuse termination', () => {
    const root = Fantom.createRoot();
    const childRef = React.createRef<React.ElementRef<typeof View>>();
    const parentRef = React.createRef<React.ElementRef<typeof View>>();
    const childOnResponderGrant = jest.fn();
    const childOnResponderTerminate = jest.fn();
    const parentOnResponderGrant = jest.fn();
    const parentOnResponderReject = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={parentRef}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={parentOnResponderGrant}
          onResponderReject={parentOnResponderReject}>
          <View
            ref={childRef}
            onStartShouldSetResponder={() => true}
            onResponderGrant={childOnResponderGrant}
            onResponderTerminationRequest={() => false}
            onResponderTerminate={childOnResponderTerminate}
          />
        </View>,
      );
    });

    // Child becomes responder
    Fantom.dispatchNativeEvent(childRef, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
    expect(childOnResponderGrant).toHaveBeenCalledTimes(1);

    // Parent tries to take over on move, child refuses
    Fantom.dispatchNativeEvent(childRef, 'onTouchMove', touchMove(), {
      category: Fantom.NativeEventCategory.Continuous,
    });

    // Child should not be terminated
    expect(childOnResponderTerminate).toHaveBeenCalledTimes(0);
    // Parent gets rejected
    expect(parentOnResponderReject).toHaveBeenCalledTimes(1);

    Fantom.dispatchNativeEvent(childRef, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('negotiates responder transfer: current responder allows termination', () => {
    const root = Fantom.createRoot();
    const childRef = React.createRef<React.ElementRef<typeof View>>();
    const childOnResponderGrant = jest.fn();
    const childOnResponderTerminate = jest.fn();
    const parentOnResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          onMoveShouldSetResponder={() => true}
          onResponderGrant={parentOnResponderGrant}>
          <View
            ref={childRef}
            onStartShouldSetResponder={() => true}
            onResponderGrant={childOnResponderGrant}
            onResponderTerminationRequest={() => true}
            onResponderTerminate={childOnResponderTerminate}
          />
        </View>,
      );
    });

    // Child becomes responder
    Fantom.dispatchNativeEvent(childRef, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
    expect(childOnResponderGrant).toHaveBeenCalledTimes(1);

    // Parent takes over on move, child allows
    Fantom.dispatchNativeEvent(childRef, 'onTouchMove', touchMove(), {
      category: Fantom.NativeEventCategory.Continuous,
    });

    // Child is terminated, parent gets grant
    expect(childOnResponderTerminate).toHaveBeenCalledTimes(1);
    expect(parentOnResponderGrant).toHaveBeenCalledTimes(1);

    Fantom.dispatchNativeEvent(childRef, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('only ancestors of the current responder can negotiate for responder', () => {
    const root = Fantom.createRoot();
    const childRef = React.createRef<React.ElementRef<typeof View>>();
    const siblingRef = React.createRef<React.ElementRef<typeof View>>();
    const childOnResponderGrant = jest.fn();
    const siblingOnResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View>
          <View
            ref={childRef}
            onStartShouldSetResponder={() => true}
            onResponderGrant={childOnResponderGrant}
            onResponderTerminationRequest={() => true}
          />
          <View
            ref={siblingRef}
            onStartShouldSetResponder={() => true}
            onResponderGrant={siblingOnResponderGrant}
          />
        </View>,
      );
    });

    // Child becomes responder
    Fantom.dispatchNativeEvent(childRef, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
    expect(childOnResponderGrant).toHaveBeenCalledTimes(1);

    // Sibling tries to become responder via a new touch — but since it's
    // not an ancestor of the current responder, negotiation starts from the
    // LCA (the parent View), not the sibling itself.
    // The sibling is not in the ancestor path, so it cannot claim.
    Fantom.dispatchNativeEvent(siblingRef, 'onTouchStart', touchStart(1), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // Sibling should NOT get the grant
    expect(siblingOnResponderGrant).toHaveBeenCalledTimes(0);

    Fantom.dispatchNativeEvent(childRef, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
    Fantom.dispatchNativeEvent(siblingRef, 'onTouchEnd', touchEnd(1), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  // --- Responder Event touchHistory ---

  it('responder event has touchHistory property', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    let hasTouchHistory = false;

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e: $FlowFixMe) => {
            hasTouchHistory = e.touchHistory != null;
          }}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(hasTouchHistory).toBe(true);

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  // --- Move negotiation ---

  it('grants responder via onMoveShouldSetResponder during touch move', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={onResponderGrant}
        />,
      );
    });

    // Touch start — no grant because onStartShouldSetResponder is not set
    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
    expect(onResponderGrant).toHaveBeenCalledTimes(0);

    // Touch move triggers onMoveShouldSetResponder
    Fantom.dispatchNativeEvent(ref, 'onTouchMove', touchMove(), {
      category: Fantom.NativeEventCategory.Continuous,
    });
    expect(onResponderGrant).toHaveBeenCalledTimes(1);

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('move events go to new responder after transfer', () => {
    const root = Fantom.createRoot();
    const childRef = React.createRef<React.ElementRef<typeof View>>();
    const childOnResponderMove = jest.fn();
    const parentOnResponderMove = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          onMoveShouldSetResponder={() => true}
          onResponderGrant={() => {}}
          onResponderMove={parentOnResponderMove}>
          <View
            ref={childRef}
            onStartShouldSetResponder={() => true}
            onResponderGrant={() => {}}
            onResponderTerminationRequest={() => true}
            onResponderMove={childOnResponderMove}
          />
        </View>,
      );
    });

    // Child becomes responder
    Fantom.dispatchNativeEvent(childRef, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // First move — triggers transfer to parent
    Fantom.dispatchNativeEvent(childRef, 'onTouchMove', touchMove(), {
      category: Fantom.NativeEventCategory.Continuous,
    });

    // Move event should go to the parent (the new responder after transfer)
    expect(parentOnResponderMove).toHaveBeenCalledTimes(1);
    // Child should not get the move (it was terminated)
    expect(childOnResponderMove).toHaveBeenCalledTimes(0);

    Fantom.dispatchNativeEvent(childRef, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('onResponderGrant returning true does not break responder lifecycle', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderRelease = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => true}
          onResponderRelease={onResponderRelease}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // Responder lifecycle should work normally despite grant returning true
    expect(onResponderRelease).toHaveBeenCalledTimes(1);
  });

  it('responder events and EventTarget events fire independently', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const order: Array<string> = [];

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {
            order.push('responderGrant');
          }}
          onPointerUp={() => {
            order.push('pointerUp');
          }}
        />,
      );
    });

    // Touch start triggers both responder grant and pointer event
    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // Responder grant should have fired
    expect(order).toContain('responderGrant');

    // Now dispatch a pointer event separately
    Fantom.dispatchNativeEvent(
      ref,
      'onPointerUp',
      {x: 0, y: 0},
      {
        category: Fantom.NativeEventCategory.Discrete,
      },
    );

    // Pointer event should fire independently
    expect(order).toContain('pointerUp');

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  // --- event.target ---

  it('responder grant event has target set to the originally touched element', () => {
    const root = Fantom.createRoot();
    const childRef = React.createRef<React.ElementRef<typeof View>>();
    let grantTarget: $FlowFixMe = null;

    Fantom.runTask(() => {
      root.render(
        <View
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e: $FlowFixMe) => {
            grantTarget = e.target;
          }}>
          <View ref={childRef} />
        </View>,
      );
    });

    Fantom.dispatchNativeEvent(childRef, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // target should be the child element (the originally touched element)
    expect(grantTarget).not.toBeNull();
    expect(grantTarget).toBe(childRef.current);

    Fantom.dispatchNativeEvent(childRef, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  // --- dispatchConfig ---

  it('responder grant event has dispatchConfig.registrationName', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    let capturedDispatchConfig: $FlowFixMe = null;

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e: $FlowFixMe) => {
            capturedDispatchConfig = e.dispatchConfig;
          }}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(capturedDispatchConfig).not.toBeNull();
    expect(capturedDispatchConfig.registrationName).toBe('onResponderGrant');

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('responder terminate event has dispatchConfig.registrationName', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    let capturedDispatchConfig: $FlowFixMe = null;

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {}}
          onResponderTerminate={(e: $FlowFixMe) => {
            capturedDispatchConfig = e.dispatchConfig;
          }}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    Fantom.dispatchNativeEvent(
      ref,
      'onTouchCancel',
      {
        touches: [],
        changedTouches: [{identifier: 0, pageX: 0, pageY: 0, timestamp: 100}],
      },
      {category: Fantom.NativeEventCategory.Discrete},
    );

    expect(capturedDispatchConfig).not.toBeNull();
    expect(capturedDispatchConfig.registrationName).toBe(
      'onResponderTerminate',
    );
  });

  // --- Error Handling ---
  // When a handler throws, the error is caught per-handler so remaining
  // dispatches and state transitions continue. The first error is rethrown
  // after all dispatching completes. This matches the old system's behavior.

  it('error in onStartShouldSetResponder prevents responder grant', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => {
            throw new Error('shouldSet error');
          }}
          onResponderGrant={onResponderGrant}
        />,
      );
    });

    expect(() =>
      Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
        category: Fantom.NativeEventCategory.Discrete,
      }),
    ).toThrow('shouldSet error');

    // Grant should not have been called since the negotiation threw
    expect(onResponderGrant).toHaveBeenCalledTimes(0);

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('error in onResponderGrant does not crash the system', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {
            throw new Error('grant error');
          }}
        />,
      );
    });

    // Error in onResponderGrant is caught per-handler.
    // The system should not crash.
    expect(() =>
      Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
        category: Fantom.NativeEventCategory.Discrete,
      }),
    ).toThrow('grant error');

    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });

  it('error in onResponderMove does not release responder', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderRelease = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {}}
          onResponderMove={() => {
            throw new Error('move error');
          }}
          onResponderRelease={onResponderRelease}
        />,
      );
    });

    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // Error in move is caught, responder remains active
    expect(() =>
      Fantom.dispatchNativeEvent(ref, 'onTouchMove', touchMove(), {
        category: Fantom.NativeEventCategory.Continuous,
      }),
    ).toThrow('move error');

    // Responder should still be active — release fires on touch end
    Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(onResponderRelease).toHaveBeenCalledTimes(1);
  });

  it('error in onResponderRelease still clears the responder', () => {
    const root = Fantom.createRoot();
    const ref = React.createRef<React.ElementRef<typeof View>>();
    const onResponderGrant = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onStartShouldSetResponder={() => true}
          onResponderGrant={onResponderGrant}
          onResponderRelease={() => {
            throw new Error('release error');
          }}
        />,
      );
    });

    // First touch — release throws but error is caught per-handler.
    // changeResponder(null) still runs, so the responder is cleared.
    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
    expect(() =>
      Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
        category: Fantom.NativeEventCategory.Discrete,
      }),
    ).toThrow('release error');

    // Second touch — responder was cleared, so grant fires again
    Fantom.dispatchNativeEvent(ref, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    expect(onResponderGrant).toHaveBeenCalledTimes(2);

    expect(() =>
      Fantom.dispatchNativeEvent(ref, 'onTouchEnd', touchEnd(), {
        category: Fantom.NativeEventCategory.Discrete,
      }),
    ).toThrow('release error');
  });

  it('error in onResponderTerminationRequest does not crash the system', () => {
    const root = Fantom.createRoot();
    const childRef = React.createRef<React.ElementRef<typeof View>>();

    Fantom.runTask(() => {
      root.render(
        <View onMoveShouldSetResponder={() => true} onResponderGrant={() => {}}>
          <View
            ref={childRef}
            onStartShouldSetResponder={() => true}
            onResponderGrant={() => {}}
            onResponderTerminationRequest={() => {
              throw new Error('terminationRequest error');
            }}
          />
        </View>,
      );
    });

    // Child becomes responder
    Fantom.dispatchNativeEvent(childRef, 'onTouchStart', touchStart(), {
      category: Fantom.NativeEventCategory.Discrete,
    });

    // Parent tries to take over on move. terminationRequest throws.
    // The system should not crash.
    expect(() =>
      Fantom.dispatchNativeEvent(childRef, 'onTouchMove', touchMove(), {
        category: Fantom.NativeEventCategory.Continuous,
      }),
    ).toThrow('terminationRequest error');

    Fantom.dispatchNativeEvent(childRef, 'onTouchEnd', touchEnd(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
  });
});
