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
 * Inventory and classify every header the React xcframework ships — the input
 * to the headers spec (headers-spec.js).
 *
 * Enumerates headers through the SAME podspec-driven discovery the prebuild
 * uses (headers.js), so the inventory cannot drift from the shipped set. For
 * each header it records:
 *
 *  - both identities: the pod-namespaced layout path (`Headers/<Pod>/<target>`)
 *    and the natural path (the include path consumers write)
 *  - language surface: objc | objcxx | cxx | c (with `#ifdef __cplusplus`
 *    guard awareness, so ObjC headers that only reach C++ behind guards are
 *    not misclassified)
 *  - a modularizability bucket (can this header live in a Clang module?)
 *
 * `computeInventory()` returns the classified set in-memory for the prebuild
 * compose step; the CLI (`node scripts/ios-prebuild/headers-inventory.js`)
 * writes the same set as a JSON manifest. Read-only: never touches the trees
 * it describes.
 */

const {getHeaderFilesFromPodspecs} = require('./headers');
// headers-spec.js requires only fs/path, so this cannot cycle.
const {DEPS_NAMESPACES} = require('./headers-spec');
const fs = require('fs');
const path = require('path');

/*::
type Identity = {
  pod: string, // pod folder name in Headers/ (specName with '-' -> '_')
  spec: string, // (sub)spec name the header came from
  namespacedPath: string, // path inside the xcframework Headers/ dir
  source: string, // repo-relative path to the physical file
  bareAlias?: boolean, // synthetic root-level alias (React_RCTAppDelegate rule)
};

type IncludeRef = {
  token: string, // text between <> or ""
  cxxGuarded: boolean, // true when only reachable under #ifdef __cplusplus
};

type HeaderEntry = {
  naturalPath: string,
  identities: Array<Identity>,
  lang: 'objc' | 'objcxx' | 'cxx' | 'c',
  bucket: 'objc-modular-candidate' | 'objc-blocked' | 'objcxx' | 'cxx',
  includes: {
    internal: Array<{naturalPath: string, cxxGuarded: boolean}>,
    thirdParty: Array<{lib: string, token: string, cxxGuarded: boolean}>,
    hermes: Array<string>,
    system: Array<string>,
    std: Array<{token: string, cxxGuarded: boolean}>,
    metaInternal: Array<string>,
    otherPlatform: Array<string>,
    notShipped: Array<string>,
    unresolved: Array<string>,
    // Quoted includes that do not resolve to a shipped header. Fine inside the
    // framework binary's own compilation, but a consumer compiling the shipped
    // header hits "file not found" (source builds mask this via pod header
    // maps). Gated by the include-health ratchet (headers-verify.js).
    quotedNotShipped: Array<string>,
  },
};
*/
// Third-party C++ libraries that RN's public headers re-expose (Tier 3 of the
// modularization doc). Keyed by the first include-path segment. Single source
// of truth: the spec's DEPS_NAMESPACES (the ReactNativeDependenciesHeaders
// sidecar's namespace set) — a new third-party dep is declared ONCE and the
// include classifier, the sidecar emitter, and the headers gate all follow.
const THIRD_PARTY_LIBS /*: Set<string> */ = new Set(DEPS_NAMESPACES);

// Apple SDK / platform include roots (first path segment). Includes resolving
// here are "system": always modular or always available, never our problem.
const SDK_PREFIXES = new Set([
  'Accelerate',
  'Accessibility',
  'AVFoundation',
  'AVKit',
  'CFNetwork',
  'CommonCrypto',
  'CoreFoundation',
  'CoreGraphics',
  'CoreLocation',
  'CoreMedia',
  'CoreServices',
  'CoreText',
  'CoreVideo',
  'Foundation',
  'ImageIO',
  'JavaScriptCore',
  'MachO',
  'Metal',
  'MetalKit',
  'MobileCoreServices',
  'Network',
  'PhotosUI',
  'QuartzCore',
  'SafariServices',
  'Security',
  'SwiftUI',
  'TargetConditionals.h',
  'UIKit',
  'UserNotifications',
  'WebKit',
  'XCTest',
  'arm',
  'dispatch',
  'libkern',
  'mach',
  'mach-o',
  'malloc',
  'objc',
  'os',
  'simd',
  'sys',
]);

/**
 * Scans a header's text line by line, tracking the preprocessor-conditional
 * stack just enough to know whether a line is only compiled under
 * `__cplusplus`. Returns the include list and language-marker observations.
 * Heuristic by design: nested #if logic beyond __cplusplus is treated as
 * "other" and ignored.
 */
function scanHeader(text /*: string */) /*: {
  includes: Array<IncludeRef>,
  hasObjC: boolean,
  hasUnguardedCxx: boolean,
  hasGuardedCxx: boolean,
} */ {
  const includes /*: Array<IncludeRef> */ = [];
  let hasObjC = false;
  let hasUnguardedCxx = false;
  let hasGuardedCxx = false;

  // Stack frames: 'cpp' (only under __cplusplus), 'notcpp', 'other'.
  const stack /*: Array<'cpp' | 'notcpp' | 'other'> */ = [];
  const inCxxOnly = () => stack.includes('cpp');

  const includeRe = /^\s*#\s*(?:include|import)\s+(?:<([^>]+)>|"([^"]+)")/;
  const objcRe =
    /^\s*(@(interface|protocol|implementation|class\s|end)|NS_ASSUME_NONNULL_BEGIN)/;
  const cxxRe =
    /^\s*(namespace\s+[A-Za-z_]|template\s*<|extern\s+"C\+\+"|enum\s+class\b|constexpr\b|using\s+(namespace\s|[A-Za-z_]\w*\s*=))/;

  // Track /* ... */ block comments across lines so a documentation line inside
  // a comment (e.g. `namespace`, `template <`, `constexpr`) can't trip the C++
  // detector below and needlessly shrink the umbrella.
  let inBlockComment = false;
  for (const rawLine of text.split('\n')) {
    let line = rawLine;
    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end === -1) {
        continue; // whole line still inside a block comment
      }
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    // Drop complete inline block comments, then line comments (which also
    // swallow any `/*` living inside a `//` comment), then detect a block
    // comment that opens and runs onto the next line.
    line = line.replace(/\/\*.*?\*\//g, '');
    line = line.replace(/\/\/.*$/, '');
    const blockOpen = line.indexOf('/*');
    if (blockOpen !== -1) {
      inBlockComment = true;
      line = line.slice(0, blockOpen);
    }
    const cond = line.match(/^\s*#\s*(if|ifdef|ifndef|elif|else|endif)\b(.*)$/);
    if (cond) {
      const [, directive, rest] = cond;
      const mentionsCpp = /__cplusplus/.test(rest);
      if (directive === 'ifdef' || directive === 'if') {
        stack.push(
          mentionsCpp &&
            !/!\s*defined|defined\s*\(\s*__cplusplus\s*\)\s*==\s*0/.test(rest)
            ? 'cpp'
            : 'other',
        );
      } else if (directive === 'ifndef') {
        stack.push(mentionsCpp ? 'notcpp' : 'other');
      } else if (directive === 'else') {
        const top = stack.pop() ?? 'other';
        stack.push(
          top === 'cpp' ? 'notcpp' : top === 'notcpp' ? 'cpp' : 'other',
        );
      } else if (directive === 'elif') {
        stack.pop();
        stack.push(mentionsCpp ? 'cpp' : 'other');
      } else if (directive === 'endif') {
        stack.pop();
      }
      continue;
    }

    const inc = line.match(includeRe);
    if (inc) {
      includes.push({
        token: inc[1] != null ? inc[1] : `"${inc[2]}"`,
        cxxGuarded: inCxxOnly(),
      });
    }
    if (objcRe.test(line)) {
      hasObjC = true;
    }
    if (cxxRe.test(line)) {
      if (inCxxOnly()) {
        hasGuardedCxx = true;
      } else {
        hasUnguardedCxx = true;
      }
    }
  }

  // C++ default member initializer inside an aggregate, e.g.
  //   struct RCTFontProperties { NSString *family = nil; CGFloat size = NAN; };
  // Illegal in C/ObjC, so the header is really ObjC++ and cannot compile in a
  // plain ObjC module. The keyword scan above misses it (no namespace/template/
  // class keyword). Detect a `struct`/`class` body that contains a member
  // declaration carrying an `=` initializer. Whole-text (not per-line) so the
  // aggregate context is required, avoiding false positives on file-scope
  // definitions. Unguarded by construction (definitions can't sit under a
  // pure `#ifdef __cplusplus` and still be the ObjC surface). The tag name is
  // optional so an anonymous `typedef struct { CGFloat x = NAN; } Foo;` is
  // caught too (a named aggregate is not required for the ObjC++ surface).
  const aggregateMemberInitRe =
    /\b(?:struct|class)\b(?:\s+[A-Za-z_]\w*)?[^;{}]*\{[^{}]*?\b[A-Za-z_][\w\s:<>,]*\**\s+\*?[A-Za-z_]\w*\s*=\s*[^;{}]+;/s;
  if (aggregateMemberInitRe.test(text)) {
    hasUnguardedCxx = true;
  }

  return {includes, hasObjC, hasUnguardedCxx, hasGuardedCxx};
}

// Meta-internal headers referenced behind RN_DISABLE_OSS_PLUGIN_HEADER (the
// FB*Plugins pattern) or fbjni/FBI18n — never resolvable in OSS, by design.
const META_INTERNAL_RE /*: RegExp */ =
  /^(fbjni|FBI18n)\/|^React\/FB\w+Plugins\.h$/;
// Non-Apple platform headers (Android-only branches in shared headers).
const OTHER_PLATFORM_PREFIXES = new Set(['android', 'jni']);

// C++ standard library headers have no slash and no extension (<memory>);
// C standard headers have no slash and a .h (<stdio.h>).
function classifyExternal(
  token /*: string */,
  ownNamespaces /*: Set<string> */,
  rootFolder /*: string */,
) /*: string */ {
  const first = token.split('/')[0];
  if (THIRD_PARTY_LIBS.has(first)) {
    return 'thirdParty';
  }
  if (first === 'hermes') {
    return 'hermes';
  }
  if (META_INTERNAL_RE.test(token)) {
    return 'metaInternal';
  }
  if (OTHER_PLATFORM_PREFIXES.has(first)) {
    return 'otherPlatform';
  }
  if (!token.includes('/')) {
    return token.endsWith('.h') ? 'system' : 'std';
  }
  if (SDK_PREFIXES.has(first)) {
    return 'system';
  }
  // RN's own include namespace but absent from the shipped set: either a
  // genuinely unshipped header or a header_dir-flattening mismatch (headers.js
  // ships <dir>/<basename>, dropping inner subdirs like mounting/stubs/).
  if (
    ownNamespaces.has(first) ||
    fs.existsSync(path.join(rootFolder, 'ReactCommon', token))
  ) {
    return 'notShipped';
  }
  return 'unresolved';
}

function buildInventory(rootFolder /*: string */) /*: {
  entries: Map<string, HeaderEntry>,
  sourceToNatural: Map<string, Array<string>>,
  collisions: Array<{naturalPath: string, sources: Array<string>}>,
} */ {
  const podSpecsWithHeaderFiles = getHeaderFilesFromPodspecs(rootFolder);

  // naturalPath -> entry skeleton; absolute source -> naturalPaths it serves.
  const entries /*: Map<string, HeaderEntry> */ = new Map();
  const sourceToNatural /*: Map<string, Array<string>> */ = new Map();
  const naturalToSources /*: Map<string, Set<string>> */ = new Map();

  const addIdentity = (
    naturalPath /*: string */,
    identity /*: Identity */,
    absSource /*: string */,
  ) => {
    let entry = entries.get(naturalPath);
    if (!entry) {
      entry = {
        naturalPath,
        identities: [],
        lang: 'c',
        bucket: 'cxx',
        includes: {
          internal: [],
          thirdParty: [],
          hermes: [],
          system: [],
          std: [],
          metaInternal: [],
          otherPlatform: [],
          notShipped: [],
          unresolved: [],
          quotedNotShipped: [],
        },
      };
      entries.set(naturalPath, entry);
    }
    entry.identities.push(identity);

    const naturals = sourceToNatural.get(absSource) ?? [];
    if (!naturals.includes(naturalPath)) {
      naturals.push(naturalPath);
    }
    sourceToNatural.set(absSource, naturals);

    const sources = naturalToSources.get(naturalPath) ?? new Set();
    sources.add(absSource);
    naturalToSources.set(naturalPath, sources);
  };

  for (const podspecPath of Object.keys(podSpecsWithHeaderFiles)) {
    const headerMaps = podSpecsWithHeaderFiles[podspecPath];
    // xcframework.js and vfs.js both use the ROOT spec's name (first map) as
    // the pod folder, with the same first-occurrence '-' -> '_' replacement.
    const podName = headerMaps[0].specName.replace(/-/g, '_');

    for (const headerMap of headerMaps) {
      for (const header of headerMap.headers) {
        // Some header patterns are written as *.{m,mm,cpp,h}; only headers ship.
        if (!/\.(h|hpp)$/.test(header.source)) {
          continue;
        }
        // Natural path = the VFS key: the podspec target, with root-level
        // targets of header_dir-less pods prefixed by the pod name (vfs.js rule).
        let naturalPath = header.target;
        if (
          !naturalPath.includes('/') &&
          (!headerMap.headerDir || headerMap.headerDir === '')
        ) {
          naturalPath = `${podName}/${naturalPath}`;
        }
        const identity /*: Identity */ = {
          pod: podName,
          spec: headerMap.specName,
          namespacedPath: path.join(podName, header.target),
          source: path.relative(rootFolder, header.source),
        };
        addIdentity(naturalPath, identity, header.source);

        // The merged ReactCoreHeaders tree ALSO exposes React_RCTAppDelegate
        // headers bare at the root (hosts write #import <RCTDefaultReactNativeFactoryDelegate.h>).
        // Model that second identity explicitly.
        if (podName === 'React_RCTAppDelegate') {
          addIdentity(
            path.basename(header.target),
            {
              ...identity,
              bareAlias: true,
            },
            header.source,
          );
        }
      }
    }
  }

  const collisions = [];
  for (const [naturalPath, sources] of naturalToSources) {
    if (sources.size > 1) {
      collisions.push({
        naturalPath,
        sources: Array.from(sources)
          .map(s => path.relative(rootFolder, s))
          .sort(),
      });
    }
  }
  collisions.sort((a, b) => a.naturalPath.localeCompare(b.naturalPath));

  return {entries, sourceToNatural, collisions};
}

function classifyEntries(
  entries /*: Map<string, HeaderEntry> */,
  sourceToNatural /*: Map<string, Array<string>> */,
  rootFolder /*: string */,
) /*: void */ {
  // RN's own top-level include namespaces, derived from the shipped set, so
  // "in our namespace but not shipped" is detectable.
  const ownNamespaces = new Set(
    Array.from(entries.keys())
      .map(p => p.split('/')[0])
      .filter(p => p.includes('.') === false),
  );

  // Scan each entry's primary source once.
  for (const entry of entries.values()) {
    const absSource = path.join(rootFolder, entry.identities[0].source);
    let text;
    try {
      text = fs.readFileSync(absSource, 'utf8');
    } catch {
      entry.includes.unresolved.push('<unreadable source>');
      continue;
    }
    const scan = scanHeader(text);
    const isHpp = absSource.endsWith('.hpp');
    if (scan.hasObjC && scan.hasUnguardedCxx) {
      entry.lang = 'objcxx';
    } else if (scan.hasObjC) {
      entry.lang = 'objc';
    } else if (scan.hasUnguardedCxx || isHpp) {
      entry.lang = 'cxx';
    } else {
      entry.lang = 'c';
    }

    for (const inc of scan.includes) {
      let token = inc.token;
      // Quoted include: resolve against the source dir and map back to a
      // natural path if the resolved file is itself a shipped header.
      if (token.startsWith('"')) {
        const resolved = path.resolve(
          path.dirname(absSource),
          token.slice(1, -1),
        );
        const naturals = sourceToNatural.get(resolved);
        if (naturals && naturals.length > 0) {
          entry.includes.internal.push({
            naturalPath: naturals[0],
            cxxGuarded: inc.cxxGuarded,
          });
        } else {
          // A quoted include in a SHIPPED header that doesn't land on another
          // shipped header: works in source builds (pod header maps / sibling
          // files) but has no resolution target in the packaged layout when a
          // consumer compiles this header. Recorded for the include-health
          // ratchet rather than silently dropped.
          entry.includes.quotedNotShipped.push(token);
        }
        continue;
      }
      if (entries.has(token)) {
        entry.includes.internal.push({
          naturalPath: token,
          cxxGuarded: inc.cxxGuarded,
        });
        continue;
      }
      const kind = classifyExternal(token, ownNamespaces, rootFolder);
      if (kind === 'thirdParty') {
        entry.includes.thirdParty.push({
          lib: token.split('/')[0],
          token,
          cxxGuarded: inc.cxxGuarded,
        });
      } else if (kind === 'hermes') {
        entry.includes.hermes.push(token);
      } else if (kind === 'system') {
        entry.includes.system.push(token);
      } else if (kind === 'std') {
        entry.includes.std.push({token, cxxGuarded: inc.cxxGuarded});
      } else if (kind === 'metaInternal') {
        entry.includes.metaInternal.push(token);
      } else if (kind === 'otherPlatform') {
        entry.includes.otherPlatform.push(token);
      } else if (kind === 'notShipped') {
        entry.includes.notShipped.push(token);
      } else {
        entry.includes.unresolved.push(token);
      }
    }
  }

  // Fixpoint over UNGUARDED edges only: what an Obj-C (non-C++) consumer of
  // this header actually pulls in. Decides modularizability of the ObjC surface.
  const reachesCxx /*: Map<string, boolean> */ = new Map();
  const reachesTp /*: Map<string, Set<string>> */ = new Map();
  for (const [naturalPath, entry] of entries) {
    reachesCxx.set(
      naturalPath,
      entry.lang === 'cxx' ||
        entry.lang === 'objcxx' ||
        entry.includes.std.some(s => !s.cxxGuarded),
    );
    reachesTp.set(
      naturalPath,
      new Set(
        entry.includes.thirdParty.filter(t => !t.cxxGuarded).map(t => t.lib),
      ),
    );
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [naturalPath, entry] of entries) {
      let cxx = reachesCxx.get(naturalPath) ?? false;
      const tp = reachesTp.get(naturalPath) ?? new Set();
      const beforeCxx = cxx;
      const beforeTp = tp.size;
      for (const dep of entry.includes.internal) {
        if (dep.cxxGuarded) {
          continue;
        }
        cxx = cxx || (reachesCxx.get(dep.naturalPath) ?? false);
        for (const lib of reachesTp.get(dep.naturalPath) ?? []) {
          tp.add(lib);
        }
      }
      if (cxx !== beforeCxx || tp.size !== beforeTp) {
        reachesCxx.set(naturalPath, cxx);
        reachesTp.set(naturalPath, tp);
        changed = true;
      }
    }
  }

  for (const [naturalPath, entry] of entries) {
    if (entry.lang === 'cxx') {
      entry.bucket = 'cxx';
    } else if (entry.lang === 'objcxx') {
      entry.bucket = 'objcxx';
    } else {
      const cxx = reachesCxx.get(naturalPath) ?? false;
      const tp = Array.from(reachesTp.get(naturalPath) ?? []).sort();
      if (!cxx && tp.length === 0) {
        entry.bucket = 'objc-modular-candidate';
      } else {
        entry.bucket = 'objc-blocked';
      }
    }
  }
}

function main() /*: void */ {
  const argv = process.argv.slice(2);
  const getFlag = (name /*: string */) /*: ?string */ => {
    const i = argv.indexOf(name);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
  };
  const rootFolder = path.resolve(
    getFlag('--root') ?? path.join(__dirname, '..', '..'),
  );
  const outPath = path.resolve(
    getFlag('--out') ?? path.join(rootFolder, 'build', 'header-inventory.json'),
  );

  const {entries, sourceToNatural, collisions} = buildInventory(rootFolder);
  classifyEntries(entries, sourceToNatural, rootFolder);
  const headers = Array.from(entries.values()).sort((a, b) =>
    a.naturalPath.localeCompare(b.naturalPath),
  );

  const manifest = {
    formatVersion: 1,
    generatedBy: 'scripts/ios-prebuild/headers-inventory.js',
    root: rootFolder,
    totals: {headers: headers.length},
    collisions,
    headers,
  };

  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${headers.length} headers to ${outPath}`);
}

if (require.main === module) {
  main();
}

/**
 * In-memory inventory for tooling that needs the classified header set
 * without going through the JSON manifest on disk (e.g. the prebuild compose
 * step feeding headers-spec.planFromInventory).
 */
function computeInventory(rootFolder /*: string */) /*: {
  headers: Array<HeaderEntry>,
  collisions: Array<{naturalPath: string, sources: Array<string>}>,
} */ {
  const {entries, sourceToNatural, collisions} = buildInventory(rootFolder);
  classifyEntries(entries, sourceToNatural, rootFolder);
  return {
    headers: Array.from(entries.values()).sort((a, b) =>
      a.naturalPath.localeCompare(b.naturalPath),
    ),
    // Natural-path collisions (two distinct sources mapping to the same
    // Headers/ path) are silently merged by addIdentity — planFromInventory
    // only keeps identities[0].source, so the second source is dropped. Surface
    // them so the compose gate can fail closed (R8) instead of regressing.
    collisions,
  };
}

module.exports = {
  buildInventory,
  classifyEntries,
  computeInventory,
  scanHeader,
  THIRD_PARTY_LIBS,
  META_INTERNAL_RE,
};
