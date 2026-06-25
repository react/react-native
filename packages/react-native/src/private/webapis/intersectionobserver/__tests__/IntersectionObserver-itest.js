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
import type IntersectionObserverType from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserver';
import type IntersectionObserverEntryType from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserverEntry';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import {createShadowNodeReferenceCountingRef} from '../../../__tests__/utilities/ShadowNodeReferenceCounter';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef, useState} from 'react';
import {ScrollView, View} from 'react-native';
import setUpIntersectionObserver from 'react-native/src/private/setup/setUpIntersectionObserver';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import DOMRectReadOnly from 'react-native/src/private/webapis/geometry/DOMRectReadOnly';

declare const IntersectionObserver: Class<IntersectionObserverType>;
declare const IntersectionObserverEntry: Class<IntersectionObserverEntryType>;

setUpIntersectionObserver();

function ensureReactNativeElement(value: unknown): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

export function expectRectEquals(
  rect: DOMRectReadOnly,
  expected: {x: number, y: number, width: number, height: number},
): boolean {
  const {x, y, width, height} = expected;
  if (
    !(
      rect.x === x &&
      rect.y === y &&
      rect.width === width &&
      rect.height === height
    )
  ) {
    const received = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
    throw new Error(
      `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(received)}`,
    );
  }
  return true;
}

describe('IntersectionObserver', () => {
  let observer: IntersectionObserver;

  afterEach(() => {
    Fantom.runTask(() => {
      if (observer != null) {
        observer.disconnect();
      }
    });
  });

  describe('constructor(callback, {root, rootMargin, threshold, rnRootThreshold})', () => {
    it('should throw if `callback` is not provided', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new IntersectionObserver();
      }).toThrow(
        "Failed to construct 'IntersectionObserver': 1 argument required, but only 0 present.",
      );
    });

    it('should throw if `callback` is not a function', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new IntersectionObserver('not a function!');
      }).toThrow(
        "Failed to construct 'IntersectionObserver': parameter 1 is not of type 'Function'.",
      );
    });

    it('should accept valid `rootMargin` values', () => {
      expect(() => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        return new IntersectionObserver(() => {}, {rootMargin: '10px'});
      }).not.toThrow();

      expect(() => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        return new IntersectionObserver(() => {}, {rootMargin: '10px 20px'});
      }).not.toThrow();

      expect(() => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        return new IntersectionObserver(() => {}, {
          rootMargin: '10px 20px 30px 40px',
        });
      }).not.toThrow();
    });

    describe('rootMargin', () => {
      it('should parse single value rootMargin', () => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        observer = new IntersectionObserver(() => {}, {rootMargin: '10px'});
        expect(observer.rootMargin).toBe('10px 10px 10px 10px');
      });

      it('should parse two value rootMargin', () => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '10px 20px',
        });
        expect(observer.rootMargin).toBe('10px 20px 10px 20px');
      });

      it('should parse three value rootMargin', () => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '10px 20px 30px',
        });
        expect(observer.rootMargin).toBe('10px 20px 30px 20px');
      });

      it('should parse four value rootMargin', () => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '10px 20px 30px 40px',
        });
        expect(observer.rootMargin).toBe('10px 20px 30px 40px');
      });

      it('should handle negative rootMargin values', () => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '-10px -20px',
        });
        expect(observer.rootMargin).toBe('-10px -20px -10px -20px');
      });

      it('should handle percentage rootMargin values', () => {
        // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '10% 20%',
        });
        expect(observer.rootMargin).toBe('10% 20% 10% 20%');
      });

      describe('default values', () => {
        it('should default to "0px 0px 0px 0px" when rootMargin is not provided', () => {
          observer = new IntersectionObserver(() => {});
          expect(observer.rootMargin).toBe('0px 0px 0px 0px');
        });

        it('should default to "0px 0px 0px 0px" when rootMargin is undefined', () => {
          // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
          observer = new IntersectionObserver(() => {}, {
            rootMargin: undefined,
          });
          expect(observer.rootMargin).toBe('0px 0px 0px 0px');
        });

        it('should default to "0px 0px 0px 0px" when rootMargin is empty string', () => {
          // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
          observer = new IntersectionObserver(() => {}, {rootMargin: ''});
          expect(observer.rootMargin).toBe('0px 0px 0px 0px');
        });
      });

      describe('parsing failures', () => {
        it('should throw when rootMargin is not a string', () => {
          expect(() => {
            // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
            // $FlowExpectedError[incompatible-type]
            return new IntersectionObserver(() => {}, {rootMargin: 123});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to read the 'rootMargin' property from 'IntersectionObserverInit': The provided value is not of type 'string'.",
          );
        });

        it('should throw when rootMargin has too many values', () => {
          expect(() => {
            // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
            return new IntersectionObserver(() => {}, {
              rootMargin: '10px 20px 30px 40px 50px',
            });
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: Too many values (expected 1-4).",
          );
        });

        it('should throw when rootMargin value is missing unit', () => {
          expect(() => {
            // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
            return new IntersectionObserver(() => {}, {rootMargin: '10'});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: '10' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when rootMargin value has invalid unit', () => {
          expect(() => {
            // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
            return new IntersectionObserver(() => {}, {rootMargin: '10em'});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: '10em' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when rootMargin value has invalid format', () => {
          expect(() => {
            // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
            return new IntersectionObserver(() => {}, {
              rootMargin: 'invalid',
            });
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: 'invalid' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when rootMargin has mixed valid and invalid values', () => {
          expect(() => {
            // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
            return new IntersectionObserver(() => {}, {
              rootMargin: '10px invalid',
            });
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: 'invalid' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when rootMargin value is only a unit', () => {
          expect(() => {
            // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
            return new IntersectionObserver(() => {}, {rootMargin: 'px'});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: 'px' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });
      });
    });

    it('should throw if `threshold` contains a value lower than 0 or greater than 1', () => {
      expect(() => {
        return new IntersectionObserver(() => {}, {threshold: 1.01});
      }).toThrow(
        "Failed to construct 'IntersectionObserver': Threshold values must be numbers between 0 and 1",
      );

      expect(() => {
        return new IntersectionObserver(() => {}, {threshold: -0.01});
      }).toThrow(
        "Failed to construct 'IntersectionObserver': Threshold values must be numbers between 0 and 1",
      );
    });

    it('should throw if `threshold` contains a value that cannot be casted to a finite number', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new IntersectionObserver(() => {}, {threshold: ['test']});
      }).toThrow(
        "Failed to read the 'threshold' property from 'IntersectionObserverInit': The provided double value is non-finite.",
      );
    });

    it('should throw if `root` is not a `ReactNativeElement`', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        observer = new IntersectionObserver(() => {}, {root: 'something'});
      }).toThrow(
        "Failed to construct 'IntersectionObserver': Failed to read the 'root' property from 'IntersectionObserverInit': The provided value is not of type '(null or ReactNativeElement)",
      );
    });

    it('should provide access to explicit `root`', () => {
      const rootRef = React.createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={rootRef} />);
      });

      const rootNode = ensureReactNativeElement(rootRef.current);

      Fantom.runTask(() => {
        observer = new IntersectionObserver(() => {}, {root: rootNode});
      });

      expect(observer?.root).toBe(rootNode);
    });

    it('should provide access to `root`, `rootMargin` and `thresholds`', () => {
      observer = new IntersectionObserver(() => {});

      expect(observer.root).toBe(null);
      expect(observer.rootMargin).toBe('0px 0px 0px 0px');
      expect(observer.thresholds).toEqual([0]);
    });

    it('should normalize `threshold` values', () => {
      // Sets default value
      expect(new IntersectionObserver(() => {}).thresholds).toEqual([0]);
      // Sets default value
      expect(
        new IntersectionObserver(() => {}, {threshold: []}).thresholds,
      ).toEqual([0]);

      // Converts to array
      expect(
        new IntersectionObserver(() => {}, {threshold: 0.5}).thresholds,
      ).toEqual([0.5]);

      // Sorts
      expect(
        new IntersectionObserver(() => {}, {threshold: [0.5, 0, 1]}).thresholds,
      ).toEqual([0, 0.5, 1]);

      // Does NOT deduplicate (browsers don't do it - shrug)
      expect(
        new IntersectionObserver(() => {}, {threshold: [0.5, 0.5, 0.5]})
          .thresholds,
      ).toEqual([0.5, 0.5, 0.5]);

      // Casts to number
      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {threshold: [true]}).thresholds,
      ).toEqual([1]);
      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {threshold: [false]}).thresholds,
      ).toEqual([0]);
      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {threshold: ['']}).thresholds,
      ).toEqual([0]);
    });

    it('should not throw if rnRootThreshold is null or undefined', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new IntersectionObserver(() => {}, {rnRootThreshold: null});
      }).not.toThrow();

      expect(() => {
        return new IntersectionObserver(() => {}, {
          rnRootThreshold: undefined,
        });
      }).not.toThrow();
    });

    it('should throw if rnRootThreshold is set to an invalid value', () => {
      expect(() => {
        return new IntersectionObserver(() => {}, {
          // $FlowExpectedError[incompatible-call]
          rnRootThreshold: 2,
        });
      }).toThrow(
        "Failed to construct 'IntersectionObserver': Threshold values must be numbers between 0 and 1",
      );

      expect(() => {
        return new IntersectionObserver(() => {}, {
          // $FlowExpectedError[incompatible-type]
          rnRootThreshold: 'invalid',
        });
      }).toThrow(
        "Failed to read the 'rnRootThreshold' property from 'IntersectionObserverInit': The provided double value is non-finite.",
      );
    });

    it('should default to null if rnRootThreshold is not set or invalid', () => {
      expect(
        new IntersectionObserver(() => {}, {}).rnRootThresholds,
      ).toBeNull();

      expect(
        new IntersectionObserver(() => {}, {threshold: 1}).rnRootThresholds,
      ).toBeNull();
      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {rnRootThreshold: null})
          .rnRootThresholds,
      ).toBeNull();

      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: undefined})
          .rnRootThresholds,
      ).toBeNull();

      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: []})
          .rnRootThresholds,
      ).toBeNull();

      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {rnRootThreshold: [null]})
          .rnRootThresholds,
      ).toBeNull();
    });

    it('should normalize `rnRootThreshold` values', () => {
      // Sets default value
      expect(new IntersectionObserver(() => {}).rnRootThresholds).toBeNull();
      // Sets default value
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: []})
          .rnRootThresholds,
      ).toBeNull();

      // Converts to array
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: 0.5})
          .rnRootThresholds,
      ).toEqual([0.5]);

      // Sorts
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: [0.5, 0, 1]})
          .rnRootThresholds,
      ).toEqual([0, 0.5, 1]);

      // Does NOT deduplicate (browsers don't do it - shrug)
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: [0.5, 0.5, 0.5]})
          .rnRootThresholds,
      ).toEqual([0.5, 0.5, 0.5]);

      // Casts to number
      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {rnRootThreshold: [true]})
          .rnRootThresholds,
      ).toEqual([1]);
      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {rnRootThreshold: [false]})
          .rnRootThresholds,
      ).toEqual([0]);
      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {rnRootThreshold: ['']})
          .rnRootThresholds,
      ).toEqual([0]);
    });

    it('should default thresholds to empty if rnRootThreshold is validly', () => {
      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: 0.5}).thresholds,
      ).toEqual([]);

      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: [1]}).thresholds,
      ).toEqual([]);
    });

    it('should default thresholds to [0] if rnRootThreshold is invalidly set', () => {
      expect(
        // $FlowExpectedError[incompatible-type]
        new IntersectionObserver(() => {}, {rnRootThreshold: null}).thresholds,
      ).toEqual([0]);

      expect(
        new IntersectionObserver(() => {}, {rnRootThreshold: []}).thresholds,
      ).toEqual([0]);
    });

    describe('unsupported options', () => {
      it('should throw if `delay` option is specified', () => {
        expect(() => {
          // $FlowExpectedError[prop-missing] delay is not defined in Flow.
          return new IntersectionObserver(() => {}, {delay: 100});
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'delay' option is not supported.",
        );
      });

      it('should throw if `scrollMargin` option is specified', () => {
        expect(() => {
          // $FlowExpectedError[prop-missing] scrollMargin is not defined in Flow.
          return new IntersectionObserver(() => {}, {scrollMargin: '10px'});
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'scrollMargin' option is not supported.",
        );
      });

      it('should throw if `trackVisibility` option is specified', () => {
        expect(() => {
          // $FlowExpectedError[prop-missing] trackVisibility is not defined in Flow.
          return new IntersectionObserver(() => {}, {trackVisibility: true});
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'trackVisibility' option is not supported.",
        );
      });

      it('should throw if `delay` option is set to undefined explicitly', () => {
        expect(() => {
          // $FlowExpectedError[prop-missing] delay is not defined in Flow.
          return new IntersectionObserver(() => {}, {delay: undefined});
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'delay' option is not supported.",
        );
      });

      it('should throw if `scrollMargin` option is set to null explicitly', () => {
        expect(() => {
          // $FlowExpectedError[prop-missing] scrollMargin is not defined in Flow.
          return new IntersectionObserver(() => {}, {scrollMargin: null});
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'scrollMargin' option is not supported.",
        );
      });

      it('should not throw when unsupported options are not specified', () => {
        expect(() => {
          return new IntersectionObserver(() => {}, {
            threshold: 0.5,
            rootMargin: '10px',
          });
        }).not.toThrow();
      });

      it('should throw if multiple unsupported options are specified', () => {
        expect(() => {
          // $FlowExpectedError[prop-missing] delay and trackVisibility are not defined in Flow.
          return new IntersectionObserver(() => {}, {
            delay: 100,
            trackVisibility: true,
          });
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'delay' option is not supported.",
        );
      });
    });

    describe('unsupported property getters', () => {
      it('should throw when accessing delay getter', () => {
        observer = new IntersectionObserver(() => {});
        expect(() => {
          return observer.delay;
        }).toThrow(
          "Failed to read the 'delay' property from 'IntersectionObserver': This property is not supported.",
        );
      });

      it('should throw when accessing scrollMargin getter', () => {
        observer = new IntersectionObserver(() => {});
        expect(() => {
          return observer.scrollMargin;
        }).toThrow(
          "Failed to read the 'scrollMargin' property from 'IntersectionObserver': This property is not supported.",
        );
      });

      it('should throw when accessing trackVisibility getter', () => {
        observer = new IntersectionObserver(() => {});
        expect(() => {
          return observer.trackVisibility;
        }).toThrow(
          "Failed to read the 'trackVisibility' property from 'IntersectionObserver': This property is not supported.",
        );
      });
    });
  });

  describe('observe(target)', () => {
    it('should throw if `target` is not a `ReactNativeElement`', () => {
      observer = new IntersectionObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        observer.observe('something');
      }).toThrow(
        "Failed to execute 'observe' on 'IntersectionObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    });

    it('should start observing the target when called for the first time (using normalized thresholds)', () => {
      const nodeRef = createRef<HostInstance>();
      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(<View style={{width: 100, height: 100}} ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [1, 0.5, 0],
        });
        observer.observe(node);
      });

      expect(observer.thresholds).toEqual([0, 0.5, 1]);
      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(true);

      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expect(entries[0].target).toBe(node);
      expect(entries[0].intersectionRatio).toBe(1);
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });

      expect(reportedObserver).toBe(observer);
    });

    it('should ignore subsequent calls to observe a target already being observed', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View style={{width: 100, height: 100}} ref={nodeRef} />);
      });
      const node = ensureReactNativeElement(nodeRef.current);

      const intersectionObserverCallback = jest.fn();

      // Let observer to run
      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [0, 0.5, 1],
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].target).toBe(node);
      expect(reportedObserver).toBe(observer);

      // Observe the same node and let observer run again
      Fantom.runTask(() => {
        observer.observe(node);
      });

      // Expect no additional calls
      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
    });

    it('should ignore disconnected targets', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View style={{width: 100, height: 100}} ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(node.isConnected).toBe(false);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
        observer.observe(node);
      });

      expect(intersectionObserverCallback).not.toHaveBeenCalled();
    });

    it('should report completely non-intersecting initial state correctly', () => {
      const nodeRef = createRef<HostInstance>();
      const scrollNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={scrollNodeRef}>
            <View style={{width: 50, height: 50}} ref={nodeRef} />
          </ScrollView>,
        );
      });
      const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
      // Ensure View is not intersecting with ScrollView
      Fantom.scrollTo(scrollNode, {x: 0, y: 200});

      const node = ensureReactNativeElement(nodeRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [0],
          rnRootThreshold: [0.5],
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(0);
      expect(entries[0].rnRootIntersectionRatio).toBe(0);
      expect(entries[0].isIntersecting).toBe(false);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -200,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    it('should report partial non-intersecting initial state correctly', () => {
      const nodeRef = createRef<HostInstance>();
      const scrollNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={scrollNodeRef}>
            <View style={{width: 50, height: 50}} ref={nodeRef} />
          </ScrollView>,
        );
      });

      const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
      const node = ensureReactNativeElement(nodeRef.current);

      // Scroll such that View is partially intersecting
      Fantom.scrollTo(scrollNode, {x: 0, y: 25});

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [1],
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(0.5);
      expect(entries[0].rnRootIntersectionRatio).toBe(0.00125);
      expect(entries[0].isIntersecting).toBe(false);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 50,
        height: 25,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -25,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    it('should report partial intersecting initial state correctly', () => {
      const nodeRef = createRef<HostInstance>();
      const scrollNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={scrollNodeRef}>
            <View style={{width: 50, height: 50}} ref={nodeRef} />
          </ScrollView>,
        );
      });
      const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
      const node = ensureReactNativeElement(nodeRef.current);

      // Scroll such that View is partially intersecting
      Fantom.scrollTo(scrollNode, {x: 0, y: 25});

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: [],
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(0.5);
      expect(entries[0].rnRootIntersectionRatio).toBe(0.00125);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 50,
        height: 25,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -25,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    describe('with offset', () => {
      it('should report completely non-intersecting initial state correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
          viewportOffsetX: 333,
          viewportOffsetY: 333,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View style={{width: 50, height: 50}} ref={nodeRef} />
            </ScrollView>,
          );
        });
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
        // Ensure View is not intersecting with ScrollView
        Fantom.scrollTo(scrollNode, {x: 0, y: 200});

        const node = ensureReactNativeElement(nodeRef.current);

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            threshold: [0],
            rnRootThreshold: [0.5],
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0);
        expect(entries[0].rnRootIntersectionRatio).toBe(0);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 333,
          y: 133, // 333-200
          width: 50,
          height: 50,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 333,
          y: 333,
          width: 1000,
          height: 1000,
        });
      });

      it('should report partial non-intersecting initial state correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
          viewportOffsetX: 333,
          viewportOffsetY: 333,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View style={{width: 50, height: 50}} ref={nodeRef} />
            </ScrollView>,
          );
        });

        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
        const node = ensureReactNativeElement(nodeRef.current);

        // Scroll such that View is partially intersecting
        Fantom.scrollTo(scrollNode, {x: 0, y: 25});

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            threshold: [1],
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0.5);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.00125);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 333,
          y: 333,
          width: 50,
          height: 25,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 333,
          y: 308, // 333-25
          width: 50,
          height: 50,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 333,
          y: 333,
          width: 1000,
          height: 1000,
        });
      });

      it('should report partial intersecting initial state correctly with offset', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
          viewportOffsetX: 333,
          viewportOffsetY: 333,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View style={{width: 50, height: 50}} ref={nodeRef} />
            </ScrollView>,
          );
        });
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
        const node = ensureReactNativeElement(nodeRef.current);

        // Scroll such that View is partially intersecting
        Fantom.scrollTo(scrollNode, {x: 0, y: 25});

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            threshold: [],
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);

        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0.5);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.00125);
        expect(entries[0].isIntersecting).toBe(true);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 333,
          y: 333,
          width: 50,
          height: 25,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 333,
          y: 308, // 333 - 25
          width: 50,
          height: 50,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 333,
          y: 333,
          width: 1000,
          height: 1000,
        });
      });

      it('should report subsequent updates correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
          viewportOffsetX: 333,
          viewportOffsetY: 333,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View style={{width: 100, height: 100}} ref={nodeRef} />
            </ScrollView>,
          );
        });

        const node = ensureReactNativeElement(nodeRef.current);
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

        expect(node.isConnected).toBe(true);

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback);
          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(1);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.01);
        expect(entries[0].isIntersecting).toBe(true);

        expectRectEquals(entries[0].intersectionRect, {
          x: 333,
          y: 333,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 333,
          y: 333,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 333,
          y: 333,
          width: 1000,
          height: 1000,
        });

        expect(reportedObserver).toBe(observer);

        // Move the view out of the viewport
        Fantom.scrollTo(scrollNode, {x: 0, y: 200});

        expect(node.isConnected).toBe(true);
        expect(intersectionObserverCallback).toHaveBeenCalledTimes(2);
        const [entries2, reportedObserver2] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries2.length).toBe(1);
        expect(entries2[0].isIntersecting).toBe(false);
        expect(entries2[0].target).toBe(node);

        expectRectEquals(entries2[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        expectRectEquals(entries2[0].boundingClientRect, {
          x: 333,
          y: 133, // 333 - 200
          width: 100,
          height: 100,
        });
        expectRectEquals(entries2[0].rootBounds, {
          x: 333,
          y: 333,
          width: 1000,
          height: 1000,
        });
        expect(reportedObserver2).toBe(observer);
      });
    });

    it('should report subsequent updates correctly', () => {
      const nodeRef = createRef<HostInstance>();
      const scrollNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={scrollNodeRef}>
            <View style={{width: 100, height: 100}} ref={nodeRef} />
          </ScrollView>,
        );
      });

      const node = ensureReactNativeElement(nodeRef.current);
      const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

      expect(node.isConnected).toBe(true);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(1);
      expect(entries[0].rnRootIntersectionRatio).toBe(0.01);
      expect(entries[0].isIntersecting).toBe(true);

      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });

      expect(reportedObserver).toBe(observer);

      // Move the view out of the viewport
      Fantom.scrollTo(scrollNode, {x: 0, y: 200});

      expect(node.isConnected).toBe(true);
      expect(intersectionObserverCallback).toHaveBeenCalledTimes(2);
      const [entries2, reportedObserver2] =
        intersectionObserverCallback.mock.lastCall;
      expect(entries2.length).toBe(1);
      expect(entries2[0].isIntersecting).toBe(false);
      expect(entries2[0].target).toBe(node);

      expectRectEquals(entries2[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expectRectEquals(entries2[0].boundingClientRect, {
        x: 0,
        y: -200,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries2[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
      expect(reportedObserver2).toBe(observer);
    });

    it('should report updates to the right observers', () => {
      let maybeNode1;
      let maybeNode2;
      const scrollNodeRef = createRef<HostInstance>();
      let observer1: IntersectionObserver;
      let observer2: IntersectionObserver;

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={scrollNodeRef}>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}
            />
            <View
              style={{width: 200, height: 200}}
              ref={receivedNode => {
                maybeNode2 = receivedNode;
              }}
            />
          </ScrollView>,
        );
      });
      const node1 = ensureReactNativeElement(maybeNode1);
      const node2 = ensureReactNativeElement(maybeNode2);
      const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

      // Scroll such that node1 is not intersecting and node 2 is intersecting
      Fantom.scrollTo(scrollNode, {x: 0, y: 100});

      const intersectionObserverCallback1 = jest.fn();
      const intersectionObserverCallback2 = jest.fn();

      Fantom.runTask(() => {
        observer1 = new IntersectionObserver(intersectionObserverCallback1, {
          threshold: [0],
        });

        observer1.observe(node1);
        observer1.observe(node2);

        observer2 = new IntersectionObserver(intersectionObserverCallback2, {
          threshold: [1],
        });
        observer2.observe(node2);
      });

      // Verify observer1 is reporting right thing
      expect(intersectionObserverCallback1).toHaveBeenCalledTimes(1);
      const [entries1, reportedObserver1] =
        intersectionObserverCallback1.mock.lastCall;

      expect(reportedObserver1).toBe(observer1);
      expect(entries1.length).toBe(2);

      expect(entries1[0].isIntersecting).toBe(false);
      expect(entries1[0].intersectionRatio).toBe(0);
      expect(entries1[0].target).toBe(node1);

      expectRectEquals(entries1[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expectRectEquals(entries1[0].boundingClientRect, {
        x: 0,
        y: -100,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries1[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });

      expect(entries1[1].isIntersecting).toBe(true);
      expect(entries1[1].intersectionRatio).toBe(0.75);
      expect(entries1[1].target).toBe(node2);

      // Verify observer2 is reporting no intersection because the threshold is 1
      expect(intersectionObserverCallback2).toHaveBeenCalledTimes(1);
      const [entries2, reportedObserver2] =
        intersectionObserverCallback2.mock.lastCall;

      expect(reportedObserver2).toBe(observer2);
      expect(entries2.length).toBe(1);

      expect(entries2[0].isIntersecting).toBe(false);
      expect(entries2[0].intersectionRatio).toBe(0.75);
      expect(entries2[0].target).toBe(node2);

      expectRectEquals(entries2[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 200,
        height: 150,
      });
      expectRectEquals(entries2[0].boundingClientRect, {
        x: 0,
        y: -50,
        width: 200,
        height: 200,
      });
      expectRectEquals(entries2[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    describe('with explicit root', () => {
      it('should report partial non-intersecting initial state correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
          viewportOffsetX: 333,
          viewportOffsetY: 333,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView style={{width: 100}} ref={scrollNodeRef}>
              <View style={{width: 50, height: 50}} ref={nodeRef} />
            </ScrollView>,
          );
        });

        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
        const node = ensureReactNativeElement(nodeRef.current);

        // Scroll such that View is partially intersecting
        Fantom.scrollTo(scrollNode, {x: 0, y: 25});

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            threshold: [1],
            root: scrollNode,
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0.5);
        // intersectionRectArea / rootboundsArea
        expect(entries[0].rnRootIntersectionRatio).toBe(0.0125);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 333,
          y: 333,
          width: 50,
          height: 25,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 333,
          y: 308, // 333 - 25
          width: 50,
          height: 50,
        });
        // Expect this to be width of the viewport
        expectRectEquals(entries[0].rootBounds, {
          x: 333,
          y: 333,
          width: 100,
          height: 1000,
        });
      });

      it('should report partial intersecting initial state correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView style={{width: 100}} ref={scrollNodeRef}>
              <View style={{width: 50, height: 50}} ref={nodeRef} />
            </ScrollView>,
          );
        });
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
        const node = ensureReactNativeElement(nodeRef.current);

        // Scroll such that View is partially intersecting
        Fantom.scrollTo(scrollNode, {x: 0, y: 25});

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            threshold: [],
            root: scrollNode,
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0.5);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.0125);
        expect(entries[0].isIntersecting).toBe(true);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 50,
          height: 25,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: -25,
          width: 50,
          height: 50,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 100,
          height: 1000,
        });
      });

      it('should report subsequent updates correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView style={{width: 100}} ref={scrollNodeRef}>
              <View style={{width: 100, height: 100}} ref={nodeRef} />
            </ScrollView>,
          );
        });

        const node = ensureReactNativeElement(nodeRef.current);
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

        expect(node.isConnected).toBe(true);

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            root: scrollNode,
          });
          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(1);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.1);
        expect(entries[0].isIntersecting).toBe(true);

        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 100,
          height: 1000,
        });

        expect(reportedObserver).toBe(observer);

        // Move the view out of the viewport
        Fantom.scrollTo(scrollNode, {x: 0, y: 200});

        expect(node.isConnected).toBe(true);
        expect(intersectionObserverCallback).toHaveBeenCalledTimes(2);
        const [entries2, reportedObserver2] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries2.length).toBe(1);
        expect(entries2[0].isIntersecting).toBe(false);
        expect(entries2[0].target).toBe(node);

        expectRectEquals(entries2[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        expectRectEquals(entries2[0].boundingClientRect, {
          x: 0,
          y: -200,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries2[0].rootBounds, {
          x: 0,
          y: 0,
          width: 100,
          height: 1000,
        });
        expect(reportedObserver2).toBe(observer);
      });

      it('should report updates to the right observers', () => {
        let maybeNode1;
        let maybeNode2;
        const scrollNodeRef = createRef<HostInstance>();
        let observer1: IntersectionObserver;
        let observer2: IntersectionObserver;

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View
                style={{width: 50, height: 50}}
                ref={receivedNode => {
                  maybeNode1 = receivedNode;
                }}
              />
              <View
                style={{width: 200, height: 200}}
                ref={receivedNode => {
                  maybeNode2 = receivedNode;
                }}
              />
            </ScrollView>,
          );
        });
        const node1 = ensureReactNativeElement(maybeNode1);
        const node2 = ensureReactNativeElement(maybeNode2);
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

        // Scroll such that node1 is not intersecting and node 2 is intersecting
        Fantom.scrollTo(scrollNode, {x: 0, y: 100});

        const intersectionObserverCallback1 = jest.fn();
        const intersectionObserverCallback2 = jest.fn();

        Fantom.runTask(() => {
          observer1 = new IntersectionObserver(intersectionObserverCallback1, {
            threshold: [0],
          });

          observer1.observe(node1);
          observer1.observe(node2);

          observer2 = new IntersectionObserver(intersectionObserverCallback2, {
            threshold: [1],
          });
          observer2.observe(node2);
        });

        // Verify observer1 is reporting right thing
        expect(intersectionObserverCallback1).toHaveBeenCalledTimes(1);
        const [entries1, reportedObserver1] =
          intersectionObserverCallback1.mock.lastCall;

        expect(reportedObserver1).toBe(observer1);
        expect(entries1.length).toBe(2);

        expect(entries1[0].isIntersecting).toBe(false);
        expect(entries1[0].intersectionRatio).toBe(0);
        expect(entries1[0].target).toBe(node1);

        expectRectEquals(entries1[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        expectRectEquals(entries1[0].boundingClientRect, {
          x: 0,
          y: -100,
          width: 50,
          height: 50,
        });
        expectRectEquals(entries1[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });

        expect(entries1[1].isIntersecting).toBe(true);
        expect(entries1[1].intersectionRatio).toBe(0.75);
        expect(entries1[1].target).toBe(node2);

        // Verify observer2 is reporting no intersection because the threshold is 1
        expect(intersectionObserverCallback2).toHaveBeenCalledTimes(1);
        const [entries2, reportedObserver2] =
          intersectionObserverCallback2.mock.lastCall;

        expect(reportedObserver2).toBe(observer2);
        expect(entries2.length).toBe(1);

        expect(entries2[0].isIntersecting).toBe(false);
        expect(entries2[0].intersectionRatio).toBe(0.75);
        expect(entries2[0].target).toBe(node2);

        expectRectEquals(entries2[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 200,
          height: 150,
        });
        expectRectEquals(entries2[0].boundingClientRect, {
          x: 0,
          y: -50,
          width: 200,
          height: 200,
        });
        expectRectEquals(entries2[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
      });
    });

    describe('with rootMargin', () => {
      describe('expanding', () => {
        it('full intersect with implicit root', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              // Position element at x: -50, y: -50 (outside viewport)
              <View
                style={{
                  position: 'absolute',
                  top: -50,
                  left: -50,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '50px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expectRectEquals(entries[0].rootBounds, {
            x: -50,
            y: -50,
            width: 1100,
            height: 1100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: -50,
            y: -50,
            width: 100,
            height: 100,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: -50,
            y: -50,
            width: 100,
            height: 100,
          });
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(1);
        });

        it('no intersection with high threshold on explicit root', () => {
          const nodeRef = createRef<HostInstance>();
          const rootNodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 200, height: 200}} ref={rootNodeRef}>
                <View
                  style={{
                    marginTop: -75,
                    width: 50,
                    height: 50,
                  }}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const rootNode = ensureReactNativeElement(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: rootNode,
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '50px 0px 0px 0px',
              threshold: 1,
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(false);
          expect(entries[0].intersectionRatio).toBe(0.5);
          expectRectEquals(entries[0].rootBounds, {
            x: 0,
            y: -50,
            width: 200,
            height: 250,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: -50,
            width: 50,
            height: 25,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: -75,
            width: 50,
            height: 50,
          });
        });

        it('no intersect with rnRootThreshold with implicit root', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: -75,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '50px',
              threshold: 1,
              rnRootThreshold: 0.5,
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(false);
          expect(entries[0].intersectionRatio).toBe(0.75);
          expect(entries[0].rnRootIntersectionRatio).toBe(
            (100 * 75) / (1100 * 1100),
          );
          expectRectEquals(entries[0].rootBounds, {
            x: -50,
            y: -50,
            width: 1100,
            height: 1100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: -50,
            width: 100,
            height: 75,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: -75,
            width: 100,
            height: 100,
          });
        });

        it('no intersect with rnRootThreshold with explicit root', () => {
          const nodeRef = createRef<HostInstance>();
          const rootRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View ref={rootRef} style={{width: 100, height: 100}}>
                <View
                  style={{
                    position: 'absolute',
                    top: -75,
                    width: 100,
                    height: 100,
                  }}
                  ref={nodeRef}
                />
                ,
              </View>,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const rootNode = ensureReactNativeElement(rootRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '50px',
              root: rootNode,
              threshold: 1,
              rnRootThreshold: 0.1,
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(0.75);
          expect(entries[0].rnRootIntersectionRatio).toBe(
            (100 * 75) / (200 * 200),
          );
          expectRectEquals(entries[0].rootBounds, {
            x: -50,
            y: -50,
            width: 200,
            height: 200,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: -50,
            width: 100,
            height: 75,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: -75,
            width: 100,
            height: 100,
          });
        });

        it('no intersection high threshold on implicit root', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: -75,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '50px',
              threshold: 1,
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expectRectEquals(entries[0].rootBounds, {
            x: -50,
            y: -50,
            width: 1100,
            height: 1100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: -50,
            width: 100,
            height: 75,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: -75,
            width: 100,
            height: 100,
          });
          expect(entries[0].isIntersecting).toBe(false);
          expect(entries[0].intersectionRatio).toBe(0.75);
        });

        it('partial intersection implicit root', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: -75,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '50px',
              threshold: 0.5,
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(0.75);
          expectRectEquals(entries[0].rootBounds, {
            x: -50,
            y: -50,
            width: 1100,
            height: 1100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: -50,
            width: 100,
            height: 75,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: -75,
            width: 100,
            height: 100,
          });
        });

        it('no intersect with implicit root', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: -101,
                  width: 50,
                  height: 50,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '50px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expectRectEquals(entries[0].rootBounds, {
            x: -50,
            y: -50,
            width: 1100,
            height: 1100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: -101,
            width: 50,
            height: 50,
          });
          expect(entries[0].isIntersecting).toBe(false);
          expect(entries[0].intersectionRatio).toBe(0);
        });

        it('full intersect with explicit root', () => {
          const nodeRef = createRef<HostInstance>();
          const rootNodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 200, height: 200}} ref={rootNodeRef}>
                <View
                  style={{
                    marginTop: 250,
                    width: 50,
                    height: 50,
                  }}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const scrollNode = ensureReactNativeElement(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: scrollNode,
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '0px 0px 100px 0px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
        });
      });

      describe('contracting', () => {
        it('partial intersection on explicit root', () => {
          const nodeRef = createRef<HostInstance>();
          const rootNodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 200, height: 200}} ref={rootNodeRef}>
                <View
                  style={{
                    marginTop: 30,
                    width: 100,
                    height: 100,
                  }}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const scrollNode = ensureReactNativeElement(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: scrollNode,
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-50px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(0.4);
          expectRectEquals(entries[0].rootBounds, {
            x: 50,
            y: 50,
            width: 100,
            height: 100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 50,
            y: 50,
            width: 50,
            height: 80,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: 30,
            width: 100,
            height: 100,
          });
        });

        it('partial intersection with threshold on explicit root', () => {
          const nodeRef = createRef<HostInstance>();
          const rootNodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 200, height: 200}} ref={rootNodeRef}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                  }}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const customRoot = ensureReactNativeElement(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: customRoot,
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-40px',
              threshold: 0.3,
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe((60 * 60) / (100 * 100));
          expectRectEquals(entries[0].rootBounds, {
            x: 40,
            y: 40,
            width: 120,
            height: 120,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 40,
            y: 40,
            width: 60,
            height: 60,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          });
        });

        it('partial intersection on implicit root', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: 25,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-50px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(0.375);
          expectRectEquals(entries[0].rootBounds, {
            x: 50,
            y: 50,
            width: 900,
            height: 900,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 50,
            y: 50,
            width: 50,
            height: 75,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: 25,
            width: 100,
            height: 100,
          });
        });

        it('edge-intersection with implicit root', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-100px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expectRectEquals(entries[0].rootBounds, {
            x: 100,
            y: 100,
            width: 800,
            height: 800,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 100,
            y: 100,
            width: 0,
            height: 0,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          });
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(0);
        });

        it('no intersection with implicit root threshold 1', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: 80,
                  left: 10,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-100px 0px 0px 0px',
              threshold: 1,
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(false);
          expect(entries[0].intersectionRatio).toBe(0.8);
          expectRectEquals(entries[0].rootBounds, {
            x: 0,
            y: 100,
            width: 1000,
            height: 900,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 10,
            y: 100,
            width: 100,
            height: 80,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 10,
            y: 80,
            width: 100,
            height: 100,
          });
        });

        it('no intersection on implicit root completely outside', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-150px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(false);
          expect(entries[0].intersectionRatio).toBe(0);
          expectRectEquals(entries[0].rootBounds, {
            x: 150,
            y: 150,
            width: 700,
            height: 700,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: 10,
            width: 100,
            height: 100,
          });
        });

        it('full intersection with explicit root', () => {
          const nodeRef = createRef<HostInstance>();
          const rootNodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 200, height: 200}} ref={rootNodeRef}>
                <View
                  style={{
                    marginTop: 60,
                    width: 80,
                    height: 80,
                  }}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const rootNode = ensureReactNativeElement(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: rootNode,
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-50px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expectRectEquals(entries[0].rootBounds, {
            x: 50,
            y: 50,
            width: 100,
            height: 100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 50,
            y: 60,
            width: 30,
            height: 80,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: 60,
            width: 80,
            height: 80,
          });
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(0.375);
        });

        it('no intersection with explicit root', () => {
          const nodeRef = createRef<HostInstance>();
          const rootNodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 200, height: 200}} ref={rootNodeRef}>
                <View
                  style={{
                    marginTop: -50,
                    width: 50,
                    height: 50,
                  }}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const scrollNode = ensureReactNativeElement(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: scrollNode,
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-50px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(false);
          expect(entries[0].intersectionRatio).toBe(0);
          expectRectEquals(entries[0].rootBounds, {
            x: 50,
            y: 50,
            width: 100,
            height: 100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: -50,
            width: 50,
            height: 50,
          });
        });
      });

      describe('percentage', () => {
        it('full intersect with percentage rootMargin', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: -50,
                  left: -50,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '5%',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(1);
          expectRectEquals(entries[0].rootBounds, {
            x: -50,
            y: -50,
            width: 1100,
            height: 1100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: -50,
            y: -50,
            width: 100,
            height: 100,
          });
        });
        it('should calculate percentage rootMargin relative to root dimensions with custom root', () => {
          const nodeRef = createRef<HostInstance>();
          const rootNodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View style={{width: 200, height: 200}} ref={rootNodeRef}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                  }}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const scrollNode = ensureReactNativeElement(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: scrollNode,
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-25%',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(0);
          expectRectEquals(entries[0].rootBounds, {
            x: 50,
            y: 50,
            width: 100,
            height: 100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 50,
            y: 50,
            width: 0,
            height: 0,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: 0,
            width: 50,
            height: 50,
          });
        });
        it('should handle mixed px and percentage rootMargin values', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  position: 'absolute',
                  top: -100,
                  left: 0,
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '10% 0px 0px 0px',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expectRectEquals(entries[0].rootBounds, {
            x: 0,
            y: -100,
            width: 1000,
            height: 1100,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 0,
            y: -100,
            width: 100,
            height: 100,
          });
          expectRectEquals(entries[0].boundingClientRect, {
            x: 0,
            y: -100,
            width: 100,
            height: 100,
          });
        });
        it('edge intersection with negative percentage rootMargin', () => {
          const nodeRef = createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });

          Fantom.runTask(() => {
            root.render(
              <View
                style={{
                  width: 100,
                  height: 100,
                }}
                ref={nodeRef}
              />,
            );
          });

          const node = ensureReactNativeElement(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
              rootMargin: '-10%',
            });
            observer.observe(node);
          });

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
          const [entries] = intersectionObserverCallback.mock.lastCall;
          expect(entries.length).toBe(1);
          expect(entries[0].isIntersecting).toBe(true);
          expect(entries[0].intersectionRatio).toBe(0);
          expectRectEquals(entries[0].rootBounds, {
            x: 100,
            y: 100,
            width: 800,
            height: 800,
          });
          expectRectEquals(entries[0].intersectionRect, {
            x: 100,
            y: 100,
            width: 0,
            height: 0,
          });
        });
      });

      it('should update intersection state when element moves with rootMargin', () => {
        const scrollNodeRef = createRef<HostInstance>();
        const nodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View style={{width: 100, height: 100}} ref={nodeRef} />
            </ScrollView>,
          );
        });

        const node = ensureReactNativeElement(nodeRef.current);
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);
        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
            rootMargin: '50px',
          });
          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries1] = intersectionObserverCallback.mock.lastCall;
        expect(entries1[0].isIntersecting).toBe(true);

        // Scroll element out of expanded viewport
        Fantom.scrollTo(scrollNode, {x: 0, y: 200});

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(2);
        const [entries2] = intersectionObserverCallback.mock.lastCall;
        expect(entries2[0].isIntersecting).toBe(false);
      });
    });

    it('should not retain initial children of observed targets', () => {
      const root = Fantom.createRoot();
      observer = new IntersectionObserver(() => {});

      const [getReferenceCount, ref] = createShadowNodeReferenceCountingRef();

      const observeRef: React.RefSetter<
        React.ElementRef<typeof View>,
      > = instance => {
        const element = ensureReactNativeElement(instance);
        observer.observe(element);
        return () => {
          observer.unobserve(element);
        };
      };

      function Observe({children}: Readonly<{children?: React.Node}>) {
        return <View ref={observeRef}>{children}</View>;
      }

      Fantom.runTask(() => {
        root.render(
          <Observe>
            <View ref={ref} />
          </Observe>,
        );
      });

      expect(getReferenceCount()).toBeGreaterThan(0);

      Fantom.runTask(() => {
        root.render(<Observe />);
      });

      expect(getReferenceCount()).toBe(0);
    });

    it('should NOT report multiple entries when observing a target that exists and we modify it later in the same tick', () => {
      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      const nodeRef = createRef<HostInstance>();

      function TestComponent() {
        const [showView, setShowView] = useState(true);

        return showView ? (
          <View
            onClick={() => {
              observer.observe(ensureReactNativeElement(nodeRef.current));
              setShowView(false);
            }}
            style={{width: 100, height: 100, backgroundColor: 'red'}}
            ref={nodeRef}
          />
        ) : null;
      }

      Fantom.runTask(() => {
        root.render(<TestComponent />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      expect(node.isConnected).toBe(true);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
      });

      // We use a discrete event to make sure React processes the update in the
      // same task.
      Fantom.dispatchNativeEvent(node, 'click');

      expect(node.isConnected).toBe(false);

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries] = intersectionObserverCallback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(false);
    });

    describe('rootThreshold', () => {
      it('should report partial intersecting initial state correctly', () => {
        const nodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(<View style={{width: 100, height: 100}} ref={nodeRef} />);
        });

        const node = ensureReactNativeElement(nodeRef.current);

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rnRootThreshold: [1, 0.5, 0],
          });
          observer.observe(node);
        });

        expect(observer.rnRootThresholds).toEqual([0, 0.5, 1]);
        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);

        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(true);
        expect(entries[0].target).toBe(node);
        expect(entries[0].intersectionRatio).toBe(1);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.01);

        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });

        expect(reportedObserver).toBe(observer);
      });

      it('should report partial non-intersecting initial state correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View style={{width: 50, height: 50}} ref={nodeRef} />
            </ScrollView>,
          );
        });
        const node = ensureReactNativeElement(nodeRef.current);
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

        Fantom.scrollTo(scrollNode, {x: 0, y: 25});

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rnRootThreshold: [0.5],
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0.5);
        expect(entries[0].rnRootIntersectionRatio).toBe(0.00125);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 50,
          height: 25,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: -25,
          width: 50,
          height: 50,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
      });

      it('should report completely non-intersecting initial state correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View style={{width: 50, height: 50}} ref={nodeRef} />
            </ScrollView>,
          );
        });
        const node = ensureReactNativeElement(nodeRef.current);
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

        Fantom.scrollTo(scrollNode, {x: 0, y: 200});

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rnRootThreshold: [0.5],
          });

          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;

        expect(reportedObserver).toBe(observer);
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0);
        expect(entries[0].rnRootIntersectionRatio).toBe(0);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].target).toBe(node);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: -200,
          width: 50,
          height: 50,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
      });

      it('should report subsequent updates correctly', () => {
        const nodeRef = createRef<HostInstance>();
        const scrollNodeRef = createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });

        Fantom.runTask(() => {
          root.render(
            <ScrollView ref={scrollNodeRef}>
              <View
                style={{
                  width: 1000,
                  height: 1000,
                }}
                ref={nodeRef}
              />
              <View
                style={{
                  width: 1000,
                  height: 2000, // This view purely to add height
                }}
              />
            </ScrollView>,
          );
        });

        const node = ensureReactNativeElement(nodeRef.current);
        const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

        // Scroll such that target View is not intersecting
        Fantom.scrollTo(scrollNode, {x: 0, y: 2000});

        expect(node.isConnected).toBe(true);

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rnRootThreshold: [1],
          });
          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries, reportedObserver] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
        expect(entries[0].intersectionRatio).toBe(0);
        expect(entries[0].rnRootIntersectionRatio).toBe(0);
        expect(entries[0].isIntersecting).toBe(false);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        expectRectEquals(entries[0].boundingClientRect, {
          x: 0,
          y: -2000,
          width: 1000,
          height: 1000,
        });
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });

        expect(reportedObserver).toBe(observer);

        // Scroll target View into viewport
        Fantom.scrollTo(scrollNode, {x: 0, y: 0});

        expect(node.isConnected).toBe(true);
        expect(intersectionObserverCallback).toHaveBeenCalledTimes(2);
        const [entries2, reportedObserver2] =
          intersectionObserverCallback.mock.lastCall;
        expect(entries2.length).toBe(1);
        expect(entries2[0].isIntersecting).toBe(true);
        expect(entries2[0].intersectionRatio).toBe(1);
        expect(entries2[0].rnRootIntersectionRatio).toBe(1);
        expect(entries2[0].target).toBe(node);

        expectRectEquals(entries2[0].intersectionRect, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
        expectRectEquals(entries2[0].boundingClientRect, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
        expectRectEquals(entries2[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });

        expect(reportedObserver2).toBe(observer);
      });
    });
  });

  describe('intersectionRect is relative to root', () => {
    it('should report intersectionRect for implicit root', () => {
      const node1Ref = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{
                position: 'absolute',
                top: -50,
                width: 100,
                height: 100,
              }}
              ref={node1Ref}
            />
          </>,
        );
      });

      const node1 = ensureReactNativeElement(node1Ref.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
        observer.observe(node1);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].intersectionRatio).toBe(0.5);
      expect(entries[0].target).toBe(node1);

      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -50,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    it('should report intersectionRect for explicit root', () => {
      const node1Ref = React.createRef<HostInstance>();
      const node2Ref = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{
                position: 'relative',
                marginTop: -50,
                width: 500,
                height: 500,
              }}
              ref={node1Ref}>
              <View
                style={{
                  position: 'absolute',
                  width: 100,
                  height: 100,
                  top: -50,
                }}
                ref={node2Ref}
              />
            </View>
          </>,
        );
      });

      const node1 = ensureReactNativeElement(node1Ref.current);
      const node2 = ensureReactNativeElement(node2Ref.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          root: node1,
        });

        observer.observe(node2);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);

      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: -50,
        width: 100,
        height: 50,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -100,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: -50,
        width: 500,
        height: 500,
      });
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].intersectionRatio).toBe(0.5);
      expect(entries[0].target).toBe(node2);
    });
  });

  describe('edge-adjacent intersection', () => {
    it('should report edge intersect with implicit root', () => {
      const node1Ref = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{
                position: 'absolute',
                top: -100,
                width: 100,
                height: 100,
              }}
              ref={node1Ref}
            />
          </>,
        );
      });

      const node1 = ensureReactNativeElement(node1Ref.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
        observer.observe(node1);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].intersectionRatio).toBe(0);
      expect(entries[0].target).toBe(node1);

      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 0,
        width: 100,
        height: 0,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: -100,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
      });
    });

    it('should report edge-adjacent views with zero intersection area', () => {
      const node1Ref = React.createRef<HostInstance>();
      const node2Ref = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{
                position: 'relative',
                marginTop: 100,
                marginLeft: 100,
                width: 100,
                height: 100,
              }}
              ref={node1Ref}>
              <View
                style={{position: 'absolute', width: 50, height: 50, top: -50}}
                ref={node2Ref}
              />
            </View>
          </>,
        );
      });

      const node1 = ensureReactNativeElement(node1Ref.current);
      const node2 = ensureReactNativeElement(node2Ref.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          root: node1,
        });

        observer.observe(node2);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].intersectionRatio).toBe(0);
      expect(entries[0].target).toBe(node2);

      expectRectEquals(entries[0].intersectionRect, {
        x: 100,
        y: 100,
        width: 50,
        height: 0,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 100,
        y: 50,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
    });
  });

  describe('clipping behavior', () => {
    it('should report intersection for clipping ancestor', () => {
      const nodeRef = React.createRef<HostInstance>();
      const rootRef = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <View style={{width: 99, height: 99, overflow: 'hidden'}}>
            <View ref={rootRef} style={{width: 200, height: 200}}>
              <View
                style={{width: 100, height: 100, marginTop: 100}}
                ref={nodeRef}
              />
            </View>
            ,
          </View>,
        );
      });
      const node = ensureReactNativeElement(nodeRef.current);
      const rootNode = ensureReactNativeElement(rootRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          root: rootNode,
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(1);
      // This is the ratio of intersection area / (explicit) root area
      expect(entries[0].rnRootIntersectionRatio).toBe(0.25);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 100,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: 100,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });
    });

    it('should report intersection for clipping root', () => {
      const nodeRef = React.createRef<HostInstance>();
      const rootRef = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <View
            ref={rootRef}
            style={{width: 100, height: 100, overflow: 'hidden'}}>
            <View
              style={{width: 100, height: 100, marginTop: 50}}
              ref={nodeRef}
            />
          </View>,
        );
      });
      const node = ensureReactNativeElement(nodeRef.current);
      const rootNode = ensureReactNativeElement(rootRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          root: rootNode,
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(0.5);
      // This is the ratio of intersection area / (explicit) root area
      expect(entries[0].rnRootIntersectionRatio).toBe(0.5);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 50,
        width: 100,
        height: 50,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: 50,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
    });

    it('should report intersection for clipping ancestor with rootMargin', () => {
      const nodeRef = React.createRef<HostInstance>();
      const rootRef = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <View style={{width: 5, height: 5, overflow: 'hidden'}}>
            <View ref={rootRef} style={{width: 200, height: 200}}>
              <View
                style={{width: 100, height: 100, marginTop: 100}}
                ref={nodeRef}
              />
            </View>
            ,
          </View>,
        );
      });
      const node = ensureReactNativeElement(nodeRef.current);
      const rootNode = ensureReactNativeElement(rootRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          root: rootNode,
          rootMargin: '-50px',
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe((50 * 50) / (100 * 100));
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].target).toBe(node);
      expectRectEquals(entries[0].intersectionRect, {
        x: 50,
        y: 100,
        width: 50,
        height: 50,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: 100,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      });
    });

    it('should report intersection for clipping root with rootMargin', () => {
      const nodeRef = React.createRef<HostInstance>();
      const rootRef = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <View
            ref={rootRef}
            style={{width: 100, height: 100, overflow: 'hidden'}}>
            <View
              style={{width: 100, height: 100, marginTop: 50}}
              ref={nodeRef}
            />
          </View>,
        );
      });
      const node = ensureReactNativeElement(nodeRef.current);
      const rootNode = ensureReactNativeElement(rootRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          root: rootNode,
          rootMargin: '10px',
        });

        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries, reportedObserver] =
        intersectionObserverCallback.mock.lastCall;

      expect(reportedObserver).toBe(observer);
      expect(entries.length).toBe(1);
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 50,
        width: 100,
        height: 50,
      });
      expectRectEquals(entries[0].boundingClientRect, {
        x: 0,
        y: 50,
        width: 100,
        height: 100,
      });
      expectRectEquals(entries[0].rootBounds, {
        x: -10,
        y: -10,
        width: 120,
        height: 120,
      });

      expect(entries[0]).toBeInstanceOf(IntersectionObserverEntry);
      expect(entries[0].intersectionRatio).toBe(0.5);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].target).toBe(node);
    });
  });

  describe('unobserve(target)', () => {
    it('should throw if `target` is not a `ReactNativeElement`', () => {
      observer = new IntersectionObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        observer.unobserve('something');
      }).toThrow(
        "Failed to execute 'unobserve' on 'IntersectionObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    });

    it('should ignore the call if `target` was not observed (not fail)', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);
      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback);
        observer.unobserve(node);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should stop observing the target if it was observed', () => {
      const nodeRef = createRef<HostInstance>();
      const scrollNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      // View is not intersecting with ScrollView
      Fantom.runTask(() => {
        root.render(
          <ScrollView ref={scrollNodeRef}>
            <View style={{width: 100, height: 100}} ref={nodeRef} />
          </ScrollView>,
        );
      });

      const node = ensureReactNativeElement(nodeRef.current);
      const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

      Fantom.scrollTo(scrollNode, {x: 0, y: 100});

      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback, {threshold: 1});
        observer.observe(node);
      });

      // Should get initial non-intersecting entry on observation
      expect(callback).toHaveBeenCalledTimes(1);
      const [entries] = callback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(false);

      Fantom.runTask(() => {
        observer.unobserve(node);
      });

      // Update View such that it is intersecting
      Fantom.runTask(() => {
        root.render(
          <ScrollView>
            <View style={{width: 100, height: 100}} ref={nodeRef} />
          </ScrollView>,
        );
      });

      // Expect no additional callback calls
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should stop observing the target if it was observed (detached target after observing)', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback);
        observer.observe(node);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(node.isConnected).toBe(false);

      Fantom.runTask(() => {
        observer.unobserve(node);
      });

      // expect no change in callback
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should stop observing the target if it was observed (detached target before observing)', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      Fantom.runTask(() => {
        root.render(<></>);
      });
      expect(node.isConnected).toBe(false);

      observer = new IntersectionObserver(() => {});
      observer.observe(node);
      observer.unobserve(node);
    });

    it('should not report the initial state if the target is unobserved before it is delivered', () => {
      const nodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);
        observer.observe(node);
        observer.unobserve(node);
      });

      expect(intersectionObserverCallback).not.toHaveBeenCalled();
    });

    it('should not report updates if the target is unobserved before they are delivered', () => {
      const nodeRef = createRef<HostInstance>();
      const scrollNodeRef = createRef<HostInstance>();

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <ScrollView
            ref={receivedNode => {
              scrollNodeRef.current = receivedNode;
            }}>
            <View style={{width: 100, height: 100}} ref={nodeRef} />
          </ScrollView>,
        );
      });

      const scrollNode = ensureReactNativeElement(scrollNodeRef.current);

      // Scroll such that view is not intersecting with ScrollView
      Fantom.scrollTo(scrollNode, {
        x: 0,
        y: 100,
      });

      const node = ensureReactNativeElement(nodeRef.current);

      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback, {threshold: 1});
        observer.observe(node);
      });

      // Should get initial non-intersecting entry on observation
      expect(callback).toHaveBeenCalledTimes(1);
      const [entries] = callback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(false);

      Fantom.runTask(() => {
        observer.unobserve(node);
      });

      // Scroll ScrollView such that View is intersecting
      Fantom.scrollTo(scrollNode, {
        x: 0,
        y: 0,
      });

      // The callback should not be called again because the target was
      // unobserved before the callback was called with the update.
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not report updates if the target is unobserved before they are delivered (with other active targets)', () => {
      let maybeNode1;
      let maybeNode2;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}
            />
            <View
              style={{width: 200, height: 200}}
              ref={receivedNode => {
                maybeNode2 = receivedNode;
              }}
            />
          </>,
        );
      });
      const node1 = ensureReactNativeElement(maybeNode1);
      const node2 = ensureReactNativeElement(maybeNode2);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          threshold: 0,
        });

        observer.observe(node1);
        observer.observe(node2);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);

      Fantom.runTask(() => {
        observer.unobserve(node1);
      });

      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}
            />
            <View
              style={{width: 200, height: 200}}
              ref={receivedNode => {
                maybeNode2 = receivedNode;
              }}
            />
          </>,
        );
      });

      // There should be no additional callback becuase node1 was unobserved
      // and node2 has no change in intersecting state (threshold 0)
      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
    });

    // This is a regression test for a bug where the registration data for the
    // target was incorrectly cleaned up when a single observer stopped
    // observing it.
    it('should work with multiple intersection observer instances', () => {
      const nodeRef = createRef<HostInstance>();
      let observer1: IntersectionObserver;
      let observer2: IntersectionObserver;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      Fantom.runTask(() => {
        observer1 = new IntersectionObserver(() => {});
        observer2 = new IntersectionObserver(() => {});

        observer1.observe(node);
        observer2.observe(node);

        observer1.unobserve(node);

        // The second call shouldn't log errors (that would make the test fail).
        observer2.unobserve(node);
      });
    });
  });

  describe('disconnect', () => {
    it('should do nothing if no targets are observed (not fail)', () => {
      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback);
        observer.disconnect();
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should stop observing all observed targets', () => {
      let maybeNode1;
      let maybeNode2;

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <>
            <View
              style={{width: 50, height: 50}}
              ref={receivedNode => {
                maybeNode1 = receivedNode;
              }}
            />
            <View
              style={{width: 200, height: 200}}
              ref={receivedNode => {
                maybeNode2 = receivedNode;
              }}
            />
          </>,
        );
      });
      const node1 = ensureReactNativeElement(maybeNode1);
      const node2 = ensureReactNativeElement(maybeNode2);

      const callback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(callback);

        observer.observe(node1);
        observer.observe(node2);

        observer.disconnect();
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not dispatch pending entries when disconnecting', () => {
      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      const nodeRef = createRef<HostInstance>();

      Fantom.runTask(() => {
        root.render(<View ref={nodeRef} style={{width: 100, height: 100}} />);
      });

      const node = ensureReactNativeElement(nodeRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback);

        // At the end of the current tick, we schedule the execution of the
        // intersection observer callback with the initial state of the
        // target.
        observer.observe(node);

        // This is executed in the next tick, before the intersection observer
        // callback is called.
        Fantom.scheduleTask(() => {
          expect(intersectionObserverCallback).not.toHaveBeenCalled();

          observer.disconnect();

          expect(intersectionObserverCallback).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('IntersectionObserverEntry global constructor', () => {
    it('throws when called', () => {
      expect(
        () =>
          // The public stub throws regardless of arguments; the real class
          // requires two so Flow needs a suppression here.
          // $FlowExpectedError[incompatible-type]
          new IntersectionObserverEntry(),
      ).toThrow(
        "Failed to construct 'IntersectionObserverEntry': Illegal constructor",
      );
    });
  });
});
