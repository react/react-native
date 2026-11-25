/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const {
  collectStableApiHeaders,
  excludePatterns,
  stableApiHeaders,
} = require('../tiers');
const fs = require('node:fs');
const path = require('node:path');

const CXX_API_DIR = path.join(__dirname, '..', '..', 'cxx-api');
const LAYOUTS_DIR = path.join(__dirname, '__fixtures__', 'layouts');
const SOURCE_REACT_COMMON = path.join(
  LAYOUTS_DIR,
  'source',
  'packages',
  'react-native',
  'ReactCommon',
);
// Under scripts/, which the iOS list excludes when it is part of the path
// below the header root.
const headerRoot = path.join(__dirname, '__fixtures__', 'tiers');

function inRoot(headers: Array<string>): Array<string> {
  return headers.map(header => path.join(headerRoot, header));
}

function quotedListItems(text: string): Array<string> {
  return [...text.matchAll(/'([^']*)'|"([^"]*)"/g)].map(
    ([, single, double]) => single ?? double,
  );
}

/** The exclude_patterns list that follows `heading` in config.yml. */
function configExcludePatterns(heading: string): Array<string> {
  const config = fs.readFileSync(path.join(CXX_API_DIR, 'config.yml'), 'utf8');
  const section = config.slice(config.indexOf(heading));
  const list = section.match(/^( *)exclude_patterns:\n((?:\1 +- .*\n)+)/m);
  return quotedListItems(list?.[2] ?? '');
}

describe('collectStableApiHeaders', () => {
  test('returns the public and for-frameworks headers for iOS, sorted', () => {
    expect(collectStableApiHeaders(headerRoot, 'ios')).toEqual(
      inRoot([
        'react/ForFrameworks.h',
        'react/Public.h',
        'react/nested/Indented.h',
        'react/platform/ios/Dup.h',
      ]),
    );
  });

  test('returns the public and for-frameworks headers for Android, sorted', () => {
    expect(collectStableApiHeaders(headerRoot, 'android')).toEqual(
      inRoot([
        'react/ForFrameworks.h',
        'react/Public.h',
        'react/Thing+Private.h',
        'react/jni/Jni.h',
        'react/nested/Indented.h',
        'react/platform/android/Dup.h',
        'react/scripts/InScripts.h',
      ]),
    );
  });

  test('accepts a relative header root and returns absolute paths', () => {
    const relativeRoot = path.relative(process.cwd(), headerRoot);

    expect(collectStableApiHeaders(relativeRoot, 'ios')).toEqual(
      collectStableApiHeaders(headerRoot, 'ios'),
    );
  });
});

describe('excludePatterns', () => {
  const main = fs.readFileSync(
    path.join(CXX_API_DIR, 'parser', '__main__.py'),
    'utf8',
  );
  const templatePatterns = quotedListItems(
    main.match(/^_TEMPLATE_EXCLUDE_PATTERNS = \[(.*)\]$/m)?.[1] ?? '',
  );
  const globalPatterns = configExcludePatterns('exclude_patterns:');

  test.each([
    ['ios', 'ReactApple'],
    ['android', 'ReactAndroid'],
  ])('matches the cxx-api %s view, %s', (platform, view) => {
    const expected = [
      ...templatePatterns,
      ...globalPatterns,
      ...configExcludePatterns(`\n  ${view}:\n`),
    ];

    expect(templatePatterns).not.toEqual([]);
    expect(globalPatterns).not.toEqual([]);
    expect(excludePatterns(platform === 'ios' ? 'ios' : 'android')).toEqual([
      ...new Set(expected),
    ]);
  });
});

/** Each header under `dir`, by `prefix` and its path below `dir`. */
function headersUnder(dir: string, prefix: string = ''): Map<string, string> {
  return new Map(
    fs
      .readdirSync(dir, {recursive: true, encoding: 'utf8'})
      .filter(entry => entry.endsWith('.h'))
      .map(entry => [
        prefix + entry.split(path.sep).join('/'),
        path.join(dir, entry),
      ]),
  );
}

describe('stableApiHeaders', () => {
  const sourceHeaders = (platform: string) =>
    // The prefab and pod rules: ReactCommon/react/ as react/, and the
    // platform's folder at the include root.
    new Map([
      ...headersUnder(path.join(SOURCE_REACT_COMMON, 'react'), 'react/'),
      ...headersUnder(
        path.join(
          SOURCE_REACT_COMMON,
          'react/renderer/view/platform',
          platform,
        ),
      ),
    ]);

  const fetcher =
    'react/renderer/image/platform/android/react/renderer/image/ImageFetcher.h';

  test.each([
    [
      'android',
      'maven-android/prefab/modules/reactnative/include',
      [
        'react/renderer/core/Props.h',
        fetcher,
        'react/renderer/view/HostProps.h',
      ],
    ],
    [
      'ios',
      'maven-ios/ReactNativeHeaders.xcframework/ios-arm64/Headers',
      ['react/renderer/core/Props.h', 'react/renderer/view/HostProps.h'],
    ],
  ])(
    'selects the same %s include paths from the source tree and from Maven',
    (platform, mavenRoot, expected) => {
      const os = platform === 'ios' ? 'ios' : 'android';

      expect(stableApiHeaders(sourceHeaders(os), os)).toEqual(expected);
      expect(
        stableApiHeaders(headersUnder(path.join(LAYOUTS_DIR, mavenRoot)), os),
      ).toEqual(expected);
    },
  );

  test('keeps a header that is only in a platform folder', () => {
    const headers = headersUnder(
      path.join(SOURCE_REACT_COMMON, 'react'),
      'react/',
    );

    expect(stableApiHeaders(headers, 'android')).toContain(fetcher);
  });

  test('drops the platform folder copy of a header at the include root', () => {
    const copy =
      'react/renderer/view/platform/android/react/renderer/view/HostProps.h';
    const headers = sourceHeaders('android');

    expect(headers.has(copy)).toBe(true);
    expect(headers.has('react/renderer/view/HostProps.h')).toBe(true);
    expect(stableApiHeaders(headers, 'android')).not.toContain(copy);
  });

  test('excludes a source-tree pattern below a ReactCommon header root', () => {
    expect(collectStableApiHeaders(SOURCE_REACT_COMMON, 'android')).toEqual(
      [
        'react/renderer/core/Props.h',
        'react/renderer/image/platform/android/react/renderer/image/ImageFetcher.h',
        'react/renderer/view/platform/android/react/renderer/view/HostProps.h',
      ].map(header => path.join(SOURCE_REACT_COMMON, header)),
    );
  });
});
