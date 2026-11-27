/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableIntersectionObserverByDefault:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type IntersectionObserverType from '../IntersectionObserver';
import type IntersectionObserverEntryType from '../IntersectionObserverEntry';
import type {HostInstance} from 'react-native';

import {createShadowNodeReferenceCountingRef} from '../../../__tests__/utilities/ShadowNodeReferenceCounter';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef, useState} from 'react';
import {ScrollView, View} from 'react-native';

declare const IntersectionObserver: Class<IntersectionObserverType>;
declare const IntersectionObserverEntry: Class<IntersectionObserverEntryType>;

export function expectRectEquals(
  rect: DOMRectReadOnly,
  expected: {x: number, y: number, width: number, height: number},
): boolean {
  const {x, y, width, height} = expected;
  if (!(
    rect.x === x &&
    rect.y === y &&
    rect.width === width &&
    rect.height === height
  )) {
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

  describe('constructor(callback, {root, rootMargin, scrollMargin, threshold, rnRootThreshold})', () => {
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
        return new IntersectionObserver(() => {}, {rootMargin: '10px'});
      }).not.toThrow();

      expect(() => {
        return new IntersectionObserver(() => {}, {rootMargin: '10px 20px'});
      }).not.toThrow();

      expect(() => {
        return new IntersectionObserver(() => {}, {
          rootMargin: '10px 20px 30px 40px',
        });
      }).not.toThrow();
    });

    describe('rootMargin', () => {
      it('should parse single value rootMargin', () => {
        observer = new IntersectionObserver(() => {}, {rootMargin: '10px'});
        expect(observer.rootMargin).toBe('10px 10px 10px 10px');
      });

      it('should parse two value rootMargin', () => {
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '10px 20px',
        });
        expect(observer.rootMargin).toBe('10px 20px 10px 20px');
      });

      it('should parse three value rootMargin', () => {
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '10px 20px 30px',
        });
        expect(observer.rootMargin).toBe('10px 20px 30px 20px');
      });

      it('should parse four value rootMargin', () => {
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '10px 20px 30px 40px',
        });
        expect(observer.rootMargin).toBe('10px 20px 30px 40px');
      });

      it('should handle negative rootMargin values', () => {
        observer = new IntersectionObserver(() => {}, {
          rootMargin: '-10px -20px',
        });
        expect(observer.rootMargin).toBe('-10px -20px -10px -20px');
      });

      it('should handle percentage rootMargin values', () => {
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
          observer = new IntersectionObserver(() => {}, {
            rootMargin: undefined,
          });
          expect(observer.rootMargin).toBe('0px 0px 0px 0px');
        });

        it('should default to "0px 0px 0px 0px" when rootMargin is empty string', () => {
          observer = new IntersectionObserver(() => {}, {rootMargin: ''});
          expect(observer.rootMargin).toBe('0px 0px 0px 0px');
        });
      });

      describe('parsing failures', () => {
        it('should throw when rootMargin is not a string', () => {
          expect(() => {
            // $FlowExpectedError[incompatible-type]
            return new IntersectionObserver(() => {}, {rootMargin: 123});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to read the 'rootMargin' property from 'IntersectionObserverInit': The provided value is not of type 'string'.",
          );
        });

        it('should throw when rootMargin has too many values', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {
              rootMargin: '10px 20px 30px 40px 50px',
            });
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: Too many values (expected 1-4).",
          );
        });

        it('should throw when rootMargin value is missing unit', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {rootMargin: '10'});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: '10' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when rootMargin value has invalid unit', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {rootMargin: '10em'});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: '10em' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when rootMargin value has invalid format', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {
              rootMargin: 'invalid',
            });
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: 'invalid' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when rootMargin has mixed valid and invalid values', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {
              rootMargin: '10px invalid',
            });
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: 'invalid' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when rootMargin value is only a unit', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {rootMargin: 'px'});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse rootMargin: 'px' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });
      });
    });

    describe('scrollMargin', () => {
      it('should parse single value scrollMargin', () => {
        observer = new IntersectionObserver(() => {}, {scrollMargin: '10px'});
        expect(observer.scrollMargin).toBe('10px 10px 10px 10px');
      });

      it('should parse two value scrollMargin', () => {
        observer = new IntersectionObserver(() => {}, {
          scrollMargin: '10px 20px',
        });
        expect(observer.scrollMargin).toBe('10px 20px 10px 20px');
      });

      it('should parse three value scrollMargin', () => {
        observer = new IntersectionObserver(() => {}, {
          scrollMargin: '10px 20px 30px',
        });
        expect(observer.scrollMargin).toBe('10px 20px 30px 20px');
      });

      it('should parse four value scrollMargin', () => {
        observer = new IntersectionObserver(() => {}, {
          scrollMargin: '10px 20px 30px 40px',
        });
        expect(observer.scrollMargin).toBe('10px 20px 30px 40px');
      });

      it('should handle negative scrollMargin values', () => {
        observer = new IntersectionObserver(() => {}, {
          scrollMargin: '-10px -20px',
        });
        expect(observer.scrollMargin).toBe('-10px -20px -10px -20px');
      });

      it('should handle percentage scrollMargin values', () => {
        observer = new IntersectionObserver(() => {}, {
          scrollMargin: '10% 20%',
        });
        expect(observer.scrollMargin).toBe('10% 20% 10% 20%');
      });

      it('should be independent from rootMargin', () => {
        observer = new IntersectionObserver(() => {}, {
          // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
          rootMargin: '5px',
          scrollMargin: '10px',
        });
        expect(observer.rootMargin).toBe('5px 5px 5px 5px');
        expect(observer.scrollMargin).toBe('10px 10px 10px 10px');
      });

      describe('default values', () => {
        it('should default to "0px 0px 0px 0px" when scrollMargin is not provided', () => {
          observer = new IntersectionObserver(() => {});
          expect(observer.scrollMargin).toBe('0px 0px 0px 0px');
        });

        it('should default to "0px 0px 0px 0px" when scrollMargin is undefined', () => {
          observer = new IntersectionObserver(() => {}, {
            scrollMargin: undefined,
          });
          expect(observer.scrollMargin).toBe('0px 0px 0px 0px');
        });

        it('should default to "0px 0px 0px 0px" when scrollMargin is empty string', () => {
          observer = new IntersectionObserver(() => {}, {scrollMargin: ''});
          expect(observer.scrollMargin).toBe('0px 0px 0px 0px');
        });
      });

      describe('parsing failures', () => {
        it('should throw when scrollMargin is not a string', () => {
          expect(() => {
            // $FlowExpectedError[incompatible-type]
            return new IntersectionObserver(() => {}, {scrollMargin: 123});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to read the 'scrollMargin' property from 'IntersectionObserverInit': The provided value is not of type 'string'.",
          );
        });

        it('should throw when scrollMargin has too many values', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {
              scrollMargin: '10px 20px 30px 40px 50px',
            });
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse scrollMargin: Too many values (expected 1-4).",
          );
        });

        it('should throw when scrollMargin value is missing unit', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {scrollMargin: '10'});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse scrollMargin: '10' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when scrollMargin value has invalid unit', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {scrollMargin: '10em'});
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse scrollMargin: '10em' is not a valid length. Only 'px' and '%' units are allowed.",
          );
        });

        it('should throw when scrollMargin has mixed valid and invalid values', () => {
          expect(() => {
            return new IntersectionObserver(() => {}, {
              scrollMargin: '10px invalid',
            });
          }).toThrow(
            "Failed to construct 'IntersectionObserver': Failed to parse scrollMargin: 'invalid' is not a valid length. Only 'px' and '%' units are allowed.",
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

      const rootNode = nullthrows(rootRef.current);

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
      expect(
        new IntersectionObserver(() => {}, {threshold: [0.000001, 1e-7]})
          .thresholds,
      ).toEqual([1e-7, 0.000001]);

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

    it('should freeze normalized thresholds without freezing caller arrays', () => {
      const threshold = [1, 0, 0.5];
      const rnRootThreshold = [0.5, 1, 0];
      observer = new IntersectionObserver(() => {}, {
        threshold,
        rnRootThreshold,
      });

      for (const thresholds of [
        observer.thresholds,
        nullthrows(observer.rnRootThresholds),
      ]) {
        expect(Object.isFrozen(thresholds)).toBe(true);
        let mutationError: unknown;
        try {
          Object.defineProperty(thresholds, '0', {value: 1});
        } catch (error: unknown) {
          mutationError = error;
        }
        expect(mutationError).toBeInstanceOf(TypeError);
        expect(thresholds).toEqual([0, 0.5, 1]);
      }

      expect(Object.isFrozen(threshold)).toBe(false);
      expect(Object.isFrozen(rnRootThreshold)).toBe(false);
      threshold.reverse();
      rnRootThreshold[0] = 0;
      expect(observer.thresholds).toEqual([0, 0.5, 1]);
      expect(observer.rnRootThresholds).toEqual([0, 0.5, 1]);
    });

    it('should freeze default, scalar, and empty normalized threshold arrays', () => {
      const observers = [
        new IntersectionObserver(() => {}),
        new IntersectionObserver(() => {}, {threshold: []}),
        new IntersectionObserver(() => {}, {threshold: 0.5}),
        new IntersectionObserver(() => {}, {rnRootThreshold: 0.5}),
      ];
      for (const testObserver of observers) {
        expect(Object.isFrozen(testObserver.thresholds)).toBe(true);
        if (testObserver.rnRootThresholds != null) {
          expect(Object.isFrozen(testObserver.rnRootThresholds)).toBe(true);
        }
      }
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
      expect(
        new IntersectionObserver(() => {}, {
          rnRootThreshold: [0.000001, 1e-7],
        }).rnRootThresholds,
      ).toEqual([1e-7, 0.000001]);

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
          return new IntersectionObserver(() => {}, {delay: 100});
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'delay' option is not supported.",
        );
      });

      it('should throw if `trackVisibility` option is specified', () => {
        expect(() => {
          return new IntersectionObserver(() => {}, {trackVisibility: true});
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'trackVisibility' option is not supported.",
        );
      });

      it('should throw if `delay` option is set to undefined explicitly', () => {
        expect(() => {
          return new IntersectionObserver(() => {}, {delay: undefined});
        }).toThrow(
          "Failed to construct 'IntersectionObserver': The 'delay' option is not supported.",
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

      const node = nullthrows(nodeRef.current);

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
      const node = nullthrows(nodeRef.current);

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

      const node = nullthrows(nodeRef.current);

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
      const scrollNode = nullthrows(scrollNodeRef.current);
      // Ensure View is not intersecting with ScrollView
      Fantom.scrollTo(scrollNode, {x: 0, y: 200});

      const node = nullthrows(nodeRef.current);

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

      const scrollNode = nullthrows(scrollNodeRef.current);
      const node = nullthrows(nodeRef.current);

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
      const scrollNode = nullthrows(scrollNodeRef.current);
      const node = nullthrows(nodeRef.current);

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
        const scrollNode = nullthrows(scrollNodeRef.current);
        // Ensure View is not intersecting with ScrollView
        Fantom.scrollTo(scrollNode, {x: 0, y: 200});

        const node = nullthrows(nodeRef.current);

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

        const scrollNode = nullthrows(scrollNodeRef.current);
        const node = nullthrows(nodeRef.current);

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
        const scrollNode = nullthrows(scrollNodeRef.current);
        const node = nullthrows(nodeRef.current);

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

        const node = nullthrows(nodeRef.current);
        const scrollNode = nullthrows(scrollNodeRef.current);

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

      const node = nullthrows(nodeRef.current);
      const scrollNode = nullthrows(scrollNodeRef.current);

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
      const node1 = nullthrows(maybeNode1);
      const node2 = nullthrows(maybeNode2);
      const scrollNode = nullthrows(scrollNodeRef.current);

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

        const scrollNode = nullthrows(scrollNodeRef.current);
        const node = nullthrows(nodeRef.current);

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
        const scrollNode = nullthrows(scrollNodeRef.current);
        const node = nullthrows(nodeRef.current);

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

        const node = nullthrows(nodeRef.current);
        const scrollNode = nullthrows(scrollNodeRef.current);

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
        const node1 = nullthrows(maybeNode1);
        const node2 = nullthrows(maybeNode2);
        const scrollNode = nullthrows(scrollNodeRef.current);

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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const rootNode = nullthrows(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: rootNode,
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const rootNode = nullthrows(rootRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const scrollNode = nullthrows(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: scrollNode,
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

          const node = nullthrows(nodeRef.current);
          const scrollNode = nullthrows(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: scrollNode,
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

          const node = nullthrows(nodeRef.current);
          const customRoot = nullthrows(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: customRoot,
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const rootNode = nullthrows(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: rootNode,
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

          const node = nullthrows(nodeRef.current);
          const scrollNode = nullthrows(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: scrollNode,
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const scrollNode = nullthrows(rootNodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
              root: scrollNode,
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

          const node = nullthrows(nodeRef.current);
          const intersectionObserverCallback = jest.fn();

          Fantom.runTask(() => {
            observer = new IntersectionObserver(intersectionObserverCallback, {
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

        const node = nullthrows(nodeRef.current);
        const scrollNode = nullthrows(scrollNodeRef.current);
        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
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
        const element = nullthrows(instance);
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
              observer.observe(nullthrows(nodeRef.current));
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

      const node = nullthrows(nodeRef.current);

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

        const node = nullthrows(nodeRef.current);

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
        const node = nullthrows(nodeRef.current);
        const scrollNode = nullthrows(scrollNodeRef.current);

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
        const node = nullthrows(nodeRef.current);
        const scrollNode = nullthrows(scrollNodeRef.current);

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

        const node = nullthrows(nodeRef.current);
        const scrollNode = nullthrows(scrollNodeRef.current);

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

      const node1 = nullthrows(node1Ref.current);

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

      const node1 = nullthrows(node1Ref.current);
      const node2 = nullthrows(node2Ref.current);

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

      const node1 = nullthrows(node1Ref.current);

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

      const node1 = nullthrows(node1Ref.current);
      const node2 = nullthrows(node2Ref.current);

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
      const node = nullthrows(nodeRef.current);
      const rootNode = nullthrows(rootRef.current);

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
      const node = nullthrows(nodeRef.current);
      const rootNode = nullthrows(rootRef.current);

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
      const node = nullthrows(nodeRef.current);
      const rootNode = nullthrows(rootRef.current);

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
      const node = nullthrows(nodeRef.current);
      const rootNode = nullthrows(rootRef.current);

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
        height: 60,
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
      expect(entries[0].intersectionRatio).toBe(0.6);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].target).toBe(node);
    });

    it('should apply rootMargin past a clipping ScrollView root', () => {
      const nodeRef = React.createRef<HostInstance>();
      const scrollNodeRef = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          // ScrollView's base style sets flexGrow: 1, which would otherwise
          // stretch it to the full viewport height and defeat the clipping.
          <ScrollView
            style={{width: 100, height: 100, flexGrow: 0}}
            ref={scrollNodeRef}>
            <View
              style={{width: 50, height: 50, marginTop: 150}}
              ref={nodeRef}
            />
          </ScrollView>,
        );
      });
      const node = nullthrows(nodeRef.current);
      const scrollNode = nullthrows(scrollNodeRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          root: scrollNode,
          rootMargin: '0px 0px 150px 0px',
          threshold: [0.01],
        });
        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries] = intersectionObserverCallback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(true);
      expect(entries[0].intersectionRatio).toBe(1);
      expectRectEquals(entries[0].rootBounds, {
        x: 0,
        y: 0,
        width: 100,
        height: 250,
      });
      expectRectEquals(entries[0].intersectionRect, {
        x: 0,
        y: 150,
        width: 50,
        height: 50,
      });
    });

    it('should still clip at an intermediate ScrollView when root is the viewport', () => {
      const nodeRef = React.createRef<HostInstance>();

      const root = Fantom.createRoot({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });
      Fantom.runTask(() => {
        root.render(
          <ScrollView style={{width: 100, height: 100, flexGrow: 0}}>
            <View
              style={{width: 50, height: 50, marginTop: 150}}
              ref={nodeRef}
            />
          </ScrollView>,
        );
      });
      const node = nullthrows(nodeRef.current);

      const intersectionObserverCallback = jest.fn();

      Fantom.runTask(() => {
        observer = new IntersectionObserver(intersectionObserverCallback, {
          rootMargin: '0px 0px 150px 0px',
          threshold: [0.01],
        });
        observer.observe(node);
      });

      expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
      const [entries] = intersectionObserverCallback.mock.lastCall;
      expect(entries.length).toBe(1);
      expect(entries[0].isIntersecting).toBe(false);
      expect(entries[0].intersectionRatio).toBe(0);
    });

    describe('targets fully clipped by an intermediate ScrollView', () => {
      // The target (150..200) is inside the 1000x1000 viewport but entirely
      // clipped by the 100x100 ScrollView. With a threshold of 0, even an
      // edge-adjacent intersection would count, so this checks that a fully
      // clipped target is not mistaken for one.
      function renderFullyClippedTarget(): HostInstance {
        const nodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView style={{width: 100, height: 100, flexGrow: 0}}>
              <View
                style={{width: 50, height: 50, marginTop: 150}}
                ref={nodeRef}
              />
            </ScrollView>,
          );
        });

        return nullthrows(nodeRef.current);
      }

      it('should not report them as intersecting with the default threshold', () => {
        const node = renderFullyClippedTarget();

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback);
          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries] = intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].intersectionRatio).toBe(0);
      });

      it('should not report them as intersecting with rootMargin', () => {
        const node = renderFullyClippedTarget();

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            rootMargin: '500px 0px',
          });
          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries] = intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].intersectionRatio).toBe(0);
      });
    });

    describe('scrollMargin', () => {
      // Same layout as the `rootMargin` cases above: a 100x100 ScrollView
      // clipping a 50x50 target that sits 150px down, entirely below the fold.
      // `rootMargin` cannot reach past an intermediate clipper, `scrollMargin`
      // can.
      function renderTargetBelowTheFoldOfAScrollView(
        marginTop: number = 150,
        scale: number = 1,
      ) {
        const nodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              style={{
                width: 100,
                height: 100,
                flexGrow: 0,
                margin: scale === 1 ? 0 : 100,
                transform: [{scale}],
              }}>
              <View style={{width: 50, height: 50, marginTop}} ref={nodeRef} />
            </ScrollView>,
          );
        });

        return nullthrows(nodeRef.current);
      }

      it('should see past an intermediate ScrollView', () => {
        const node = renderTargetBelowTheFoldOfAScrollView();

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            scrollMargin: '0px 0px 150px 0px',
            threshold: [0.01],
          });
          observer.observe(node);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries] = intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        expect(entries[0].isIntersecting).toBe(true);
        expect(entries[0].intersectionRatio).toBe(1);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 150,
          width: 50,
          height: 50,
        });
        // Unlike `rootMargin`, `scrollMargin` must not affect `rootBounds`.
        expectRectEquals(entries[0].rootBounds, {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        });
      });

      it('should partially reveal a target when the margin does not fully cover it', () => {
        const node = renderTargetBelowTheFoldOfAScrollView();

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            // Expands the scrollport's clip to 0..175, revealing the first
            // 25px of the target (which spans 150..200).
            scrollMargin: '0px 0px 75px 0px',
            threshold: [0.01],
          });
          observer.observe(node);
        });

        const [entries] = intersectionObserverCallback.mock.lastCall;
        expect(entries[0].isIntersecting).toBe(true);
        expect(entries[0].intersectionRatio).toBe(0.5);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 150,
          width: 50,
          height: 25,
        });
      });

      for (const scale of [0.5, 2]) {
        for (const {scrollMargin, marginTop, expectedRatio} of [
          {
            scrollMargin: '0px 0px 75px 0px',
            marginTop: 150,
            expectedRatio: 0.5,
          },
          {scrollMargin: '0% 0% 75% 0%', marginTop: 150, expectedRatio: 0.5},
          {
            scrollMargin: '0px 0px -20px 0px',
            marginTop: 60,
            expectedRatio: 0.4,
          },
          {scrollMargin: '0% 0% -20% 0%', marginTop: 60, expectedRatio: 0.4},
        ]) {
          it(`should apply ${scrollMargin} in scrollport coordinates at scale ${scale}`, () => {
            const node = renderTargetBelowTheFoldOfAScrollView(
              marginTop,
              scale,
            );
            const entry = observeAndGetEntry(node, {scrollMargin});

            expect(entry.isIntersecting).toBe(true);
            expect(entry.intersectionRatio).toBe(expectedRatio);
          });
        }
      }

      it('should not reveal a target still beyond the expanded clip', () => {
        const node = renderTargetBelowTheFoldOfAScrollView();

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            // Expands the clip to 0..125, still short of the target at 150.
            scrollMargin: '0px 0px 25px 0px',
            threshold: [0.01],
          });
          observer.observe(node);
        });

        const [entries] = intersectionObserverCallback.mock.lastCall;
        expect(entries[0].isIntersecting).toBe(false);
        expect(entries[0].intersectionRatio).toBe(0);
      });

      it('should resolve percentages against the scrollport, not the root', () => {
        const node = renderTargetBelowTheFoldOfAScrollView();

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            // 60% of the 100px scrollport is 60px, expanding its clip to
            // 0..160 and revealing 10px of the target. Were this resolved
            // against the 1000px viewport it would reveal the target entirely.
            scrollMargin: '0% 0% 60% 0%',
            threshold: [0.01],
          });
          observer.observe(node);
        });

        const [entries] = intersectionObserverCallback.mock.lastCall;
        expect(entries[0].isIntersecting).toBe(true);
        expect(entries[0].intersectionRatio).toBe(0.2);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 150,
          width: 50,
          height: 10,
        });
      });

      it('should contract the scrollport clip with negative values', () => {
        // Target spans 60..110, so the unmodified scrollport clips it to
        // 60..100 (80% visible).
        const node = renderTargetBelowTheFoldOfAScrollView(60);

        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            // Contracts the clip to 0..80, leaving only 60..80 visible.
            scrollMargin: '0px 0px -20px 0px',
            threshold: [0.01],
          });
          observer.observe(node);
        });

        const [entries] = intersectionObserverCallback.mock.lastCall;
        expect(entries[0].isIntersecting).toBe(true);
        expect(entries[0].intersectionRatio).toBe(0.4);
        expectRectEquals(entries[0].intersectionRect, {
          x: 0,
          y: 60,
          width: 50,
          height: 20,
        });
      });

      function observeAndGetEntry(
        target: HostInstance,
        options: {
          root?: HostInstance,
          rootMargin?: string,
          scrollMargin?: string,
        },
      ): {
        readonly isIntersecting: boolean,
        readonly intersectionRatio: number,
        readonly intersectionRect: DOMRectReadOnly,
        readonly rootBounds: ?DOMRectReadOnly,
        ...
      } {
        const intersectionObserverCallback = jest.fn();

        Fantom.runTask(() => {
          observer = new IntersectionObserver(intersectionObserverCallback, {
            threshold: [0.01],
            ...options,
          });
          observer.observe(target);
        });

        expect(intersectionObserverCallback).toHaveBeenCalledTimes(1);
        const [entries] = intersectionObserverCallback.mock.lastCall;
        expect(entries.length).toBe(1);
        return entries[0];
      }

      describe('non-scroll containers', () => {
        it('should not apply negative values to the clip of `overflow: visible` ancestors', () => {
          const nodeRef = React.createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });
          Fantom.runTask(() => {
            root.render(
              <View style={{width: 200, height: 200}}>
                <View
                  style={{width: 50, height: 50, marginTop: 20, marginLeft: 20}}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          // There are no scroll containers between the target and the root,
          // so per spec `scrollMargin` must have no effect at all.
          const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
            scrollMargin: '-10px',
          });

          expect(entry.isIntersecting).toBe(true);
          expect(entry.intersectionRatio).toBe(1);
          expectRectEquals(entry.intersectionRect, {
            x: 20,
            y: 20,
            width: 50,
            height: 50,
          });
        });

        it('should not apply negative values to `overflow: visible` ancestors inside a scroll container', () => {
          const nodeRef = React.createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });
          Fantom.runTask(() => {
            root.render(
              <ScrollView style={{width: 100, height: 100, flexGrow: 0}}>
                <View style={{width: 50, height: 50, marginTop: 20}}>
                  <View style={{width: 50, height: 50}} ref={nodeRef} />
                </View>
              </ScrollView>,
            );
          });

          // Contracts only the scrollport's clip to 10..100, which still
          // contains the target at 20..70. The wrapping view is not a scroll
          // container and must not be contracted.
          const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
            scrollMargin: '-10px 0px 0px 0px',
          });

          expect(entry.isIntersecting).toBe(true);
          expect(entry.intersectionRatio).toBe(1);
          expectRectEquals(entry.intersectionRect, {
            x: 0,
            y: 20,
            width: 50,
            height: 50,
          });
        });

        it('should not apply to the target itself, even if it is a scroll container', () => {
          const nodeRef = React.createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });
          Fantom.runTask(() => {
            root.render(
              <ScrollView
                style={{
                  width: 50,
                  height: 50,
                  flexGrow: 0,
                  marginTop: 20,
                  marginLeft: 20,
                  overflow: 'hidden',
                }}
                ref={nodeRef}
              />,
            );
          });

          // The spec starts the clipping walk at the target's containing
          // block, so the target's own clip is never dilated.
          const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
            scrollMargin: '-10px',
          });

          expect(entry.isIntersecting).toBe(true);
          expect(entry.intersectionRatio).toBe(1);
          expectRectEquals(entry.intersectionRect, {
            x: 20,
            y: 20,
            width: 50,
            height: 50,
          });
        });

        it('should not dilate non-scrollable `overflow: hidden` ancestors', () => {
          const nodeRef = React.createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });
          Fantom.runTask(() => {
            root.render(
              <View style={{width: 100, height: 100, overflow: 'hidden'}}>
                <View
                  style={{width: 50, height: 50, marginTop: 150}}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
            scrollMargin: '0px 0px 75px 0px',
          });

          expect(entry.isIntersecting).toBe(false);
          expect(entry.intersectionRatio).toBe(0);
          expectRectEquals(entry.intersectionRect, {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          });
        });

        it('should keep a non-scrollable hidden clip unchanged with negative scrollMargin', () => {
          const nodeRef = React.createRef<HostInstance>();
          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });
          Fantom.runTask(() => {
            root.render(
              <View style={{width: 100, height: 100, overflow: 'hidden'}}>
                <View
                  style={{width: 50, height: 50, marginTop: 60}}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
            scrollMargin: '0px 0px -20px 0px',
          });

          expect(entry.isIntersecting).toBe(true);
          expect(entry.intersectionRatio).toBe(0.8);
          expectRectEquals(entry.intersectionRect, {
            x: 0,
            y: 60,
            width: 50,
            height: 40,
          });
        });

        it('should update clipping when an ancestor changes its overflow', () => {
          const nodeRef = React.createRef<HostInstance>();
          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });
          const render = (overflow: 'visible' | 'hidden') => {
            Fantom.runTask(() => {
              root.render(
                <View style={{width: 100, height: 100, overflow}}>
                  <View
                    style={{width: 50, height: 50, marginTop: 150}}
                    ref={nodeRef}
                  />
                </View>,
              );
            });
          };
          render('hidden');
          const callback = jest.fn();
          Fantom.runTask(() => {
            observer = new IntersectionObserver(callback, {
              scrollMargin: '500px',
            });
            observer.observe(nullthrows(nodeRef.current));
          });
          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.lastCall[0][0].isIntersecting).toBe(false);

          render('visible');
          expect(callback).toHaveBeenCalledTimes(2);
          expect(callback.mock.lastCall[0][0].isIntersecting).toBe(true);
          expect(callback.mock.lastCall[0][0].intersectionRatio).toBe(1);

          render('hidden');
          expect(callback).toHaveBeenCalledTimes(3);
          expect(callback.mock.lastCall[0][0].isIntersecting).toBe(false);
        });
      });

      describe('explicit root', () => {
        function renderTargetBelowTheFoldOfAScrollViewRoot(): {
          scrollNode: HostInstance,
          node: HostInstance,
        } {
          const scrollNodeRef = React.createRef<HostInstance>();
          const nodeRef = React.createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });
          Fantom.runTask(() => {
            root.render(
              <ScrollView
                style={{width: 100, height: 100, flexGrow: 0}}
                ref={scrollNodeRef}>
                <View
                  style={{width: 50, height: 50, marginTop: 150}}
                  ref={nodeRef}
                />
              </ScrollView>,
            );
          });

          return {
            scrollNode: nullthrows(scrollNodeRef.current),
            node: nullthrows(nodeRef.current),
          };
        }

        it('should apply to a scrollable root', () => {
          const {scrollNode, node} =
            renderTargetBelowTheFoldOfAScrollViewRoot();

          // Per spec, both `rootMargin` and `scrollMargin` apply to a
          // scrollable root. Expands the root's clip to 0..175.
          const entry = observeAndGetEntry(node, {
            root: scrollNode,
            scrollMargin: '0px 0px 75px 0px',
          });

          expect(entry.isIntersecting).toBe(true);
          expect(entry.intersectionRatio).toBe(0.5);
          expectRectEquals(entry.intersectionRect, {
            x: 0,
            y: 150,
            width: 50,
            height: 25,
          });
          // `rootBounds` is the root intersection rectangle, which only
          // `rootMargin` dilates.
          expectRectEquals(nullthrows(entry.rootBounds), {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          });
        });

        it('should combine with rootMargin on a scrollable root, resolving both against the undilated root', () => {
          const {scrollNode, node} =
            renderTargetBelowTheFoldOfAScrollViewRoot();

          // rootMargin adds 40px and scrollMargin 25% of the undilated 100px
          // root (25px), so the clip is 0..165. Resolving the percentage
          // against the rootMargin-dilated root (140px) would give 0..175.
          const entry = observeAndGetEntry(node, {
            root: scrollNode,
            rootMargin: '0px 0px 40px 0px',
            scrollMargin: '0% 0% 25% 0%',
          });

          expect(entry.isIntersecting).toBe(true);
          expect(entry.intersectionRatio).toBe(0.3);
          expectRectEquals(entry.intersectionRect, {
            x: 0,
            y: 150,
            width: 50,
            height: 15,
          });
          expectRectEquals(nullthrows(entry.rootBounds), {
            x: 0,
            y: 0,
            width: 100,
            height: 140,
          });
        });

        it('should not apply to a non-scrollable clipping root', () => {
          const rootNodeRef = React.createRef<HostInstance>();
          const nodeRef = React.createRef<HostInstance>();

          const root = Fantom.createRoot({
            viewportWidth: 1000,
            viewportHeight: 1000,
          });
          Fantom.runTask(() => {
            root.render(
              <View
                style={{width: 100, height: 100, overflow: 'hidden'}}
                ref={rootNodeRef}>
                <View
                  style={{width: 50, height: 50, marginTop: 150}}
                  ref={nodeRef}
                />
              </View>,
            );
          });

          const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
            root: nullthrows(rootNodeRef.current),
            scrollMargin: '0px 0px 75px 0px',
          });

          expect(entry.isIntersecting).toBe(false);
          expect(entry.intersectionRatio).toBe(0);
        });
      });

      it('should apply to every scroll container between the root and the target', () => {
        const nodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView style={{width: 100, height: 100, flexGrow: 0}}>
              <ScrollView style={{width: 100, height: 100, flexGrow: 0}}>
                <View
                  style={{width: 50, height: 50, marginTop: 150}}
                  ref={nodeRef}
                />
              </ScrollView>
            </ScrollView>,
          );
        });

        // Both scrollports span 0..100. Each must expand to 0..175 for the
        // target to be revealed: if either were not dilated, its 0..100 clip
        // would hide the target entirely.
        const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
          scrollMargin: '0px 0px 75px 0px',
        });

        expect(entry.isIntersecting).toBe(true);
        expect(entry.intersectionRatio).toBe(0.5);
        expectRectEquals(entry.intersectionRect, {
          x: 0,
          y: 150,
          width: 50,
          height: 25,
        });
      });

      it('should preserve scroll-container behavior through prop updates and disabled user scrolling', () => {
        const nodeRef = React.createRef<HostInstance>();
        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });

        for (const scrollEnabled of [true, false]) {
          Fantom.runTask(() => {
            root.render(
              <ScrollView
                scrollEnabled={scrollEnabled}
                style={{width: 100, height: 100, flexGrow: 0}}>
                <View
                  style={{width: 50, height: 50, marginTop: 150}}
                  ref={nodeRef}
                />
              </ScrollView>,
            );
          });
          const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
            scrollMargin: '0px 0px 75px 0px',
          });
          expect(entry.isIntersecting).toBe(true);
          expect(entry.intersectionRatio).toBe(0.5);
          observer.disconnect();
        }
      });

      it('should apply to the horizontal edges', () => {
        const nodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              horizontal
              style={{width: 100, height: 100, flexGrow: 0}}>
              <View
                style={{width: 50, height: 50, marginLeft: 150}}
                ref={nodeRef}
              />
            </ScrollView>,
          );
        });

        // Expands the scrollport's clip to 0..175 horizontally.
        const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
          scrollMargin: '0px 75px 0px 0px',
        });

        expect(entry.isIntersecting).toBe(true);
        expect(entry.intersectionRatio).toBe(0.5);
        expectRectEquals(entry.intersectionRect, {
          x: 150,
          y: 0,
          width: 25,
          height: 50,
        });
      });

      it('should reveal a target scrolled above the scrollport through the top edge', () => {
        const scrollNodeRef = React.createRef<HostInstance>();
        const nodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot({
          viewportWidth: 1000,
          viewportHeight: 1000,
        });
        Fantom.runTask(() => {
          root.render(
            <ScrollView
              style={{width: 100, height: 100, flexGrow: 0, marginTop: 100}}
              ref={scrollNodeRef}>
              <View
                style={{width: 50, height: 50, marginTop: 150}}
                ref={nodeRef}
              />
              <View style={{height: 500}} />
            </ScrollView>,
          );
        });

        // The scrollport spans 100..200 in the viewport. Scrolling by 200
        // moves the target (150..200 in the content) to 50..100, just above
        // it.
        Fantom.scrollTo(nullthrows(scrollNodeRef.current), {
          x: 0,
          y: 200,
        });

        // Expands the scrollport's clip to 75..200.
        const entry = observeAndGetEntry(nullthrows(nodeRef.current), {
          scrollMargin: '25px 0px 0px 0px',
        });

        expect(entry.isIntersecting).toBe(true);
        expect(entry.intersectionRatio).toBe(0.5);
        expectRectEquals(entry.intersectionRect, {
          x: 0,
          y: 75,
          width: 50,
          height: 25,
        });
      });

      it('should compose with rootMargin on the implicit root', () => {
        const node = renderTargetBelowTheFoldOfAScrollView();

        // scrollMargin expands the scrollport's clip to 0..250, revealing the
        // whole target (150..200), but rootMargin contracts the root to
        // 0..160, so only 150..160 is intersecting.
        const entry = observeAndGetEntry(node, {
          rootMargin: '0px 0px -840px 0px',
          scrollMargin: '0px 0px 150px 0px',
        });

        expect(entry.isIntersecting).toBe(true);
        expect(entry.intersectionRatio).toBe(0.2);
        expectRectEquals(entry.intersectionRect, {
          x: 0,
          y: 150,
          width: 50,
          height: 10,
        });
        expectRectEquals(nullthrows(entry.rootBounds), {
          x: 0,
          y: 0,
          width: 1000,
          height: 160,
        });
      });
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

      const node = nullthrows(nodeRef.current);
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

      const node = nullthrows(nodeRef.current);
      const scrollNode = nullthrows(scrollNodeRef.current);

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

      const node = nullthrows(nodeRef.current);

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

      const node = nullthrows(nodeRef.current);

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

      const node = nullthrows(nodeRef.current);

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

      const scrollNode = nullthrows(scrollNodeRef.current);

      // Scroll such that view is not intersecting with ScrollView
      Fantom.scrollTo(scrollNode, {
        x: 0,
        y: 100,
      });

      const node = nullthrows(nodeRef.current);

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
      const node1 = nullthrows(maybeNode1);
      const node2 = nullthrows(maybeNode2);

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

      const node = nullthrows(nodeRef.current);

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

  it('should keep entry ratios stable after later scrolling updates', () => {
    const scrollRef = createRef<HostInstance>();
    const targetRef = createRef<HostInstance>();
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 200});
    const callback = jest.fn();
    Fantom.runTask(() => {
      root.render(
        <ScrollView ref={scrollRef}>
          <View ref={targetRef} style={{width: 100, height: 100}} />
          <View style={{width: 100, height: 1000}} />
        </ScrollView>,
      );
    });
    Fantom.runTask(() => {
      observer = new IntersectionObserver(callback, {threshold: [0, 0.5, 1]});
      observer.observe(nullthrows(targetRef.current));
    });
    const initialEntry = callback.mock.lastCall[0][0];
    Fantom.scrollTo(nullthrows(scrollRef.current), {x: 0, y: 50});
    const updatedEntry = callback.mock.lastCall[0][0];
    expect(callback).toHaveBeenCalledTimes(2);
    for (let i = 0; i < 2; i++) {
      expect(initialEntry.intersectionRatio).toBe(1);
      expect(initialEntry.rnRootIntersectionRatio).toBe(0.5);
      expect(updatedEntry.intersectionRatio).toBe(0.5);
      expect(updatedEntry.rnRootIntersectionRatio).toBe(0.25);
    }
    Fantom.runTask(() => observer.disconnect());
    root.destroy();
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
      const node1 = nullthrows(maybeNode1);
      const node2 = nullthrows(maybeNode2);

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

      const node = nullthrows(nodeRef.current);

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
