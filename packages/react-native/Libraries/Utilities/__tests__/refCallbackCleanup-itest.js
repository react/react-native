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

import type {HostInstance} from '../../../src/private/types/HostInstance';

import View from '../../Components/View/View';
import useMergeRefs from '../useMergeRefs';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

type RegistryEntry = {kind: 'effect' | 'cleanup', name: string, key: ?string};

/**
 * TestView provide a component execution environment to test ref lifecycle.
 */
function TestView({
  childKey = null,
  effect,
}: {
  childKey: ?string,
  effect: React.RefSetter<HostInstance>,
}) {
  return <View key={childKey} ref={effect} id={childKey ?? undefined} />;
}

function keyOf(instance: ?HostInstance): ?string {
  if (instance == null) {
    return null;
  }
  return instance.id;
}

function effectEntry(name: string, key: ?string): RegistryEntry {
  return {kind: 'effect', name, key};
}

function cleanupEntry(name: string, key: ?string): RegistryEntry {
  return {kind: 'cleanup', name, key};
}

function mockEffectRegistry(): {
  mockEffect: string => React.RefSetter<HostInstance>,
  mockEffectThatThrows: string => React.RefSetter<HostInstance>,
  mockEffectWithoutCleanup: string => React.RefSetter<HostInstance>,
  registry: Array<RegistryEntry>,
} {
  const registry: Array<RegistryEntry> = [];
  return {
    mockEffect(name: string): (?HostInstance) => () => void {
      return instance => {
        const key = keyOf(instance);
        registry.push(effectEntry(name, key));
        return () => {
          registry.push(cleanupEntry(name, key));
        };
      };
    },
    mockEffectThatThrows(name: string): (?HostInstance) => void {
      return instance => {
        const key = keyOf(instance);
        registry.push(effectEntry(name, key));
        if (instance != null) {
          throw new Error(`${name} failed`);
        }
      };
    },
    mockEffectWithoutCleanup(name: string): (?HostInstance) => void {
      return instance => {
        const key = keyOf(instance);
        registry.push(effectEntry(name, key));
      };
    },
    registry,
  };
}

test('calls effect without cleanup', () => {
  const root = Fantom.createRoot();

  const {mockEffectWithoutCleanup, registry} = mockEffectRegistry();
  const effectA = mockEffectWithoutCleanup('A');

  Fantom.runTask(() => {
    root.render(<TestView childKey="foo" effect={effectA} />);
  });

  expect(registry).toEqual([effectEntry('A', 'foo')]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(registry).toEqual([effectEntry('A', 'foo'), effectEntry('A', null)]);
});

test('calls effect with null when it throws', () => {
  const root = Fantom.createRoot();

  const {mockEffectThatThrows, registry} = mockEffectRegistry();
  const effectA = mockEffectThatThrows('A');

  Fantom.runTask(() => {
    root.render(<TestView childKey="foo" effect={effectA} />);
  });

  // A cleanup is only adopted from an effect that returns normally, so React
  // detaches by invoking the effect again with null.
  expect(registry).toEqual([effectEntry('A', 'foo'), effectEntry('A', null)]);
});

test('calls effect and cleanup', () => {
  const root = Fantom.createRoot();

  const {mockEffect, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');

  Fantom.runTask(() => {
    root.render(<TestView childKey="foo" effect={effectA} />);
  });

  expect(registry).toEqual([effectEntry('A', 'foo')]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(registry).toEqual([effectEntry('A', 'foo'), cleanupEntry('A', 'foo')]);
});

test('cleans up old effect before calling new effect', () => {
  const root = Fantom.createRoot();

  const {mockEffect, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');
  const effectB = mockEffect('B');

  Fantom.runTask(() => {
    root.render(<TestView childKey="foo" effect={effectA} />);
  });

  Fantom.runTask(() => {
    root.render(<TestView childKey="foo" effect={effectB} />);
  });

  expect(registry).toEqual([
    effectEntry('A', 'foo'),
    cleanupEntry('A', 'foo'),
    effectEntry('B', 'foo'),
  ]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(registry).toEqual([
    effectEntry('A', 'foo'),
    cleanupEntry('A', 'foo'),
    effectEntry('B', 'foo'),
    cleanupEntry('B', 'foo'),
  ]);
});

test('calls cleanup and effect on new instance', () => {
  const root = Fantom.createRoot();

  const {mockEffect, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');

  Fantom.runTask(() => {
    root.render(<TestView childKey="foo" effect={effectA} />);
  });

  Fantom.runTask(() => {
    root.render(<TestView childKey="bar" effect={effectA} />);
  });

  expect(registry).toEqual([
    effectEntry('A', 'foo'),
    cleanupEntry('A', 'foo'),
    effectEntry('A', 'bar'),
  ]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(registry).toEqual([
    effectEntry('A', 'foo'),
    cleanupEntry('A', 'foo'),
    effectEntry('A', 'bar'),
    cleanupEntry('A', 'bar'),
  ]);
});

test('useMergeRefs correctly combines different ref handler types', () => {
  const root = Fantom.createRoot();

  const {mockEffect, mockEffectWithoutCleanup, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');
  const effectB = mockEffectWithoutCleanup('B');

  function ComponentUsingMergeRefs() {
    const mergedRef = useMergeRefs(effectA, effectB);
    return <TestView childKey="foo" effect={mergedRef} />;
  }

  Fantom.runTask(() => {
    root.render(<ComponentUsingMergeRefs />);
  });

  expect(registry).toEqual([effectEntry('A', 'foo'), effectEntry('B', 'foo')]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(registry).toEqual([
    effectEntry('A', 'foo'),
    effectEntry('B', 'foo'),
    cleanupEntry('A', 'foo'),
    effectEntry('B', null),
  ]);
});

test('cleans up old effect before calling new effect with new instance', () => {
  const root = Fantom.createRoot();

  const {mockEffect, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');
  const effectB = mockEffect('B');

  Fantom.runTask(() => {
    root.render(<TestView childKey="foo" effect={effectA} />);
  });

  Fantom.runTask(() => {
    root.render(<TestView childKey="bar" effect={effectB} />);
  });

  expect(registry).toEqual([
    effectEntry('A', 'foo'),
    cleanupEntry('A', 'foo'),
    effectEntry('B', 'bar'),
  ]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(registry).toEqual([
    effectEntry('A', 'foo'),
    cleanupEntry('A', 'foo'),
    effectEntry('B', 'bar'),
    cleanupEntry('B', 'bar'),
  ]);
});
