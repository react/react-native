/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_flags enableNativeCSSParsing:*
 * @fantom_flags enableCppPropsIteratorSetter:*
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('<View>', () => {
  it('has displayName', () => {
    expect(View.displayName ?? View.name).toBe('View');
  });

  describe('props', () => {
    describe('style', () => {
      describe('width and height style', () => {
        it('handles correct percentage-based dimensions', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 100, height: 100}}>
                <View
                  style={{width: '20%', height: '50%'}}
                  collapsable={false}
                />
              </View>,
            );
          });

          expect(
            root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
          ).toEqual(
            <rn-view
              layoutMetrics-frame="{x:0,y:0,width:20,height:50}"
              height="50%"
              layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-displayType="Flex"
              layoutMetrics-layoutDirection="LeftToRight"
              layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
              layoutMetrics-pointScaleFactor="3"
              width="20%"
            />,
          );
        });

        it('handles numeric values passed in as strings', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View style={{width: '5', height: '10'}} collapsable={false} />,
            );
          });

          expect(
            root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
          ).toEqual(
            <rn-view
              layoutMetrics-frame="{x:0,y:0,width:5,height:10}"
              height="10"
              layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-displayType="Flex"
              layoutMetrics-layoutDirection="LeftToRight"
              layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
              layoutMetrics-pointScaleFactor="3"
              width="5"
            />,
          );
        });

        it('handles invalid values, falling back to default', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 100, height: 100}}>
                <View
                  // 5pt is a valid CSS value but RN can't parse it.
                  style={{width: '5pt', height: 'error 50%'}}
                  collapsable={false}
                />
              </View>,
            );
          });

          expect(
            root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
          ).toEqual(
            <rn-view
              layoutMetrics-frame="{x:0,y:0,width:100,height:0}"
              height="undefined"
              layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-displayType="Flex"
              layoutMetrics-layoutDirection="LeftToRight"
              layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
              layoutMetrics-pointScaleFactor="3"
              width="undefined"
            />,
          );
        });
      });

      describe('margin style', () => {
        it('handles correct percentage-based values', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 100, height: 200}}>
                <View
                  style={{width: 5, height: 10, margin: '50%'}}
                  collapsable={false}
                />
              </View>,
            );
          });

          expect(
            root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
          ).toEqual(
            <rn-view
              layoutMetrics-frame="{x:50,y:50,width:5,height:10}"
              height="10"
              layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-displayType="Flex"
              layoutMetrics-layoutDirection="LeftToRight"
              layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
              layoutMetrics-pointScaleFactor="3"
              margin="50%"
              width="5"
            />,
          );
        });

        it('handles numeric values passed in as strings', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 100, height: 200}}>
                <View
                  style={{width: 5, height: 10, margin: '5'}}
                  collapsable={false}
                />
              </View>,
            );
          });

          expect(
            root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
          ).toEqual(
            <rn-view
              layoutMetrics-frame="{x:5,y:5,width:5,height:10}"
              height="10"
              layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
              layoutMetrics-displayType="Flex"
              layoutMetrics-layoutDirection="LeftToRight"
              layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
              layoutMetrics-pointScaleFactor="3"
              margin="5"
              width="5"
            />,
          );
        });
      });

      describe('transform style', () => {
        it('causes view to be unflattened', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View style={{transform: [{translateX: 10}]}} />);
          });

          expect(
            root.getRenderedOutput({props: ['transform']}).toJSX(),
          ).toEqual(<rn-view transform='[{"translateX": 10}]' />);
        });

        [
          [undefined, {x: -5, y: 0, width: 20, height: 10}],
          ['50% 50%', {x: -5, y: 0, width: 20, height: 10}],
          ['top left', {x: 0, y: 0, width: 20, height: 10}],
          ['right bottom', {x: -10, y: 0, width: 20, height: 10}],
        ].forEach(([transformOrigin, expectedBounds]) => {
          it(`applies transformOrigin correctly for ${String(transformOrigin)}`, () => {
            const root = Fantom.createRoot();

            const viewRef = createRef<HostInstance>();
            Fantom.runTask(() => {
              root.render(
                <View
                  ref={viewRef}
                  style={{
                    width: 10,
                    height: 10,
                    transform: [{scaleX: 2}],
                    transformOrigin,
                  }}
                />,
              );
            });

            const viewElement = ensureInstance(
              viewRef.current,
              ReactNativeElement,
            );

            const viewBounds = viewElement.getBoundingClientRect();
            expect(viewBounds.x).toBe(expectedBounds.x);
            expect(viewBounds.y).toBe(expectedBounds.y);
            expect(viewBounds.width).toBe(expectedBounds.width);
            expect(viewBounds.height).toBe(expectedBounds.height);
          });
        });
      });

      describe('aspectRatio', () => {
        it('is preserved when updating an unrelated prop', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View
                style={{width: 100, aspectRatio: 2}}
                nativeID="first"
                collapsable={false}
              />,
            );
          });

          // width=100, aspectRatio=2 → height = 100 / 2 = 50
          expect(
            root
              .getRenderedOutput({
                includeLayoutMetrics: true,
                props: ['layoutMetrics-frame'],
              })
              .toJSX(),
          ).toEqual(
            <rn-view layoutMetrics-frame="{x:0,y:0,width:100,height:50}" />,
          );

          // Update only nativeID, not aspectRatio
          Fantom.runTask(() => {
            root.render(
              <View
                style={{width: 100, aspectRatio: 2}}
                nativeID="second"
                collapsable={false}
              />,
            );
          });

          // aspectRatio must still be preserved → same layout
          expect(
            root
              .getRenderedOutput({
                includeLayoutMetrics: true,
                props: ['layoutMetrics-frame'],
              })
              .toJSX(),
          ).toEqual(
            <rn-view layoutMetrics-frame="{x:0,y:0,width:100,height:50}" />,
          );
        });

        it('can be changed to undefined after initially having a value', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 100, aspectRatio: 2}} collapsable={false} />,
            );
          });

          // width=100, aspectRatio=2 → height = 100 / 2 = 50
          expect(
            root
              .getRenderedOutput({
                includeLayoutMetrics: true,
                props: ['layoutMetrics-frame'],
              })
              .toJSX(),
          ).toEqual(
            <rn-view layoutMetrics-frame="{x:0,y:0,width:100,height:50}" />,
          );

          // Update aspectRatio to undefined
          Fantom.runTask(() => {
            root.render(
              <View
                style={{width: 100, aspectRatio: undefined}}
                collapsable={false}
              />,
            );
          });

          // aspectRatio is now undefined → height collapses to 0
          expect(
            root
              .getRenderedOutput({
                includeLayoutMetrics: true,
                props: ['layoutMetrics-frame'],
              })
              .toJSX(),
          ).toEqual(
            <rn-view layoutMetrics-frame="{x:0,y:0,width:100,height:0}" />,
          );
        });
      });

      describe('background-image', () => {
        it('it parses CSS and object syntax', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <>
                <View
                  style={{
                    backgroundImage: 'radial-gradient(#e66465, #9198e5)',
                  }}
                />
                <View
                  style={{
                    backgroundImage: [
                      {
                        type: 'radial-gradient',
                        shape: 'ellipse',
                        position: {top: '50%', right: '50%'},
                        size: 'farthest-corner',
                        colorStops: [{color: '#e66465'}, {color: '#9198e5'}],
                      },
                    ],
                  }}
                />
              </>,
            );
          });

          const expectedProps = {
            backgroundImage:
              '[radial-gradient(ellipse farthest-corner at 50% 50% , rgba(230, 100, 101, 1), rgba(145, 152, 229, 1))]',
          };

          expect(root.getRenderedOutput().toJSON()).toEqual([
            {
              children: [],
              props: expectedProps,
              type: 'View',
            },
            {
              children: [],
              props: expectedProps,
              type: 'View',
            },
          ]);
        });
      });
    });

    describe('pointerEvents', () => {
      it('auto does not propagate to the mounting layer, it is the default', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View collapsable={false} pointerEvents="auto" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(<rn-view />);
      });
      it('box-none propagates to the mounting layer, does not unflatten', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View collapsable={false} pointerEvents="box-none" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(<rn-view pointerEvents="box-none" />);

        Fantom.runTask(() => {
          root.render(<View pointerEvents="box-none" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(null);
      });
      it('box-only propagates to the mounting layer, unflattens', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View pointerEvents="box-only" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(<rn-view pointerEvents="box-only" />);
      });
      it('none propagates to the mounting layer, unflattens', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View pointerEvents="none" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(<rn-view pointerEvents="none" />);
      });
    });

    describe('accessibility', () => {
      describe('accessibilityActions', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View
                accessibilityActions={[
                  {name: 'activate'},
                  {name: 'increment', label: 'random label'},
                ]}
                accessible={true}
              />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityActions']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityActions="[activate, increment: 'random label']" />,
          );
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View
                accessibilityActions={[
                  {name: 'activate'},
                  {name: 'increment', label: 'random label'},
                ]}
              />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityElementsHidden', () => {
        it("is an iOS-only prop and ignored by Fantom (Android)'s BaseViewConfig", () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View accessibilityElementsHidden={true} collapsable={false} />,
            );
          });

          expect(root.getRenderedOutput().toJSX()).toEqual(<rn-view />);
        });
      });

      describe('aria-hidden', () => {
        it('is mapped to importantForAccessibility', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View aria-hidden={true} collapsable={false} />);
          });

          expect(
            root
              .getRenderedOutput({props: ['importantForAccessibility']})
              .toJSX(),
          ).toEqual(
            <rn-view importantForAccessibility="no-hide-descendants" />,
          );
        });

        it('resets importantForAccessibility when set to undefined', () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<View aria-hidden={true} collapsable={false} />);
          });
          expect(
            root
              .getRenderedOutput({props: ['importantForAccessibility']})
              .toJSX(),
          ).toEqual(
            <rn-view importantForAccessibility="no-hide-descendants" />,
          );
          Fantom.runTask(() => {
            root.render(<View collapsable={false} />);
          });
          expect(
            root
              .getRenderedOutput({props: ['importantForAccessibility']})
              .toJSX(),
          ).toEqual(<rn-view />);
        });
      });

      describe('accessibilityHint', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityHint={'exit'} accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityHint']}).toJSX(),
          ).toEqual(<rn-view accessibilityHint="exit" />);
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityHint={'exit'} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityHint']}).toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityLabel', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View accessibilityLabel={'custom label'} accessible={true} />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(<rn-view accessibilityLabel="custom label" />);
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityLabel={'custom label'} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityLiveRegion', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View accessibilityLiveRegion={'polite'} accessible={true} />,
            );
          });

          expect(
            root
              .getRenderedOutput({props: ['accessibilityLiveRegion']})
              .toJSX(),
          ).toEqual(<rn-view accessibilityLiveRegion="polite" />);
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityLiveRegion={'polite'} />);
          });

          expect(
            root
              .getRenderedOutput({props: ['accessibilityLiveRegion']})
              .toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityRole', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View accessibilityRole={'button'} accessible={true} />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
          ).toEqual(<rn-view accessibilityRole="button" />);
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityRole={'button'} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
          ).toEqual(null);
        });
      });
      describe('aria-label', () => {
        it('is mapped to accessibilityLabel', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View aria-label="custom label" accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(<rn-view accessibilityLabel="custom label" />);
        });

        it('resets accessibilityLabel when set to undefined', () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<View aria-label="custom label" accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(<rn-view accessibilityLabel="custom label" />);
          Fantom.runTask(() => {
            root.render(<View accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(<rn-view />);
        });
      });

      describe('overlapping aria-label and accessibilityLabel', () => {
        it('preserves accessibilityLabel when aria-label is removed', () => {
          const root = Fantom.createRoot();

          // Set both aria-label and accessibilityLabel
          Fantom.runTask(() => {
            root.render(
              <View
                aria-label="aria value"
                accessibilityLabel="native value"
                accessible={true}
              />,
            );
          });

          // aria-label should take precedence
          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(<rn-view accessibilityLabel="aria value" />);

          // Remove aria-label but keep accessibilityLabel
          Fantom.runTask(() => {
            root.render(
              <View accessibilityLabel="native value" accessible={true} />,
            );
          });

          // accessibilityLabel should still be "native value"
          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(<rn-view accessibilityLabel="native value" />);
        });
      });

      describe('overlapping aria-hidden and importantForAccessibility', () => {
        it('preserves importantForAccessibility when aria-hidden is removed', () => {
          const root = Fantom.createRoot();

          // Set both aria-hidden and importantForAccessibility
          Fantom.runTask(() => {
            root.render(
              <View
                aria-hidden={true}
                importantForAccessibility="no-hide-descendants"
                accessible={true}
              />,
            );
          });

          expect(
            root
              .getRenderedOutput({props: ['importantForAccessibility']})
              .toJSX(),
          ).toEqual(
            <rn-view importantForAccessibility="no-hide-descendants" />,
          );

          // Remove aria-hidden but keep importantForAccessibility
          Fantom.runTask(() => {
            root.render(
              <View
                importantForAccessibility="no-hide-descendants"
                accessible={true}
              />,
            );
          });

          // importantForAccessibility should still be "no-hide-descendants"
          expect(
            root
              .getRenderedOutput({props: ['importantForAccessibility']})
              .toJSX(),
          ).toEqual(
            <rn-view importantForAccessibility="no-hide-descendants" />,
          );
        });
      });

      describe('aria-hidden={false} with importantForAccessibility', () => {
        it('does not overwrite explicit importantForAccessibility', () => {
          const root = Fantom.createRoot();

          // Set importantForAccessibility="yes" and aria-hidden={false}.
          // aria-hidden={false} should NOT reset importantForAccessibility
          // to Auto, it should preserve the explicit "yes" value.
          Fantom.runTask(() => {
            root.render(
              <View
                importantForAccessibility="yes"
                aria-hidden={false}
                collapsable={false}
              />,
            );
          });

          expect(
            root
              .getRenderedOutput({props: ['importantForAccessibility']})
              .toJSX(),
          ).toEqual(<rn-view importantForAccessibility="yes" />);
        });
      });

      describe('overlapping aria-live and accessibilityLiveRegion', () => {
        it('preserves accessibilityLiveRegion when aria-live is removed', () => {
          const root = Fantom.createRoot();

          // Set both aria-live and accessibilityLiveRegion
          Fantom.runTask(() => {
            root.render(
              <View
                aria-live="polite"
                accessibilityLiveRegion="assertive"
                accessible={true}
              />,
            );
          });

          // Remove aria-live but keep accessibilityLiveRegion
          Fantom.runTask(() => {
            root.render(
              <View accessibilityLiveRegion="assertive" accessible={true} />,
            );
          });

          // accessibilityLiveRegion should still be "assertive"
          expect(
            root
              .getRenderedOutput({props: ['accessibilityLiveRegion']})
              .toJSX(),
          ).toEqual(<rn-view accessibilityLiveRegion="assertive" />);
        });
      });

      describe('aria-live', () => {
        it('is mapped to accessibilityLiveRegion', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View aria-live="polite" accessible={true} />);
          });

          expect(
            root
              .getRenderedOutput({props: ['accessibilityLiveRegion']})
              .toJSX(),
          ).toEqual(<rn-view accessibilityLiveRegion="polite" />);
        });

        it('resets accessibilityLiveRegion when set to undefined', () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<View aria-live="polite" accessible={true} />);
          });
          expect(
            root
              .getRenderedOutput({props: ['accessibilityLiveRegion']})
              .toJSX(),
          ).toEqual(<rn-view accessibilityLiveRegion="polite" />);
          Fantom.runTask(() => {
            root.render(<View accessible={true} />);
          });
          expect(
            root
              .getRenderedOutput({props: ['accessibilityLiveRegion']})
              .toJSX(),
          ).toEqual(<rn-view />);
        });
      });

      describe('aria-busy', () => {
        it('is mapped to accessibilityState', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View aria-busy={true} accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:false,selected:false,checked:None,busy:true,expanded:null}" />,
          );
        });

        it('resets accessibilityState when set to undefined', () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<View aria-busy={true} accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:false,selected:false,checked:None,busy:true,expanded:null}" />,
          );
          Fantom.runTask(() => {
            root.render(<View accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(<rn-view />);
        });
      });

      describe('aria-disabled', () => {
        it('is mapped to accessibilityState', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View aria-disabled={true} accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
          );
        });

        it('resets accessibilityState when set to undefined', () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<View aria-disabled={true} accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
          );
          Fantom.runTask(() => {
            root.render(<View accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(<rn-view />);
        });
      });

      describe('aria-expanded', () => {
        it('is mapped to accessibilityState', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View aria-expanded={true} accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:true}" />,
          );
        });

        it('resets accessibilityState when set to undefined', () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<View aria-expanded={true} accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:true}" />,
          );
          Fantom.runTask(() => {
            root.render(<View accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(<rn-view />);
        });
      });

      describe('aria-selected', () => {
        it('is mapped to accessibilityState', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View aria-selected={true} accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:false,selected:true,checked:None,busy:false,expanded:null}" />,
          );
        });

        it('resets accessibilityState when set to undefined', () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<View aria-selected={true} accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:false,selected:true,checked:None,busy:false,expanded:null}" />,
          );
          Fantom.runTask(() => {
            root.render(<View accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(<rn-view />);
        });
      });

      describe('aria-checked', () => {
        it('is mapped to accessibilityState', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View aria-checked={true} accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:false,selected:false,checked:Checked,busy:false,expanded:null}" />,
          );
        });

        it('resets accessibilityState when set to undefined', () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<View aria-checked={true} accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityState="{disabled:false,selected:false,checked:Checked,busy:false,expanded:null}" />,
          );
          Fantom.runTask(() => {
            root.render(<View accessible={true} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(<rn-view />);
        });
      });
    });

    describe('accessible', () => {
      it('unflattens view', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View />);
        });

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          null,
        );

        Fantom.runTask(() => {
          root.render(<View accessible={true} />);
        });

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          <rn-view accessible="true" />,
        );
      });
    });
  });

  describe('web compat props', () => {
    describe('id', () => {
      it('is mapped to nativeID', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View id="my-id" collapsable={false} />);
        });

        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-view nativeID="my-id" />,
        );
      });

      it('resets nativeID when set to undefined', () => {
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<View id="my-id" collapsable={false} />);
        });
        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-view nativeID="my-id" />,
        );
        Fantom.runTask(() => {
          root.render(<View collapsable={false} />);
        });
        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-view />,
        );
      });
    });

    describe('nativeID', () => {
      it('resets nativeID when removed', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View nativeID="my-id" collapsable={false} />);
        });

        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-view nativeID="my-id" />,
        );

        Fantom.runTask(() => {
          root.render(<View collapsable={false} />);
        });

        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-view />,
        );
      });
    });
  });

  describe('testID', () => {
    it('is propagated to the mounting layer', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<View testID="testID" collapsable={false} />);
      });

      expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
        <rn-view testID="testID" />,
      );
    });
  });

  describe('ref', () => {
    it('is an element node', () => {
      const elementRef = createRef<HostInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<View ref={elementRef} />);
      });

      expect(elementRef.current).toBeInstanceOf(ReactNativeElement);
    });

    it('uses the "RN:View" tag name', () => {
      const elementRef = createRef<HostInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<View ref={elementRef} />);
      });

      const element = ensureInstance(elementRef.current, ReactNativeElement);
      expect(element.tagName).toBe('RN:View');
    });
  });
});
