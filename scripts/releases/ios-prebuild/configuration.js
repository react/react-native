/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*::
import type { Dependency, Platform } from './types';
*/

const platforms /*: ReadonlyArray<Platform> */ = [
  'ios',
  'ios-simulator',
  'macos',
  'mac-catalyst',
  'tvos',
  'tvos-simulator',
  'xros',
  'xros-simulator',
];

const CPP_STANDARD = 'c++20';

const dependencies /*: ReadonlyArray<Dependency> */ = [
  {
    name: 'glog',
    version: '0.3.5',
    url: new URL(
      'https://github.com/google/glog/archive/refs/tags/v0.3.5.tar.gz',
    ),
    prepareScript: './packages/react-native/scripts/ios-configure-glog.sh',
    files: {
      sources: [
        'src/*.h',
        'src/base/*.h',
        'src/glog/*.h',
        'src/demangle.cc',
        'src/logging.cc',
        'src/raw_logging.cc',
        'src/signalhandler.cc',
        'src/symbolize.cc',
        'src/utilities.cc',
        'src/vlog_is_on.cc',
      ],
      headers: ['src/glog/*.h'],
      resources: ['../third-party-podspecs/glog/PrivacyInfo.xcprivacy'],
      headerSkipFolderNames: 'src',
    },
    settings: {
      publicHeaderFiles: './headers',
      headerSearchPaths: ['src'],
      cCompilerFlags: ['-Wno-shorten-64-to-32'],
      cxxCompilerFlags: ['-Wno-shorten-64-to-32', `-std=${CPP_STANDARD}`],
      defines: [
        {name: 'DEFINES_MODULE', value: 'YES'},
        {name: 'USE_HEADERMAP', value: 'NO'},
      ],
    },
  },
  {
    name: 'double-conversion',
    version: '1.1.6',
    url: new URL(
      'https://github.com/google/double-conversion/archive/refs/tags/v1.1.6.tar.gz',
    ),
    files: {
      sources: ['src/*.{h,cc}'],
      headers: ['src/*.h'],
      headerTargetFolder: 'double-conversion',
      headerSkipFolderNames: 'src',
    },
    settings: {
      publicHeaderFiles: './headers',
      headerSearchPaths: ['src'],
    },
  },
  {
    name: 'fmt',
    version: '12.1.0',
    url: new URL(
      'https://github.com/fmtlib/fmt/archive/refs/tags/12.1.0.tar.gz',
    ),
    files: {
      sources: ['src/format.cc', 'include/fmt/*.h'],
      headers: ['include/fmt/*.h'],
      headerSkipFolderNames: 'include',
    },
    settings: {
      publicHeaderFiles: './include',
      headerSearchPaths: ['include'],
      linkedLibraries: ['c++'],
      cxxCompilerFlags: [`-std=${CPP_STANDARD}`],
      defines: [{name: 'DEFINES_MODULE', value: 'YES'}],
    },
  },
  {
    name: 'boost',
    version: '1.84.0',
    prepareScript: 'touch dummy.cc',
    url: new URL(
      'https://github.com/react-native-community/boost-for-react-native/archive/refs/tags/v1.84.0.tar.gz',
    ),
    files: {
      sources: ['boost/**/*.hpp', 'dummy.cc'],
      headers: ['boost/**/*.hpp'],
      resources: ['../third-party-podspecs/boost/PrivacyInfo.xcprivacy'],
    },
    settings: {
      publicHeaderFiles: './',
      headerSearchPaths: ['./'],
      cCompilerFlags: ['-Wno-documentation'],
      cxxCompilerFlags: ['-Wno-documentation', `-std=${CPP_STANDARD}`],
    },
  },
  {
    name: 'fast_float',
    version: '8.0.0',
    prepareScript: 'touch dummy.cc',
    url: new URL(
      'https://github.com/fastfloat/fast_float/archive/refs/tags/v8.0.0.tar.gz',
    ),
    files: {
      sources: ['./include/fast_float/*.h', 'dummy.cc'],
      headers: ['./include/fast_float/*.h'],
      headerSkipFolderNames: 'include',
    },
    settings: {
      publicHeaderFiles: './include',
      headerSearchPaths: ['include'],
      cxxCompilerFlags: [`-std=${CPP_STANDARD}`],
      linkedLibraries: ['c++'],
    },
  },
  {
    name: 'socket-rocket',
    version: '0.7.1',
    url: new URL(
      'https://github.com/facebookincubator/SocketRocket/archive/refs/tags/0.7.1.tar.gz',
    ),
    files: {
      sources: ['SocketRocket/**/*.{h,m}'],
      headers: ['SocketRocket/*.h'],
    },
    settings: {
      publicHeaderFiles: './SocketRocket',
      headerSearchPaths: [
        './',
        'SocketRocket',
        'SocketRocket/Internal',
        'SocketRocket/Internal/Utilities',
        'SocketRocket/Internal/Delegate',
        'SocketRocket/Internal/IOConsumer',
        'SocketRocket/Internal/Proxy',
        'SocketRocket/Internal/RunLoop',
        'SocketRocket/Internal/Security',
        'SocketRocket/Internal/Utilities',
      ],
      defines: [{name: 'DEFINES_MODULE', value: 'YES'}],
    },
  },
  {
    name: 'folly',
    version: '0.9.0',
    prepareScript:
      'echo "#pragma once\n\n#define FOLLY_MOBILE 1\n#define FOLLY_HAVE_PTHREAD 1\n#define FOLLY_USE_LIBCPP 1\n#define FOLLY_CFG_NO_COROUTINES 1\n#define FOLLY_HAVE_CLOCK_GETTIME 1 \n\n#pragma clang diagnostic ignored \\""-Wcomma\\""" > ./folly/folly-config.h',
    url: new URL(
      'https://github.com/facebook/folly/archive/refs/tags/v2024.11.18.00.tar.gz',
    ),
    files: {
      sources: [
        // Common:
        'folly/String.cpp',
        'folly/Conv.cpp',
        'folly/Demangle.cpp',
        'folly/FileUtil.cpp',
        'folly/Format.cpp',
        'folly/lang/SafeAssert.cpp',
        'folly/lang/ToAscii.cpp',
        'folly/ScopeGuard.cpp',
        'folly/Unicode.cpp',
        'folly/json/dynamic.cpp',
        'folly/json/json.cpp',
        'folly/json/json_pointer.cpp',
        'folly/container/detail/F14Table.cpp',
        'folly/detail/Demangle.cpp',
        'folly/detail/FileUtilDetail.cpp',
        'folly/detail/SplitStringSimd.cpp',
        'folly/detail/StaticSingletonManager.cpp',
        'folly/detail/UniqueInstance.cpp',
        'folly/hash/SpookyHashV2.cpp',
        'folly/lang/CString.cpp',
        'folly/lang/Exception.cpp',
        'folly/memory/ReentrantAllocator.cpp',
        'folly/memory/detail/MallocImpl.cpp',
        'folly/net/NetOps.cpp',
        'folly/portability/SysUio.cpp',
        'folly/synchronization/SanitizeThread.cpp',
        'folly/system/AtFork.cpp',
        'folly/system/ThreadId.cpp',
        'folly/*.h',
        'folly/algorithm/simd/*.h',
        'folly/algorithm/simd/detail/*.h',
        'folly/chrono/*.h',
        'folly/container/*.h',
        'folly/container/detail/*.h',
        'folly/detail/*.h',
        'folly/functional/*.h',
        'folly/hash/*.h',
        'folly/json/*.h',
        'folly/lang/*.h',
        'folly/memory/*.h',
        'folly/memory/detail/*.h',
        'folly/net/*.h',
        'folly/net/detail/*.h',
        'folly/portability/*.h',
        'folly/system/*.h',
        // Fabric:
        'folly/SharedMutex.cpp',
        'folly/concurrency/CacheLocality.cpp',
        'folly/detail/Futex.cpp',
        'folly/synchronization/ParkingLot.cpp',
        'folly/concurrency/CacheLocality.h',
        'folly/synchronization/*.h',
        'folly/system/ThreadId.h',
      ],
      headers: [
        'folly/*.h',
        'folly/algorithm/simd/*.h',
        'folly/algorithm/simd/detail/*.h',
        'folly/chrono/*.h',
        'folly/container/*.h',
        'folly/container/detail/*.h',
        'folly/detail/*.h',
        'folly/functional/*.h',
        'folly/hash/*.h',
        'folly/json/*.h',
        'folly/lang/*.h',
        'folly/memory/*.h',
        'folly/memory/detail/*.h',
        'folly/net/*.h',
        'folly/net/detail/*.h',
        'folly/portability/*.h',
        'folly/system/*.h',
      ],
      resources: ['../third-party-podspecs/RCT-Folly/PrivacyInfo.xcprivacy'],
    },
    dependencies: [
      'glog',
      'double-conversion',
      'fmt',
      'boost',
      'fast_float',
      'socket-rocket',
    ],
    settings: {
      publicHeaderFiles: './',
      headerSearchPaths: ['./'],
      cCompilerFlags: ['-faligned-new', '-Wno-shorten-64-to-32', '-Wno-comma'],
      cxxCompilerFlags: [
        '-faligned-new',
        '-Wno-shorten-64-to-32',
        '-Wno-comma',
        `-std=${CPP_STANDARD}`,
      ],
      defines: [
        {name: 'USE_HEADERMAP', value: 'NO'},
        {name: 'DEFINES_MODULE', value: 'YES'},
      ],
      linkedLibraries: ['c++abi'],
      linkerSettings: ['-Wl,-U,_jump_fcontext', '-Wl,-U,_make_fcontext'],
    },
  },
];

module.exports = {dependencies, platforms};
