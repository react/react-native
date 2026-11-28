/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ClassMembers} from './ast';
import type {LayoutMap} from './normalize';

const {createClassCollector, createEnumCollector} = require('./ast');
const {normalizeDump} = require('./normalize');
const {execFileSync, spawn} = require('node:child_process');
const readline = require('node:readline');

export type Platform = 'ios' | 'android';
export type BuildType = 'debug' | 'release';

export type DumpOptions = {
  /**
   * The headers to include in the translation unit: absolute paths, or
   * include paths that clang finds in `includeDirs`.
   */
  headers: ReadonlyArray<string>,
  includeDirs: ReadonlyArray<string>,
  /** The `-F` directories, searched for `<Framework/Header.h>`. */
  frameworkDirs?: ReadonlyArray<string>,
  /**
   * Platform whose compile flags to use. Each platform and build type is a
   * separate ABI. Defaults to the host, with no platform flags.
   */
  platform?: Platform,
  /** Selects the debug or release defines. Defaults to debug. */
  buildType?: BuildType,
  /** Clang target triple. Defaults to the platform's target, else the host. */
  target?: string,
  /** SDK or NDK sysroot. On iOS, defaults to the iphoneos SDK from xcrun. */
  sysroot?: string,
  defines?: ReadonlyArray<string>,
  /** Path or name of the clang++ executable. Defaults to `clang++`. */
  clang?: string,
  namespacePattern: RegExp,
};

type Language = 'c++' | 'objective-c++';

type PlatformFlags = {
  language: Language,
  target: string,
  sysrootFlag: string,
  defaultSysroot: () => string,
  flags: Array<string>,
  defines: Array<string>,
};

// The flags of React Native's own builds: the prebuilt iOS frameworks, and on
// Android ReactCommon/cmake-utils/react-native-flags.cmake and
// ReactAndroid/cmake-utils/folly-flags.cmake.
const PLATFORMS: {readonly [platform: Platform]: PlatformFlags} = {
  ios: {
    // Platform headers such as RCTTurboModuleManager.h are Objective-C++.
    language: 'objective-c++',
    target: 'arm64-apple-ios15.1',
    sysrootFlag: '-isysroot',
    defaultSysroot: () =>
      execFileSync('xcrun', ['--sdk', 'iphoneos', '--show-sdk-path'], {
        encoding: 'utf8',
      }).trim(),
    flags: [],
    defines: [
      'FOLLY_NO_CONFIG=1',
      'FOLLY_MOBILE=1',
      'FOLLY_USE_LIBCPP=1',
      'FOLLY_CFG_NO_COROUTINES=1',
      'FOLLY_HAVE_CLOCK_GETTIME=1',
    ],
  },
  android: {
    language: 'c++',
    target: 'aarch64-linux-android24',
    sysrootFlag: '--sysroot',
    defaultSysroot: () => {
      throw new Error(
        'Android needs `sysroot`, the NDK sysroot at ' +
          '<ndk>/toolchains/llvm/prebuilt/<host>/sysroot. Without it, clang ' +
          'compiles against the host C++ library, whose layouts differ.',
      );
    },
    flags: ['-fexceptions', '-frtti'],
    defines: [
      'FOLLY_NO_CONFIG=1',
      'FOLLY_HAVE_CLOCK_GETTIME=1',
      'FOLLY_USE_LIBCPP=1',
      'FOLLY_CFG_NO_COROUTINES=1',
      'FOLLY_MOBILE=1',
      'FOLLY_HAVE_RECVMMSG=1',
      'FOLLY_HAVE_PTHREAD=1',
      'FOLLY_HAVE_XSI_STRERROR_R=1',
      'RN_SERIALIZABLE_STATE',
      'ANDROID=1',
      'HERMES_V1_ENABLED=1',
      'LOG_TAG="ReactNative"',
    ],
  },
};

const LAYOUT_FLAGS = [
  '-Xclang',
  '-fdump-record-layouts-complete',
  '-Xclang',
  '-fdump-vtable-layouts',
];

const POLYMORPHIC_LAYOUT =
  /^\s*0 \|\s+\([^()\n]+ vtable pointer\)|\(primary virtual base/m;

function language(options: DumpOptions): Language {
  return options.platform != null
    ? PLATFORMS[options.platform].language
    : 'c++';
}

// Keep in sync with the debug and release variants in
// scripts/cxx-api/config.yml.
const BUILD_TYPE_DEFINES: {readonly [buildType: BuildType]: Array<string>} = {
  debug: ['DEBUG=1', 'REACT_NATIVE_DEBUG=1'],
  release: ['NDEBUG=1', 'REACT_NATIVE_PRODUCTION=1'],
};

/** The clang arguments, other than the dump flags, for `options`. */
function compileFlags(options: DumpOptions): Array<string> {
  const platform =
    options.platform != null ? PLATFORMS[options.platform] : null;
  const target = options.target ?? platform?.target;
  const sysroot = options.sysroot ?? platform?.defaultSysroot();
  const defines = [
    ...(platform?.defines ?? []),
    ...BUILD_TYPE_DEFINES[options.buildType ?? 'debug'],
    ...(options.defines ?? []),
  ];

  return [
    '-x',
    language(options),
    '-std=c++20',
    ...(target != null ? [`--target=${target}`] : []),
    ...(sysroot != null ? [platform?.sysrootFlag ?? '--sysroot', sysroot] : []),
    ...(platform?.flags ?? []),
    ...options.includeDirs.map(dir => `-I${dir}`),
    ...(options.frameworkDirs ?? []).map(dir => `-F${dir}`),
    ...defines.map(define => `-D${define}`),
    '-Wno-everything',
    '-fno-color-diagnostics',
  ];
}

/** One line of a generated translation unit, and what it is for. */
type SourceLine = {label: string, code: string};

function includeLine(header: string, options: DumpOptions): SourceLine {
  // Clang does not unescape `#include "..."`, so a quote cannot be written
  // there. An absolute path in `<...>` is found the same way.
  if (/[>\n]/.test(header)) {
    throw new Error(`Cannot include a header path with ">": ${header}`);
  }
  // Objective-C headers rely on #import instead of include guards, and a
  // header that is both #included and #imported is read twice.
  const directive =
    language(options) === 'objective-c++' ? '#import' : '#include';
  return {label: header, code: `${directive} <${header}>`};
}

const MEMBER_POINTER_ALIAS: SourceLine = {
  label: 'the vtable probes',
  code: 'template <typename Signature, typename Class> using abi_check_member_pointer = Signature Class::*;',
};

/**
 * Clang dumps a vtable only when code generation needs its layout, so each
 * polymorphic class gets a function that does. Taking the address of a
 * virtual method needs no virtual destructor; the cast picks an overload,
 * with the type as written, so it goes in the class's namespace. A class that
 * declares no virtual method is deleted through its, maybe inherited, virtual
 * destructor.
 */
function vtableProbe(
  className: string,
  members: ?ClassMembers,
  index: number,
): ?SourceLine {
  const type = `::${className}`;
  const probe = `abi_check_vtable_${index}`;
  const methods = members?.methods ?? [];
  const usingNames = members?.usingNames ?? [];
  const isOverloaded = (name: string) =>
    [...methods.map(method => method.name), ...usingNames].filter(
      other => other === name,
    ).length > 1;
  const virtuals = methods.filter(method => method.virtual && !method.deleted);
  const unique = virtuals.find(method => !isOverloaded(method.name));

  let code;
  if (unique != null) {
    code = `auto ${probe}() { return &${type}::${unique.name}; }`;
  } else if (virtuals.length > 0 && members?.hasVirtualDestructor !== true) {
    const [{name, type: signature}] = virtuals;
    code =
      `auto ${probe}() { return static_cast<::abi_check_member_pointer<` +
      `${signature}, ${type}>>(&${type}::${name}); }`;
  } else if (members?.hasDeletedDestructor !== true) {
    code = `void ${probe}(${type} *p) { delete p; }`;
  } else {
    return null;
  }
  const namespace = members?.namespace ?? '';
  return {
    label: `the vtable probe for ${className}`,
    code: namespace === '' ? code : `namespace ${namespace} { ${code} }`,
  };
}

/**
 * Compiles `lines` from stdin and calls `onLine` for each line of stdout.
 * Rejects with the parts of `lines` that clang reported errors in.
 */
function runClang(
  clang: string,
  args: Array<string>,
  lines: Array<SourceLine>,
  onLine: (line: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(clang, [...args, '-']);
    const stderrChunks: Array<Buffer> = [];
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    readline.createInterface({input: child.stdout}).on('line', onLine);
    // Clang can exit before it reads all of stdin; its exit code reports why.
    child.stdin.on('error', () => {});
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }
      const stderr = Buffer.concat(stderrChunks).toString();
      const failed = new Set(
        [...stderr.matchAll(/<stdin>:(\d+):/g)]
          .map(([, line]) => lines[Number(line) - 1]?.label)
          .filter(Boolean),
      );
      const what =
        failed.size > 0 ? [...failed].join(', ') : 'the translation unit';
      reject(new Error(`${clang} could not compile ${what}:\n${stderr}`));
    });
    child.stdin.end(lines.map(line => `${line.code}\n`).join(''));
  });
}

async function dumpLayouts(
  clang: string,
  args: Array<string>,
  lines: Array<SourceLine>,
): Promise<string> {
  const output: Array<string> = [];
  await runClang(clang, args, lines, line => {
    output.push(line);
  });
  return output.join('\n');
}

/**
 * Compiles a translation unit that includes `headers` and returns the
 * normalized record layouts, vtables and enumerator values of every type
 * whose name matches `namespacePattern`.
 */
async function dumpHeaders(options: DumpOptions): Promise<LayoutMap> {
  const clang = options.clang ?? 'clang++';
  const flags = compileFlags(options);
  const {namespacePattern} = options;
  const includes = options.headers.map(header => includeLine(header, options));

  const enumCollector = createEnumCollector(namespacePattern);
  const classCollector = createClassCollector(namespacePattern);
  const [recordDump] = await Promise.all([
    dumpLayouts(clang, [...flags, '-fsyntax-only', ...LAYOUT_FLAGS], includes),
    runClang(
      clang,
      [...flags, '-fsyntax-only', '-Xclang', '-ast-dump'],
      includes,
      line => {
        enumCollector.onLine(line);
        classCollector.onLine(line);
      },
    ),
  ]);

  // Template specializations and unnamed types cannot be spelled from their
  // dumped names. Access control is off so that probes may use private methods.
  const classes = classCollector.finish();
  const probes = [...normalizeDump(recordDump, {namespacePattern})]
    .filter(
      ([key, layout]) =>
        key.startsWith('L ') &&
        !/[<(]/.test(key) &&
        POLYMORPHIC_LAYOUT.test(layout),
    )
    .flatMap(([key], index) => {
      const className = key.slice(2);
      return vtableProbe(className, classes.get(className), index) ?? [];
    });
  const layoutDump = await dumpLayouts(
    clang,
    [...flags, '-fno-access-control', '-c', '-o', '/dev/null', ...LAYOUT_FLAGS],
    [...includes, MEMBER_POINTER_ALIAS, ...probes],
  );

  return new Map([
    ...normalizeDump(layoutDump, {namespacePattern}),
    ...enumCollector.finish(),
  ]);
}

module.exports = {compileFlags, dumpHeaders};
