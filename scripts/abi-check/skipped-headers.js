/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {Platform} from './dump';

export type SkippedHeader = {
  platform: Platform,
  /** The include path, as written in `#include <...>`. */
  header: string,
  /** Why the header does not compile in a published layout. */
  reason: string,
  /**
   * The release versions the entry applies to: it applies when the base or
   * the current version is one of them. Without it, it applies to all.
   */
  versions?: ReadonlyArray<string>,
};

const FLATTENED = 'iOS prebuild flattens subfolders (headers.js basename rule)';
const ANDROID_ONLY = 'Android-only header shipped in iOS package';
const MISSING_INCLUDE = 'missing include';
const PREFAB_0_87 =
  '0.87.1 prefab layout: text/platform/android is not on the include root';
const IMAGEMANAGER_PREFAB =
  'prefab layout: imagemanager/platform/cxx, not platform/android, is on the include root';

/**
 * Stable API headers that do not compile in a published layout. The ABI
 * check drops them from both sides; any other header that does not compile
 * fails the check. An entry without `versions` skips its header in every
 * comparison, also with versions where it compiles. Remove an entry when its
 * cause is fixed in every version the check compares with.
 */
const SKIPPED_HEADERS: ReadonlyArray<SkippedHeader> = [
  ...[
    'AnimatedModule.h',
    'AnimationDriver.h',
    'DecayAnimationDriver.h',
    'FrameAnimationDriver.h',
    'InterpolationAnimatedNode.h',
    'NativeAnimatedNodesManager.h',
    'NativeAnimatedNodesManagerProvider.h',
    'PropsAnimatedNode.h',
    'RoundAnimatedNode.h',
    'SpringAnimationDriver.h',
  ].map((name): SkippedHeader => ({
    platform: 'ios',
    header: `react/renderer/animated/${name}`,
    reason: FLATTENED,
  })),
  {
    platform: 'ios',
    header: 'react/renderer/mounting/StubViewTree.h',
    reason: FLATTENED,
  },
  {
    platform: 'ios',
    header: 'react/renderer/mounting/stubs.h',
    reason: FLATTENED,
  },
  ...[
    'AndroidTextInputComponentDescriptor.h',
    'AndroidTextInputProps.h',
    'AndroidTextInputShadowNode.h',
  ].map((name): SkippedHeader => ({
    platform: 'ios',
    header: `react/renderer/components/textinput/${name}`,
    reason: ANDROID_ONLY,
  })),
  {
    platform: 'ios',
    header: 'react/renderer/components/iostextinput/propsConversions.h',
    reason: MISSING_INCLUDE,
  },
  {
    platform: 'ios',
    header: 'react/renderer/scheduler/InspectorData.h',
    reason: MISSING_INCLUDE,
  },
  ...[
    'ParagraphComponentDescriptor.h',
    'ParagraphProps.h',
    'ParagraphShadowNode.h',
    'SelectableParagraphComponentDescriptor.h',
    'SelectableParagraphShadowNode.h',
    'stateConversions.h',
  ].map((name): SkippedHeader => ({
    platform: 'android',
    header: `react/renderer/components/text/${name}`,
    reason: PREFAB_0_87,
    versions: ['0.87.1'],
  })),
  ...['ImageFetcher.h', 'conversions.h'].map((name): SkippedHeader => ({
    platform: 'android',
    header: `react/renderer/imagemanager/platform/android/react/renderer/imagemanager/${name}`,
    reason: IMAGEMANAGER_PREFAB,
  })),
  {
    platform: 'android',
    header: 'react/renderer/scheduler/InspectorData.h',
    reason: MISSING_INCLUDE,
    versions: ['0.87.1'],
  },
];

module.exports = {SKIPPED_HEADERS};
