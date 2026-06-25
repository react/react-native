/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';

const {PlatformColor} = require('../../StyleSheet/PlatformColorValueTypes');
let Animated = require('../Animated').default;
const AnimatedProps = require('../nodes/AnimatedProps').default;
const {
  create,
  unmount,
  update,
} = require('@react-native/jest-preset/jest/renderer');
const TestRenderer = require('react-test-renderer');

// WORKAROUND: `jest.runAllTicks` skips tasks scheduled w/ `queueMicrotask`.
function mockQueueMicrotask() {
  let queueMicrotask;
  beforeEach(() => {
    queueMicrotask = global.queueMicrotask;
    // $FlowFixMe[cannot-write]
    global.queueMicrotask = process.nextTick;
  });
  afterEach(() => {
    // $FlowFixMe[cannot-write]
    global.queueMicrotask = queueMicrotask;
  });
}

describe('Animated', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  mockQueueMicrotask();

  describe('Animated', () => {
    it('works end to end', () => {
      const anim = new Animated.Value(0);
      const translateAnim = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 200],
      });

      const callback = jest.fn();

      const node = new AnimatedProps(
        {
          style: {
            backgroundColor: 'red',
            opacity: anim,
            transform: [
              {
                translate: [translateAnim, translateAnim],
              },
              {
                translateX: translateAnim,
              },
              {scale: anim},
            ],
            shadowOffset: {
              width: anim,
              height: anim,
            },
          },
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: {
          backgroundColor: 'red',
          opacity: 0,
          transform: [{translate: [100, 100]}, {translateX: 100}, {scale: 0}],
          shadowOffset: {
            width: 0,
            height: 0,
          },
        },
      });

      expect(anim.__getChildren().length).toBe(0);

      node.__attach();

      anim.setValue(0.5);

      expect(callback).toBeCalled();

      expect(node.__getValue()).toEqual({
        style: {
          backgroundColor: 'red',
          opacity: 0.5,
          transform: [{translate: [150, 150]}, {translateX: 150}, {scale: 0.5}],
          shadowOffset: {
            width: 0.5,
            height: 0.5,
          },
        },
      });

      node.__detach();
      expect(anim.__getChildren().length).toBe(0);

      anim.setValue(1);
      expect(callback.mock.calls.length).toBe(1);
    });

    it('detaches only on unmount (in a microtask)', async () => {
      const opacity = new Animated.Value(0);
      jest.spyOn(opacity, '__detach');

      const root = await create(<Animated.View style={{opacity}} />);
      expect(opacity.__detach).not.toBeCalled();

      await update(root, <Animated.View style={{opacity}} />);
      expect(opacity.__detach).not.toBeCalled();
      jest.runAllTicks();
      expect(opacity.__detach).not.toBeCalled();

      await unmount(root);
      expect(opacity.__detach).not.toBeCalled();
      jest.runAllTicks();
      expect(opacity.__detach).toBeCalled();
    });

    it('restores default values only on update (in a microtask)', async () => {
      const __restoreDefaultValues = jest.spyOn(
        AnimatedProps.prototype,
        '__restoreDefaultValues',
      );

      try {
        const opacityA = new Animated.Value(0);
        const root = await create(
          <Animated.View style={{opacity: opacityA}} />,
        );
        expect(__restoreDefaultValues).not.toBeCalled();

        const opacityB = new Animated.Value(0);
        await update(root, <Animated.View style={{opacity: opacityB}} />);
        expect(__restoreDefaultValues).not.toBeCalled();
        jest.runAllTicks();
        expect(__restoreDefaultValues).toBeCalledTimes(1);

        const opacityC = new Animated.Value(0);
        await update(root, <Animated.View style={{opacity: opacityC}} />);
        expect(__restoreDefaultValues).toBeCalledTimes(1);
        jest.runAllTicks();
        expect(__restoreDefaultValues).toBeCalledTimes(2);

        await unmount(root);
        expect(__restoreDefaultValues).toBeCalledTimes(2);
        jest.runAllTicks();
        expect(__restoreDefaultValues).toBeCalledTimes(2);
      } finally {
        __restoreDefaultValues.mockRestore();
      }
    });

    it('stops animation when detached (in a microtask)', async () => {
      const opacity = new Animated.Value(0);
      const callback = jest.fn();

      const root = await create(<Animated.View style={{opacity}} />);

      Animated.timing(opacity, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: false,
      }).start(callback);

      await unmount(root);

      expect(callback).not.toBeCalled();
      jest.runAllTicks();
      expect(callback).toBeCalledWith({finished: false});
    });

    it('triggers callback when spring is at rest', () => {
      const anim = new Animated.Value(0);
      const callback = jest.fn();
      Animated.spring(anim, {
        toValue: 0,
        velocity: 0,
        useNativeDriver: false,
      }).start(callback);
      expect(callback).toBeCalled();
    });

    it('renders animated and primitive style correctly', () => {
      const anim = new Animated.Value(0);
      const staticProps: {[string]: unknown} = {
        style: [
          {transform: [{translateX: anim}]},
          {transform: [{translateX: 100}]},
        ],
      };
      const staticPropsWithoutAnim = {
        style: {transform: [{translateX: 100}]},
      };
      const node = new AnimatedProps(staticProps, jest.fn());
      expect(node.__getValueWithStaticProps(staticProps)).toStrictEqual(
        staticPropsWithoutAnim,
      );
    });

    it('send toValue when a critically damped spring stops', () => {
      const anim = new Animated.Value(0);
      const listener = jest.fn();
      anim.addListener(listener);
      Animated.spring(anim, {
        stiffness: 8000,
        damping: 2000,
        toValue: 15,
        useNativeDriver: false,
      }).start();
      jest.runAllTimers();
      const lastValue =
        listener.mock.calls[listener.mock.calls.length - 2][0].value;
      expect(lastValue).not.toBe(15);
      expect(lastValue).toBeCloseTo(15);
      expect(anim.__getValue()).toBe(15);
    });

    it('convert to JSON', () => {
      expect(JSON.stringify(new Animated.Value(10))).toBe('10');
    });

    it('bypasses `setNativeProps` in test environments', async () => {
      const opacity = new Animated.Value(0);

      const testRenderer = await create(<Animated.View style={{opacity}} />);

      expect(testRenderer.toJSON()?.props.style.opacity).toEqual(0);

      TestRenderer.act(() => {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 0,
          useNativeDriver: false,
        }).start();
      });

      expect(testRenderer.toJSON()?.props.style.opacity).toEqual(1);
    });

    it('warns if `useNativeDriver` is missing', () => {
      jest.spyOn(console, 'warn').mockImplementationOnce(() => {});

      // $FlowExpectedError[incompatible-type]
      Animated.spring(new Animated.Value(0), {
        toValue: 0,
        velocity: 0,
        // useNativeDriver
      }).start();

      expect(console.warn).toBeCalledWith(
        'Animated: `useNativeDriver` was not specified. This is a required option and must be explicitly set to `true` or `false`',
      );
      // $FlowFixMe[prop-missing]
      console.warn.mockRestore();
    });

    it('throws if `useNativeDriver` is incompatible with AnimatedValue', () => {
      const value = new Animated.Value(0);
      value.__makeNative();

      const animation = Animated.spring(value, {
        toValue: 0,
        velocity: 0,
        useNativeDriver: false,
      });

      expect(() => {
        animation.start();
      }).toThrow(
        'Attempting to run JS driven animation on animated node that has ' +
          'been moved to "native" earlier by starting an animation with ' +
          '`useNativeDriver: true`',
      );
    });

    it('synchronously throws on `useNativeDriver` incompatibility', () => {
      const value = new Animated.Value(0);
      value.__makeNative();

      const animation = Animated.spring(value, {
        delay: 100, // Even with a non-zero delay, error throws synchronously.
        toValue: 0,
        velocity: 0,
        useNativeDriver: false,
      });

      expect(() => {
        animation.start();
      }).toThrow(
        'Attempting to run JS driven animation on animated node that has ' +
          'been moved to "native" earlier by starting an animation with ' +
          '`useNativeDriver: true`',
      );
    });
  });

  describe('Animated Sequence', () => {
    it('works with an empty sequence', () => {
      const cb = jest.fn();
      Animated.sequence([]).start(cb);
      expect(cb).toBeCalledWith({finished: true});
    });

    it('sequences well', () => {
      const anim1 = {start: jest.fn()};
      const anim2 = {start: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.sequence([anim1 as $FlowFixMe, anim2 as $FlowFixMe]);

      expect(anim1.start).not.toBeCalled();
      expect(anim2.start).not.toBeCalled();

      seq.start(cb);

      expect(anim1.start).toBeCalled();
      expect(anim2.start).not.toBeCalled();
      expect(cb).not.toBeCalled();

      anim1.start.mock.calls[0][0]({finished: true});

      expect(anim2.start).toBeCalled();
      expect(cb).not.toBeCalled();

      anim2.start.mock.calls[0][0]({finished: true});
      expect(cb).toBeCalledWith({finished: true});
    });

    it('supports interrupting sequence', () => {
      const anim1 = {start: jest.fn()};
      const anim2 = {start: jest.fn()};
      const cb = jest.fn();

      Animated.sequence([anim1 as $FlowFixMe, anim2 as $FlowFixMe]).start(cb);

      anim1.start.mock.calls[0][0]({finished: false});

      expect(anim1.start).toBeCalled();
      expect(anim2.start).not.toBeCalled();
      expect(cb).toBeCalledWith({finished: false});
    });

    it('supports stopping sequence', () => {
      const anim1 = {start: jest.fn(), stop: jest.fn()};
      const anim2 = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.sequence([anim1 as $FlowFixMe, anim2 as $FlowFixMe]);
      seq.start(cb);
      seq.stop();

      expect(anim1.stop).toBeCalled();
      expect(anim2.stop).not.toBeCalled();
      expect(cb).not.toBeCalled();

      anim1.start.mock.calls[0][0]({finished: false});

      expect(cb).toBeCalledWith({finished: false});
    });

    it('supports restarting sequence after it was stopped during execution', () => {
      const anim1 = {start: jest.fn(), stop: jest.fn()};
      const anim2 = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.sequence([anim1 as $FlowFixMe, anim2 as $FlowFixMe]);

      seq.start(cb);

      anim1.start.mock.calls[0][0]({finished: true});
      seq.stop();

      // anim1 should be finished so anim2 should also start
      expect(anim1.start).toHaveBeenCalledTimes(1);
      expect(anim2.start).toHaveBeenCalledTimes(1);

      seq.start(cb);

      // after restart the sequence should resume from the anim2
      expect(anim1.start).toHaveBeenCalledTimes(1);
      expect(anim2.start).toHaveBeenCalledTimes(2);
    });

    it('supports restarting sequence after it was finished without a reset', () => {
      const anim1 = {start: jest.fn(), stop: jest.fn()};
      const anim2 = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.sequence([anim1 as $FlowFixMe, anim2 as $FlowFixMe]);

      seq.start(cb);
      anim1.start.mock.calls[0][0]({finished: true});
      anim2.start.mock.calls[0][0]({finished: true});

      // sequence should be finished
      expect(cb).toBeCalledWith({finished: true});

      seq.start(cb);

      // sequence should successfully restart from the anim1
      expect(anim1.start).toHaveBeenCalledTimes(2);
      expect(anim2.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('Animated Loop', () => {
    it('loops indefinitely if config not specified', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation as $FlowFixMe);

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
      expect(animation.reset).toHaveBeenCalledTimes(4);
      expect(cb).not.toBeCalled();
    });

    it('loops indefinitely if iterations is -1', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation as $FlowFixMe, {iterations: -1});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
      expect(animation.reset).toHaveBeenCalledTimes(4);
      expect(cb).not.toBeCalled();
    });

    it('loops indefinitely if iterations not specified', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(
        animation as $FlowFixMe,
        {anotherKey: 'value'} as $FlowFixMe,
      );

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
      expect(animation.reset).toHaveBeenCalledTimes(4);
      expect(cb).not.toBeCalled();
    });

    it('loops three times if iterations is 3', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation as $FlowFixMe, {iterations: 3});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).toBeCalledWith({finished: true});
    });

    it('does not loop if iterations is 1', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation as $FlowFixMe, {iterations: 1});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(cb).toBeCalledWith({finished: true});
    });

    it('does not animate if iterations is 0', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation as $FlowFixMe, {iterations: 0});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).not.toBeCalled();
      expect(cb).toBeCalledWith({finished: true});
    });

    it('supports interrupting an indefinite loop', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      Animated.loop(animation as $FlowFixMe).start(cb);
      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: false}); // Interrupt loop
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).toBeCalledWith({finished: false});
    });

    it('supports stopping loop', () => {
      const animation = {
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation as $FlowFixMe);
      loop.start(cb);
      loop.stop();

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(animation.stop).toBeCalled();

      animation.start.mock.calls[0][0]({finished: false}); // Interrupt loop
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).toBeCalledWith({finished: false});
    });
  });

  it('does not reset animation in a loop if resetBeforeIteration is false', () => {
    const animation = {
      start: jest.fn(),
      reset: jest.fn(),
      _isUsingNativeDriver: () => false,
    };
    const cb = jest.fn();

    const loop = Animated.loop(
      animation as $FlowFixMe,
      {resetBeforeIteration: false} as $FlowFixMe,
    );

    expect(animation.start).not.toBeCalled();

    loop.start(cb);

    expect(animation.start).toBeCalled();
    expect(animation.reset).not.toBeCalled();
    expect(cb).not.toBeCalled();

    animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
    expect(animation.reset).not.toBeCalled();
    expect(cb).not.toBeCalled();

    animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
    expect(animation.reset).not.toBeCalled();
    expect(cb).not.toBeCalled();

    animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
    expect(animation.reset).not.toBeCalled();
    expect(cb).not.toBeCalled();
  });

  it('restarts sequence normally in a loop if resetBeforeIteration is false', () => {
    const anim1 = {start: jest.fn(), stop: jest.fn()};
    const anim2 = {start: jest.fn(), stop: jest.fn()};
    const seq = Animated.sequence([anim1 as $FlowFixMe, anim2 as $FlowFixMe]);

    // $FlowFixMe[incompatible-type]
    const loop = Animated.loop(seq, {resetBeforeIteration: false});

    loop.start();

    expect(anim1.start).toHaveBeenCalledTimes(1);

    anim1.start.mock.calls[0][0]({finished: true});

    expect(anim2.start).toHaveBeenCalledTimes(1);

    anim2.start.mock.calls[0][0]({finished: true});

    // after anim2 is finished, the sequence is finished,
    // hence the loop iteration is finished, so the next iteration starts
    expect(anim1.start).toHaveBeenCalledTimes(2);
  });

  describe('Animated Parallel', () => {
    it('works with an empty parallel', () => {
      const cb = jest.fn();
      Animated.parallel([]).start(cb);
      expect(cb).toBeCalledWith({finished: true});
    });

    it('works with an empty element in array', () => {
      const anim1 = {start: jest.fn()};
      const cb = jest.fn();
      Animated.parallel([null as $FlowFixMe, anim1 as $FlowFixMe]).start(cb);

      expect(anim1.start).toBeCalled();
      anim1.start.mock.calls[0][0]({finished: true});

      expect(cb).toBeCalledWith({finished: true});
    });

    it('parallelizes well', () => {
      const anim1 = {start: jest.fn()};
      const anim2 = {start: jest.fn()};
      const cb = jest.fn();

      const par = Animated.parallel([anim1 as $FlowFixMe, anim2 as $FlowFixMe]);

      expect(anim1.start).not.toBeCalled();
      expect(anim2.start).not.toBeCalled();

      par.start(cb);

      expect(anim1.start).toBeCalled();
      expect(anim2.start).toBeCalled();
      expect(cb).not.toBeCalled();

      anim1.start.mock.calls[0][0]({finished: true});
      expect(cb).not.toBeCalled();

      anim2.start.mock.calls[0][0]({finished: true});
      expect(cb).toBeCalledWith({finished: true});
    });

    it('supports stopping parallel', () => {
      const anim1 = {start: jest.fn(), stop: jest.fn()};
      const anim2 = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.parallel([anim1 as $FlowFixMe, anim2 as $FlowFixMe]);
      seq.start(cb);
      seq.stop();

      expect(anim1.stop).toBeCalled();
      expect(anim2.stop).toBeCalled();
      expect(cb).not.toBeCalled();

      anim1.start.mock.calls[0][0]({finished: false});
      expect(cb).not.toBeCalled();

      anim2.start.mock.calls[0][0]({finished: false});
      expect(cb).toBeCalledWith({finished: false});
    });

    it('does not call stop more than once when stopping', () => {
      const anim1 = {start: jest.fn(), stop: jest.fn()};
      const anim2 = {start: jest.fn(), stop: jest.fn()};
      const anim3 = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.parallel([
        anim1 as $FlowFixMe,
        anim2 as $FlowFixMe,
        anim3 as $FlowFixMe,
      ]);
      seq.start(cb);

      anim1.start.mock.calls[0][0]({finished: false});

      expect(anim1.stop.mock.calls.length).toBe(0);
      expect(anim2.stop.mock.calls.length).toBe(1);
      expect(anim3.stop.mock.calls.length).toBe(1);

      anim2.start.mock.calls[0][0]({finished: false});

      expect(anim1.stop.mock.calls.length).toBe(0);
      expect(anim2.stop.mock.calls.length).toBe(1);
      expect(anim3.stop.mock.calls.length).toBe(1);

      anim3.start.mock.calls[0][0]({finished: false});

      expect(anim1.stop.mock.calls.length).toBe(0);
      expect(anim2.stop.mock.calls.length).toBe(1);
      expect(anim3.stop.mock.calls.length).toBe(1);
    });
  });

  describe('Animated delays', () => {
    it('should call anim after delay in sequence', () => {
      const anim = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();
      Animated.sequence([Animated.delay(1000), anim as $FlowFixMe]).start(cb);
      jest.runAllTimers();
      expect(anim.start.mock.calls.length).toBe(1);
      expect(cb).not.toBeCalled();
      anim.start.mock.calls[0][0]({finished: true});
      expect(cb).toBeCalledWith({finished: true});
    });
    it('should run stagger to end', () => {
      const cb = jest.fn();
      Animated.stagger(1000, [
        Animated.delay(1000),
        Animated.delay(1000),
        Animated.delay(1000),
      ]).start(cb);
      jest.runAllTimers();
      expect(cb).toBeCalledWith({finished: true});
    });
  });

  describe('Animated Events', () => {
    it('should map events', () => {
      const value = new Animated.Value(0);
      const handler = Animated.event([null, {state: {foo: value}}], {
        useNativeDriver: false,
      });
      handler({bar: 'ignoreBar'}, {state: {baz: 'ignoreBaz', foo: 42}});
      expect(value.__getValue()).toBe(42);
    });

    it('should validate AnimatedValueXY mappings', () => {
      const value = new Animated.ValueXY({x: 0, y: 0});
      const handler = Animated.event([{state: value}], {
        useNativeDriver: false,
      });
      handler({state: {x: 1, y: 2}});
      expect(value.__getValue()).toMatchObject({x: 1, y: 2});
    });

    it('should call listeners', () => {
      const value = new Animated.Value(0);
      const listener = jest.fn();
      const handler = Animated.event([{foo: value}], {
        listener,
        useNativeDriver: false,
      });
      handler({foo: 42});
      expect(value.__getValue()).toBe(42);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({foo: 42});
    });

    it('should call forked event listeners, with Animated.event() listener', () => {
      const value = new Animated.Value(0);
      const listener = jest.fn();
      const handler = Animated.event([{foo: value}], {
        listener,
        useNativeDriver: false,
      });
      const listener2 = jest.fn();
      const forkedHandler = Animated.forkEvent(handler, listener2);
      // $FlowFixMe[prop-missing]
      forkedHandler({foo: 42});
      expect(value.__getValue()).toBe(42);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({foo: 42});
      expect(listener2.mock.calls.length).toBe(1);
      expect(listener2).toBeCalledWith({foo: 42});
    });

    it('should call forked event listeners, with js listener', () => {
      const listener = jest.fn();
      const listener2 = jest.fn();
      const forkedHandler = Animated.forkEvent(listener, listener2);
      // $FlowFixMe[prop-missing]
      forkedHandler({foo: 42});
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({foo: 42});
      expect(listener2.mock.calls.length).toBe(1);
      expect(listener2).toBeCalledWith({foo: 42});
    });

    it('should call forked event listeners, with undefined listener', () => {
      const listener = undefined;
      const listener2 = jest.fn();
      const forkedHandler = Animated.forkEvent(listener, listener2);
      // $FlowFixMe[prop-missing]
      forkedHandler({foo: 42});
      expect(listener2.mock.calls.length).toBe(1);
      expect(listener2).toBeCalledWith({foo: 42});
    });
  });

  describe('Animated Tracking', () => {
    it('should track values', () => {
      const value1 = new Animated.Value(0);
      const value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42);
      value1.setValue(7);
      expect(value2.__getValue()).toBe(7);
    });

    it('should track interpolated values', () => {
      const value1 = new Animated.Value(0);
      const value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1.interpolate({
          inputRange: [0, 2],
          outputRange: [0, 1],
        }),
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42 / 2);
    });

    it('should stop tracking when animated', () => {
      const value1 = new Animated.Value(0);
      const value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42);
      Animated.timing(value2, {
        toValue: 7,
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue(1492);
      expect(value2.__getValue()).toBe(7);
    });

    it('should start tracking immediately on animation start', () => {
      const value1 = new Animated.Value(42);
      const value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      expect(value2.__getValue()).toBe(42);
      value1.setValue(7);
      expect(value2.__getValue()).toBe(7);
    });
  });

  describe('Animated Vectors', () => {
    it('should animate vectors', () => {
      const vec = new Animated.ValueXY();

      const callback = jest.fn();

      const node = new AnimatedProps(
        {
          // $FlowFixMe[cannot-spread-indexer]
          style: {
            opacity: vec.x.interpolate({
              inputRange: [0, 42],
              outputRange: [0.2, 0.8],
            }),
            transform: vec.getTranslateTransform(),
            ...vec.getLayout(),
          },
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: {
          opacity: 0.2,
          transform: [{translateX: 0}, {translateY: 0}],
          left: 0,
          top: 0,
        },
      });

      node.__attach();

      expect(callback.mock.calls.length).toBe(0);

      vec.setValue({x: 42, y: 1492});

      expect(callback.mock.calls.length).toBe(2); // once each for x, y

      expect(node.__getValue()).toEqual({
        style: {
          opacity: 0.8,
          transform: [{translateX: 42}, {translateY: 1492}],
          left: 42,
          top: 1492,
        },
      });

      node.__detach();

      vec.setValue({x: 1, y: 1});
      expect(callback.mock.calls.length).toBe(2);
    });

    it('should track vectors', () => {
      const value1 = new Animated.ValueXY();
      const value2 = new Animated.ValueXY();
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue({x: 42, y: 1492});
      expect(value2.__getValue()).toEqual({x: 42, y: 1492});

      // Make sure tracking keeps working (see stopTogether in ParallelConfig used
      // by maybeVectorAnim).
      value1.setValue({x: 3, y: 4});
      expect(value2.__getValue()).toEqual({x: 3, y: 4});
    });

    it('should track with springs', () => {
      const value1 = new Animated.ValueXY();
      const value2 = new Animated.ValueXY();
      Animated.spring(value2, {
        toValue: value1,
        tension: 3000, // faster spring for faster test
        friction: 60,
        useNativeDriver: false,
      }).start();
      value1.setValue({x: 1, y: 1});
      jest.runAllTimers();
      expect(Math.round(value2.__getValue().x)).toEqual(1);
      expect(Math.round(value2.__getValue().y)).toEqual(1);
      value1.setValue({x: 2, y: 2});
      jest.runAllTimers();
      expect(Math.round(value2.__getValue().x)).toEqual(2);
      expect(Math.round(value2.__getValue().y)).toEqual(2);
    });
  });

  describe('Animated Listeners', () => {
    it('should get updates', () => {
      const value1 = new Animated.Value(0);
      const listener = jest.fn();
      const id = value1.addListener(listener);
      value1.setValue(42);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({value: 42});
      expect(value1.__getValue()).toBe(42);
      value1.setValue(7);
      expect(listener.mock.calls.length).toBe(2);
      expect(listener).toBeCalledWith({value: 7});
      expect(value1.__getValue()).toBe(7);
      value1.removeListener(id);
      value1.setValue(1492);
      expect(listener.mock.calls.length).toBe(2);
      expect(value1.__getValue()).toBe(1492);
    });

    it('should get updates for derived animated nodes', () => {
      const value1 = new Animated.Value(40);
      const value2 = new Animated.Value(50);
      const value3 = new Animated.Value(0);
      const value4 = Animated.add(value3, Animated.multiply(value1, value2));
      const callback = jest.fn();
      const view = new AnimatedProps(
        {
          style: {
            transform: [
              {
                translateX: value4,
              },
            ],
          },
        },
        callback,
      );
      view.__attach();
      const listener = jest.fn();
      const id = value4.addListener(listener);
      value3.setValue(137);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({value: 2137});
      value1.setValue(0);
      expect(listener.mock.calls.length).toBe(2);
      expect(listener).toBeCalledWith({value: 137});
      expect(view.__getValue()).toEqual({
        style: {
          transform: [
            {
              translateX: 137,
            },
          ],
        },
      });
      value4.removeListener(id);
      value1.setValue(40);
      expect(listener.mock.calls.length).toBe(2);
      expect(value4.__getValue()).toBe(2137);
    });

    it('should removeAll', () => {
      const value1 = new Animated.Value(0);
      const listener = jest.fn();
      [1, 2, 3, 4].forEach(() => value1.addListener(listener));
      value1.setValue(42);
      expect(listener.mock.calls.length).toBe(4);
      expect(listener).toBeCalledWith({value: 42});
      value1.removeAllListeners();
      value1.setValue(7);
      expect(listener.mock.calls.length).toBe(4);
    });
  });

  describe('Animated Diff Clamp', () => {
    it('should get the proper value', () => {
      const inputValues = [0, 20, 40, 30, 0, -40, -10, -20, 0];
      const expectedValues = [0, 20, 20, 10, 0, 0, 20, 10, 20];
      const value = new Animated.Value(0);
      const diffClampValue = Animated.diffClamp(value, 0, 20);
      for (let i = 0; i < inputValues.length; i++) {
        value.setValue(inputValues[i]);
        expect(diffClampValue.__getValue()).toBe(expectedValues[i]);
      }
    });
  });

  describe('Animated Colors', () => {
    it('should normalize colors', () => {
      let color = new Animated.Color();
      expect(color.__getValue()).toEqual('rgba(0, 0, 0, 1)');

      color = new Animated.Color({r: 11, g: 22, b: 33, a: 1.0});
      expect(color.__getValue()).toEqual('rgba(11, 22, 33, 1)');

      color = new Animated.Color('rgba(255, 0, 0, 1.0)');
      expect(color.__getValue()).toEqual('rgba(255, 0, 0, 1)');

      color = new Animated.Color('#ff0000ff');
      expect(color.__getValue()).toEqual('rgba(255, 0, 0, 1)');

      color = new Animated.Color('red');
      expect(color.__getValue()).toEqual('rgba(255, 0, 0, 1)');

      color = new Animated.Color({
        r: new Animated.Value(255),
        g: new Animated.Value(0),
        b: new Animated.Value(0),
        a: new Animated.Value(1.0),
      });
      expect(color.__getValue()).toEqual('rgba(255, 0, 0, 1)');

      color = new Animated.Color('unknown');
      expect(color.__getValue()).toEqual('rgba(0, 0, 0, 1)');

      // $FlowFixMe[incompatible-type]
      color = new Animated.Color({key: 'value'});
      expect(color.__getValue()).toEqual('rgba(0, 0, 0, 1)');
    });

    it('should animate colors', () => {
      const color = new Animated.Color({r: 255, g: 0, b: 0, a: 1.0});
      const callback = jest.fn();
      const node = new AnimatedProps(
        {
          style: {
            backgroundColor: color,
            transform: [
              {
                scale: color.a.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2],
                }),
              },
            ],
          },
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: {
          backgroundColor: 'rgba(255, 0, 0, 1)',
          transform: [{scale: 2}],
        },
      });

      node.__attach();
      expect(callback).not.toHaveBeenCalled();

      color.setValue({r: 11, g: 22, b: 33, a: 0.5});
      expect(callback).toHaveBeenCalledTimes(5);
      expect(node.__getValue()).toEqual({
        style: {
          backgroundColor: 'rgba(11, 22, 33, 0.5)',
          transform: [{scale: 1.5}],
        },
      });

      node.__detach();
      color.setValue({r: 255, g: 0, b: 0, a: 1.0});
      expect(callback).toHaveBeenCalledTimes(5);
    });

    it('should track colors', () => {
      const color1 = new Animated.Color();
      const color2 = new Animated.Color();
      Animated.timing(color2, {
        toValue: color1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      color1.setValue({r: 11, g: 22, b: 33, a: 0.5});
      expect(color2.__getValue()).toEqual('rgba(11, 22, 33, 0.5)');

      // Make sure tracking keeps working (see stopTogether in ParallelConfig used
      // by maybeVectorAnim).
      color1.setValue({r: 255, g: 0, b: 0, a: 1.0});
      expect(color2.__getValue()).toEqual('rgba(255, 0, 0, 1)');
    });

    it('should track with springs', () => {
      const color1 = new Animated.Color();
      const color2 = new Animated.Color();
      Animated.spring(color2, {
        toValue: color1,
        tension: 3000, // faster spring for faster test
        friction: 60,
        useNativeDriver: false,
      }).start();
      color1.setValue({r: 11, g: 22, b: 33, a: 0.5});
      jest.runAllTimers();
      expect(color2.__getValue()).toEqual('rgba(11, 22, 33, 0.5)');
      color1.setValue({r: 44, g: 55, b: 66, a: 0.0});
      jest.runAllTimers();
      expect(color2.__getValue()).toEqual('rgba(44, 55, 66, 0)');
    });

    it('should provide updates for native colors', () => {
      const color = new Animated.Color('red');

      const listener = jest.fn();
      color.addListener(listener);

      const callback = jest.fn();
      const node = new AnimatedProps({style: {color}}, callback);
      node.__attach();

      color.setValue('blue');
      expect(callback).toHaveBeenCalledTimes(5);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({value: 'rgba(0, 0, 255, 1)'});
      expect(color.__getValue()).toEqual('rgba(0, 0, 255, 1)');

      callback.mockClear();
      listener.mockClear();

      color.setValue(PlatformColor('bar'));
      expect(callback).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({value: PlatformColor('bar')});
      expect(color.__getValue()).toEqual(PlatformColor('bar'));
    });
  });
});
