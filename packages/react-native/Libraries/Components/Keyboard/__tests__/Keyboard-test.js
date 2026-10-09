/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const RCTDeviceEventEmitter =
  require('../../../EventEmitter/RCTDeviceEventEmitter').default;
const LayoutAnimation =
  require('../../../LayoutAnimation/LayoutAnimation').default;
const dismissKeyboard = require('../../../Utilities/dismissKeyboard').default;
const Keyboard = require('../Keyboard').default;

jest.mock('../../../LayoutAnimation/LayoutAnimation');
jest.mock('../../../Utilities/dismissKeyboard');

describe('Keyboard', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('uses dismissKeyboard utility', () => {
    Keyboard.dismiss();
    expect(dismissKeyboard).toHaveBeenCalled();
  });

  it('invokes listeners with the specified context', () => {
    const context = {};
    let that;
    const listener = jest.fn(function (this: unknown, _event: unknown) {
      that = this;
    });
    const subscription = Keyboard.addListener(
      'keyboardDidShow',
      listener,
      context,
    );

    RCTDeviceEventEmitter.emit('keyboardDidShow', {});

    expect(listener).toHaveBeenCalled();
    expect(that).toBe(context);
    subscription.remove();
  });

  describe('scheduling layout animation', () => {
    const scheduleLayoutAnimation = (
      duration: null | number,
      easing: null | string,
    ): void =>
      // $FlowFixMe[incompatible-type]
      Keyboard.scheduleLayoutAnimation({duration, easing});

    it('triggers layout animation', () => {
      scheduleLayoutAnimation(12, 'spring');
      expect(LayoutAnimation.configureNext).toHaveBeenCalledWith({
        duration: 12,
        update: {
          duration: 12,
          type: 'spring',
        },
      });
    });

    it('does not trigger animation when duration is null', () => {
      scheduleLayoutAnimation(null, 'spring');
      expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    });

    it('does not trigger animation when duration is 0', () => {
      scheduleLayoutAnimation(0, 'spring');
      expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    });

    describe('animation update type', () => {
      const assertAnimationUpdateType = (type: string) =>
        expect(LayoutAnimation.configureNext).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: expect.anything(),
            update: {duration: expect.anything(), type},
          }),
        );

      it('retrieves type from LayoutAnimation', () => {
        scheduleLayoutAnimation(12, 'linear');
        assertAnimationUpdateType('linear');
      });

      it("defaults to 'keyboard' when key in LayoutAnimation is not found", () => {
        scheduleLayoutAnimation(12, 'some-unknown-animation-type');
        assertAnimationUpdateType('keyboard');
      });

      it("defaults to 'keyboard' when easing is null", () => {
        scheduleLayoutAnimation(12, null);
        assertAnimationUpdateType('keyboard');
      });
    });
  });
});
