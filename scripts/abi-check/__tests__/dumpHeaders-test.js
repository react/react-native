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

import type {BuildType, DumpOptions} from '../dump';
import type {LayoutMap} from '../normalize';

const {compileFlags, dumpHeaders} = require('../dump');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CLANG = process.env.CLANG ?? 'clang++';
const CLANG_TIMEOUT_MS = 60_000;
const FIXTURE_DIR = path.join(__dirname, '__fixtures__', 'dump');

function dumpSample(): Promise<LayoutMap> {
  return dumpHeaders({
    headers: [path.join(FIXTURE_DIR, 'Sample.h')],
    includeDirs: [FIXTURE_DIR],
    clang: CLANG,
    namespacePattern: /facebook::react::/,
  });
}

describe('dumpHeaders', () => {
  beforeAll(() => {
    // Fake timers are enabled globally; clang runs in real child processes.
    jest.useRealTimers();
  });

  test(
    'keys the enumerator values of each named, non-dependent enum',
    async () => {
      const enums = [...(await dumpSample())].filter(([key]) =>
        key.startsWith('E '),
      );

      expect(enums.sort()).toEqual([
        ['E facebook::react::Fixed', ': unsigned char\nLow = 1\nHigh = 201'],
        [
          'E facebook::react::Implicit',
          'First = 0\nSecond = 1\nFifth = 4\nSixth = 5',
        ],
        ['E facebook::react::Signed', ': int\nNegative = -3\nNext = -2'],
        [
          'E facebook::react::Wide',
          ': unsigned long long\nMax = 18446744073709551615',
        ],
      ]);
    },
    CLANG_TIMEOUT_MS,
  );

  test(
    'dumps the vtable of a class whose destructor is not public',
    async () => {
      const vtable = (await dumpSample()).get(
        'V facebook::react::ProtectedDestructor',
      );

      expect(vtable).toContain(
        'void facebook::react::ProtectedDestructor::run()',
      );
    },
    CLANG_TIMEOUT_MS,
  );

  test(
    'rejects with the clang error when the headers do not compile',
    async () => {
      await expect(
        dumpHeaders({
          headers: [path.join(FIXTURE_DIR, 'Missing.h')],
          includeDirs: [],
          clang: CLANG,
          namespacePattern: /facebook::react::/,
        }),
      ).rejects.toThrow(/Missing\.h/);
    },
    CLANG_TIMEOUT_MS,
  );

  test(
    'dumps the vtable of every polymorphic class',
    async () => {
      const keys = [...(await dumpSample()).keys()];

      expect(keys).toEqual(
        expect.arrayContaining(
          [
            'ProtectedDestructor',
            'NonVirtualProtectedDestructor',
            'Interface',
            'Overrider',
            'DeletedDestructor',
            'Overloaded',
            'PrivateVirtual',
            'VirtualDestructorBase',
            'InheritsVirtualDestructor',
          ].map(name => `V facebook::react::${name}`),
        ),
      );
    },
    CLANG_TIMEOUT_MS,
  );

  test(
    'names the included header that failed to compile first in the error',
    async () => {
      const dump = dumpHeaders({
        headers: ['Outer.h', 'Sample.h'].map(header =>
          path.join(FIXTURE_DIR, header),
        ),
        includeDirs: [],
        clang: CLANG,
        namespacePattern: /facebook::react::/,
      });

      const message = await dump.then(
        () => '',
        (error: Error) => error.message,
      );
      const [summary] = message.split('\n');
      expect(summary).toContain(path.join(FIXTURE_DIR, 'Outer.h'));
      expect(summary).not.toContain('Sample.h');
      expect(message).toContain('NotThere.h');
    },
    CLANG_TIMEOUT_MS,
  );

  test(
    'includes headers whose paths contain quotes and backslashes',
    async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-'));
      const headers = [
        ['Quote"d.h', 'Quoted'],
        ['Back\\slash.h', 'Backslashed'],
      ].map(([file, type]) => {
        const header = path.join(dir, file);
        fs.writeFileSync(
          header,
          `namespace facebook::react { struct ${type} { int value; }; }\n`,
        );
        return header;
      });

      try {
        const layouts = await dumpHeaders({
          headers,
          includeDirs: [],
          clang: CLANG,
          namespacePattern: /facebook::react::/,
        });
        expect([...layouts.keys()].sort()).toEqual([
          'L facebook::react::Backslashed',
          'L facebook::react::Quoted',
        ]);
      } finally {
        fs.rmSync(dir, {recursive: true});
      }
    },
    CLANG_TIMEOUT_MS,
  );
});

describe('compileFlags', () => {
  const options: DumpOptions = {
    headers: [],
    includeDirs: ['/include'],
    namespacePattern: /facebook::react::/,
  };
  const buildTypes: Array<[BuildType, Array<string>]> = [
    ['debug', ['-DDEBUG=1', '-DREACT_NATIVE_DEBUG=1']],
    ['release', ['-DNDEBUG=1', '-DREACT_NATIVE_PRODUCTION=1']],
  ];

  test.each(buildTypes)(
    'compiles iOS %s as Objective-C++',
    (buildType, buildDefines) => {
      expect(
        compileFlags({...options, platform: 'ios', buildType, sysroot: '/sdk'}),
      ).toEqual([
        '-x',
        'objective-c++',
        '-std=c++20',
        '--target=arm64-apple-ios15.1',
        '-isysroot',
        '/sdk',
        '-I/include',
        '-DFOLLY_NO_CONFIG=1',
        '-DFOLLY_MOBILE=1',
        '-DFOLLY_USE_LIBCPP=1',
        '-DFOLLY_CFG_NO_COROUTINES=1',
        '-DFOLLY_HAVE_CLOCK_GETTIME=1',
        ...buildDefines,
        '-Wno-everything',
        '-fno-color-diagnostics',
      ]);
    },
  );

  test.each(buildTypes)(
    'compiles Android %s as C++',
    (buildType, buildDefines) => {
      expect(
        compileFlags({
          ...options,
          platform: 'android',
          buildType,
          sysroot: '/ndk/sysroot',
        }),
      ).toEqual([
        '-x',
        'c++',
        '-std=c++20',
        '--target=aarch64-linux-android24',
        '--sysroot',
        '/ndk/sysroot',
        '-fexceptions',
        '-frtti',
        '-I/include',
        '-DFOLLY_NO_CONFIG=1',
        '-DFOLLY_HAVE_CLOCK_GETTIME=1',
        '-DFOLLY_USE_LIBCPP=1',
        '-DFOLLY_CFG_NO_COROUTINES=1',
        '-DFOLLY_MOBILE=1',
        '-DFOLLY_HAVE_RECVMMSG=1',
        '-DFOLLY_HAVE_PTHREAD=1',
        '-DFOLLY_HAVE_XSI_STRERROR_R=1',
        '-DRN_SERIALIZABLE_STATE',
        '-DANDROID=1',
        '-DHERMES_V1_ENABLED=1',
        '-DLOG_TAG="ReactNative"',
        ...buildDefines,
        '-Wno-everything',
        '-fno-color-diagnostics',
      ]);
    },
  );

  test('compiles for the host as C++ debug without a platform', () => {
    expect(compileFlags(options)).toEqual([
      '-x',
      'c++',
      '-std=c++20',
      '-I/include',
      '-DDEBUG=1',
      '-DREACT_NATIVE_DEBUG=1',
      '-Wno-everything',
      '-fno-color-diagnostics',
    ]);
  });

  test('searches the framework dirs after the include dirs', () => {
    expect(
      compileFlags({...options, frameworkDirs: ['/frameworks']}).slice(3, 5),
    ).toEqual(['-I/include', '-F/frameworks']);
  });

  test('requires a sysroot for Android', () => {
    expect(() =>
      compileFlags({...options, platform: 'android', buildType: 'release'}),
    ).toThrow(/sysroot/);
  });
});
