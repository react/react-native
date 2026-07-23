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

const {scanHeader} = require('../headers-inventory');

describe('scanHeader include classification', () => {
  test('an unguarded include is not cxx-guarded', () => {
    const r = scanHeader('#import <React/RCTBridge.h>\n');
    expect(r.includes).toEqual([
      {token: 'React/RCTBridge.h', cxxGuarded: false},
    ]);
  });

  test('an include under #ifdef __cplusplus is cxx-guarded', () => {
    const r = scanHeader(
      '#ifdef __cplusplus\n#include <folly/dynamic.h>\n#endif\n',
    );
    expect(r.includes).toEqual([{token: 'folly/dynamic.h', cxxGuarded: true}]);
  });

  test('#else flips the __cplusplus guard', () => {
    const src = [
      '#ifdef __cplusplus',
      '#include <cpp/only.h>',
      '#else',
      '#include <c/only.h>',
      '#endif',
      '',
    ].join('\n');
    expect(scanHeader(src).includes).toEqual([
      {token: 'cpp/only.h', cxxGuarded: true},
      {token: 'c/only.h', cxxGuarded: false},
    ]);
  });

  test('#elif __cplusplus enters a cxx-only region', () => {
    const src = [
      '#if SOMETHING',
      '#include <a.h>',
      '#elif __cplusplus',
      '#include <b.h>',
      '#endif',
      '',
    ].join('\n');
    expect(scanHeader(src).includes).toEqual([
      {token: 'a.h', cxxGuarded: false},
      {token: 'b.h', cxxGuarded: true},
    ]);
  });
});

describe('scanHeader C++ / ObjC surface detection', () => {
  test('an unguarded namespace is unguarded C++', () => {
    const r = scanHeader('namespace facebook { struct X; }\n');
    expect(r.hasUnguardedCxx).toBe(true);
    expect(r.hasGuardedCxx).toBe(false);
  });

  test('a namespace under __cplusplus is guarded, not unguarded', () => {
    const r = scanHeader('#ifdef __cplusplus\nnamespace facebook {}\n#endif\n');
    expect(r.hasGuardedCxx).toBe(true);
    expect(r.hasUnguardedCxx).toBe(false);
  });

  test('a named aggregate with a member initializer is ObjC++', () => {
    const r = scanHeader('struct RCTFontProperties { CGFloat size = NAN; };\n');
    expect(r.hasUnguardedCxx).toBe(true);
  });

  test('an ANONYMOUS aggregate with a member initializer is ObjC++', () => {
    // Regression: the tag name is optional, so a typedef'd anonymous struct
    // carrying a C++ default member initializer is still detected as ObjC++.
    const r = scanHeader('typedef struct { CGFloat x = NAN; } Foo;\n');
    expect(r.hasUnguardedCxx).toBe(true);
  });

  test('@interface marks the header as ObjC', () => {
    const r = scanHeader('@interface RCTBridge : NSObject\n@end\n');
    expect(r.hasObjC).toBe(true);
  });
});

describe('scanHeader comment handling', () => {
  test('a multi-line block comment mentioning C++ keywords does not trip the detector', () => {
    const src = [
      '/*',
      ' * namespace foo is documented here',
      ' * template <typename T> and constexpr too',
      ' */',
      '@interface RCTFoo',
      '@end',
      '',
    ].join('\n');
    const r = scanHeader(src);
    expect(r.hasUnguardedCxx).toBe(false);
    expect(r.hasGuardedCxx).toBe(false);
    expect(r.hasObjC).toBe(true);
  });

  test('an inline block comment does not trip the detector', () => {
    expect(scanHeader('int x; /* namespace y */\n').hasUnguardedCxx).toBe(
      false,
    );
  });

  test('a // line comment mentioning a keyword does not trip the detector', () => {
    expect(scanHeader('// using namespace std;\n').hasUnguardedCxx).toBe(false);
  });
});
