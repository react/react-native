/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../../src/private/types/HostInstance';
import type {KeyboardEvent} from '../../Keyboard/Keyboard';
import type {ScrollViewProps} from '../ScrollView';

import TextInputState from '../../TextInput/TextInputState';
import * as React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// The jest preset replaces ScrollView with a mock component — these tests
// exercise the real implementation's responder negotiation.
const ScrollView = (jest.requireActual('../ScrollView') as $FlowFixMe).default;

const fakeTextInput: HostInstance = {} as $FlowFixMe;
const fakeKeyboardEvent: KeyboardEvent = {
  duration: 250,
  easing: 'keyboard',
  endCoordinates: {height: 336, screenX: 0, screenY: 400, width: 400},
  startCoordinates: {height: 0, screenX: 0, screenY: 736, width: 400},
  isEventFromThisApp: true,
};

function fakeTapEvent(target: unknown) {
  return {target, nativeEvent: {touches: []}} as $FlowFixMe;
}

async function renderScrollView(props: ScrollViewProps) {
  let testRenderer;
  await ReactTestRenderer.act(() => {
    testRenderer = ReactTestRenderer.create(<ScrollView {...props} />);
  });

  const instance = (testRenderer as $FlowFixMe).root.find(
    node => node.instance?._handleStartShouldSetResponder != null,
  ).instance as $FlowFixMe;

  return instance;
}

describe('shouldDismissKeyboardOnTap', () => {
  beforeEach(() => {
    // Simulate a focused text input with an open soft keyboard.
    TextInputState.registerInput(fakeTextInput);
    TextInputState.focusInput(fakeTextInput);
  });

  afterEach(() => {
    TextInputState.blurInput(fakeTextInput);
    TextInputState.unregisterInput(fakeTextInput);
  });

  it('by default, a tap outside the focused input claims the responder in "handled" mode', async () => {
    const instance = await renderScrollView({
      keyboardShouldPersistTaps: 'handled',
    });
    instance.scrollResponderKeyboardWillShow(fakeKeyboardEvent);

    expect(instance._handleStartShouldSetResponder(fakeTapEvent({}))).toBe(
      true,
    );
  });

  it('returning false vetoes the responder claim', async () => {
    const shouldDismissKeyboardOnTap = jest.fn().mockReturnValue(false);
    const instance = await renderScrollView({
      keyboardShouldPersistTaps: 'handled',
      shouldDismissKeyboardOnTap,
    });
    instance.scrollResponderKeyboardWillShow(fakeKeyboardEvent);

    const tapEvent = fakeTapEvent({});
    expect(instance._handleStartShouldSetResponder(tapEvent)).toBe(false);
    expect(shouldDismissKeyboardOnTap).toHaveBeenCalledWith(tapEvent);
  });

  it('returning true keeps the responder claim', async () => {
    const shouldDismissKeyboardOnTap = jest.fn().mockReturnValue(true);
    const instance = await renderScrollView({
      keyboardShouldPersistTaps: 'handled',
      shouldDismissKeyboardOnTap,
    });
    instance.scrollResponderKeyboardWillShow(fakeKeyboardEvent);

    const tapEvent = fakeTapEvent({});
    expect(instance._handleStartShouldSetResponder(tapEvent)).toBe(true);
    expect(shouldDismissKeyboardOnTap).toHaveBeenCalledWith(tapEvent);
  });

  it('is not consulted when there is no dismissible keyboard', async () => {
    const shouldDismissKeyboardOnTap = jest.fn().mockReturnValue(false);
    const instance = await renderScrollView({
      keyboardShouldPersistTaps: 'handled',
      shouldDismissKeyboardOnTap,
    });
    // No keyboard event was received, so there is no keyboard to dismiss.

    expect(instance._handleStartShouldSetResponder(fakeTapEvent({}))).toBe(
      false,
    );
    expect(shouldDismissKeyboardOnTap).not.toHaveBeenCalled();
  });

  it('is not consulted when the tap lands on the focused input', async () => {
    const shouldDismissKeyboardOnTap = jest.fn().mockReturnValue(false);
    const instance = await renderScrollView({
      keyboardShouldPersistTaps: 'handled',
      shouldDismissKeyboardOnTap,
    });
    instance.scrollResponderKeyboardWillShow(fakeKeyboardEvent);

    expect(
      instance._handleStartShouldSetResponder(fakeTapEvent(fakeTextInput)),
    ).toBe(false);
    expect(shouldDismissKeyboardOnTap).not.toHaveBeenCalled();
  });

  it.each(['never', 'always'])(
    'is not consulted when keyboardShouldPersistTaps is %s',
    async keyboardShouldPersistTaps => {
      const shouldDismissKeyboardOnTap = jest.fn().mockReturnValue(false);
      const instance = await renderScrollView({
        keyboardShouldPersistTaps,
        shouldDismissKeyboardOnTap,
      });
      instance.scrollResponderKeyboardWillShow(fakeKeyboardEvent);

      expect(instance._handleStartShouldSetResponder(fakeTapEvent({}))).toBe(
        false,
      );
      expect(shouldDismissKeyboardOnTap).not.toHaveBeenCalled();
    },
  );
});
