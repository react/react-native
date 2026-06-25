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

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from '../../../src/private/webapis/dom/nodes/ReactNativeElement';
import View from '../../Components/View/View';
import useRefEffect from '../useRefEffect';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

type RegistryEntry = {kind: 'effect' | 'cleanup', name: string, key: ?string};

/**
 * TestView provide a component execution environment to test hooks.
 */
function TestView({
  childKey = null,
  effect,
}: {
  childKey: ?string,
  effect: (?HostInstance) => (() => void) | void,
}) {
  const ref = useRefEffect<?HostInstance>(effect);
  return <View key={childKey} ref={ref} id={childKey ?? undefined} />;
}

function keyOf(instance: ?HostInstance): ?string {
  if (instance == null) {
    return null;
  }
  return ensureInstance(instance, ReactNativeElement).id;
}

function effectEntry(name: string, key: ?string): RegistryEntry {
  return {kind: 'effect', name, key};
}

function cleanupEntry(name: string, key: ?string): RegistryEntry {
  return {kind: 'cleanup', name, key};
}

function mockEffectRegistry(): {
  mockEffect: string => (?HostInstance) => () => void,
  mockEffectWithoutCleanup: string => (?HostInstance) => void,
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

  expect(registry).toEqual([effectEntry('A', 'foo')]);
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
