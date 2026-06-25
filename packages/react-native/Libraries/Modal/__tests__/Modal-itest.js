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
import * as React from 'react';
import {createRef} from 'react';
import {Modal} from 'react-native';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

const DEFAULT_MODAL_CHILD_VIEW = (
  <rn-view backgroundColor="rgba(255, 255, 255, 1)" flex="1" left="0" top="0" />
);

describe('<Modal>', () => {
  let root: Fantom.Root;

  beforeEach(() => {
    root = Fantom.createRoot();
  });

  afterEach(() => {
    root.destroy();
    // Flush any remaining tasks that may have been scheduled during the
    // render (e.g. passive effects from AppContainer in __DEV__ mode).
    // This prevents flaky "MessageQueue is not empty" failures from the
    // global afterEach validation hook.
    Fantom.runWorkLoop();
  });
  describe('props', () => {
    it('renders a Modal with the default values when no props are passed', () => {
      Fantom.runTask(() => {
        root.render(<Modal />);
      });

      expect(root.getRenderedOutput().toJSX()).toEqual(
        <rn-modalHostView positionType="absolute" visible="true">
          {DEFAULT_MODAL_CHILD_VIEW}
        </rn-modalHostView>,
      );
    });
    describe('animationType', () => {
      it('renders a Modal with animationType="none" by default', () => {
        Fantom.runTask(() => {
          root.render(<Modal animationType="none" />);
        });

        expect(
          root.getRenderedOutput({props: ['animationType']}).toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });

      (['slide', 'fade'] as const).forEach(animationType => {
        it(`renders a Modal with animationType="${animationType}"`, () => {
          Fantom.runTask(() => {
            root.render(<Modal animationType={animationType} />);
          });

          expect(
            root.getRenderedOutput({props: ['animationType']}).toJSX(),
          ).toEqual(
            <rn-modalHostView animationType={animationType}>
              <rn-view />
            </rn-modalHostView>,
          );
        });
      });
    });

    describe('presentationStyle', () => {
      it('renders a Modal with presentationStyle="fullScreen" by default', () => {
        Fantom.runTask(() => {
          root.render(<Modal presentationStyle="fullScreen" />);
        });

        expect(
          root.getRenderedOutput({props: ['presentationStyle']}).toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });

      (['pageSheet', 'formSheet', 'overFullScreen'] as const).forEach(
        presentationStyle => {
          it(`renders a Modal with presentationStyle="${presentationStyle}"`, () => {
            Fantom.runTask(() => {
              root.render(<Modal presentationStyle={presentationStyle} />);
            });

            expect(
              root.getRenderedOutput({props: ['presentationStyle']}).toJSX(),
            ).toEqual(
              <rn-modalHostView presentationStyle={presentationStyle}>
                <rn-view />
              </rn-modalHostView>,
            );
          });
        },
      );
    });
    describe('transparent', () => {
      it('renders a Modal with transparent="true"', () => {
        Fantom.runTask(() => {
          root.render(<Modal transparent={true} />);
        });

        expect(
          root
            .getRenderedOutput({props: ['transparent', 'presentationStyle']})
            .toJSX(),
        ).toEqual(
          <rn-modalHostView
            transparent="true"
            presentationStyle="overFullScreen">
            <rn-view />
          </rn-modalHostView>,
        );
      });

      it('renders a Modal with transparent="false"', () => {
        Fantom.runTask(() => {
          root.render(<Modal transparent={false} />);
        });

        expect(
          root
            .getRenderedOutput({props: ['transparent', 'presentationStyle']})
            .toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });
    });
    describe('statusBarTranslucent', () => {
      it('renders a Modal with statusBarTranslucent="true"', () => {
        Fantom.runTask(() => {
          root.render(<Modal statusBarTranslucent={true} />);
        });

        expect(
          root.getRenderedOutput({props: ['statusBarTranslucent']}).toJSX(),
        ).toEqual(
          <rn-modalHostView statusBarTranslucent="true">
            <rn-view />
          </rn-modalHostView>,
        );
      });
      it('renders a Modal with statusBarTranslucent="false"', () => {
        Fantom.runTask(() => {
          root.render(<Modal statusBarTranslucent={false} />);
        });

        expect(
          root.getRenderedOutput({props: ['statusBarTranslucent']}).toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });
    });
    describe('navigationBarTranslucent', () => {
      it('renders a Modal with navigationBarTranslucent="true" and statusBarTranslucent="true"', () => {
        Fantom.runTask(() => {
          // navigationBarTranslucent=true with statusBarTranslucent=false is not supported
          // and it emits a warning.
          root.render(
            <Modal
              navigationBarTranslucent={true}
              statusBarTranslucent={true}
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['navigationBarTranslucent', 'statusBarTranslucent'],
            })
            .toJSX(),
        ).toEqual(
          <rn-modalHostView
            navigationBarTranslucent="true"
            statusBarTranslucent="true">
            <rn-view />
          </rn-modalHostView>,
        );
      });
      it('renders a Modal with navigationBarTranslucent="false"', () => {
        Fantom.runTask(() => {
          root.render(<Modal navigationBarTranslucent={false} />);
        });

        expect(
          root
            .getRenderedOutput({
              props: ['navigationBarTranslucent', 'statusBarTranslucent'],
            })
            .toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });
    });

    describe('hardwareAccelerated', () => {
      it('renders a Modal with hardwareAccelerated="true"', () => {
        Fantom.runTask(() => {
          root.render(<Modal hardwareAccelerated={true} />);
        });

        expect(
          root.getRenderedOutput({props: ['hardwareAccelerated']}).toJSX(),
        ).toEqual(
          <rn-modalHostView hardwareAccelerated="true">
            <rn-view />
          </rn-modalHostView>,
        );
      });
      it('renders a Modal with hardwareAccelerated="false"', () => {
        Fantom.runTask(() => {
          root.render(<Modal hardwareAccelerated={false} />);
        });

        expect(
          root.getRenderedOutput({props: ['hardwareAccelerated']}).toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });
    });

    describe('visible', () => {
      it('renders a Modal with visible="true"', () => {
        Fantom.runTask(() => {
          root.render(<Modal visible={true} />);
        });

        expect(root.getRenderedOutput({props: ['visible']}).toJSX()).toEqual(
          <rn-modalHostView visible="true">
            <rn-view />
          </rn-modalHostView>,
        );
      });
      it('renders nothing when visible="false"', () => {
        Fantom.runTask(() => {
          root.render(<Modal visible={false} />);
        });

        expect(root.getRenderedOutput({props: ['visible']}).toJSX()).toBeNull();
      });
    });

    describe('allowSwipeDismissal', () => {
      it('renders a Modal with allowSwipeDismissal="true"', () => {
        Fantom.runTask(() => {
          root.render(<Modal allowSwipeDismissal={true} />);
        });

        expect(
          root.getRenderedOutput({props: ['allowSwipeDismissal']}).toJSX(),
        ).toEqual(
          <rn-modalHostView allowSwipeDismissal="true">
            <rn-view />
          </rn-modalHostView>,
        );
      });
      it('renders a Modal with allowSwipeDismissal="false"', () => {
        Fantom.runTask(() => {
          root.render(<Modal allowSwipeDismissal={false} />);
        });

        expect(
          root.getRenderedOutput({props: ['allowSwipeDismissal']}).toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });
    });

    describe('animated', () => {
      [true, false].forEach(animated => {
        // The 'animated' prop is deprecated and ignored when the Modal is rendered
        // Users should use the 'animationType' prop instead.
        it(`[DEPRECATED] renders a Modal with animated="${animated ? 'true' : 'false'}"`, () => {
          Fantom.runTask(() => {
            root.render(<Modal animated={animated} />);
          });

          expect(root.getRenderedOutput({props: ['animated']}).toJSX()).toEqual(
            <rn-modalHostView>
              <rn-view />
            </rn-modalHostView>,
          );
        });
      });
    });
    // ... more props
  });
  describe('ref', () => {
    describe('exampleMethod()', () => {
      // more describe('<context>') or tests with it('<behaviour>')
    });
    // ... more methods
    describe('instance', () => {
      it('uses the "RN:ModalHostView" tag name', () => {
        const elementRef = createRef<HostInstance>();
        Fantom.runTask(() => {
          root.render(<Modal ref={elementRef} />);
        });

        expect(elementRef.current).toBeInstanceOf(ReactNativeElement);
        const element = ensureInstance(elementRef.current, ReactNativeElement);
        expect(element.tagName).toBe('RN:ModalHostView');
      });
    });
  });
});
