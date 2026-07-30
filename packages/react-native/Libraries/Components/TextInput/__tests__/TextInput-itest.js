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

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef, useEffect, useLayoutEffect, useRef} from 'react';
import {TextInput} from 'react-native';

describe('<TextInput>', () => {
  describe('props', () => {
    describe('selection', () => {
      it('the selection is passed to component view by command', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TextInput nativeID="text-input" selection={{start: 0, end: 4}}>
              hello World!
            </TextInput>,
          );
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Update {type: "RootView", nativeID: (root)}',
          'Create {type: "AndroidTextInput", nativeID: "text-input"}',
          'Insert {type: "AndroidTextInput", parentNativeID: (root), index: 0, nativeID: "text-input"}',
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "setTextAndSelection, args: [0,null,0,4]"}',
        ]);
      });
    });

    describe('onChange', () => {
      it('is called when the change native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();
        const onChange = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              onChange={event => {
                onChange(event.nativeEvent);
              }}
              ref={nodeRef}
            />,
          );
        });

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(nodeRef, 'change', {
            text: 'Hello World',
          });
        });

        Fantom.runWorkLoop();

        expect(onChange).toHaveBeenCalledTimes(1);
        const [entry] = onChange.mock.lastCall;
        expect(entry.text).toEqual('Hello World');
      });
    });

    describe('onChangeText', () => {
      it('is called when the change native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();
        const onChangeText = jest.fn();

        Fantom.runTask(() => {
          root.render(<TextInput onChangeText={onChangeText} ref={nodeRef} />);
        });

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(nodeRef, 'change', {
            text: 'Hello World',
          });
        });

        Fantom.runWorkLoop();

        expect(onChangeText).toHaveBeenCalledTimes(1);
        const [entry] = onChangeText.mock.lastCall;
        expect(entry).toEqual('Hello World');
      });
    });

    describe('onFocus', () => {
      it('is called when the focus native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();

        let focusEvent = jest.fn();

        Fantom.runTask(() => {
          root.render(<TextInput onFocus={focusEvent} ref={nodeRef} />);
        });

        expect(focusEvent).toHaveBeenCalledTimes(0);

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(nodeRef, 'focus');
        });

        // The tasks have not run.
        expect(focusEvent).toHaveBeenCalledTimes(0);

        Fantom.runWorkLoop();

        expect(focusEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('onBlur', () => {
      it('is called when the blur native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();

        let blurEvent = jest.fn();

        Fantom.runTask(() => {
          root.render(<TextInput onBlur={blurEvent} ref={nodeRef} />);
        });

        expect(blurEvent).toHaveBeenCalledTimes(0);

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(nodeRef, 'blur');
        });

        // The tasks have not run.
        expect(blurEvent).toHaveBeenCalledTimes(0);

        Fantom.runWorkLoop();

        expect(blurEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('onSelectionChange', () => {
      it('is called with the updated selection', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();
        const onSelectionChange = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              onSelectionChange={event => {
                onSelectionChange(event.nativeEvent);
              }}
              ref={nodeRef}>
              hello world
            </TextInput>,
          );
        });

        Fantom.dispatchNativeEvent(nodeRef, 'selectionChange', {
          selection: {start: 2, end: 5},
        });

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        const [entry] = onSelectionChange.mock.lastCall;
        expect(entry.selection).toEqual({start: 2, end: 5});
      });
    });

    describe('onSubmitEditing', () => {
      it('is called when the submit native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();
        const onSubmitEditing = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              onSubmitEditing={event => {
                onSubmitEditing(event.nativeEvent);
              }}
              ref={nodeRef}
            />,
          );
        });

        Fantom.dispatchNativeEvent(nodeRef, 'submitEditing', {
          text: 'submitted text',
        });

        expect(onSubmitEditing).toHaveBeenCalledTimes(1);
        const [entry] = onSubmitEditing.mock.lastCall;
        expect(entry.text).toEqual('submitted text');
      });
    });

    describe('onKeyPress', () => {
      it('is called with the pressed key', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();
        const onKeyPress = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              onKeyPress={event => {
                onKeyPress(event.nativeEvent);
              }}
              ref={nodeRef}
            />,
          );
        });

        Fantom.dispatchNativeEvent(nodeRef, 'keyPress', {key: 'a'});

        expect(onKeyPress).toHaveBeenCalledTimes(1);
        const [entry] = onKeyPress.mock.lastCall;
        expect(entry.key).toEqual('a');
      });
    });

    describe('onEndEditing', () => {
      it('is called when the end editing native event is dispatched', () => {
        const root = Fantom.createRoot();
        const nodeRef = createRef<HostInstance>();
        const onEndEditing = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              onEndEditing={event => {
                onEndEditing(event.nativeEvent);
              }}
              ref={nodeRef}
            />,
          );
        });

        Fantom.dispatchNativeEvent(nodeRef, 'endEditing', {
          text: 'final text',
        });

        expect(onEndEditing).toHaveBeenCalledTimes(1);
        const [entry] = onEndEditing.mock.lastCall;
        expect(entry.text).toEqual('final text');
      });
    });

    describe('id and nativeID', () => {
      it(`has 'id' propagated as 'nativeID' to the mounting layer`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TextInput id="alpha" />);
        });

        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-androidTextInput nativeID="alpha" />,
        );
      });

      it(`has 'nativeID' propagated correctly`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="alpha" />);
        });

        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-androidTextInput nativeID="alpha" />,
        );
      });

      it(`has a precedence of 'id' over 'nativeID'`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TextInput id="alpha" nativeID="gamma" />);
        });

        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-androidTextInput nativeID="alpha" />,
        );
      });
    });

    describe('testID', () => {
      it('is propagated to the mounting layer', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TextInput testID="my-test-id" />);
        });

        expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
          <rn-androidTextInput testID="my-test-id" />,
        );
      });
    });

    describe('aria-label and accessibilityLabel', () => {
      it(`has 'aria-label' propagated as 'accessibilityLabel'`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TextInput aria-label="label" />);
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
        ).toEqual(<rn-androidTextInput accessibilityLabel="label" />);
      });

      it(`has 'accessibilityLabel' propagated correctly`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TextInput accessibilityLabel="label" />);
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
        ).toEqual(<rn-androidTextInput accessibilityLabel="label" />);
      });
    });

    describe('aria-* and accessibilityState', () => {
      it(`maps 'aria-*' state props to 'accessibilityState'`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              aria-busy={true}
              aria-checked={true}
              aria-disabled={true}
              aria-expanded={true}
              aria-selected={true}
            />,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-androidTextInput accessibilityState="{disabled:true,selected:true,checked:Checked,busy:true,expanded:true}" />,
        );
      });
    });

    describe('accessibilityRole', () => {
      it('is propagated to the mounting layer', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TextInput accessibilityRole="button" />);
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
        ).toEqual(<rn-androidTextInput accessibilityRole="button" />);
      });
    });

    describe('style', () => {
      it('propagates style values to the mounting layer', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TextInput style={{backgroundColor: 'white'}} />);
        });

        expect(
          root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
        ).toEqual(
          <rn-androidTextInput backgroundColor="rgba(255, 255, 255, 1)" />,
        );
      });
    });
  });

  describe('ref', () => {
    it('is an element node', () => {
      const ref = createRef<HostInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<TextInput ref={ref} />);
      });

      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it('provides additional methods: clear, isFocused, getNativeRef, setSelection', () => {
      const ref = createRef<React.ElementRef<typeof TextInput>>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<TextInput ref={ref} />);
      });

      const instance = nullthrows(ref.current);
      expect(instance.clear).toBeInstanceOf(Function);
      expect(instance.isFocused).toBeInstanceOf(Function);
      expect(instance.getNativeRef).toBeInstanceOf(Function);
    });

    describe('focus()', () => {
      it('dispatches the focus command', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        root.takeMountingManagerLogs();

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.focus();
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "focus"}',
        ]);
      });

      it('creates view before dispatching view command from ref function', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TextInput
              nativeID="text-input"
              ref={node => {
                if (node) {
                  node.focus();
                }
              }}
            />,
          );
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Update {type: "RootView", nativeID: (root)}',
          'Create {type: "AndroidTextInput", nativeID: "text-input"}',
          'Insert {type: "AndroidTextInput", parentNativeID: (root), index: 0, nativeID: "text-input"}',
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "focus"}',
        ]);
      });

      it('creates view before dispatching view command from useLayoutEffect', () => {
        const root = Fantom.createRoot();

        function Component() {
          const textInputRef = useRef<null | React.ElementRef<
            typeof TextInput,
          >>(null);

          useLayoutEffect(() => {
            textInputRef.current?.focus();
          });

          return <TextInput ref={textInputRef} nativeID="text-input" />;
        }
        Fantom.runTask(() => {
          root.render(<Component />);
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Update {type: "RootView", nativeID: (root)}',
          'Create {type: "AndroidTextInput", nativeID: "text-input"}',
          'Insert {type: "AndroidTextInput", parentNativeID: (root), index: 0, nativeID: "text-input"}',
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "focus"}',
        ]);
      });

      it('creates view before dispatching view command from useEffect', () => {
        const root = Fantom.createRoot();

        function Component() {
          const textInputRef = useRef<null | React.ElementRef<
            typeof TextInput,
          >>(null);

          useEffect(() => {
            textInputRef.current?.focus();
          });

          return <TextInput ref={textInputRef} nativeID="text-input" />;
        }

        Fantom.runTask(() => {
          root.render(<Component />);
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Update {type: "RootView", nativeID: (root)}',
          'Create {type: "AndroidTextInput", nativeID: "text-input"}',
          'Insert {type: "AndroidTextInput", parentNativeID: (root), index: 0, nativeID: "text-input"}',
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "focus"}',
        ]);
      });

      it('unfocuses any previously focused TextInput when a new one is focused', () => {
        const root = Fantom.createRoot();
        const ref1 = createRef<React.ElementRef<typeof TextInput>>();
        const ref2 = createRef<React.ElementRef<typeof TextInput>>();

        Fantom.runTask(() => {
          root.render(
            <>
              <TextInput nativeID="text-input-1" ref={ref1} />
              <TextInput nativeID="text-input-2" ref={ref2} />
            </>,
          );
        });

        const instance1 = nullthrows(ref1.current);
        const instance2 = nullthrows(ref2.current);

        expect(instance1.isFocused()).toBe(false);
        expect(instance2.isFocused()).toBe(false);

        Fantom.runTask(() => {
          instance1.focus();
        });

        expect(instance1.isFocused()).toBe(true);
        expect(instance2.isFocused()).toBe(false);
        expect(TextInput.State.currentlyFocusedInput()).toBe(instance1);

        Fantom.runTask(() => {
          instance2.focus();
        });

        expect(instance1.isFocused()).toBe(false);
        expect(instance2.isFocused()).toBe(true);
        expect(TextInput.State.currentlyFocusedInput()).toBe(instance2);
      });
    });

    describe('blur()', () => {
      it('does NOT dispatch any commands if the input is NOT focused', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        root.takeMountingManagerLogs();

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.blur();
        });

        expect(root.takeMountingManagerLogs()).toEqual([]);
      });

      it('does dispatches the blur command if the input is focused', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.focus();
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          instance.blur();
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "blur"}',
        ]);
      });

      it('dispatches the blur command when a focused input is unmounted', () => {
        const root = Fantom.createRoot();
        const ref = createRef<HostInstance>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.focus();
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          // unmount TextInput
          root.render(<></>);
        });

        expect(root.takeMountingManagerLogs()).toContain(
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "blur"}',
        );
        expect(TextInput.State.currentlyFocusedInput()).toBe(null);
      });
    });

    describe('clear()', () => {
      it('dispatches the clear command', () => {
        const root = Fantom.createRoot();
        const ref = createRef<React.ElementRef<typeof TextInput>>();

        Fantom.runTask(() => {
          root.render(
            <TextInput nativeID="text-input" ref={ref} value="Some input" />,
          );
        });

        root.takeMountingManagerLogs();

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.clear();
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "setTextAndSelection, args: [0,"",0,0]"}',
        ]);
      });
    });

    describe('isFocused()', () => {
      it('returns true if the input is focused', () => {
        const root = Fantom.createRoot();
        const ref = createRef<React.ElementRef<typeof TextInput>>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        const instance = nullthrows(ref.current);

        expect(instance.isFocused()).toBe(false);

        Fantom.runTask(() => {
          instance.focus();
        });

        expect(instance.isFocused()).toBe(true);

        Fantom.runTask(() => {
          instance.blur();
        });

        expect(instance.isFocused()).toBe(false);
      });

      it('returns false if the input is unmounted', () => {
        const root = Fantom.createRoot();
        const ref = createRef<React.ElementRef<typeof TextInput>>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        const instance = nullthrows(ref.current);

        expect(instance.isFocused()).toBe(false);

        Fantom.runTask(() => {
          instance.focus();
        });

        expect(instance.isFocused()).toBe(true);

        Fantom.runTask(() => {
          // unmount TextInput
          root.render(<></>);
        });

        expect(instance.isFocused()).toBe(false);
      });

      it('returns false if the input is unmounted and never focused', () => {
        Fantom.runTask(() => {
          // TextInputState is global, so we need to clean up the state to be sure that we
          // don't have a focused input ref
          TextInput.State.blurTextInput(
            TextInput.State.currentlyFocusedInput(),
          );
        });

        expect(TextInput.State.currentlyFocusedInput()).toBe(null);

        const root = Fantom.createRoot();
        const ref = createRef<React.ElementRef<typeof TextInput>>();

        Fantom.runTask(() => {
          root.render(<TextInput nativeID="text-input" ref={ref} />);
        });

        const instance = nullthrows(ref.current);

        expect(instance.isFocused()).toBe(false);

        Fantom.runTask(() => {
          // unmount TextInput
          root.render(<></>);
        });

        expect(instance.getNativeRef()).toBe(null);
        expect(TextInput.State.currentlyFocusedInput()).toBe(null);
        expect(instance.isFocused()).toBe(false);
      });
    });

    describe('setSelection', () => {
      it('dispatches the setTextAndSelection command', () => {
        const root = Fantom.createRoot();
        const ref = createRef<React.ElementRef<typeof TextInput>>();

        Fantom.runTask(() => {
          root.render(
            <TextInput nativeID="text-input" ref={ref} value="Some input" />,
          );
        });

        root.takeMountingManagerLogs();

        const instance = nullthrows(ref.current);

        Fantom.runTask(() => {
          instance.setSelection(2, 5);
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "AndroidTextInput", nativeID: "text-input", name: "setTextAndSelection, args: [0,null,2,5]"}',
        ]);
      });
    });
  });

  it('has the correct displayName', () => {
    expect(TextInput.displayName).toBe('TextInput');
  });
});
