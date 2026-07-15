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

const {
  DEPS_NAMESPACES,
  planFromInventory,
  renderNamespaceModuleMap,
  renderReactModuleMap,
} = require('../headers-spec');
const fs = require('fs');

/*::
type TestInventoryManifest = {
  headers: Array<{
    naturalPath: string,
    bucket: string,
    lang: string,
    identities: Array<{source: string}>,
  }>,
};
*/

// isUmbrellaSafe reads each header's source to reject extern-inline defs. Stub
// it to empty so synthetic objc-modular-candidate headers count as umbrella-safe
// (and thus land in namespaceModules), making these tests deterministic.
const planFromInventoryForTest = (manifest /*: TestInventoryManifest */) => {
  const readFileSync = jest.spyOn(fs, 'readFileSync').mockReturnValue('');
  try {
    return planFromInventory(manifest);
  } finally {
    readFileSync.mockRestore();
  }
};

const entry = (
  naturalPath /*: string */,
  bucket /*: string */,
  source /*:: ?: string */,
) => ({
  naturalPath,
  bucket,
  lang: 'objc',
  identities: [{source: source ?? `does/not/exist/${naturalPath}`}],
});

// A manifest satisfying both the R9 private-header allowlist and the R10
// umbrella-namespace allowlist (React_RCTAppDelegate).
const validManifest = () => ({
  headers: [
    entry('React/RCTBridge+Private.h', 'objc-modular-candidate'),
    entry('React/RCTComponentViewFactory.h', 'objc-blocked'),
    entry('React/RCTComponentViewProtocol.h', 'objc-blocked'),
    entry('React/RCTComponentViewRegistry.h', 'objc-blocked'),
    entry('React/RCTMountingManager.h', 'objc-blocked'),
    entry('React/RCTSurfacePresenter.h', 'objc-blocked'),
    entry('React/RCTViewComponentView.h', 'objc-blocked'),
    entry(
      'React_RCTAppDelegate/RCTReactNativeFactory.h',
      'objc-modular-candidate',
    ),
    entry(
      'React_RCTAppDelegate/RCTRootViewFactory.h',
      'objc-modular-candidate',
    ),
    entry('React_RCTAppDelegate/RCTAppDelegate.h', 'objc-modular-candidate'),
  ],
});

describe('renderReactModuleMap (R9 private headers)', () => {
  test('appends modular allowlist as `header` and objc-blocked as `textual header`', () => {
    const out = renderReactModuleMap({
      modular: ['RCTBridge+Private.h'],
      textual: ['RCTMountingManager.h'],
    });
    expect(out).toContain('umbrella header "React-umbrella.h"');
    expect(out).toContain('  header "RCTBridge+Private.h"');
    expect(out).toContain('  textual header "RCTMountingManager.h"');
    // A textual header must NOT also appear as a plain modular `header`.
    expect(out).not.toMatch(/^\s*header "RCTMountingManager\.h"/m);
  });

  test('with no private headers renders just the umbrella (backwards compatible)', () => {
    const out = renderReactModuleMap();
    expect(out).toContain('umbrella header "React-umbrella.h"');
    expect(out).not.toContain('textual header');
  });
});

describe('planFromInventory R9 validation', () => {
  test('passes for a valid allowlist and exposes privateReactHeaders', () => {
    const plan = planFromInventoryForTest(validManifest());
    expect(plan.privateReactHeaders.modular).toContain('RCTBridge+Private.h');
    expect(plan.privateReactHeaders.textual).toContain('RCTMountingManager.h');
  });

  test('throws when an allowlisted header is absent from the inventory', () => {
    const m = validManifest();
    m.headers = m.headers.filter(
      x => x.naturalPath !== 'React/RCTBridge+Private.h',
    );
    expect(() => planFromInventoryForTest(m)).toThrow(
      /RCTBridge\+Private\.h is absent/,
    );
  });

  test('throws when a modular allowlist header is no longer objc-modular-candidate', () => {
    const m = validManifest();
    const h = m.headers.find(
      x => x.naturalPath === 'React/RCTBridge+Private.h',
    );
    if (h == null) {
      throw new Error('fixture missing RCTBridge+Private.h');
    }
    h.bucket = 'objc-blocked';
    expect(() => planFromInventoryForTest(m)).toThrow(
      /not 'objc-modular-candidate'/,
    );
  });
});

describe('R10 per-namespace umbrella (React_RCTAppDelegate)', () => {
  test('emits a derived umbrella for the namespace', () => {
    const plan = planFromInventoryForTest(validManifest());
    const u = plan.namespaceUmbrellas.find(
      x => x.relPath === 'React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h',
    );
    expect(u).toBeDefined();
    if (u == null) {
      return;
    }
    // Imports are relative to the namespace dir, derived from the live set.
    expect(u.content).toContain('#import "RCTReactNativeFactory.h"');
    expect(u.content).toContain('#import "RCTRootViewFactory.h"');
    expect(u.content).toContain('#import "RCTAppDelegate.h"');
    expect(u.content).toContain('#ifdef __OBJC__');
    // No CocoaPods version boilerplate.
    expect(u.content).not.toContain('FOUNDATION_EXPORT');
  });

  test('module map lists the umbrella so the import stays modular', () => {
    const plan = planFromInventoryForTest(validManifest());
    const mm = renderNamespaceModuleMap(plan.namespaceModules);
    expect(mm).toContain('module React_RCTAppDelegate {');
    expect(mm).toContain(
      'header "React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h"',
    );
  });

  test('fails closed when the umbrella namespace lost its modular headers', () => {
    const m = validManifest();
    m.headers = m.headers.filter(
      x => !x.naturalPath.startsWith('React_RCTAppDelegate/'),
    );
    expect(() => planFromInventoryForTest(m)).toThrow(
      /umbrella namespace 'React_RCTAppDelegate'/,
    );
  });
});

describe('R5 invalid-identifier exemption assert (H5)', () => {
  test('throws when an invalid-identifier namespace gains a modular candidate', () => {
    const m = validManifest();
    m.headers.push(entry('bad-namespace/Foo.h', 'objc-modular-candidate'));
    expect(() => planFromInventoryForTest(m)).toThrow(
      /namespace 'bad-namespace' is not a valid module identifier/,
    );
  });

  test('invalid-identifier namespaces with only non-modular headers stay exempt', () => {
    const m = validManifest();
    m.headers.push(entry('jsinspector-modern/Foo.h', 'objcxx'));
    expect(() => planFromInventoryForTest(m)).not.toThrow();
  });
});

describe('R11 redirect shims for dual-identity headers', () => {
  test('RNH spelling of a source that also ships as React/ becomes a shim', () => {
    const m = validManifest();
    m.headers.push(
      entry('React/RCTClipboard.h', 'objc-modular-candidate', 'src/clip.h'),
      entry(
        'CoreModules/RCTClipboard.h',
        'objc-modular-candidate',
        'src/clip.h',
      ),
    );
    const plan = planFromInventoryForTest(m);
    const shim = plan.reactNativeHeaders.find(
      e => e.naturalPath === 'CoreModules/RCTClipboard.h',
    );
    expect(shim?.redirectTo).toBe('React/RCTClipboard.h');
    // The React/ owner keeps its content.
    const owner = plan.react.find(
      e => e.naturalPath === 'React/RCTClipboard.h',
    );
    expect(owner?.redirectTo).toBeUndefined();
    // The shim stays a namespace-module member (imports the owning module).
    expect(plan.namespaceModules.CoreModules).toContain(
      'CoreModules/RCTClipboard.h',
    );
  });

  test('bare root alias shims to its RNH namespaced owner', () => {
    const m = validManifest();
    m.headers.push(
      entry('RCTAppDelegate.h', 'objc-modular-candidate', 'src/appdelegate.h'),
    );
    // Same source as the namespaced form.
    const ns = m.headers.find(
      x => x.naturalPath === 'React_RCTAppDelegate/RCTAppDelegate.h',
    );
    if (ns == null) {
      throw new Error('fixture missing namespaced RCTAppDelegate.h');
    }
    ns.identities[0].source = 'src/appdelegate.h';
    const plan = planFromInventoryForTest(m);
    const bare = plan.react.find(e => e.naturalPath === 'RCTAppDelegate.h');
    expect(bare?.redirectTo).toBe('React_RCTAppDelegate/RCTAppDelegate.h');
    const owner = plan.reactNativeHeaders.find(
      e => e.naturalPath === 'React_RCTAppDelegate/RCTAppDelegate.h',
    );
    expect(owner?.redirectTo).toBeUndefined();
  });

  test('single-identity headers get no redirect', () => {
    const plan = planFromInventoryForTest(validManifest());
    for (const e of [...plan.react, ...plan.reactNativeHeaders]) {
      expect(e.redirectTo).toBeUndefined();
    }
  });
});

describe('DEPS_NAMESPACES (R2 — the deps sidecar namespace set)', () => {
  test('includes SocketRocket: one physical home, in the sidecar', () => {
    // Pre-sidecar, SocketRocket was excluded from relocation because a REAL
    // pod vended it (the 2026-07-03 dual-copy regression). With the sidecar
    // being the deps' single header home, it must be declared like every
    // other deps namespace.
    expect(DEPS_NAMESPACES).toContain('SocketRocket');
  });

  test('plan.depsNamespaces mirrors the spec list', () => {
    expect(planFromInventoryForTest(validManifest()).depsNamespaces).toEqual(
      DEPS_NAMESPACES,
    );
  });
});

describe('headers-verify gate pieces', () => {
  const {
    diffAgainstBaseline,
    renderObjcFixture,
    renderPrivilegedFixture,
  } = require('../headers-verify');

  test('diffAgainstBaseline ratchets: new offenders fail, resolved reported', () => {
    const {newOffenders, resolved} = diffAgainstBaseline(
      ['a', 'c'],
      ['a', 'b'],
    );
    expect(newOffenders).toEqual(['c']);
    expect(resolved).toEqual(['b']);
  });

  test('ObjC fixture asserts and imports the R9/R10 + module surfaces', () => {
    const plan = planFromInventoryForTest(validManifest());
    const tu = renderObjcFixture(plan);
    expect(tu).toContain('__has_include(<React/RCTBridge+Private.h>)');
    expect(tu).toContain(
      '__has_include(<React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h>)',
    );
    expect(tu).toContain('#import <React/RCTBridge.h>');
    expect(tu).toContain('#import <React/RCTBridge+Private.h>');
    // One import per namespace module (fixture has React_RCTAppDelegate).
    expect(tu).toMatch(/#import <React_RCTAppDelegate\//);
  });

  test('privileged fixture imports every R9 textual header', () => {
    const plan = planFromInventoryForTest(validManifest());
    const tu = renderPrivilegedFixture(plan);
    expect(tu).toContain('#import <React/RCTMountingManager.h>');
    expect(tu).toContain('#import <React/RCTViewComponentView.h>');
  });
});
