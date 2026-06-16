/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

describe('AnimatedColor', () => {
  let NativeAnimatedHelper;
  let AnimatedColor;

  beforeEach(() => {
    jest.resetModules();

    jest.mock('../NativeAnimatedTurboModule', () => ({
      __esModule: true,
      default: {
        addListener: jest.fn(),
        createAnimatedNode: jest.fn(),
        connectAnimatedNodes: jest.fn(),
        disconnectAnimatedNodes: jest.fn(),
        dropAnimatedNode: jest.fn(),
        removeListeners: jest.fn(),
        startListeningToAnimatedNodeValue: jest.fn(),
        stopListeningToAnimatedNodeValue: jest.fn(),
        extractAnimatedNodeOffset: jest.fn(),
      },
    }));

    NativeAnimatedHelper =
      require('../../../src/private/animated/NativeAnimatedHelper').default;
    AnimatedColor = require('../nodes/AnimatedColor').default;

    jest.spyOn(NativeAnimatedHelper.API, 'startListeningToAnimatedNodeValue');
    jest.spyOn(NativeAnimatedHelper.API, 'stopListeningToAnimatedNodeValue');
    jest.spyOn(NativeAnimatedHelper.API, 'createAnimatedNode');
    jest.spyOn(NativeAnimatedHelper.API, 'dropAnimatedNode');
  });

  describe('addListener and removeListener', () => {
    it('calls listener when color channel values change', () => {
      const callback = jest.fn();
      const color = new AnimatedColor({r: 0, g: 0, b: 0, a: 1});
      color.__attach();

      color.addListener(callback);
      color.setValue({r: 255, g: 0, b: 0, a: 1});

      expect(callback).toBeCalledTimes(1);
    });

    it('does not call listener after removeListener', () => {
      const callback = jest.fn();
      const color = new AnimatedColor({r: 0, g: 0, b: 0, a: 1});
      color.__attach();

      const id = color.addListener(callback);
      color.removeListener(id);
      color.setValue({r: 255, g: 0, b: 0, a: 1});

      expect(callback).not.toBeCalled();
    });

    it('does not let r/g/b/a _listenerCount go negative after __detach followed by removeListener', () => {
      // This is the core regression test.
      //
      // Steps that trigger the bug:
      //   1. addListener  → r/g/b/a _listenerCount = 1
      //   2. __detach()   → calls removeAllListeners() on r/g/b/a
      //                     → r/g/b/a _listenerCount = 0
      //   3. removeListener(id) → calls r.removeListener() etc.
      //                     → WITHOUT fix: r/g/b/a _listenerCount = -1 
      //                     → WITH fix:    early return, stays at 0   
      const color = new AnimatedColor({r: 0, g: 0, b: 0, a: 1});
      color.__attach();

      const id = color.addListener(jest.fn());

      // Simulate component unmount — __detach calls removeAllListeners on channels
      color.__detach();

      // Stale cleanup still calls removeListener (e.g. from useEffect cleanup)
      color.removeListener(id);

      expect(color.r._listenerCount).toBe(0);
      expect(color.g._listenerCount).toBe(0);
      expect(color.b._listenerCount).toBe(0);
      expect(color.a._listenerCount).toBe(0);
    });

    it('does not throw when removeListener is called after removeAllListeners', () => {
      const color = new AnimatedColor({r: 0, g: 0, b: 0, a: 1});
      color.__attach();

      const id = color.addListener(jest.fn());
      color.removeAllListeners();

      expect(() => color.removeListener(id)).not.toThrow();

      expect(color.r._listenerCount).toBe(0);
      expect(color.g._listenerCount).toBe(0);
      expect(color.b._listenerCount).toBe(0);
      expect(color.a._listenerCount).toBe(0);
    });
  });

  describe('native subscription cleanup', () => {
    it('starts listening to each channel when addListener is called on a native color', () => {
      const color = new AnimatedColor(
        {r: 0, g: 0, b: 0, a: 1},
        {useNativeDriver: true},
      );
      color.__attach();

      color.addListener(jest.fn());

      // r, g, b, a — 4 channels each start listening
      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(4);
    });

    it('stops listening to each channel when removeListener brings count to 0', () => {
      const color = new AnimatedColor(
        {r: 0, g: 0, b: 0, a: 1},
        {useNativeDriver: true},
      );
      color.__attach();

      const id = color.addListener(jest.fn());
      color.removeListener(id);

      // r, g, b, a — 4 channels each stop listening
      expect(
        NativeAnimatedHelper.API.stopListeningToAnimatedNodeValue,
      ).toBeCalledTimes(4);
    });

    it('does not leak native subscription when __detach is followed by removeListener', () => {
      // Without the fix, _listenerCount goes to -1 after this sequence,
      // so the === 0 check never fires again on a subsequent addListener/removeListener
      // cycle — leaking the native subscription permanently.
      const color = new AnimatedColor(
        {r: 0, g: 0, b: 0, a: 1},
        {useNativeDriver: true},
      );
      color.__attach();

      const id = color.addListener(jest.fn());

      color.__detach(); // removeAllListeners → _listenerCount = 0

      // With fix: this is a no-op, does not decrement to -1
      color.removeListener(id);

      // Re-attach and add a new listener — native subscription should work cleanly
      color.__attach();
      const id2 = color.addListener(jest.fn());

      // stopListening count should match startListening count from the new cycle
      color.removeListener(id2);
      expect(
        NativeAnimatedHelper.API.stopListeningToAnimatedNodeValue,
      ).toBeCalledTimes(
        // 4 from __detach cleanup + 4 from id2 removeListener
        8,
      );
    });
  });
});
