/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {EventSubscription} from '../EventEmitter';

import EventEmitter from '../EventEmitter';

describe('listeners', () => {
  it('does nothing without listeners', () => {
    const emitter = new EventEmitter<{A: []}>();

    expect(() => {
      emitter.emit('A');
    }).not.toThrow();
  });

  it('invokes multiple listeners', () => {
    const emitter = new EventEmitter<{A: []}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('A', listenerB);

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalledTimes(2);
    expect(listenerB).toHaveBeenCalledTimes(2);
  });

  it('invokes listeners of a type', () => {
    const emitter = new EventEmitter<{A: [], B: []}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('B', listenerB);

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(0);

    emitter.emit('B');
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
  });

  it('invokes listeners in registration order', () => {
    const emitter = new EventEmitter<{A: []}>();

    const results = [];

    const listenerA = jest.fn(() => {
      results.push('A');
    });
    const listenerB = jest.fn(() => {
      results.push('B');
    });
    const listenerC = jest.fn(() => {
      results.push('C');
    });
    emitter.addListener('A', listenerA);
    emitter.addListener('A', listenerB);
    emitter.addListener('A', listenerC);

    emitter.emit('A');
    expect(results).toEqual(['A', 'B', 'C']);
  });

  it('invokes the same listener registered multiple times', () => {
    const emitter = new EventEmitter<{A: []}>();

    const listener = jest.fn();
    const subscriptionA = emitter.addListener('A', listener);
    const subscriptionB = emitter.addListener('A', listener);

    emitter.emit('A');
    expect(listener).toHaveBeenCalledTimes(2);

    subscriptionA.remove();

    emitter.emit('A');
    expect(listener).toHaveBeenCalledTimes(3);

    subscriptionB.remove();

    emitter.emit('A');
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('throws on non-function listeners', () => {
    const emitter = new EventEmitter<{A: []}>();

    expect(() => {
      emitter.addListener('A', () => {});
    }).not.toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      emitter.addListener('A', null);
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      emitter.addListener('A', undefined);
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      emitter.addListener('A', 'abc');
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      emitter.addListener('A', 123);
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      emitter.addListener('A', 123);
    }).toThrow();
  });
});

describe('arguments and context', () => {
  it('invokes listeners with emit() arguments', () => {
    const emitter = new EventEmitter<{A: [number, string]}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('A', listenerB);

    emitter.emit('A', 123, 'abc');
    expect(listenerA).toHaveBeenCalledWith(123, 'abc');
    expect(listenerB).toHaveBeenCalledWith(123, 'abc');

    emitter.emit('A', 456, 'def');
    expect(listenerA).toHaveBeenCalledWith(456, 'def');
    expect(listenerB).toHaveBeenCalledWith(456, 'def');
  });

  it('invokes listeners with specified context', () => {
    const emitter = new EventEmitter<{A: []}>();

    const context = {};
    let that;
    const listener = jest.fn(function (this: unknown) {
      that = this;
    });
    emitter.addListener('A', listener, context);

    emitter.emit('A');
    expect(listener).toHaveBeenCalled();
    expect(that).toBe(context);
  });
});

describe('removing subscriptions', () => {
  it('does not invoked removed listeners', () => {
    const emitter = new EventEmitter<{A: []}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn();
    const subscriptionA = emitter.addListener('A', listenerA);
    const subscriptionB = emitter.addListener('A', listenerB);

    subscriptionA.remove();

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalledTimes(0);
    expect(listenerB).toHaveBeenCalledTimes(1);

    subscriptionB.remove();

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalledTimes(0);
    expect(listenerB).toHaveBeenCalledTimes(1);
  });

  it('does nothing when removing a subscription more than once', () => {
    const emitter = new EventEmitter<{A: []}>();

    const listener = jest.fn();
    const subscription = emitter.addListener('A', listener);

    subscription.remove();

    expect(() => {
      subscription.remove();
    }).not.toThrow();
  });

  it('removes all listeners', () => {
    const emitter = new EventEmitter<{A: [], B: []}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('B', listenerB);

    emitter.removeAllListeners();

    emitter.emit('A');
    expect(listenerA).not.toHaveBeenCalled();

    emitter.emit('B');
    expect(listenerB).not.toHaveBeenCalled();
  });

  it('removes all listeners of a type', () => {
    const emitter = new EventEmitter<{A: [], B: []}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('B', listenerB);

    emitter.removeAllListeners('A');

    emitter.emit('A');
    expect(listenerA).not.toHaveBeenCalled();

    emitter.emit('B');
    expect(listenerB).toHaveBeenCalled();
  });
});

describe('listener count', () => {
  it('counts the number of listeners for an event type', () => {
    const emitter = new EventEmitter<{A: [], B: []}>();

    expect(emitter.listenerCount('A')).toBe(0);
    expect(emitter.listenerCount('B')).toBe(0);

    const listenerA = jest.fn();
    const listenerB = jest.fn();
    const listenerC = jest.fn();
    const subscriptionA = emitter.addListener('A', listenerA);
    const subscriptionB = emitter.addListener('A', listenerB);
    const subscriptionC = emitter.addListener('B', listenerC);

    expect(emitter.listenerCount('A')).toBe(2);
    expect(emitter.listenerCount('B')).toBe(1);

    subscriptionA.remove();

    expect(emitter.listenerCount('A')).toBe(1);
    expect(emitter.listenerCount('B')).toBe(1);

    subscriptionB.remove();
    subscriptionC.remove();

    expect(emitter.listenerCount('A')).toBe(0);
    expect(emitter.listenerCount('B')).toBe(0);

    subscriptionA.remove();

    // Just for good measure...
    expect(emitter.listenerCount('A')).toBe(0);
  });
});

describe('event emission', () => {
  it('interrupts emission when a listener throws an error', () => {
    const emitter = new EventEmitter<{A: []}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn(() => {
      throw new Error('Expected error.');
    });
    const listenerC = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('A', listenerB);
    emitter.addListener('A', listenerC);

    expect(() => {
      emitter.emit('A');
    }).toThrow('Expected error.');

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
    expect(listenerC).toHaveBeenCalledTimes(0);
  });

  it('does not invoke listeners added during emission', () => {
    const emitter = new EventEmitter<{A: []}>();

    const listenerA = jest.fn(() => {
      emitter.addListener('A', listenerB);
    });
    const listenerB = jest.fn();
    emitter.addListener('A', listenerA);

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).not.toHaveBeenCalled();
  });

  it('invokes pending listeners if previous subscriptions are removed', () => {
    const emitter = new EventEmitter<{A: []}>();

    const results = [];

    const listenerA = jest.fn(() => {
      results.push('A');
    });
    const listenerB = jest.fn(() => {
      results.push('B');
      subscriptionA.remove();
    });
    const listenerC = jest.fn(() => {
      results.push('C');
    });
    const subscriptionA = emitter.addListener('A', listenerA);
    emitter.addListener('A', listenerB);
    emitter.addListener('A', listenerC);

    emitter.emit('A');
    expect(results).toEqual(['A', 'B', 'C']);

    emitter.emit('A');
    expect(results).toEqual(['A', 'B', 'C', 'B', 'C']);
  });

  it('invokes pending listeners if current subscription is removed', () => {
    const emitter = new EventEmitter<{A: []}>();

    const results = [];

    const listenerA = jest.fn(() => {
      results.push('A');
    });
    const listenerB: JestMockFn<Array<unknown>, void> = jest.fn(() => {
      results.push('B');
      subscriptionB.remove();
    });
    const listenerC = jest.fn(() => {
      results.push('C');
    });
    emitter.addListener('A', listenerA);
    const subscriptionB: EventSubscription = emitter.addListener(
      'A',
      listenerB,
    );
    emitter.addListener('A', listenerC);

    emitter.emit('A');
    expect(results).toEqual(['A', 'B', 'C']);

    emitter.emit('A');
    expect(results).toEqual(['A', 'B', 'C', 'A', 'C']);
  });

  it('invokes pending listeners even if its subscription is removed', () => {
    const emitter = new EventEmitter<{A: []}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn(() => {
      subscriptionC.remove();
    });
    const listenerC = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('A', listenerB);
    const subscriptionC = emitter.addListener('A', listenerC);

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalled();
    expect(listenerC).toHaveBeenCalled();
  });

  it('invokes pending listeners even if all listeners are removed', () => {
    const emitter = new EventEmitter<{A: []}>();

    const listenerA = jest.fn();
    const listenerB = jest.fn(() => {
      emitter.removeAllListeners();
    });
    const listenerC = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('A', listenerB);
    emitter.addListener('A', listenerC);

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalled();
    expect(listenerC).toHaveBeenCalled();
  });

  it('invokes pending listeners if all listeners of a type are removed', () => {
    const emitter = new EventEmitter<{A: [], B: []}>();

    const listenerA = jest.fn(() => {
      emitter.removeAllListeners('A');
    });
    const listenerB = jest.fn();
    const listenerC = jest.fn();
    emitter.addListener('A', listenerA);
    emitter.addListener('A', listenerB);
    emitter.addListener('B', listenerC);

    emitter.emit('A');
    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalled();

    emitter.emit('B');
    expect(listenerC).toHaveBeenCalled();
  });
});
