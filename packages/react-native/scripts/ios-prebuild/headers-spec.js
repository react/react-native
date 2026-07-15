/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * THE HEADERS SPEC — executable contract for the packaged header layout.
 *
 * One source of truth: the prebuild compose step (headers-compose.js) EMITS
 * artifacts from it, and the SPM tooling derives what consumers need from it
 * (nothing extra, by design).
 *
 * The rules:
 *
 * R1. React.framework/Headers ROOT serves the `React/` namespace (contents
 *     hoisted to root) plus the bare root aliases. The framework name supplies
 *     the `React/` prefix, so `<React/RCTBridge.h>` resolves verbatim through
 *     FRAMEWORK_SEARCH_PATHS. The `react/` (lowercase) namespace is NOT here —
 *     it ships in ReactNativeHeaders (R2). Resolving it through React.framework
 *     would require case-folding `react.framework` → `React.framework`, which
 *     only works on case-insensitive filesystems; the header-search-path route
 *     is exact and works everywhere.
 * R2. Every other RN namespace (incl. `react/`) ships in ONE headers-only
 *     library xcframework ("ReactNativeHeaders"), namespace dirs at its
 *     Headers root. PURE-RN: the third-party deps namespaces (DEPS_NAMESPACES)
 *     are NOT here — they ship in the ReactNativeDependenciesHeaders sidecar
 *     built by the deps prebuild from its own artifact headers, so every
 *     namespace has exactly ONE physical home (the SocketRocket dual-copy
 *     regression class is structurally impossible). Both are served by exact
 *     header-search-path lookup, so resolution is filesystem-case-independent.
 * R3. NO include rewriting anywhere — source headers are byte-identical to
 *     the repo (content authority = source files; layout authority = this
 *     spec). Consumers compile unchanged except bare-form angle includes
 *     (R6).
 * R4. React.framework gets a framework module map with an umbrella over the
 *     ObjC modular surface: objc-modular-candidate ∧ React/-namespace ∧ no
 *     '+'-category header ∧ no C extern-inline definition (C99 extern inline
 *     emits a STRONG symbol per importing .m TU → duplicate symbols;
 *     RCTTextInputNativeCommands.h found empirically).
 * R5. Every namespace with objc-modular-candidates gets a module declaring
 *     exactly those candidates (framework modules may not textually include
 *     non-modular framework headers; yoga + RCTDeprecation found
 *     empirically). Namespaces whose name is not a valid module identifier
 *     (e.g. jsinspector-modern) are exempt — they have no candidates today;
 *     planFromInventory FAILS CLOSED if that changes. `react/` is also exempt: its few
 *     objc-modular-candidates stay textual (as they already were inside
 *     React.framework) so no `react` module aliases the `React` framework
 *     module.
 * R6. Bare root aliases are servable only as `<React/X>` — bare angle forms
 *     (`#import <RCTAppDelegate.h>`) have no framework spelling. This is the
 *     accepted, measured consumer migration (~4 lines ecosystem-wide).
 * R7. Artifacts are code-signed AFTER header composition (signature pins the
 *     header manifest).
 * R8. Collisions are ERRORS: two different source files may never project to
 *     the same destination path.
 * R9. Private React headers — a curated allowlist of `<React/...>` headers the
 *     umbrella (R4) excludes (they are `+`-suffixed and/or objc-blocked) — are
 *     added to the React framework module map so privileged consumers can reach
 *     them. The allowlist fails closed on drift (validatePrivateReactHeaders).
 * R10. Per-namespace umbrella headers are emitted into ReactNativeHeaders so
 *     consumers that import a whole namespace (e.g. Expo) get one entry point;
 *     each is derived from namespaceModules (R5) so it cannot drift.
 * R11. ONE source file, ONE content location. Some sources ship under several
 *     spellings (React/X.h + a legacy pod-namespace form like CoreModules/X.h,
 *     or a bare root alias + React_RCTAppDelegate/X.h). Under the VFS overlay
 *     all spellings mapped to one physical file, so #import-once and module
 *     ownership were coherent. The flattened layout would duplicate the
 *     declarations — any -fmodules consumer touching two spellings (even
 *     transitively: a legacy-spelling import whose header pulls a modular
 *     <React/...>) hits redefinition errors. Therefore: the MODULE-OWNED
 *     spelling keeps the content (the React/ form when it exists — it is the
 *     umbrella/module-React owner or the canonical textual home; else the
 *     R5-module namespaced form), and every other spelling is emitted as a
 *     one-line redirect shim (`#import <owner>`). Shims that are namespace-
 *     module members are fine: they import the owning module, so declarations
 *     stay single-owned.
 */

const fs = require('fs');
const path = require('path');

// Fallback root only — inventory `source` paths are relative to the root the
// inventory was computed from, so callers with a different tree (SPM tooling,
// headers-inventory --root) must pass that root to planFromInventory.
const RN_ROOT = path.join(__dirname, '..', '..');

/*::
export type SpecEntry = {
  relPath: string, // destination under the artifact's Headers root
  source: string, // repo-relative source file
  naturalPath: string, // canonical include identity (inventory key)
  // R11: when set, the destination is a one-line redirect shim
  // (`#import <redirectTo>`) instead of a copy of the source file.
  redirectTo?: string,
};

export type HeadersSpecPlan = {
  // React.xcframework -> React.framework/Headers (R1)
  react: Array<SpecEntry>,
  // ReactNativeHeaders.xcframework -> Headers (R2); deps namespaces are
  // added by the emitter from the deps artifact (not per-file here).
  reactNativeHeaders: Array<SpecEntry>,
  depsNamespaces: Array<string>,
  // R4: umbrella header list (React/-relative paths)
  umbrella: Array<string>,
  // R5: plain modules for ReactNativeHeaders' module.modulemap
  namespaceModules: {[ns: string]: Array<string>},
  // R10: per-namespace umbrella headers emitted into ReactNativeHeaders.
  namespaceUmbrellas: Array<{relPath: string, content: string}>,
  // R9: private headers added to the React module map (allowlist).
  privateReactHeaders: {modular: Array<string>, textual: Array<string>},
  collisions: Array<string>,
};
*/

// R2: the third-party deps namespaces — the exact contents of the
// ReactNativeDependenciesHeaders sidecar, and the exact set of namespace dirs
// the deps artifact's Headers/ ships. The sidecar emitter fails closed on a
// missing OR an undeclared namespace (set equality), the headers gate asserts
// these stay ABSENT from ReactNativeHeaders (one physical home per
// namespace — relocated copies collided with real pods' own headers: the
// SocketRocket duplicate-@interface / poisoned-module-graph Expo regression,
// 2026-07-03), and the include classifier (headers-inventory.js
// THIRD_PARTY_LIBS) derives from this same list.
const DEPS_NAMESPACES = [
  'folly',
  'glog',
  'boost',
  'fmt',
  'double-conversion',
  'fast_float',
  'SocketRocket',
];

// R4/R5 umbrella exclusion: C extern-inline definitions.
const EXTERN_INLINE_RE /*: RegExp */ =
  /\b(RCT_EXTERN\s+inline|extern\s+inline)\b/;

const MODULE_IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

// R9: Private React headers — a curated allowlist of `<React/...>` headers that
// privileged framework consumers (e.g. Expo) import, but which the public
// umbrella (R4) excludes (they are `+`-suffixed and/or objc-blocked). They are
// already shipped in React.framework/Headers; adding them to the React module
// map keeps the existing `#import <React/...>` sites MODULAR under explicit
// modules — backwards-compatible, no consumer import (or Swift) changes. Split
// by inventory bucket:
//   - modular: objc-modular-candidate (reach no C++) -> real `header`.
//   - textual: objc-blocked (reach C++ via `<react/...>`) -> `textual header`
//     (a real member would re-trip -Wnon-modular-include; the C++ includes
//     resolve at the consumer's use site, exactly as under the old VFS overlay).
// Privacy is by convention (the `+Private`/internal naming): a single binary
// artifact cannot hard-gate apps from headers a framework legitimately needs.
const PRIVATE_REACT_HEADERS /*: {modular: Array<string>, textual: Array<string>} */ =
  {
    modular: ['RCTBridge+Private.h'],
    textual: [
      'RCTComponentViewFactory.h',
      'RCTComponentViewProtocol.h',
      'RCTComponentViewRegistry.h',
      'RCTMountingManager.h',
      'RCTSurfacePresenter.h',
      'RCTViewComponentView.h',
    ],
  };

// Fail closed if an allowlisted private header drifts: it must exist in the
// inventory (else it was removed/renamed in source — e.g. RCTUIKit.h /
// RCTRootContentView.h, which need restoration, NOT this allowlist), and a
// `modular` entry must really be objc-modular-candidate (else it now reaches
// C++/third-party and must move to `textual`).
function validatePrivateReactHeaders(manifest /*: any */) /*: void */ {
  const byNatural = new Map(manifest.headers.map(h => [h.naturalPath, h]));
  const requireShipped = (name /*: string */) => {
    const e = byNatural.get(`React/${name}`);
    if (e == null) {
      throw new Error(
        `Private React header allowlist: React/${name} is absent from the ` +
          `inventory (removed/renamed in source?). Restore the header or remove ` +
          `it from PRIVATE_REACT_HEADERS.`,
      );
    }
    return e;
  };
  for (const name of PRIVATE_REACT_HEADERS.modular) {
    const e = requireShipped(name);
    if (e.bucket !== 'objc-modular-candidate') {
      throw new Error(
        `Private React header React/${name} is bucket '${e.bucket}', not ` +
          `'objc-modular-candidate' — it now reaches C++/third-party. Move it ` +
          `to PRIVATE_REACT_HEADERS.textual.`,
      );
    }
  }
  for (const name of PRIVATE_REACT_HEADERS.textual) {
    requireShipped(name);
  }
}

function isUmbrellaSafe(h /*: any */, rnRoot /*: string */) /*: boolean */ {
  if (h.bucket !== 'objc-modular-candidate' || h.naturalPath.includes('+')) {
    return false;
  }
  try {
    return !EXTERN_INLINE_RE.test(
      fs.readFileSync(path.join(rnRoot, h.identities[0].source), 'utf8'),
    );
  } catch {
    return false;
  }
}

// R10: per-namespace umbrella headers. Some consumers (e.g. Expo's
// RCTAppDelegateUmbrella.h) probe
// `<React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h>` via __has_include.
// The flattened ReactNativeHeaders layout (R2/R5) ships the individual
// namespace headers but no umbrella, so the probe fails and e.g.
// RCTReactNativeFactory / RCTRootViewFactory are never declared. Re-emit a
// per-namespace umbrella for the namespaces consumers probe — content DERIVED
// from namespaceModules (R5) so it can't drift — and add it to that
// namespace's module so the import stays modular under explicit modules.
// Targeted (not all namespaces): only those a consumer imports as
// `<ns/ns-umbrella.h>`. Extend as the ecosystem surfaces more.
const UMBRELLA_NAMESPACES /*: Array<string> */ = ['React_RCTAppDelegate'];

// Renders a per-namespace umbrella that re-imports the namespace's modular
// headers. Paths are relative to the namespace dir (where the umbrella lives),
// so the first `<ns>/` segment is stripped.
function renderNamespaceUmbrella(
  ns /*: string */,
  headers /*: Array<string> */,
) /*: string */ {
  const imports = headers
    .map(np => `#import "${np.slice(ns.length + 1)}"`)
    .join('\n');
  return `#ifdef __OBJC__\n#import <UIKit/UIKit.h>\n#endif\n\n${imports}\n`;
}

/**
 * Computes the full layout plan from the header inventory manifest
 * (build/header-inventory.json — regenerate with header-inventory.js).
 * `rnRoot` is the tree the inventory's relative `source` paths resolve
 * against; defaults to the manifest's recorded root, then to the package
 * hosting this script.
 */
function planFromInventory(
  manifest /*: any */,
  rnRoot /*:: ?: string */,
) /*: HeadersSpecPlan */ {
  const root = rnRoot ?? manifest.root ?? RN_ROOT;
  validatePrivateReactHeaders(manifest); // R9: fail closed on allowlist drift
  const react /*: Array<SpecEntry> */ = [];
  const reactNativeHeaders /*: Array<SpecEntry> */ = [];
  const umbrella /*: Array<string> */ = [];
  const namespaceModules /*: {[string]: Array<string>} */ = {};
  const collisions /*: Array<string> */ = [];
  const seen /*: Map<string, string> */ = new Map();

  for (const h of manifest.headers) {
    const np = h.naturalPath;
    const source = h.identities[0].source;
    let bucketKey;
    let entryList;
    let relPath;
    if (np.startsWith('React/')) {
      relPath = np.slice(6); // R1: hoist React/ to the framework Headers root
      bucketKey = `React.framework/${relPath}`;
      entryList = react;
    } else if (!np.includes('/')) {
      relPath = np; // R1/R6: bare alias at root
      bucketKey = `React.framework/${relPath}`;
      entryList = react;
    } else {
      // R2: every other namespace (incl. react/) keeps its prefix and is
      // served from ReactNativeHeaders via the header search path.
      relPath = np;
      bucketKey = `ReactNativeHeaders/${relPath}`;
      entryList = reactNativeHeaders;
    }
    const prev = seen.get(bucketKey);
    if (prev != null) {
      if (prev !== source) {
        collisions.push(`${bucketKey}: ${prev} vs ${source}`); // R8
      }
      continue;
    }
    seen.set(bucketKey, source);
    entryList.push({relPath, source, naturalPath: np});

    // R4: React umbrella membership.
    if (np.startsWith('React/') && isUmbrellaSafe(h, root)) {
      umbrella.push(np);
    }
    // R5: namespace modules (only for ReactNativeHeaders namespaces). Every
    // namespace with modular candidates gets a module so that React.framework's
    // modular headers can `#import <ns/...>` as a MODULAR include (otherwise
    // clang's -Wnon-modular-include-in-framework-module rejects it). `react/` is
    // included here too — its module is renamed in renderNamespaceModuleMap so a
    // `react` module never aliases the `React` framework module on a
    // case-insensitive filesystem.
    if (entryList === reactNativeHeaders) {
      const ns = np.split('/')[0];
      if (isUmbrellaSafe(h, root)) {
        // R5 exemption assert: a namespace whose name is not a valid module
        // identifier cannot get a module, so a modular-candidate header in it
        // would be silently non-modular — consumers importing it from a
        // framework-module context hit -Wnon-modular-include downstream.
        // Fail here instead: rename the namespace or keep the header out of
        // the modular surface.
        if (!MODULE_IDENT_RE.test(ns)) {
          throw new Error(
            `R5: namespace '${ns}' is not a valid module identifier but ` +
              `ships a modular-candidate header (${np}). It cannot get a ` +
              `namespace module, so the header would be silently ` +
              `non-modular for consumers.`,
          );
        }
        if (!namespaceModules[ns]) {
          namespaceModules[ns] = [];
        }
        namespaceModules[ns].push(np);
      }
    }
  }

  umbrella.sort();
  for (const ns of Object.keys(namespaceModules)) {
    namespaceModules[ns].sort();
  }

  // R11: assign redirect shims for duplicate spellings of one source.
  // Owner precedence: the React/ form (module React / canonical textual home)
  // when the source ships one; else the RNH namespaced form (the R5-module
  // owner — bare root aliases redirect INTO it, since content must live at
  // the module-owned spelling or dual-module/dual-copy redefinitions return).
  const reactBySource /*: Map<string, string> */ = new Map();
  for (const e of react) {
    if (e.naturalPath.startsWith('React/')) {
      reactBySource.set(e.source, e.relPath);
    }
  }
  const rnhBySource /*: Map<string, string> */ = new Map();
  for (const e of reactNativeHeaders) {
    if (!rnhBySource.has(e.source)) {
      rnhBySource.set(e.source, e.naturalPath);
    }
  }
  for (const e of reactNativeHeaders) {
    const reactForm = reactBySource.get(e.source);
    if (reactForm != null) {
      e.redirectTo = `React/${reactForm}`;
    } else {
      // Two RNH spellings of one source with no React/ form: the first is
      // the owner, later ones shim to it.
      const owner = rnhBySource.get(e.source);
      if (owner != null && owner !== e.naturalPath) {
        e.redirectTo = owner;
      }
    }
  }
  for (const e of react) {
    if (e.naturalPath.includes('/')) {
      continue; // real React/ content, never a shim
    }
    // Bare root alias: prefer the React/ owner (three-spelling case), else
    // the RNH namespaced sibling (the React_RCTAppDelegate rule).
    const reactForm = reactBySource.get(e.source);
    const nsForm = rnhBySource.get(e.source);
    if (reactForm != null) {
      e.redirectTo = `React/${reactForm}`;
    } else if (nsForm != null) {
      e.redirectTo = nsForm;
    }
  }

  // R10: fail closed if a probed umbrella namespace lost all its modular
  // headers (removed/renamed) — the umbrella would silently vanish and
  // re-break consumers like Expo.
  const namespaceUmbrellas = UMBRELLA_NAMESPACES.map(ns => {
    const headers = namespaceModules[ns];
    if (headers == null || headers.length === 0) {
      throw new Error(
        `R10: umbrella namespace '${ns}' has no modular headers in the ` +
          `inventory (removed/renamed?). Update UMBRELLA_NAMESPACES.`,
      );
    }
    return {
      relPath: `${ns}/${ns}-umbrella.h`,
      content: renderNamespaceUmbrella(ns, headers),
    };
  });

  return {
    react,
    reactNativeHeaders,
    depsNamespaces: DEPS_NAMESPACES,
    umbrella,
    namespaceModules,
    namespaceUmbrellas,
    privateReactHeaders: PRIVATE_REACT_HEADERS,
    collisions,
  };
}

/**
 * Renders React.framework's module map (R4 + R9). The umbrella covers the
 * public modular surface; the allowlisted private headers (R9) are appended as
 * explicit `header` (modular) / `textual header` (objc-blocked) entries so
 * `#import <React/...>` of them stays modular without polluting the umbrella.
 */
function renderReactModuleMap(
  privateReactHeaders /*:: ?: {modular: Array<string>, textual: Array<string>} */,
) /*: string */ {
  const pv = privateReactHeaders ?? {modular: [], textual: []};
  const extra = [
    ...pv.modular.map(h => `  header "${h}"`),
    ...pv.textual.map(h => `  textual header "${h}"`),
  ];
  const extraBlock = extra.length > 0 ? '\n' + extra.join('\n') : '';
  return `framework module React {
  umbrella header "React-umbrella.h"${extraBlock}
  export *
  module * { export * }
}
`;
}

/** Renders the umbrella header content (R4). */
function renderUmbrellaHeader(umbrella /*: Array<string> */) /*: string */ {
  return umbrella.map(u => `#import <${u}>`).join('\n') + '\n';
}

/**
 * Renders ReactNativeHeaders' module.modulemap (R5): PLAIN (non-framework)
 * modules, one per namespace with modular candidates — discovered implicitly
 * by clang via the auto-added header search path. Headers are referenced by
 * their path relative to the Headers root (= the modulemap's directory).
 */
function renderNamespaceModuleMap(
  namespaceModules /*: {[string]: Array<string>} */,
) /*: string */ {
  // The module NAME is internal to clang's module graph (consumers never
  // `@import` these; they `#import <ns/...>` and clang maps the header to its
  // module). It only has to be unique and must not alias the `React` framework
  // module on a case-insensitive filesystem — so the lowercase `react`
  // namespace is given a distinct module name. Header paths are unchanged, so
  // `<react/...>` still resolves and is now a modular include.
  const moduleNameFor = (ns /*: string */) /*: string */ =>
    ns === 'react' ? 'ReactNativeHeaders_react' : ns;
  const blocks = [];
  for (const ns of Object.keys(namespaceModules).sort()) {
    const headerLines = namespaceModules[ns].map(hh => `  header "${hh}"`);
    // R10: the per-namespace umbrella is itself a module member, so importing
    // it stays modular (otherwise it re-trips -Wnon-modular-include inside the
    // consumer's framework module).
    if (UMBRELLA_NAMESPACES.includes(ns)) {
      headerLines.push(`  header "${ns}/${ns}-umbrella.h"`);
    }
    blocks.push(
      `module ${moduleNameFor(ns)} {\n` +
        headerLines.join('\n') +
        `\n  export *\n}`,
    );
  }
  return blocks.join('\n\n') + '\n';
}

module.exports = {
  planFromInventory,
  renderReactModuleMap,
  renderUmbrellaHeader,
  renderNamespaceModuleMap,
  DEPS_NAMESPACES,
};
