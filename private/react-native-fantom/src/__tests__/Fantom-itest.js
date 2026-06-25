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

import type {Root} from '@react-native/fantom';
import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {LogBox, Modal, ScrollView, Text, TextInput, View} from 'react-native';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import NativeFantom from 'react-native/src/private/testing/fantom/specs/NativeFantom';
import ReactNativeDocument from 'react-native/src/private/webapis/dom/nodes/ReactNativeDocument';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

function getActualViewportDimensions(root: Root): {
  viewportWidth: number,
  viewportHeight: number,
  viewportOffsetX: number,
  viewportOffsetY: number,
} {
  Fantom.runTask(() => {
    root.render(<View />);
  });

  const rect = root.document.documentElement.getBoundingClientRect();
  return {
    viewportWidth: rect.width,
    viewportHeight: rect.height,
    viewportOffsetX: rect.x,
    viewportOffsetY: rect.y,
  };
}

describe('Fantom', () => {
  describe('scheduleTask', () => {
    it('does not run task immediately', () => {
      let didRun = false;

      Fantom.scheduleTask(() => {
        didRun = true;
      });

      expect(didRun).toBe(false);

      Fantom.runWorkLoop();

      expect(didRun).toBe(true);
    });

    it('can be scheduled from within another task', () => {
      let didInnerTaskRun = false;

      Fantom.scheduleTask(() => {
        Fantom.scheduleTask(() => {
          didInnerTaskRun = true;
        });
      });

      expect(didInnerTaskRun).toBe(false);

      Fantom.runWorkLoop();

      expect(didInnerTaskRun).toBe(true);
    });
  });

  describe('runTask', () => {
    it('should run a task synchronously', () => {
      const task = jest.fn();

      Fantom.runTask(task);

      expect(task).toHaveBeenCalledTimes(1);
    });

    it('should exhaust the microtask queue synchronously', () => {
      const lastMicrotask = jest.fn();

      Fantom.runTask(() => {
        queueMicrotask(() => {
          queueMicrotask(() => {
            queueMicrotask(() => {
              queueMicrotask(lastMicrotask);
            });
          });
        });
      });

      expect(lastMicrotask).toHaveBeenCalledTimes(1);
    });

    it('should run async tasks synchronously', () => {
      let completed = false;

      Fantom.runTask(async () => {
        await Promise.resolve(6);
        completed = true;
      });

      expect(completed).toBe(true);
    });

    describe('error handling', () => {
      afterEach(() => {
        Fantom.setLogBoxCheckEnabled(true);
        LogBox.uninstall();
      });

      it('should throw when running a task inside another task', () => {
        expect(() => {
          Fantom.runTask(() => {
            Fantom.runTask(() => {});
          });
        }).toThrow(
          'Nested `runTask` calls are not allowed. If you want to schedule a task from inside another task, use `scheduleTask` instead.',
        );

        expect(() => {
          Fantom.runTask(() => {
            queueMicrotask(() => {
              Fantom.runTask(() => {});
            });
          });
        }).toThrow(
          'Nested `runTask` calls are not allowed. If you want to schedule a task from inside another task, use `scheduleTask` instead.',
        );
      });

      it('should re-throw errors from the task synchronously', () => {
        expect(() => {
          Fantom.runTask(() => {
            throw new Error('test error');
          });
        }).toThrow('test error');
      });

      it('should re-throw errors from microtasks synchronously', () => {
        expect(() => {
          Fantom.runTask(() => {
            queueMicrotask(() => {
              throw new Error('test error');
            });
          });
        }).toThrow('test error');
      });

      // TODO: fix error handling and make this pass
      // eslint-disable-next-line jest/no-disabled-tests
      it.skip('should not run subsequent tasks after an error in a task', () => {
        Fantom.scheduleTask(() => {
          throw new Error('test error');
        });

        const subsequentTask = jest.fn();
        Fantom.scheduleTask(subsequentTask);

        try {
          Fantom.runWorkLoop();
        } catch {}

        expect(subsequentTask).not.toHaveBeenCalled();
      });

      // TODO: fix error handling and make this pass
      // eslint-disable-next-line jest/no-disabled-tests
      it.skip('should not run subsequent tasks after an error in a microtask', () => {
        Fantom.scheduleTask(() => {
          queueMicrotask(() => {
            throw new Error('test error');
          });
        });

        const subsequentTask = jest.fn();
        Fantom.scheduleTask(subsequentTask);

        try {
          Fantom.runWorkLoop();
        } catch {}

        expect(subsequentTask).not.toHaveBeenCalled();
      });

      // TODO: fix error handling and make this pass
      // eslint-disable-next-line jest/no-disabled-tests
      it.skip('should not run subsequent microtasks after an error in a task', () => {
        const subsequentMicrotask = jest.fn();

        Fantom.runTask(() => {
          queueMicrotask(subsequentMicrotask);

          throw new Error('test error');
        });

        try {
          Fantom.runWorkLoop();
        } catch {}

        expect(subsequentMicrotask).not.toHaveBeenCalled();
      });

      // TODO: fix error handling and make this pass
      // eslint-disable-next-line jest/no-disabled-tests
      it.skip('should not run subsequent microtasks after an error in a microtask', () => {
        const subsequentMicrotask = jest.fn();

        Fantom.runTask(() => {
          queueMicrotask(() => {
            throw new Error('test error');
          });
          queueMicrotask(subsequentMicrotask);
        });

        try {
          Fantom.runWorkLoop();
        } catch {}

        expect(subsequentMicrotask).not.toHaveBeenCalled();
      });

      it('should error when any scheduled tasks remain after the test', () => {
        Fantom.scheduleTask(() => {});
        expect(() => NativeFantom.validateEmptyMessageQueue()).toThrow(
          'Exception in HostFunction: MessageQueue is not empty',
        );

        // Flushing queue to avoid this test failing
        Fantom.runWorkLoop();
      });

      describe('when LogBox is installed', () => {
        let originalConsoleError;

        beforeEach(() => {
          LogBox.install();

          originalConsoleError = console.error;

          // $FlowExpectedError[cannot-write]
          console.error = jest.fn();
        });

        afterEach(() => {
          LogBox.uninstall();

          // $FlowExpectedError[cannot-write]
          console.error = originalConsoleError;
        });

        it('should throw an error when running a task', () => {
          const expectedErrorMessage =
            'Cannot run work loop while LogBox is installed, as LogBox intercepts errors thrown in tests.' +
            ' If you are installing LogBox unintentionally using `InitializeCore`, replace it with `@react-native/fantom/src/setUpDefaultReactNativeEnvironment` to avoid this problem.';

          expect(() => {
            Fantom.runTask(() => {});
          }).toThrow(expectedErrorMessage);

          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error).toHaveBeenCalledWith(expectedErrorMessage);

          // We need to do this cleanup or Fantom will fail the test for us.
          LogBox.uninstall();
          Fantom.runWorkLoop();
        });

        it('should not throw an error if setLogBoxCheckEnabled is set to false', () => {
          Fantom.setLogBoxCheckEnabled(false);

          expect(() => {
            Fantom.runTask(() => {});
          }).not.toThrow();

          expect(console.error).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('createRoot', () => {
    it('allows creating a root with specific dimensions', () => {
      const rootWithDefaults = Fantom.createRoot();

      expect(getActualViewportDimensions(rootWithDefaults)).toEqual({
        viewportWidth: 390,
        viewportHeight: 844,
        viewportOffsetX: 0,
        viewportOffsetY: 0,
      });

      const rootWithCustomWidthAndHeight = Fantom.createRoot({
        viewportWidth: 200,
        viewportHeight: 600,
        viewportOffsetX: 20,
        viewportOffsetY: 102,
      });

      expect(getActualViewportDimensions(rootWithCustomWidthAndHeight)).toEqual(
        {
          viewportWidth: 200,
          viewportHeight: 600,
          viewportOffsetX: 20,
          viewportOffsetY: 102,
        },
      );
    });

    it('throws when trying to render a root outside of a task', () => {
      const root = Fantom.createRoot();

      expect(() => {
        root.render(<View />);
      }).toThrow(
        'Unexpected call to `render` outside of the event loop. Please call `render` within a `runTask` callback.',
      );

      expect(() => {
        Fantom.runTask(() => {
          root.render(<View />);
        });
      }).not.toThrow();
    });

    it('provides a document node', () => {
      const root = Fantom.createRoot();

      expect(() => {
        root.document;
      }).toThrow(
        'Cannot get `document` from root because it has not been rendered.',
      );

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(root.document).toBeInstanceOf(ReactNativeDocument);
    });
  });

  describe('getRenderedOutput', () => {
    describe('toJSX', () => {
      it('default config', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-view height="100" width="100" />,
        );
      });

      it('default config, list of children', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <>
              <View
                key="first"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
              <View
                key="second"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
            </>,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <>
            <rn-view key="0" width="100" height="100" />
            <rn-view key="1" width="100" height="100" />
          </>,
        );
      });

      it('include root', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(root.getRenderedOutput({includeRoot: true}).toJSX()).toEqual(
          <rn-rootView>
            <rn-view width="100" height="100" />
          </rn-rootView>,
        );
      });

      it('include layout metrics', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
        ).toEqual(
          <rn-view
            height="100"
            layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
            layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
            layoutMetrics-displayType="Flex"
            layoutMetrics-frame="{x:0,y:0,width:100,height:100}"
            layoutMetrics-layoutDirection="LeftToRight"
            layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
            layoutMetrics-pointScaleFactor="3"
            width="100"
          />,
        );
      });

      it('take props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['width'],
            })
            .toJSX(),
        ).toEqual(<rn-view width="100" />);
      });

      it('skip props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['^(?!width$).*$'],
            })
            .toJSX(),
        ).toEqual(<rn-view height="100" />);
      });

      it('filter out all props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <>
              <View
                key="first"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
              <Text key="second">hello world!</Text>
              <View
                key="third"
                style={{width: 200, height: 300}}
                collapsable={false}
              />
            </>,
          );
        });

        expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
          <>
            <rn-view key="0" />
            <rn-paragraph key="1">hello world!</rn-paragraph>
            <rn-view key="2" />
          </>,
        );
      });
    });

    describe('toJSON', () => {
      it('nested text', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Text>
              Testing native{' '}
              <Text style={{color: 'red'}}>
                JSX is <Text style={{color: 'blue'}}>easy!</Text>
              </Text>
            </Text>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['foreground*']}).toJSON(),
        ).toEqual({
          children: [
            'Testing native ',
            {
              children: 'JSX is ',
              props: {
                foregroundColor: 'rgba(255, 0, 0, 1)',
              },
              type: 'Text',
            },
            {
              children: 'easy!',
              props: {
                foregroundColor: 'rgba(0, 0, 255, 1)',
              },
              type: 'Text',
            },
          ],
          props: {
            foregroundColor: 'rgba(0, 0, 0, 0)',
          },
          type: 'Paragraph',
        });
      });
    });
  });

  describe('runOnUIThread + enqueueNativeEvent', () => {
    it('sends event without payload', () => {
      const root = Fantom.createRoot();

      let focusEvent = jest.fn();

      const ref = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(<TextInput onFocus={focusEvent} ref={ref} />);
      });

      const element = ensureInstance(ref.current, ReactNativeElement);

      expect(focusEvent).toHaveBeenCalledTimes(0);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(element, 'focus');
      });

      // The tasks have not run.
      expect(focusEvent).toHaveBeenCalledTimes(0);

      Fantom.runWorkLoop();

      expect(focusEvent).toHaveBeenCalledTimes(1);
    });

    it('sends event without payload (with ref)', () => {
      const root = Fantom.createRoot();

      let focusEvent = jest.fn();

      const ref = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(<TextInput onFocus={focusEvent} ref={ref} />);
      });

      expect(focusEvent).toHaveBeenCalledTimes(0);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(ref, 'focus');
      });

      // The tasks have not run.
      expect(focusEvent).toHaveBeenCalledTimes(0);

      Fantom.runWorkLoop();

      expect(focusEvent).toHaveBeenCalledTimes(1);
    });

    it('sends event with payload', () => {
      const root = Fantom.createRoot();
      const ref = createRef<HostInstance>();
      const onChange = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <TextInput
            onChange={event => {
              onChange(event.nativeEvent);
            }}
            ref={ref}
          />,
        );
      });

      const element = ensureInstance(ref.current, ReactNativeElement);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(element, 'change', {
          text: 'Hello World',
        });
      });

      Fantom.runWorkLoop();

      expect(onChange).toHaveBeenCalledTimes(1);
      const [entry] = onChange.mock.lastCall;
      expect(entry.text).toEqual('Hello World');
    });

    it('it batches events with isUnique option', () => {
      const root = Fantom.createRoot();
      const ref = createRef<HostInstance>();
      const onScroll = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <ScrollView
            onScroll={event => {
              onScroll(event.nativeEvent);
            }}
            ref={ref}
          />,
        );
      });

      const element = ensureInstance(ref.current, ReactNativeElement);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          element,
          'scroll',
          {
            contentOffset: {
              x: 0,
              y: 1,
            },
          },
          {
            isUnique: true,
          },
        );
        Fantom.enqueueNativeEvent(
          element,
          'scroll',
          {
            contentOffset: {
              x: 0,
              y: 2,
            },
          },
          {
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onScroll).toHaveBeenCalledTimes(1);
      const [entry] = onScroll.mock.lastCall;
      expect(entry.contentOffset).toEqual({
        x: 0,
        y: 2,
      });
    });
  });

  describe('dispatchNativeEvent', () => {
    it('flushes the event and runs the work loop', () => {
      const root = Fantom.createRoot();
      const ref = createRef<HostInstance>();

      let focusEvent = jest.fn();

      Fantom.runTask(() => {
        root.render(<TextInput onFocus={focusEvent} ref={ref} />);
      });

      const element = ensureInstance(ref.current, ReactNativeElement);

      expect(focusEvent).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(element, 'focus');

      expect(focusEvent).toHaveBeenCalledTimes(1);
    });

    it('flushes the event and runs the work loop (with ref)', () => {
      const root = Fantom.createRoot();
      const ref = createRef<HostInstance>();

      let focusEvent = jest.fn();

      Fantom.runTask(() => {
        root.render(<TextInput onFocus={focusEvent} ref={ref} />);
      });

      expect(focusEvent).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(ref, 'focus');

      expect(focusEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('enqueueScrollEvent', () => {
    it('throws error if called on node that is not scroll view', () => {
      const root = Fantom.createRoot();
      const ref = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(<View ref={ref} />);
      });

      const element = ensureInstance(ref.current, ReactNativeElement);

      expect(() => {
        Fantom.runOnUIThread(() => {
          Fantom.enqueueScrollEvent(element, {
            x: 0,
            y: 1,
          });
        });
      }).toThrow(
        'Exception in HostFunction: enqueueScrollEvent() can only be called on <ScrollView />',
      );
    });

    it('delivers onScroll event and affects position of elements on screen', () => {
      const root = Fantom.createRoot();
      const viewRef = createRef<HostInstance>();
      const scrollViewRef = createRef<HostInstance>();
      const onScroll = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <ScrollView
            onScroll={event => {
              onScroll(event.nativeEvent);
            }}
            ref={scrollViewRef}>
            <View style={{width: 1, height: 2, top: 3}} ref={viewRef} />
          </ScrollView>,
        );
      });

      const scrollViewElement = ensureInstance(
        scrollViewRef.current,
        ReactNativeElement,
      );

      Fantom.runOnUIThread(() => {
        Fantom.enqueueScrollEvent(scrollViewElement, {
          x: 0,
          y: 1,
        });
      });

      Fantom.runWorkLoop();

      expect(onScroll).toHaveBeenCalledTimes(1);

      const viewElement = ensureInstance(viewRef.current, ReactNativeElement);

      let rect;

      viewElement.measure((x, y, width, height, pageX, pageY) => {
        rect = {
          x,
          y,
          width,
          height,
          pageX,
          pageY,
        };
      });

      expect(rect).toEqual({
        x: 0,
        y: 3,
        width: 1,
        height: 2,
        pageY: 2,
        pageX: 0,
      });

      const boundingClientRect = viewElement.getBoundingClientRect();
      expect(boundingClientRect.x).toBe(0);
      expect(boundingClientRect.y).toBe(2);
      expect(boundingClientRect.width).toBe(1);
      expect(boundingClientRect.height).toBe(2);

      root.destroy();
    });

    it('delivers onScroll event (with ref)', () => {
      const root = Fantom.createRoot();
      const viewRef = createRef<HostInstance>();
      const scrollViewRef = createRef<HostInstance>();
      const onScroll = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <ScrollView
            onScroll={event => {
              onScroll(event.nativeEvent);
            }}
            ref={scrollViewRef}>
            <View style={{width: 1, height: 2, top: 3}} ref={viewRef} />
          </ScrollView>,
        );
      });

      Fantom.runOnUIThread(() => {
        Fantom.enqueueScrollEvent(scrollViewRef, {
          x: 0,
          y: 1,
        });
      });

      Fantom.runWorkLoop();

      expect(onScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe('scrollTo', () => {
    it('throws error if called on node that is not scroll view', () => {
      const root = Fantom.createRoot();
      const ref = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(<View ref={ref} />);
      });

      const element = ensureInstance(ref.current, ReactNativeElement);

      expect(() => {
        Fantom.scrollTo(element, {
          x: 0,
          y: 1,
        });
      }).toThrow(
        'Exception in HostFunction: enqueueScrollEvent() can only be called on <ScrollView />',
      );
    });

    it('delivers onScroll event and affects position of elements on screen', () => {
      const root = Fantom.createRoot();
      const scrollViewRef = createRef<HostInstance>();
      const viewRef = createRef<HostInstance>();
      const onScroll = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <ScrollView
            onScroll={event => {
              onScroll(event.nativeEvent);
            }}
            ref={scrollViewRef}>
            <View style={{width: 1, height: 2, top: 3}} ref={viewRef} />
          </ScrollView>,
        );
      });

      const scrollViewElement = ensureInstance(
        scrollViewRef.current,
        ReactNativeElement,
      );

      expect(scrollViewElement.scrollTop).toBe(0);

      Fantom.scrollTo(scrollViewElement, {
        x: 0,
        y: 1,
      });

      expect(scrollViewElement.scrollTop).toBe(1);

      expect(onScroll).toHaveBeenCalledTimes(1);

      const viewElement = ensureInstance(viewRef.current, ReactNativeElement);

      let rect;

      viewElement.measure((x, y, width, height, pageX, pageY) => {
        rect = {
          x,
          y,
          width,
          height,
          pageX,
          pageY,
        };
      });

      expect(rect).toEqual({
        x: 0,
        y: 3,
        width: 1,
        height: 2,
        pageY: 2,
        pageX: 0,
      });

      const boundingClientRect = viewElement.getBoundingClientRect();
      expect(boundingClientRect.x).toBe(0);
      expect(boundingClientRect.y).toBe(2);
      expect(boundingClientRect.width).toBe(1);
      expect(boundingClientRect.height).toBe(2);

      root.destroy();
    });

    it('delivers onScroll event and affects position of elements on screen (with ref)', () => {
      const root = Fantom.createRoot();
      const scrollViewRef = createRef<HostInstance>();
      const viewRef = createRef<HostInstance>();
      const onScroll = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <ScrollView
            onScroll={event => {
              onScroll(event.nativeEvent);
            }}
            ref={scrollViewRef}>
            <View style={{width: 1, height: 2, top: 3}} ref={viewRef} />
          </ScrollView>,
        );
      });

      const scrollViewElement = ensureInstance(
        scrollViewRef.current,
        ReactNativeElement,
      );

      expect(scrollViewElement.scrollTop).toBe(0);

      Fantom.scrollTo(scrollViewRef, {
        x: 0,
        y: 1,
      });

      expect(scrollViewElement.scrollTop).toBe(1);
    });
  });

  describe('flushAllNativeEvents', () => {
    it('calls events in the event queue', () => {
      const root = Fantom.createRoot();
      const onLayout = jest.fn();
      Fantom.runTask(() => {
        root.render(
          <View
            style={{width: 100, height: 100}}
            onLayout={event => {
              onLayout(event.nativeEvent);
            }}
          />,
        );
      });

      expect(onLayout).toHaveBeenCalledTimes(0);

      Fantom.flushAllNativeEvents();

      expect(onLayout).toHaveBeenCalledTimes(1);
    });
  });

  describe('enqueueModalSizeUpdate', () => {
    it('throws error if called on node that is not <Modal />', () => {
      const root = Fantom.createRoot();
      const ref = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(<View ref={ref} />);
      });

      const element = ensureInstance(ref.current, ReactNativeElement);

      expect(() => {
        Fantom.runOnUIThread(() => {
          Fantom.enqueueModalSizeUpdate(element, {
            width: 200,
            height: 100,
          });
        });
      }).toThrow(
        'Exception in HostFunction: enqueueModalSizeUpdate() can only be called on <Modal />',
      );
    });

    it('change size of <Modal />', () => {
      const root = Fantom.createRoot();
      const modalNodeRef = createRef<HostInstance>();
      const viewNodeRef = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(
          <Modal ref={modalNodeRef}>
            <View style={{width: '50%', height: '25%'}} ref={viewNodeRef} />
          </Modal>,
        );
      });

      const modalElement = ensureInstance(
        modalNodeRef.current,
        ReactNativeElement,
      );

      Fantom.runOnUIThread(() => {
        Fantom.enqueueModalSizeUpdate(modalElement, {
          width: 100,
          height: 100,
        });
      });

      Fantom.runWorkLoop();

      const viewElement = ensureInstance(
        viewNodeRef.current,
        ReactNativeElement,
      );

      const boundingClientRect = viewElement.getBoundingClientRect();
      expect(boundingClientRect.height).toBe(25);
      expect(boundingClientRect.width).toBe(50);
    });

    it('change size of <Modal /> (with ref)', () => {
      const root = Fantom.createRoot();
      const modalNodeRef = createRef<HostInstance>();
      const viewNodeRef = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(
          <Modal ref={modalNodeRef}>
            <View style={{width: '50%', height: '25%'}} ref={viewNodeRef} />
          </Modal>,
        );
      });

      Fantom.runOnUIThread(() => {
        Fantom.enqueueModalSizeUpdate(modalNodeRef, {
          width: 100,
          height: 100,
        });
      });

      Fantom.runWorkLoop();

      const viewElement = ensureInstance(
        viewNodeRef.current,
        ReactNativeElement,
      );

      const boundingClientRect = viewElement.getBoundingClientRect();
      expect(boundingClientRect.height).toBe(25);
      expect(boundingClientRect.width).toBe(50);
    });
  });
});
