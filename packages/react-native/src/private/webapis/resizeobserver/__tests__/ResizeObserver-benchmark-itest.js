/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableResizeObserverByDefault:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type ResizeObserverType from '../ResizeObserver';
import type ResizeObserverEntryType from '../ResizeObserverEntry';
import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';

declare const ResizeObserver: Class<ResizeObserverType>;

for (const count of [1, 100, 1000]) {
  const root = Fantom.createRoot({viewportWidth: 200, viewportHeight: 200});
  const refs = Array.from({length: count}, () => createRef<HostInstance>());
  let observers: Array<ResizeObserverType> = [];
  let entriesDelivered = 0;
  let callbacksDelivered = 0;
  let width = 200;
  let height = 200;

  beforeAll(() => {
    Fantom.runTask(() => {
      root.render(
        <View style={{flex: 1}}>
          {refs.map((ref, index) => (
            <View
              key={index}
              ref={ref}
              collapsable={false}
              style={{position: 'absolute', width: '50%', height: 10}}
            />
          ))}
        </View>,
      );
    });
  });

  afterAll(() => {
    root.destroy();
  });

  function observeTargets(oneObserverPerTarget: boolean = false): void {
    entriesDelivered = 0;
    callbacksDelivered = 0;
    const callback = (entries: ReadonlyArray<ResizeObserverEntryType>) => {
      entriesDelivered += entries.length;
      callbacksDelivered++;
      for (const entry of entries) {
        if (entry.contentBoxSize[0].inlineSize !== width / 2) {
          throw new Error('Unexpected observed width');
        }
      }
    };
    Fantom.runTask(() => {
      if (oneObserverPerTarget) {
        observers = refs.map(ref => {
          const observer = new ResizeObserver(callback);
          observer.observe(nullthrows(ref.current));
          return observer;
        });
      } else {
        const observer = new ResizeObserver(callback);
        observers = [observer];
        for (const ref of refs) {
          observer.observe(nullthrows(ref.current));
        }
      }
    });
    expect(entriesDelivered).toBe(count);
    entriesDelivered = 0;
    callbacksDelivered = 0;
  }

  function disconnectTargets(): void {
    Fantom.runTask(() => {
      for (const observer of observers) {
        observer.disconnect();
      }
    });
    observers = [];
  }

  Fantom.unstable_benchmark
    .suite(`ResizeObserver (${count} targets)`, {
      minIterations: 100,
      minTestExecutionTimeMs: 500,
      minWarmupIterations: 20,
    })
    .test('unrelated surface resize / no observers', () => {
      height = height === 200 ? 201 : 200;
      Fantom.runTask(() => root.updateSurfaceConstraints(width, height));
    })
    .test('idle task', () => Fantom.runTask(() => {}), {
      beforeAll: () => observeTargets(),
      afterAll: disconnectTargets,
      afterEach: () => expect(entriesDelivered).toBe(0),
    })
    .test(
      'unrelated surface resize',
      () => {
        height = height === 200 ? 201 : 200;
        Fantom.runTask(() => root.updateSurfaceConstraints(width, height));
      },
      {
        beforeAll: () => observeTargets(),
        afterAll: disconnectTargets,
        afterEach: () => expect(entriesDelivered).toBe(0),
      },
    )
    .test(
      'resize / one observer',
      () => {
        width = width === 200 ? 202 : 200;
        Fantom.runTask(() => root.updateSurfaceConstraints(width, height));
      },
      {
        beforeAll: () => observeTargets(),
        afterAll: disconnectTargets,
        beforeEach: () => {
          entriesDelivered = 0;
          callbacksDelivered = 0;
        },
        afterEach: () => {
          expect(entriesDelivered).toBe(count);
          expect(callbacksDelivered).toBe(1);
        },
      },
    )
    .test(
      'resize / one observer per target',
      () => {
        width = width === 200 ? 202 : 200;
        Fantom.runTask(() => root.updateSurfaceConstraints(width, height));
      },
      {
        beforeAll: () => observeTargets(true),
        afterAll: disconnectTargets,
        beforeEach: () => {
          entriesDelivered = 0;
          callbacksDelivered = 0;
        },
        afterEach: () => {
          expect(entriesDelivered).toBe(count);
          expect(callbacksDelivered).toBe(count);
        },
      },
    );

  Fantom.unstable_benchmark
    .suite(`ResizeObserver teardown (${count} targets)`, {
      minIterations: 200,
      minWarmupIterations: 20,
    })
    .test('disconnect / last observer', disconnectTargets, {
      beforeEach: () => observeTargets(),
      afterEach: () => {
        entriesDelivered = 0;
        width = width === 200 ? 202 : 200;
        Fantom.runTask(() => root.updateSurfaceConstraints(width, height));
        expect(entriesDelivered).toBe(0);
      },
    });
}

const sparseRoot = Fantom.createRoot({viewportWidth: 200, viewportHeight: 200});
const sparseRefs = Array.from({length: 32}, () => createRef<HostInstance>());
let sparseObserver: ?ResizeObserverType;
let sparseHeight = 200;
let sparseDeliveries = 0;

beforeAll(() => {
  Fantom.runTask(() => {
    sparseRoot.render(
      <View style={{flex: 1}}>
        {sparseRefs.map((ref, index) => (
          <View
            key={`observed-${index}`}
            ref={ref}
            style={{width: 10, height: 10}}
          />
        ))}
        {Array.from({length: 9968}, (_, index) => (
          <View
            key={`unobserved-${index}`}
            collapsable={false}
            style={{width: 10, height: 10}}
          />
        ))}
      </View>,
    );
  });
});
afterAll(() => sparseRoot.destroy());

Fantom.unstable_benchmark
  .suite('ResizeObserver sparse surface (32 of 10000 targets)', {
    minIterations: 100,
    minWarmupIterations: 20,
  })
  .test(
    'unrelated surface resize',
    () => {
      sparseHeight = sparseHeight === 200 ? 201 : 200;
      Fantom.runTask(() =>
        sparseRoot.updateSurfaceConstraints(200, sparseHeight),
      );
    },
    {
      beforeAll: () => {
        Fantom.runTask(() => {
          sparseObserver = new ResizeObserver(entries => {
            sparseDeliveries += entries.length;
          });
          for (const ref of sparseRefs) {
            nullthrows(sparseObserver).observe(nullthrows(ref.current));
          }
        });
        expect(sparseDeliveries).toBe(32);
        sparseDeliveries = 0;
      },
      afterEach: () => expect(sparseDeliveries).toBe(0),
      afterAll: () =>
        Fantom.runTask(() => nullthrows(sparseObserver).disconnect()),
    },
  );
