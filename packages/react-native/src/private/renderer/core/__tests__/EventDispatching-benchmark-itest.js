/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableNativeEventTargetEventDispatching:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

let root: ReturnType<typeof Fantom.createRoot>;
let ref: {current: React.ElementRef<typeof View> | null};

function createNestedViews(
  depth: number,
  innerRef: {current: React.ElementRef<typeof View> | null},
): React.MixedElement {
  if (depth === 0) {
    return (
      <View
        ref={innerRef}
        collapsable={false}
        onPointerUp={() => {}}
        style={{width: 10, height: 10}}
      />
    );
  }
  return (
    <View collapsable={false} onPointerUp={() => {}}>
      {createNestedViews(depth - 1, innerRef)}
    </View>
  );
}

// `onLayout` is a direct (non-bubbling) event, so only the leaf needs a
// handler; ancestors never receive the layout event.
function createNestedViewsWithLayout(
  depth: number,
  innerRef: {current: React.ElementRef<typeof View> | null},
): React.MixedElement {
  if (depth === 0) {
    return (
      <View
        ref={innerRef}
        collapsable={false}
        onLayout={() => {}}
        style={{width: 10, height: 10}}
      />
    );
  }
  return (
    <View collapsable={false}>
      {createNestedViewsWithLayout(depth - 1, innerRef)}
    </View>
  );
}

const {isOSS} = Fantom.getConstants();

if (isOSS) {
  it('is not supported in OSS yet', () => {
    expect(true).toBe(true);
  });
} else {
  Fantom.unstable_benchmark
    .suite('Event Dispatching')
    .test(
      'dispatch event, flat (1 handler)',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
        },
        beforeEach: () => {
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(
              <View
                ref={ref}
                collapsable={false}
                onPointerUp={() => {}}
                style={{width: 10, height: 10}}
              />,
            );
          });
        },
        afterEach: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch event, nested 10 deep (bubbling)',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
        },
        beforeEach: () => {
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(createNestedViews(10, ref));
          });
        },
        afterEach: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch event, nested 50 deep (bubbling)',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
        },
        beforeEach: () => {
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(createNestedViews(50, ref));
          });
        },
        afterEach: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch event, nested 10 deep (no handlers on ancestors)',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
        },
        beforeEach: () => {
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            let views: React.MixedElement = (
              <View
                ref={ref}
                collapsable={false}
                onPointerUp={() => {}}
                style={{width: 10, height: 10}}
              />
            );
            for (let i = 0; i < 10; i++) {
              views = <View collapsable={false}>{views}</View>;
            }
            root.render(views);
          });
        },
        afterEach: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch event with stopPropagation, nested 10 deep',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
        },
        beforeEach: () => {
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            let views: React.MixedElement = (
              <View
                ref={ref}
                collapsable={false}
                onPointerUp={e => {
                  e.stopPropagation();
                }}
                style={{width: 10, height: 10}}
              />
            );
            for (let i = 0; i < 10; i++) {
              views = (
                <View collapsable={false} onPointerUp={() => {}}>
                  {views}
                </View>
              );
            }
            root.render(views);
          });
        },
        afterEach: () => {
          root.destroy();
        },
      },
    )
    .test(
      'render + dispatch, flat (handler update cost)',
      () => {
        Fantom.runTask(() => {
          root.render(
            <View
              ref={ref}
              collapsable={false}
              onPointerUp={() => {}}
              style={{width: 10, height: 10}}
            />,
          );
        });
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
        },
        beforeEach: () => {
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(
              <View
                ref={ref}
                collapsable={false}
                onPointerUp={() => {}}
                style={{width: 10, height: 10}}
              />,
            );
          });
        },
        afterEach: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch event, nested 50 deep (bubbling), stable tree',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(createNestedViews(50, ref));
          });
        },
        afterAll: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch event, nested 50 deep (no handlers on ancestors), stable tree',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onPointerUp',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            let views: React.MixedElement = (
              <View
                ref={ref}
                collapsable={false}
                onPointerUp={() => {}}
                style={{width: 10, height: 10}}
              />
            );
            for (let i = 0; i < 50; i++) {
              views = <View collapsable={false}>{views}</View>;
            }
            root.render(views);
          });
        },
        afterAll: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch onLayout event, flat (1 handler)',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onLayout',
          {layout: {x: 0, y: 0, width: 100, height: 50}},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(
              <View
                ref={ref}
                collapsable={false}
                onLayout={() => {}}
                style={{width: 10, height: 10}}
              />,
            );
          });
          // Flush the layout events emitted during the initial layout pass so
          // they are not measured as part of the dispatched event below.
          Fantom.flushAllNativeEvents();
        },
        afterAll: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch onLayout event, nested 10 deep (direct, no bubbling)',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onLayout',
          {layout: {x: 0, y: 0, width: 100, height: 50}},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(createNestedViewsWithLayout(10, ref));
          });
          Fantom.flushAllNativeEvents();
        },
        afterAll: () => {
          root.destroy();
        },
      },
    )
    .test(
      'dispatch onLayout event, nested 50 deep (direct, no bubbling)',
      () => {
        Fantom.dispatchNativeEvent(
          ref,
          'onLayout',
          {layout: {x: 0, y: 0, width: 100, height: 50}},
          {
            category: Fantom.NativeEventCategory.Discrete,
          },
        );
      },
      {
        beforeAll: () => {
          ref = React.createRef();
          root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(createNestedViewsWithLayout(50, ref));
          });
          Fantom.flushAllNativeEvents();
        },
        afterAll: () => {
          root.destroy();
        },
      },
    );
}
