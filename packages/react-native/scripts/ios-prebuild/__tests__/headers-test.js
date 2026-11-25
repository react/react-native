/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {getHeaderFilesFromPodspecs} = require('../headers');
const path = require('node:path');

const reactNativeRoot = path.resolve(__dirname, '../../..');
const rendererSourceDir = path.join(
  reactNativeRoot,
  'ReactCommon/react/renderer',
);

const headers = Object.values(
  getHeaderFilesFromPodspecs(reactNativeRoot),
).flatMap(headerMaps => headerMaps.flatMap(headerMap => headerMap.headers));
const targets = new Set(headers.map(header => header.target));

function targetsOf(rendererRelativeSource /*: string */) /*: Array<string> */ {
  const source = path.join(rendererSourceDir, rendererRelativeSource);
  return headers
    .filter(header => header.source === source)
    .map(header => header.target);
}

describe('prebuilt header layout', () => {
  test.each([
    'animated/nodes/AnimatedNode.h',
    'animated/internal/primitives.h',
    'animated/drivers/AnimationDriver.h',
    'animated/event_drivers/EventAnimationDriver.h',
    'mounting/stubs/stubs.h',
    'mounting/internal/CullingContext.h',
  ])('%s keeps its subfolder', nestedHeader => {
    const nestedTarget = `react/renderer/${nestedHeader}`;
    const flattenedTarget = path.join(
      path.dirname(path.dirname(nestedTarget)),
      path.basename(nestedTarget),
    );

    expect(targetsOf(nestedHeader)).toEqual([nestedTarget]);
    expect(targets.has(flattenedTarget)).toBe(false);
  });

  test.each(['animated/AnimatedModule.h', 'mounting/MountingCoordinator.h'])(
    'top-level %s stays in place',
    header => {
      expect(targetsOf(header)).toEqual([`react/renderer/${header}`]);
    },
  );

  test.each([
    'intersection/IntersectionObserverManager.h',
    'mutation/MutationObserverManager.h',
    'resize/ResizeObserverManager.h',
  ])('observers/%s is shipped', observerHeader => {
    expect(targetsOf(`observers/${observerHeader}`)).toEqual([
      `react/renderer/observers/${observerHeader}`,
    ]);
  });

  test('no Android text input header is shipped', () => {
    const androidTextInputDir = path.join(
      rendererSourceDir,
      'components/textinput/platform/android',
    );

    expect(
      headers
        .map(header => header.source)
        .filter(source => source.startsWith(androidTextInputDir + path.sep)),
    ).toEqual([]);
  });

  test('view platform headers stay flattened into their header dir', () => {
    expect(
      targetsOf(
        'components/view/platform/cxx/react/renderer/components/view/HostPlatformViewProps.h',
      ),
    ).toEqual(['react/renderer/components/view/HostPlatformViewProps.h']);
  });
});
