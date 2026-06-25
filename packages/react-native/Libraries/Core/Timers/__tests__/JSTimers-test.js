/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const NativeTiming = {
  createTimer: jest.fn(),
  deleteTimer: jest.fn(),
  setSendIdleEvents: jest.fn(),
};

jest.mock('../NativeTiming', () => ({
  __esModule: true,
  default: NativeTiming,
}));

const JSTimers = require('../JSTimers').default;

describe('JSTimers', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockReturnValue(undefined);
    // $FlowExpectedError[cannot-write]
    global.setTimeout = JSTimers.setTimeout;
  });

  afterEach(() => {
    // $FlowFixMe[prop-missing]
    console.warn.mockRestore();
  });

  it('should call function with setTimeout', () => {
    let didCall = false;
    const id = JSTimers.setTimeout(() => {
      didCall = true;
    }, 0);
    JSTimers.callTimers([id]);
    expect(didCall).toBe(true);
  });

  it('should call nested setTimeout when cleared', () => {
    let id1: number;
    let id2: number;
    let id3: number;
    let callCount = 0;

    id1 = JSTimers.setTimeout(() => {
      JSTimers.clearTimeout(id1);
      id2 = JSTimers.setTimeout(() => {
        JSTimers.clearTimeout(id2);
        id3 = JSTimers.setTimeout(() => {
          callCount += 1;
        }, 0);
      }, 0);
    }, 0);
    JSTimers.callTimers([id1]);
    // $FlowFixMe[incompatible-type]
    JSTimers.callTimers([id2]);
    // $FlowFixMe[incompatible-type]
    JSTimers.callTimers([id3]);

    expect(callCount).toBe(1);
  });

  it('should call nested queueReactNativeMicrotask when cleared', () => {
    let id1: number;
    let id2: number;
    let id3: number;
    let callCount = 0;

    id1 = JSTimers.queueReactNativeMicrotask(() => {
      JSTimers.clearReactNativeMicrotask(id1);
      id2 = JSTimers.queueReactNativeMicrotask(() => {
        JSTimers.clearReactNativeMicrotask(id2);
        id3 = JSTimers.queueReactNativeMicrotask(() => {
          callCount += 1;
        }, 0);
      }, 0);
    }, 0);
    JSTimers.callTimers([id1]);
    // $FlowFixMe[incompatible-type]
    JSTimers.callTimers([id2]);
    // $FlowFixMe[incompatible-type]
    JSTimers.callTimers([id3]);

    expect(callCount).toBe(1);
  });

  it('should call nested requestAnimationFrame when cleared', () => {
    let id1: number;
    let id2: number;
    let id3: number;
    let callCount = 0;

    id1 = JSTimers.requestAnimationFrame(() => {
      JSTimers.cancelAnimationFrame(id1);
      id2 = JSTimers.requestAnimationFrame(() => {
        JSTimers.cancelAnimationFrame(id2);
        id3 = JSTimers.requestAnimationFrame(() => {
          callCount += 1;
        });
      });
    });
    JSTimers.callTimers([id1]);
    // $FlowFixMe[incompatible-type]
    JSTimers.callTimers([id2]);
    // $FlowFixMe[incompatible-type]
    JSTimers.callTimers([id3]);

    expect(callCount).toBe(1);
  });

  it('should call nested setInterval when cleared', () => {
    let id1: number;
    let id2: number;
    let id3: number;
    let callCount = 0;

    id1 = JSTimers.setInterval(() => {
      JSTimers.clearInterval(id1);
      id2 = JSTimers.setInterval(() => {
        JSTimers.clearInterval(id2);
        id3 = JSTimers.setInterval(() => {
          callCount += 1;
        }, 0);
      }, 0);
    }, 0);
    JSTimers.callTimers([id1]);
    // $FlowFixMe[incompatible-type]
    JSTimers.callTimers([id2]);
    // $FlowFixMe[incompatible-type]
    JSTimers.callTimers([id3]);

    expect(callCount).toBe(1);
  });

  it('should call function with setInterval', () => {
    const callback = jest.fn();
    const id = JSTimers.setInterval(callback, 0);
    JSTimers.callTimers([id]);
    expect(callback).toBeCalledTimes(1);
  });

  it('should call function with queueReactNativeMicrotask', () => {
    const callback = jest.fn();
    JSTimers.queueReactNativeMicrotask(callback);
    JSTimers.callReactNativeMicrotasks();
    expect(callback).toBeCalledTimes(1);
  });

  it('should not call function with clearReactNativeMicrotask', () => {
    const callback = jest.fn();
    const id = JSTimers.queueReactNativeMicrotask(callback);
    JSTimers.clearReactNativeMicrotask(id);
    JSTimers.callReactNativeMicrotasks();
    expect(callback).not.toBeCalled();
  });

  it('should call functions in the right order with queueReactNativeMicrotask', () => {
    let count = 0;
    let firstCalled = null;
    let secondCalled = null;
    JSTimers.queueReactNativeMicrotask(() => {
      firstCalled = count++;
    });
    JSTimers.queueReactNativeMicrotask(() => {
      secondCalled = count++;
    });
    JSTimers.callReactNativeMicrotasks();
    expect(firstCalled).toBe(0);
    expect(secondCalled).toBe(1);
  });

  it('should call functions in the right order with nested queueReactNativeMicrotask', () => {
    let count = 0;
    let firstCalled = null;
    let secondCalled = null;
    let thirdCalled = null;
    JSTimers.queueReactNativeMicrotask(() => {
      firstCalled = count++;
      JSTimers.queueReactNativeMicrotask(() => {
        thirdCalled = count++;
      });
      secondCalled = count++;
    });
    JSTimers.callReactNativeMicrotasks();
    expect(firstCalled).toBe(0);
    expect(secondCalled).toBe(1);
    expect(thirdCalled).toBe(2);
  });

  it('should call nested queueReactNativeMicrotask', () => {
    let firstCalled = false;
    let secondCalled = false;
    JSTimers.queueReactNativeMicrotask(() => {
      firstCalled = true;
      JSTimers.queueReactNativeMicrotask(() => {
        secondCalled = true;
      });
    });
    JSTimers.callReactNativeMicrotasks();
    expect(firstCalled).toBe(true);
    expect(secondCalled).toBe(true);
  });

  it('should call function with requestAnimationFrame', () => {
    const callback = jest.fn();
    const id = JSTimers.requestAnimationFrame(callback);
    JSTimers.callTimers([id]);
    expect(callback).toBeCalledTimes(1);
  });

  it("should not call function if we don't callTimers", () => {
    const callback = jest.fn();
    JSTimers.setTimeout(callback, 10);
    expect(callback).not.toBeCalled();
    JSTimers.setInterval(callback, 10);
    expect(callback).not.toBeCalled();
    JSTimers.requestAnimationFrame(callback);
    expect(callback).not.toBeCalled();
  });

  it('should call setInterval as many times as callTimers is called', () => {
    const callback = jest.fn();
    const id = JSTimers.setInterval(callback, 10);
    JSTimers.callTimers([id]);
    JSTimers.callTimers([id]);
    JSTimers.callTimers([id]);
    JSTimers.callTimers([id]);
    expect(callback).toBeCalledTimes(4);
  });

  it("should only call the function who's id we pass in", () => {
    let firstCalled = false;
    let secondCalled = false;
    JSTimers.setTimeout(() => {
      firstCalled = true;
    }, 0);
    const secondID = JSTimers.setTimeout(() => {
      secondCalled = true;
    }, 0);
    JSTimers.callTimers([secondID]);
    expect(firstCalled).toBe(false);
    expect(secondCalled).toBe(true);
  });

  it('should work with calling multiple timers', () => {
    let firstCalled = false;
    let secondCalled = false;
    const firstID = JSTimers.setTimeout(() => {
      firstCalled = true;
    }, 0);
    const secondID = JSTimers.setTimeout(() => {
      secondCalled = true;
    }, 0);
    JSTimers.callTimers([firstID, secondID]);
    expect(firstCalled).toBe(true);
    expect(secondCalled).toBe(true);
  });

  it('should still execute all callbacks even if one throws', () => {
    const firstID = JSTimers.setTimeout(() => {
      throw new Error('error');
    }, 10);
    let secondCalled = false;
    const secondID = JSTimers.setTimeout(() => {
      secondCalled = true;
    }, 10);
    expect(JSTimers.callTimers.bind(null, [firstID, secondID])).toThrow();
    expect(secondCalled).toBe(true);
  });

  it('should clear timers even if callback throws', () => {
    const timerID = JSTimers.setTimeout(() => {
      throw new Error('error');
    }, 10);
    expect(JSTimers.callTimers.bind(null, [timerID])).toThrow('error');
    JSTimers.callTimers.bind(null, [timerID]);
  });

  it('should not warn if callback is called on cancelled timer', () => {
    const callback = jest.fn();
    const timerID = JSTimers.setTimeout(callback, 10);
    JSTimers.clearTimeout(timerID);
    JSTimers.callTimers([timerID]);
    expect(callback).not.toBeCalled();
    expect(console.warn).not.toBeCalled();
  });

  it('should warn when callTimers is called with garbage timer id', () => {
    JSTimers.callTimers([1337]);
    expect(console.warn).toBeCalled();
  });

  it('should only call callback once for setTimeout', () => {
    const callback = jest.fn();
    const timerID = JSTimers.setTimeout(callback, 10);
    // First time the timer fires, should call callback
    JSTimers.callTimers([timerID]);
    expect(callback).toBeCalledTimes(1);
    // Second time it should be ignored
    JSTimers.callTimers([timerID]);
    expect(callback).toBeCalledTimes(1);
    expect(console.warn).not.toBeCalled();
  });

  it('should only call callback once for requestAnimationFrame', () => {
    const callback = jest.fn();
    const timerID = JSTimers.requestAnimationFrame(callback);
    // First time the timer fires, should call callback
    JSTimers.callTimers([timerID]);
    expect(callback).toBeCalledTimes(1);
    // Second time it should be ignored
    JSTimers.callTimers([timerID]);
    expect(callback).toBeCalledTimes(1);
    expect(console.warn).not.toBeCalled();
  });

  it('should re-throw first exception', () => {
    const timerID1 = JSTimers.setTimeout(() => {
      throw new Error('first error');
    }, 0);
    const timerID2 = JSTimers.setTimeout(() => {
      throw new Error('second error');
    }, 0);
    expect(JSTimers.callTimers.bind(null, [timerID1, timerID2])).toThrowError(
      'first error',
    );
  });

  it('should pass along errors thrown from queueReactNativeMicrotask', () => {
    JSTimers.queueReactNativeMicrotask(() => {
      throw new Error('error within queueReactNativeMicrotask');
    });

    NativeTiming.createTimer = jest.fn();
    JSTimers.callReactNativeMicrotasks();

    // The remaining errors should be called within setTimeout, in case there
    // are a series of them
    expect(NativeTiming.createTimer).toBeCalled();
    const timerID = NativeTiming.createTimer.mock.calls[0][0];
    expect(JSTimers.callTimers.bind(null, [timerID])).toThrowError(
      'error within queueReactNativeMicrotask',
    );
  });

  it('should throw all errors from queueReactNativeMicrotask', () => {
    JSTimers.queueReactNativeMicrotask(() => {
      throw new Error('first error');
    });

    JSTimers.queueReactNativeMicrotask(() => {
      throw new Error('second error');
    });

    NativeTiming.createTimer = jest.fn();
    JSTimers.callReactNativeMicrotasks();

    expect(NativeTiming.createTimer.mock.calls.length).toBe(2);

    const firstTimerID = NativeTiming.createTimer.mock.calls[0][0];
    expect(JSTimers.callTimers.bind(null, [firstTimerID])).toThrowError(
      'first error',
    );

    const secondTimerID = NativeTiming.createTimer.mock.calls[1][0];
    expect(JSTimers.callTimers.bind(null, [secondTimerID])).toThrowError(
      'second error',
    );
  });

  it('should pass along errors thrown from setTimeout', () => {
    const timerID = JSTimers.setTimeout(() => {
      throw new Error('error within setTimeout');
    }, 0);

    expect(JSTimers.callTimers.bind(null, [timerID])).toThrowError(
      'error within setTimeout',
    );
  });

  it('should throw all errors from setTimeout', () => {
    const firstTimerID = JSTimers.setTimeout(() => {
      throw new Error('first error');
    }, 0);
    const secondTimerID = JSTimers.setTimeout(() => {
      throw new Error('second error');
    }, 0);

    NativeTiming.createTimer = jest.fn();
    expect(
      JSTimers.callTimers.bind(null, [firstTimerID, secondTimerID]),
    ).toThrowError('first error');

    expect(NativeTiming.createTimer.mock.calls.length).toBe(1);
    const thirdTimerID = NativeTiming.createTimer.mock.calls[0][0];
    expect(JSTimers.callTimers.bind(null, [thirdTimerID])).toThrowError(
      'second error',
    );
  });

  it('should pass along errors thrown from setInterval', () => {
    const timerID = JSTimers.setInterval(() => {
      throw new Error('error within setInterval');
    }, 0);
    expect(JSTimers.callTimers.bind(null, [timerID])).toThrowError(
      'error within setInterval',
    );
  });

  it('should not call to native when clearing a null timer', () => {
    const timerID = JSTimers.setTimeout(() => {}, 0);
    JSTimers.clearTimeout(timerID);
    NativeTiming.deleteTimer = jest.fn();

    // $FlowExpectedError[incompatible-type]
    JSTimers.clearTimeout(null);
    expect(NativeTiming.deleteTimer.mock.calls.length).toBe(0);
  });
});
