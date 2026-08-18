/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableNativeEventTargetEventDispatching:*
 * @fantom_flags enableImperativeEvents:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {
  NativePointerEvent,
  PointerEvent,
} from 'react-native/Libraries/Types/CoreEventTypes';
import type {ReadOnlyNodeWithEventTarget} from 'react-native/src/private/webapis/dom/nodes/ReadOnlyNode';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';
import Event from 'react-native/src/private/webapis/dom/events/Event';

// Temporary cast until ReadOnlyNode extends EventTarget ungated.
function asEventTarget(node: ?interface {}): ReadOnlyNodeWithEventTarget {
  if (node == null) {
    throw new Error('Expected non-null node');
  }
  // $FlowFixMe[incompatible-return] ReadOnlyNode extends EventTarget at runtime
  // $FlowFixMe[incompatible-type]
  return node;
}

function createNestedViewsWithLayout(
  depth: number,
  innerRef: {current: React.ElementRef<typeof View> | null},
  onLayout: () => void,
): React.MixedElement {
  if (depth === 0) {
    return (
      <View
        ref={innerRef}
        collapsable={false}
        onLayout={onLayout}
        style={{width: 10, height: 10}}
      />
    );
  }
  return (
    <View collapsable={false}>
      {createNestedViewsWithLayout(depth - 1, innerRef, onLayout)}
    </View>
  );
}

const {isOSS} = Fantom.getConstants();

(isOSS ? describe.skip : describe)(
  'EventTarget-based Event Dispatching',
  () => {
    it('dispatches basic press event to handler', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      const onPointerUp = jest.fn();

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={onPointerUp} />);
      });

      expect(onPointerUp).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 10, y: 20},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(onPointerUp).toHaveBeenCalledTimes(1);
    });

    it('event bubbles from child to parent', () => {
      const root = Fantom.createRoot();
      const childRef = React.createRef<React.ElementRef<typeof View>>();
      const parentHandler = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <View onPointerUp={parentHandler}>
            <View ref={childRef} />
          </View>,
        );
      });

      expect(parentHandler).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        childRef,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(parentHandler).toHaveBeenCalledTimes(1);
    });

    it('capture phase fires before bubble phase', () => {
      const root = Fantom.createRoot();
      const childRef = React.createRef<React.ElementRef<typeof View>>();
      const order: Array<string> = [];

      Fantom.runTask(() => {
        root.render(
          <View
            onPointerUpCapture={() => {
              order.push('parent-capture');
            }}
            onPointerUp={() => {
              order.push('parent-bubble');
            }}>
            <View
              ref={childRef}
              onPointerUpCapture={() => {
                order.push('child-capture');
              }}
              onPointerUp={() => {
                order.push('child-bubble');
              }}
            />
          </View>,
        );
      });

      Fantom.dispatchNativeEvent(
        childRef,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(order).toEqual([
        'parent-capture',
        'child-capture',
        'child-bubble',
        'parent-bubble',
      ]);
    });

    it('stopPropagation prevents parent handler from firing', () => {
      const root = Fantom.createRoot();
      const childRef = React.createRef<React.ElementRef<typeof View>>();
      const parentHandler = jest.fn();
      const childHandler = jest.fn((e: PointerEvent) => {
        e.stopPropagation();
      });

      Fantom.runTask(() => {
        root.render(
          <View onPointerUp={parentHandler}>
            <View ref={childRef} onPointerUp={childHandler} />
          </View>,
        );
      });

      Fantom.dispatchNativeEvent(
        childRef,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(childHandler).toHaveBeenCalledTimes(1);
      expect(parentHandler).toHaveBeenCalledTimes(0);
    });

    it('event object has correct nativeEvent property', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      let capturedNativeEvent: NativePointerEvent | null = null;

      const onPointerUp = jest.fn((e: PointerEvent) => {
        // Capture nativeEvent inside the handler because legacy SyntheticEvent
        // nullifies properties after dispatch.
        capturedNativeEvent = e.nativeEvent;
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={onPointerUp} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 42, y: 99},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(onPointerUp).toHaveBeenCalledTimes(1);
      expect(capturedNativeEvent?.x).toBe(42);
      expect(capturedNativeEvent?.y).toBe(99);
    });

    it('handler updates correctly when prop changes', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={firstHandler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(firstHandler).toHaveBeenCalledTimes(1);
      expect(secondHandler).toHaveBeenCalledTimes(0);

      // Re-render with a new handler
      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={secondHandler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(firstHandler).toHaveBeenCalledTimes(1);
      expect(secondHandler).toHaveBeenCalledTimes(1);
    });

    it('handler removal stops event dispatch', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      const handler = jest.fn();

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={handler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);

      // Re-render without the handler
      Fantom.runTask(() => {
        root.render(<View ref={ref} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('multiple event types on the same element dispatch correctly', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      const onPointerUp = jest.fn();
      const onPointerMove = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <View
            ref={ref}
            onPointerUp={onPointerUp}
            onPointerMove={onPointerMove}
          />,
        );
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(onPointerUp).toHaveBeenCalledTimes(1);
      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerMove',
        {x: 1, y: 1},
        {
          category: Fantom.NativeEventCategory.Continuous,
        },
      );

      expect(onPointerUp).toHaveBeenCalledTimes(1);
      expect(onPointerMove).toHaveBeenCalledTimes(1);
    });

    it('preventDefault sets defaultPrevented to true', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      let defaultPrevented: ?boolean = false;

      const handler = jest.fn((e: PointerEvent) => {
        e.preventDefault();
        defaultPrevented = e.defaultPrevented;
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={handler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(defaultPrevented).toBe(true);
    });

    it('isDefaultPrevented() returns true after preventDefault()', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      let result = false;

      const handler = jest.fn((e: PointerEvent) => {
        e.preventDefault();
        result = e.isDefaultPrevented();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={handler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('isDefaultPrevented() returns false when preventDefault() was not called', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      let result = true;

      const handler = jest.fn((e: PointerEvent) => {
        result = e.isDefaultPrevented();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={handler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });

    it('isPropagationStopped() returns true after stopPropagation()', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      let result = false;

      const handler = jest.fn((e: PointerEvent) => {
        e.stopPropagation();
        result = e.isPropagationStopped();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={handler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('isPropagationStopped() returns false when stopPropagation() was not called', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      let result = true;

      const handler = jest.fn((e: PointerEvent) => {
        result = e.isPropagationStopped();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={handler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });

    it('persist() is callable and does not throw', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();

      const handler = jest.fn((e: PointerEvent) => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={handler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);
    });

    // --- addEventListener / removeEventListener on refs ---
    // These tests require both `enableNativeEventTargetEventDispatching` and
    // `enableImperativeEvents` to be enabled, since the public `addEventListener`
    // API on element refs is only available when both flags are on. They are
    // skipped for the other flag combinations.

    (ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching() &&
      ReactNativeFeatureFlags.enableImperativeEvents()
      ? describe
      : describe.skip)('addEventListener / removeEventListener', () => {
      it('addEventListener on a ref receives dispatched events', () => {
        const root = Fantom.createRoot();
        const ref = React.createRef<React.ElementRef<typeof View>>();
        const handler = jest.fn();

        Fantom.runTask(() => {
          root.render(<View ref={ref} />);
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(ref.current).addEventListener('pointerup', handler);

        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('removeEventListener stops receiving events', () => {
        const root = Fantom.createRoot();
        const ref = React.createRef<React.ElementRef<typeof View>>();
        const handler = jest.fn();

        Fantom.runTask(() => {
          root.render(<View ref={ref} />);
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(ref.current).addEventListener('pointerup', handler);

        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(handler).toHaveBeenCalledTimes(1);

        asEventTarget(ref.current).removeEventListener('pointerup', handler);

        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('addEventListener with capture option fires during capture phase', () => {
        const root = Fantom.createRoot();
        const parentRef = React.createRef<React.ElementRef<typeof View>>();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const order: Array<string> = [];

        Fantom.runTask(() => {
          root.render(
            <View ref={parentRef}>
              <View
                ref={childRef}
                onPointerUp={() => {
                  order.push('child-bubble');
                }}
              />
            </View>,
          );
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(parentRef.current).addEventListener(
          'pointerup',
          () => {
            order.push('parent-capture');
          },
          {capture: true},
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(order).toEqual(['parent-capture', 'child-bubble']);
      });

      it('addEventListener receives events that bubble from children', () => {
        const root = Fantom.createRoot();
        const parentRef = React.createRef<React.ElementRef<typeof View>>();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const handler = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <View ref={parentRef}>
              <View ref={childRef} />
            </View>,
          );
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(parentRef.current).addEventListener('pointerup', handler);

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(handler).toHaveBeenCalledTimes(1);
      });

      // --- Declarative (prop) vs imperative (addEventListener) ordering ---

      it('declarative prop handler fires before imperative addEventListener listener', () => {
        const root = Fantom.createRoot();
        const ref = React.createRef<React.ElementRef<typeof View>>();
        const order: Array<string> = [];

        Fantom.runTask(() => {
          root.render(
            <View
              ref={ref}
              onPointerUp={() => {
                order.push('prop');
              }}
            />,
          );
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(ref.current).addEventListener('pointerup', () => {
          order.push('addEventListener');
        });

        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(order).toEqual(['prop', 'addEventListener']);
      });

      it('declarative capture prop fires before imperative capture addEventListener', () => {
        const root = Fantom.createRoot();
        const parentRef = React.createRef<React.ElementRef<typeof View>>();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const order: Array<string> = [];

        Fantom.runTask(() => {
          root.render(
            <View
              ref={parentRef}
              onPointerUpCapture={() => {
                order.push('parent-prop-capture');
              }}>
              <View ref={childRef} />
            </View>,
          );
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(parentRef.current).addEventListener(
          'pointerup',
          () => {
            order.push('parent-imperative-capture');
          },
          {capture: true},
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(order).toEqual([
          'parent-prop-capture',
          'parent-imperative-capture',
        ]);
      });

      it('stopImmediatePropagation in prop handler prevents addEventListener listeners', () => {
        const root = Fantom.createRoot();
        const ref = React.createRef<React.ElementRef<typeof View>>();
        const imperativeHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <View
              ref={ref}
              onPointerUp={(e: $FlowFixMe) => {
                e.stopImmediatePropagation();
              }}
            />,
          );
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(ref.current).addEventListener(
          'pointerup',
          imperativeHandler,
        );

        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(imperativeHandler).toHaveBeenCalledTimes(0);
      });

      it('stopImmediatePropagation in addEventListener does not affect prop handler', () => {
        const root = Fantom.createRoot();
        const ref = React.createRef<React.ElementRef<typeof View>>();
        const propHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(<View ref={ref} onPointerUp={propHandler} />);
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(ref.current).addEventListener(
          'pointerup',
          (e: $FlowFixMe) => {
            e.stopImmediatePropagation();
          },
        );

        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        // Prop handler fires first, so it is not affected
        expect(propHandler).toHaveBeenCalledTimes(1);
      });

      it('full dispatch order: capture props, capture imperative, bubble props, bubble imperative', () => {
        const root = Fantom.createRoot();
        const parentRef = React.createRef<React.ElementRef<typeof View>>();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const order: Array<string> = [];

        Fantom.runTask(() => {
          root.render(
            <View
              ref={parentRef}
              onPointerUpCapture={() => {
                order.push('parent-prop-capture');
              }}
              onPointerUp={() => {
                order.push('parent-prop-bubble');
              }}>
              <View
                ref={childRef}
                onPointerUpCapture={() => {
                  order.push('child-prop-capture');
                }}
                onPointerUp={() => {
                  order.push('child-prop-bubble');
                }}
              />
            </View>,
          );
        });

        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(parentRef.current).addEventListener(
          'pointerup',
          () => {
            order.push('parent-imperative-capture');
          },
          {capture: true},
        );
        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(parentRef.current).addEventListener('pointerup', () => {
          order.push('parent-imperative-bubble');
        });
        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(childRef.current).addEventListener(
          'pointerup',
          () => {
            order.push('child-imperative-capture');
          },
          {capture: true},
        );
        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(childRef.current).addEventListener('pointerup', () => {
          order.push('child-imperative-bubble');
        });

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(order).toEqual([
          'parent-prop-capture',
          'parent-imperative-capture',
          'child-prop-capture',
          'child-imperative-capture',
          'child-prop-bubble',
          'child-imperative-bubble',
          'parent-prop-bubble',
          'parent-imperative-bubble',
        ]);
      });
    });

    it('event has type and bubbles properties when using EventTarget dispatching', () => {
      const root = Fantom.createRoot();
      const ref = React.createRef<React.ElementRef<typeof View>>();
      let eventType: unknown = null;
      let eventBubbles: unknown = null;

      const handler = jest.fn((e: PointerEvent) => {
        eventType = e.type;
        eventBubbles = e.bubbles;
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerUp={handler} />);
      });

      Fantom.dispatchNativeEvent(
        ref,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      expect(handler).toHaveBeenCalledTimes(1);
      // The legacy SyntheticEvent does not set type/bubbles as standard
      // DOM Event properties. The new EventTarget-based path does.
      if (eventType != null) {
        expect(eventType).toBe('pointerup');
        expect(eventBubbles).toBe(true);
      }
    });

    (ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching()
      ? it
      : it.skip)(
      'event.target points to the original target and event.currentTarget changes at each step',
      () => {
        const root = Fantom.createRoot();
        const parentRef = React.createRef<React.ElementRef<typeof View>>();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const targets: Array<{target: unknown, currentTarget: unknown}> = [];

        Fantom.runTask(() => {
          root.render(
            <View
              ref={parentRef}
              onPointerUpCapture={(e: $FlowFixMe) => {
                targets.push({
                  target: e.target,
                  currentTarget: e.currentTarget,
                });
              }}
              onPointerUp={(e: $FlowFixMe) => {
                targets.push({
                  target: e.target,
                  currentTarget: e.currentTarget,
                });
              }}>
              <View
                ref={childRef}
                onPointerUp={(e: $FlowFixMe) => {
                  targets.push({
                    target: e.target,
                    currentTarget: e.currentTarget,
                  });
                }}
              />
            </View>,
          );
        });

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(targets).toHaveLength(3);

        // event.target is always the original target element
        expect(targets[0].target).toBe(childRef.current);
        expect(targets[1].target).toBe(childRef.current);
        expect(targets[2].target).toBe(childRef.current);

        // event.currentTarget changes at each propagation step
        // Capture: parent
        expect(targets[0].currentTarget).toBe(parentRef.current);
        // Bubble: child, then parent
        expect(targets[1].currentTarget).toBe(childRef.current);
        expect(targets[2].currentTarget).toBe(parentRef.current);
      },
    );

    (ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching() &&
      ReactNativeFeatureFlags.enableImperativeEvents()
      ? it
      : it.skip)(
      'direct (non-bubbling) events do not propagate via addEventListener',
      () => {
        const root = Fantom.createRoot();
        const parentRef = React.createRef<React.ElementRef<typeof View>>();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const childHandler = jest.fn();
        const parentImperativeHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <View ref={parentRef}>
              <View ref={childRef} onLayout={childHandler} />
            </View>,
          );
        });

        // Add an imperative listener on the parent for the 'layout' event.
        // Since 'layout' is a direct (non-bubbling) event, this should NOT
        // fire when we dispatch onLayout on the child.
        // Temporary: ReadOnlyNode extends EventTarget at runtime behind feature flag
        asEventTarget(parentRef.current).addEventListener(
          'layout',
          parentImperativeHandler,
        );

        const childCallsBefore = childHandler.mock.calls.length;

        Fantom.dispatchNativeEvent(
          childRef,
          'onLayout',
          {layout: {x: 0, y: 0, width: 100, height: 50}},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        // Child handler fires
        expect(
          childHandler.mock.calls.length - childCallsBefore,
        ).toBeGreaterThan(0);
        // Parent's addEventListener listener does NOT fire because layout
        // is a non-bubbling (direct) event
        expect(parentImperativeHandler).toHaveBeenCalledTimes(0);
      },
    );

    (ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching() &&
      ReactNativeFeatureFlags.enableImperativeEvents()
      ? describe
      : describe.skip)('bubbling to document element and document', () => {
      it('event bubbles from child up to the document element', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const documentElementHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(<View ref={childRef} />);
        });

        asEventTarget(root.document.documentElement).addEventListener(
          'pointerup',
          documentElementHandler,
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(documentElementHandler).toHaveBeenCalledTimes(1);
      });

      it('event bubbles from child up to the document', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const documentHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(<View ref={childRef} />);
        });

        asEventTarget(root.document).addEventListener(
          'pointerup',
          documentHandler,
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(documentHandler).toHaveBeenCalledTimes(1);
      });

      it('event bubbles from a deeply nested child up to document element and document', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const documentElementHandler = jest.fn();
        const documentHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <View>
              <View>
                <View>
                  <View ref={childRef} />
                </View>
              </View>
            </View>,
          );
        });

        asEventTarget(root.document.documentElement).addEventListener(
          'pointerup',
          documentElementHandler,
        );
        asEventTarget(root.document).addEventListener(
          'pointerup',
          documentHandler,
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(documentElementHandler).toHaveBeenCalledTimes(1);
        expect(documentHandler).toHaveBeenCalledTimes(1);
      });

      it('capture phase on document fires before capture phase on document element', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const order: Array<string> = [];

        Fantom.runTask(() => {
          root.render(
            <View
              ref={childRef}
              onPointerUpCapture={() => {
                order.push('child-capture');
              }}
              onPointerUp={() => {
                order.push('child-bubble');
              }}
            />,
          );
        });

        asEventTarget(root.document).addEventListener(
          'pointerup',
          () => {
            order.push('document-capture');
          },
          {capture: true},
        );
        asEventTarget(root.document.documentElement).addEventListener(
          'pointerup',
          () => {
            order.push('documentElement-capture');
          },
          {capture: true},
        );
        asEventTarget(root.document.documentElement).addEventListener(
          'pointerup',
          () => {
            order.push('documentElement-bubble');
          },
        );
        asEventTarget(root.document).addEventListener('pointerup', () => {
          order.push('document-bubble');
        });

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(order).toEqual([
          'document-capture',
          'documentElement-capture',
          'child-capture',
          'child-bubble',
          'documentElement-bubble',
          'document-bubble',
        ]);
      });

      it('event.target points to the original child and event.currentTarget transitions through document element and document', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const targets: Array<{target: unknown, currentTarget: unknown}> = [];

        Fantom.runTask(() => {
          root.render(<View ref={childRef} />);
        });

        asEventTarget(root.document.documentElement).addEventListener(
          'pointerup',
          (e: $FlowFixMe) => {
            targets.push({target: e.target, currentTarget: e.currentTarget});
          },
        );
        asEventTarget(root.document).addEventListener(
          'pointerup',
          (e: $FlowFixMe) => {
            targets.push({target: e.target, currentTarget: e.currentTarget});
          },
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(targets).toHaveLength(2);

        // event.target is always the original target element
        expect(targets[0].target).toBe(childRef.current);
        expect(targets[1].target).toBe(childRef.current);

        // event.currentTarget changes at each propagation step
        expect(targets[0].currentTarget).toBe(root.document.documentElement);
        expect(targets[1].currentTarget).toBe(root.document);
      });

      it('stopPropagation on document element prevents document handler from firing', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const documentHandler = jest.fn();
        const documentElementHandler = jest.fn((e: $FlowFixMe) => {
          e.stopPropagation();
        });

        Fantom.runTask(() => {
          root.render(<View ref={childRef} />);
        });

        asEventTarget(root.document.documentElement).addEventListener(
          'pointerup',
          documentElementHandler,
        );
        asEventTarget(root.document).addEventListener(
          'pointerup',
          documentHandler,
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(documentElementHandler).toHaveBeenCalledTimes(1);
        expect(documentHandler).toHaveBeenCalledTimes(0);
      });

      it('removeEventListener on document element stops events from being received', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const documentElementHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(<View ref={childRef} />);
        });

        asEventTarget(root.document.documentElement).addEventListener(
          'pointerup',
          documentElementHandler,
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(documentElementHandler).toHaveBeenCalledTimes(1);

        asEventTarget(root.document.documentElement).removeEventListener(
          'pointerup',
          documentElementHandler,
        );

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(documentElementHandler).toHaveBeenCalledTimes(1);
      });

      it('direct (non-bubbling) events do not reach the document element or document', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const childHandler = jest.fn();
        const documentElementHandler = jest.fn();
        const documentHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(<View ref={childRef} onLayout={childHandler} />);
        });

        asEventTarget(root.document.documentElement).addEventListener(
          'layout',
          documentElementHandler,
        );
        asEventTarget(root.document).addEventListener(
          'layout',
          documentHandler,
        );

        const childCallsBefore = childHandler.mock.calls.length;

        Fantom.dispatchNativeEvent(
          childRef,
          'onLayout',
          {layout: {x: 0, y: 0, width: 100, height: 50}},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        // Child handler fires
        expect(
          childHandler.mock.calls.length - childCallsBefore,
        ).toBeGreaterThan(0);
        // Non-bubbling events don't reach the document element or the document
        expect(documentElementHandler).toHaveBeenCalledTimes(0);
        expect(documentHandler).toHaveBeenCalledTimes(0);
      });
    });

    it('stopPropagation in capture phase prevents all bubble-phase handlers', () => {
      const root = Fantom.createRoot();
      const childRef = React.createRef<React.ElementRef<typeof View>>();
      const order: Array<string> = [];

      Fantom.runTask(() => {
        root.render(
          <View
            onPointerUpCapture={(e: PointerEvent) => {
              order.push('parent-capture');
              e.stopPropagation();
            }}
            onPointerUp={() => {
              order.push('parent-bubble');
            }}>
            <View
              ref={childRef}
              onPointerUpCapture={() => {
                order.push('child-capture');
              }}
              onPointerUp={() => {
                order.push('child-bubble');
              }}
            />
          </View>,
        );
      });

      Fantom.dispatchNativeEvent(
        childRef,
        'onPointerUp',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.Discrete,
        },
      );

      // Only the parent capture handler should fire; everything else is stopped
      expect(order).toEqual(['parent-capture']);
    });

    describe('error handling', () => {
      it('error in event handler does not break dispatch to subsequent listeners', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const parentHandler = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <View onPointerUp={parentHandler}>
              <View
                ref={childRef}
                onPointerUp={() => {
                  throw new Error('handler error');
                }}
              />
            </View>,
          );
        });

        const dispatch = () =>
          Fantom.dispatchNativeEvent(
            childRef,
            'onPointerUp',
            {x: 0, y: 0},
            {
              category: Fantom.NativeEventCategory.Discrete,
            },
          );

        expect(dispatch).toThrow('handler error');

        // The parent bubble handler should still fire despite child's error
        expect(parentHandler).toHaveBeenCalledTimes(1);
      });
    });

    (ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching()
      ? describe
      : describe.skip)('event timestamps', () => {
      it('event preserves native timestamp from nativeEvent.timeStamp', () => {
        const root = Fantom.createRoot();
        const ref = React.createRef<React.ElementRef<typeof View>>();
        let eventTimeStamp: unknown = null;

        Fantom.runTask(() => {
          root.render(
            <View
              ref={ref}
              onPointerUp={(e: $FlowFixMe) => {
                eventTimeStamp = e.timeStamp;
              }}
            />,
          );
        });

        const nativeTimestamp = 12345.678;
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0, timeStamp: nativeTimestamp},
          {category: Fantom.NativeEventCategory.Discrete},
        );

        expect(eventTimeStamp).toBe(nativeTimestamp);
      });
    });

    // --- dispatchConfig ---

    describe('dispatchConfig', () => {
      it('includes phasedRegistrationNames on bubbling events', () => {
        const root = Fantom.createRoot();
        const ref = React.createRef<React.ElementRef<typeof View>>();
        let capturedDispatchConfig: $FlowFixMe = null;

        Fantom.runTask(() => {
          root.render(
            <View
              ref={ref}
              onPointerUp={(e: $FlowFixMe) => {
                capturedDispatchConfig = e.dispatchConfig;
              }}
            />,
          );
        });

        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {category: Fantom.NativeEventCategory.Discrete},
        );

        expect(capturedDispatchConfig).not.toBeNull();
        expect(capturedDispatchConfig.phasedRegistrationNames.bubbled).toBe(
          'onPointerUp',
        );
        expect(capturedDispatchConfig.phasedRegistrationNames.captured).toBe(
          'onPointerUpCapture',
        );
      });

      it('includes registrationName on direct events', () => {
        const root = Fantom.createRoot();
        const ref = React.createRef<React.ElementRef<typeof View>>();
        let capturedDispatchConfig: $FlowFixMe = null;

        Fantom.runTask(() => {
          root.render(
            <View
              ref={ref}
              onLayout={(e: $FlowFixMe) => {
                capturedDispatchConfig = e.dispatchConfig;
              }}
            />,
          );
        });

        Fantom.dispatchNativeEvent(
          ref,
          'onLayout',
          {x: 0, y: 0, width: 100, height: 50},
          {category: Fantom.NativeEventCategory.Discrete},
        );

        expect(capturedDispatchConfig).not.toBeNull();
        expect(capturedDispatchConfig.registrationName).toBe('onLayout');
      });
    });

    // --- skipBubbling ---

    describe('skipBubbling (pointerenter / pointerleave)', () => {
      it('does not bubble onPointerEnter to ancestor views', () => {
        const root = Fantom.createRoot();

        const childRef = React.createRef<React.ElementRef<typeof View>>();

        const parentSpy = jest.fn((_e: PointerEvent) => {});
        const childSpy = jest.fn((_e: PointerEvent) => {});

        Fantom.runTask(() => {
          root.render(
            <View onPointerEnter={parentSpy}>
              <View ref={childRef} onPointerEnter={childSpy} />
            </View>,
          );
        });

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerEnter',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.ContinuousStart,
          },
        );

        expect(childSpy).toHaveBeenCalledTimes(1);
        expect(parentSpy).toHaveBeenCalledTimes(0);
      });

      it('does not bubble onPointerLeave to ancestor views', () => {
        const root = Fantom.createRoot();

        const childRef = React.createRef<React.ElementRef<typeof View>>();

        const parentSpy = jest.fn((_e: PointerEvent) => {});
        const childSpy = jest.fn((_e: PointerEvent) => {});

        Fantom.runTask(() => {
          root.render(
            <View onPointerLeave={parentSpy}>
              <View ref={childRef} onPointerLeave={childSpy} />
            </View>,
          );
        });

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerLeave',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.ContinuousEnd,
          },
        );

        expect(childSpy).toHaveBeenCalledTimes(1);
        expect(parentSpy).toHaveBeenCalledTimes(0);
      });

      it('still fires onPointerEnterCapture on ancestors during the capture phase', () => {
        const root = Fantom.createRoot();

        const childRef = React.createRef<React.ElementRef<typeof View>>();

        const callOrder: Array<string> = [];
        const parentCaptureSpy = jest.fn((_e: PointerEvent) => {
          callOrder.push('parentCapture');
        });
        const childSpy = jest.fn((_e: PointerEvent) => {
          callOrder.push('child');
        });

        Fantom.runTask(() => {
          root.render(
            <View onPointerEnterCapture={parentCaptureSpy}>
              <View ref={childRef} onPointerEnter={childSpy} />
            </View>,
          );
        });

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerEnter',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.ContinuousStart,
          },
        );

        expect(parentCaptureSpy).toHaveBeenCalledTimes(1);
        expect(childSpy).toHaveBeenCalledTimes(1);
        expect(callOrder).toEqual(['parentCapture', 'child']);
      });

      it('still bubbles non-skipBubbling events (onPointerDown) to ancestor views', () => {
        const root = Fantom.createRoot();

        const childRef = React.createRef<React.ElementRef<typeof View>>();

        const parentSpy = jest.fn((_e: PointerEvent) => {});
        const childSpy = jest.fn((_e: PointerEvent) => {});

        Fantom.runTask(() => {
          root.render(
            <View onPointerDown={parentSpy}>
              <View ref={childRef} onPointerDown={childSpy} />
            </View>,
          );
        });

        Fantom.dispatchNativeEvent(
          childRef,
          'onPointerDown',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        expect(childSpy).toHaveBeenCalledTimes(1);
        expect(parentSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('direct events (onLayout)', () => {
      it('does not bubble onLayout to ancestor views via the onLayout prop', () => {
        const root = Fantom.createRoot();

        const childRef = React.createRef<React.ElementRef<typeof View>>();

        const parentSpy = jest.fn();
        const childSpy = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <View onLayout={parentSpy}>
              <View ref={childRef} onLayout={childSpy} />
            </View>,
          );
        });

        // Flush the layout events emitted for both views during the initial
        // layout pass so they are not conflated with the dispatch below.
        Fantom.flushAllNativeEvents();

        // Both onLayout handlers fired for their own layout during mount.
        const childCallsBefore = childSpy.mock.calls.length;
        const parentCallsBefore = parentSpy.mock.calls.length;

        Fantom.dispatchNativeEvent(
          childRef,
          'onLayout',
          {layout: {x: 0, y: 0, width: 100, height: 50}},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );

        // Child's onLayout handler fires for the dispatched event
        expect(childSpy.mock.calls.length - childCallsBefore).toBeGreaterThan(
          0,
        );
        // Parent's onLayout prop handler does NOT fire from the child's event
        // because layout is a direct (non-bubbling) event
        expect(parentSpy.mock.calls.length - parentCallsBefore).toBe(0);
      });
    });

    describe('direct events (rnIsDirect) — Event construction validation', () => {
      it('allows constructing a direct event that does not bubble', () => {
        const event = new Event('layout', {rnIsDirect: true});
        expect(event.rnIsDirect).toBe(true);
        expect(event.bubbles).toBe(false);
      });

      it('defaults rnIsDirect to false', () => {
        const event = new Event('layout');
        expect(event.rnIsDirect).toBe(false);
      });

      it('throws when rnIsDirect and bubbles are both true', () => {
        expect(() => {
          // eslint-disable-next-line no-new
          new Event('layout', {rnIsDirect: true, bubbles: true});
        }).toThrow(
          "Failed to construct 'Event': 'rnIsDirect' cannot be true when 'bubbles' is also true.",
        );
      });
    });

    // The dispatch-behavior tests use `addEventListener` on refs and the
    // document element, which is only available when both
    // `enableNativeEventTargetEventDispatching` and `enableImperativeEvents`
    // are enabled.
    (ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching() &&
      ReactNativeFeatureFlags.enableImperativeEvents()
      ? describe
      : describe.skip)('direct events (rnIsDirect) — dispatch behavior', () => {
      it('dispatches onLayout to the target but never to ancestor onLayout props or bubble listeners', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const childHandler = jest.fn();
        const parentPropHandler = jest.fn();
        const parentImperativeBubble = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <View onLayout={parentPropHandler}>
              <View>
                <View>
                  <View ref={childRef} onLayout={childHandler} />
                </View>
              </View>
            </View>,
          );
        });

        asEventTarget(root.document.documentElement).addEventListener(
          'layout',
          parentImperativeBubble,
        );

        // Drain mount-time layout events.
        Fantom.flushAllNativeEvents();

        const childBefore = childHandler.mock.calls.length;
        const parentBefore = parentPropHandler.mock.calls.length;
        const parentBubbleBefore = parentImperativeBubble.mock.calls.length;

        Fantom.dispatchNativeEvent(
          childRef,
          'onLayout',
          {layout: {x: 0, y: 0, width: 100, height: 50}},
          {category: Fantom.NativeEventCategory.Discrete},
        );

        // The target's own onLayout fires exactly once.
        expect(childHandler.mock.calls.length - childBefore).toBe(1);
        // A direct (non-bubbling) event never reaches an ancestor's onLayout
        // prop or an ancestor's bubble-phase listener, regardless of the fast
        // path.
        expect(parentPropHandler.mock.calls.length - parentBefore).toBe(0);
        expect(
          parentImperativeBubble.mock.calls.length - parentBubbleBefore,
        ).toBe(0);
      });

      it('restricts the event path to the target (AT_TARGET only, no ancestor capture listeners)', () => {
        const root = Fantom.createRoot();
        const childRef = React.createRef<React.ElementRef<typeof View>>();
        const ancestorCapture = jest.fn();
        let observedPhase: number | null = null;
        let observedPathLength: number | null = null;
        let observedCurrentIsTarget: boolean | null = null;

        const handler = jest.fn((e: $FlowFixMe) => {
          observedPhase = e.eventPhase;
          observedPathLength = e.composedPath().length;
          observedCurrentIsTarget = e.currentTarget === childRef.current;
        });

        Fantom.runTask(() => {
          root.render(createNestedViewsWithLayout(5, childRef, () => {}));
        });

        asEventTarget(childRef.current).addEventListener('layout', handler);
        asEventTarget(root.document.documentElement).addEventListener(
          'layout',
          ancestorCapture,
          {capture: true},
        );
        Fantom.flushAllNativeEvents();

        const ancestorCaptureBefore = ancestorCapture.mock.calls.length;

        Fantom.dispatchNativeEvent(
          childRef,
          'onLayout',
          {layout: {x: 0, y: 0, width: 100, height: 50}},
          {category: Fantom.NativeEventCategory.Discrete},
        );

        expect(handler).toHaveBeenCalled();
        expect(observedPhase).toBe(Event.AT_TARGET);
        // Event path is just the target node.
        expect(observedPathLength).toBe(1);
        expect(observedCurrentIsTarget).toBe(true);
        // With the fast path, the capture phase does not traverse ancestors.
        expect(ancestorCapture.mock.calls.length - ancestorCaptureBefore).toBe(
          0,
        );
      });
    });
  },
);
