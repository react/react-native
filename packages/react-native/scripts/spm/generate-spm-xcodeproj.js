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

/**
 * generate-spm-xcodeproj.js – Surgical, in-place Swift Package Manager
 * integration toolkit for an existing `<App>.xcodeproj`.
 *
 * `injectSpmIntoExistingXcodeproj` adds the SPM package references, React build
 * settings, the "Sync SPM Autolinking" build phase, and a scheme pre-action to
 * a user's existing project — purely additively, recording every edit in a
 * `.spm-injected.json` marker. `removeSpmInjection` is the exact inverse (used
 * by `spm deinit`). Consumed as a library by setup-apple-spm.js; not a CLI.
 */

const {readFlavoredFrameworksManifest} = require('./flavored-frameworks');
const {
  addArrayMembers,
  addArrayStringValues,
  ensureScalarField,
  findApplicationTargets,
  findField,
  findObjectByUuid,
  findProjectObject,
  insertObjectsIntoSection,
  namespacedUUID,
  quoteIfNeeded,
  removeArrayMembersByUuid,
  removeArrayStringValues,
  removeDanglingJavaScriptCoreRef,
  removeEmptyPodsGroup,
  removeField,
  removeObjectByUuid,
  serializeEntry,
  setScalarField,
} = require('./spm-pbxproj');
const {makeLogger, remotePackageConfig} = require('./spm-utils');
const fs = require('fs');
const path = require('path');

/*:: import type {
  FlavoredFrameworkManifestEntry,
  XcframeworkSlice,
} from './spm-types'; */

const {log} = makeLogger('generate-spm-xcodeproj');

// Sidecar inside a USER-OWNED xcodeproj that SPM packages were injected into in
// place. Records the host project's root UUID + every edit so `spm deinit`
// (removeSpmInjection) can surgically revert and re-runs stay idempotent.
const SPM_INJECTED_MARKER = '.spm-injected.json';

// Manifest of plugin-contributed sources that must COMPILE INTO THE APP TARGET
// (e.g. Expo's ExpoModulesProvider.swift — an `@objc` class only reaches the
// ObjC classlist, and so is discoverable via NSClassFromString, when it
// compiles into the app target, NOT the static Autolinked aggregate). Written
// by generate-spm-autolinking.js (the plugin merge) BEFORE setupXcodeproj runs
// on both `add` and `update`, so the injector reads it synchronously. Path is
// relative to the app root (== SRCROOT / the .xcodeproj's dir).
const SPM_GENERATED_SOURCES_MANIFEST = path.join(
  'build',
  'generated',
  'autolinking',
  '.spm-plugin-generated-sources.json',
);

// The single navigator group all injected generated sources are parented under
// (created on first use). Its namespacedUUID id + display name.
const SPM_GENERATED_SOURCES_GROUP_ID = 'SPMGeneratedSources';
const SPM_GENERATED_SOURCES_GROUP_NAME = 'SPM Generated Sources';

// pbxproj `lastKnownFileType` per source extension. v1 plugins emit Swift only;
// .m/.mm are mapped as future-proofing (the plugin contract permits ObjC/ObjC++
// sources). An unmapped extension is skipped with a loud log.
const GENERATED_SOURCE_FILE_TYPES /*: {[string]: string} */ = {
  '.swift': 'sourcecode.swift',
  '.m': 'sourcecode.c.objc',
  '.mm': 'sourcecode.cpp.objcpp',
};

// Maps each SPM product to its sub-package path (relative to app root).
// The xcodeproj must reference each sub-package directly so Xcode can
// resolve the product dependencies — SPM doesn't expose transitive products.
const SPM_PRODUCT_PACKAGES /*: Array<{product: string, packagePath: string, packageName: string}> */ =
  [
    {
      product: 'ReactHeaders',
      packagePath: 'build/xcframeworks',
      packageName: 'ReactNative',
    },
    {
      product: 'ReactNativeHeaders',
      packagePath: 'build/xcframeworks',
      packageName: 'ReactNative',
    },
    {
      product: 'ReactNativeDependenciesHeaders',
      packagePath: 'build/xcframeworks',
      packageName: 'ReactNative',
    },
    {
      product: 'Autolinked',
      packagePath: 'build/generated/autolinking',
      packageName: 'Autolinked',
    },
    {
      product: 'ReactCodegen',
      packagePath: 'build/generated/ios',
      packageName: 'React-GeneratedCode',
    },
    {
      product: 'ReactAppDependencyProvider',
      packagePath: 'build/generated/ios',
      packageName: 'React-GeneratedCode',
    },
  ];

/*::
type RemoteCfg = {url: string, version: string, identity: string};
// Precise record of the build-setting edits injection made to ONE build config,
// so deinit can reverse exactly those (and nothing the user already had).
type BuildSettingChange = {
  configUuid: string,
  createdArrayKeys: Array<string>,
  appendedArrayValues: {[string]: Array<string>},
  createdScalars: Array<string>,
  // Scalars whose pre-injection value was replaced (key → original raw
  // value), e.g. a ${PODS_ROOT}-anchored REACT_NATIVE_PATH that dangles once
  // CocoaPods is deintegrated. Deinit restores the original.
  replacedScalars?: {[string]: string},
};
// A plugin-contributed source, normalized for pbxproj emission. `path` is
// SRCROOT-relative when under the app root, else absolute; `sourceTree` is the
// matching pbxproj token ('SOURCE_ROOT' or '"<absolute>"').
type GeneratedSource = {path: string, name: string, sourceTree: string, fileType: string};
type SpmGraph = {
  uniquePackages: Array<{packagePath: string, packageName: string}>,
  localPkgRefs: Array<{uuid: string, packagePath: string, comment: string}>,
  remotePkgRef: ?{uuid: string, url: string, version: string, identity: string, comment: string},
  products: Array<{product: string, depUuid: string, buildFileUuid: string, pkgRefUuid: string, refComment: string}>,
};
*/

/**
 * Resolve the SPM dependency graph (package references + product
 * dependencies + their frameworks build files) from SPM_PRODUCT_PACKAGES.
 * `mkUuid(section, id)` supplies UUIDs, seeded with the host project's root
 * UUID so injected IDs are stable across re-runs and collision-safe.
 */
function buildSpmDependencyGraph(
  mkUuid /*: (section: string, id: string) => string */,
  remote /*: ?RemoteCfg */,
) /*: SpmGraph */ {
  // Remote mode: ReactNative-family products move to the remote package.
  const productPackages = SPM_PRODUCT_PACKAGES.map(e =>
    remote != null && e.packagePath === 'build/xcframeworks'
      ? {...e, packagePath: 'REMOTE', packageName: remote.identity}
      : e,
  );
  const uniquePackages = Array.from(
    new Map(
      productPackages
        .filter(e => e.packagePath !== 'REMOTE')
        .map(e => [
          e.packagePath,
          {packagePath: e.packagePath, packageName: e.packageName},
        ]),
    ).values(),
  );
  const localPkgRefs = uniquePackages.map(pkg => ({
    uuid: mkUuid('XCLocalSwiftPackageReference', pkg.packagePath),
    packagePath: pkg.packagePath,
    comment: `XCLocalSwiftPackageReference "${pkg.packagePath}"`,
  }));
  const remotePkgRef =
    remote != null
      ? {
          uuid: mkUuid('XCRemoteSwiftPackageReference', remote.url),
          url: remote.url,
          version: remote.version,
          identity: remote.identity,
          comment: `XCRemoteSwiftPackageReference "${remote.identity}"`,
        }
      : null;
  const localByPath = new Map(localPkgRefs.map(r => [r.packagePath, r]));
  const products = productPackages.map(entry => {
    const {product, packagePath} = entry;
    const isRemote = packagePath === 'REMOTE' && remotePkgRef != null;
    const pkgRefUuid = isRemote
      ? // $FlowFixMe[incompatible-use] guarded by isRemote
        remotePkgRef.uuid
      : // $FlowFixMe[incompatible-use] every non-REMOTE path is in localByPath
        localByPath.get(packagePath).uuid;
    const refComment = isRemote
      ? // $FlowFixMe[incompatible-use] guarded by isRemote
        `XCRemoteSwiftPackageReference "${remotePkgRef.identity}"`
      : `XCLocalSwiftPackageReference "${packagePath}"`;
    return {
      product,
      depUuid: mkUuid('XCSwiftPackageProductDependency', product),
      buildFileUuid: mkUuid('PBXBuildFile', `spm:${product}`),
      pkgRefUuid,
      refComment,
    };
  });
  return {uniquePackages, localPkgRefs, remotePkgRef, products};
}

/**
 * Render the SPM graph into pbxproj section entry objects the in-place injector
 * splices into an existing project.
 */
/*:: type PbxEntryT = {uuid: string, comment: string, fields: {[string]: string}}; */

function spmGraphToEntries(
  graph /*: SpmGraph */,
) /*: {localRefs: Array<PbxEntryT>, remoteRef: ?PbxEntryT, productDeps: Array<PbxEntryT>, buildFiles: Array<PbxEntryT>} */ {
  const localRefs /*: Array<PbxEntryT> */ = graph.localPkgRefs.map(ref => ({
    uuid: ref.uuid,
    comment: ref.comment,
    fields: {
      isa: 'XCLocalSwiftPackageReference',
      relativePath: quoteIfNeeded(ref.packagePath),
    },
  }));
  const remote = graph.remotePkgRef;
  const remoteRef /*: ?PbxEntryT */ =
    remote != null
      ? {
          uuid: remote.uuid,
          comment: remote.comment,
          fields: {
            isa: 'XCRemoteSwiftPackageReference',
            repositoryURL: quoteIfNeeded(remote.url),
            requirement: `{\n\t\t\t\tkind = exactVersion;\n\t\t\t\tversion = "${remote.version}";\n\t\t\t}`,
          },
        }
      : null;
  const productDeps /*: Array<PbxEntryT> */ = graph.products.map(p => ({
    uuid: p.depUuid,
    comment: p.product,
    fields: {
      isa: 'XCSwiftPackageProductDependency',
      package: `${p.pkgRefUuid} /* ${p.refComment} */`,
      productName: quoteIfNeeded(p.product),
    },
  }));
  const buildFiles /*: Array<PbxEntryT> */ = graph.products.map(p => ({
    uuid: p.buildFileUuid,
    comment: `${p.product} in Frameworks`,
    fields: {
      isa: 'PBXBuildFile',
      productRef: `${p.depUuid} /* ${p.product} */`,
    },
  }));
  return {localRefs, remoteRef, productDeps, buildFiles};
}

// Sync SPM Autolinking: timestamp check + conditional node re-run. Shared by
// the build phase (safety net) and the scheme pre-action (the one that
// actually fires before SPM resolution, so a single build picks up
// dep-graph changes from `npm install`).
// Build a PBXShellScriptBuildPhase entry (the "Sync SPM Autolinking" phase).
function shellScriptPhase(
  phaseUUID /*: string */,
  name /*: string */,
  script /*: string */,
  options /*: {inputPaths?: string, outputPaths?: string} */ = {},
) /*: {uuid: string, comment: string, fields: {[string]: string}} */ {
  const empty = '(\n\t\t\t)';
  return {
    uuid: phaseUUID,
    comment: name,
    fields: {
      isa: 'PBXShellScriptBuildPhase',
      buildActionMask: '2147483647',
      files: empty,
      inputFileListPaths: empty,
      inputPaths: options.inputPaths ?? empty,
      name: quoteIfNeeded(name),
      outputFileListPaths: empty,
      outputPaths: options.outputPaths ?? empty,
      runOnlyForDeploymentPostprocessing: '0',
      shellPath: '/bin/sh',
      shellScript: quoteIfNeeded(script),
    },
  };
}

function frameworkSettingPrefix(id /*: string */) /*: string */ {
  return `RN_SPM_${id.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
}

function flavorForBuildConfiguration(
  configurationName /*: string */,
) /*: 'debug' | 'release' */ {
  const lower = configurationName.toLowerCase();
  return lower.includes('debug') || lower.includes('development')
    ? 'debug'
    : 'release';
}

function buildConfigurationName(
  text /*: string */,
  configUuid /*: string */,
) /*: string */ {
  const config = findObjectByUuid(text, configUuid);
  const name = config != null ? findField(text, config, 'name') : null;
  if (name == null) {
    throw new Error(`pbxproj: build configuration ${configUuid} has no name`);
  }
  return name.value.replace(/^"|"$/g, '');
}

function frameworkConditionalSettings(
  frameworks /*: ReadonlyArray<FlavoredFrameworkManifestEntry> */,
) /*: Array<{key: string, value: string}> */ {
  const settings /*: Array<{key: string, value: string}> */ = [];
  for (const framework of frameworks) {
    const prefix = frameworkSettingPrefix(framework.id);
    const bySdk /*: Map<string, Array<XcframeworkSlice>> */ = new Map();
    // The injected target is an Apple mobile/Catalyst application. Native
    // macOS slices share `sdk=macosx*` with Catalyst and cannot be
    // distinguished by an XCBuildConfiguration condition, so use the Catalyst
    // slice and leave native-mac packaging out of this iOS integration.
    for (const slice of framework.slices.filter(
      candidate => candidate.platform !== 'macos',
    )) {
      const existing = bySdk.get(slice.sdk) ?? [];
      existing.push(slice);
      bySdk.set(slice.sdk, existing);
    }
    for (const [sdk, slices] of bySdk) {
      const emit = (slice /*: XcframeworkSlice */, condition /*: string */) => {
        const root =
          `$(SRCROOT)/build/xcframeworks/$(RN_SPM_FLAVOR)/` +
          `${framework.artifactRelativePath}/${slice.libraryIdentifier}`;
        settings.push(
          {
            key: quoteIfNeeded(`${prefix}_FRAMEWORK${condition}`),
            value: quoteIfNeeded(`${root}/${slice.libraryPath}`),
          },
          {
            key: quoteIfNeeded(`${prefix}_BINARY${condition}`),
            value: quoteIfNeeded(`${root}/${slice.binaryPath}`),
          },
          {
            key: quoteIfNeeded(`${prefix}_SEARCH_PATH${condition}`),
            value: quoteIfNeeded(root),
          },
        );
      };
      if (slices.length === 1) {
        emit(slices[0], `[sdk=${sdk}]`);
        continue;
      }
      const seenArchitectures /*: Set<string> */ = new Set();
      for (const slice of slices) {
        for (const architecture of slice.architectures) {
          if (seenArchitectures.has(architecture)) {
            throw new Error(
              `${framework.frameworkName} has ambiguous ${sdk}/${architecture} slices`,
            );
          }
          seenArchitectures.add(architecture);
          emit(slice, `[sdk=${sdk}][arch=${architecture}]`);
        }
      }
    }
  }
  return settings;
}

function frameworkArrayBuildSettings(
  frameworks /*: ReadonlyArray<FlavoredFrameworkManifestEntry> */,
) /*: Array<{key: string, values: Array<string>}> */ {
  return [
    {
      key: 'OTHER_LDFLAGS',
      values: [
        '"-ObjC"',
        ...frameworks.map(
          framework => `"$(${frameworkSettingPrefix(framework.id)}_BINARY)"`,
        ),
      ],
    },
    {
      key: 'FRAMEWORK_SEARCH_PATHS',
      values: frameworks.map(
        framework => `"$(${frameworkSettingPrefix(framework.id)}_SEARCH_PATH)"`,
      ),
    },
    {
      key: 'LD_RUNPATH_SEARCH_PATHS',
      values: ['"@executable_path/Frameworks"'],
    },
  ];
}

function pbxPathList(paths /*: ReadonlyArray<string> */) /*: string */ {
  if (paths.length === 0) {
    return '(\n\t\t\t)';
  }
  return `(\n${paths
    .map(value => `\t\t\t\t${quoteIfNeeded(value)},\n`)
    .join('')}\t\t\t)`;
}

function buildEmbedFrameworksScript(
  frameworks /*: ReadonlyArray<FlavoredFrameworkManifestEntry> */,
) /*: string */ {
  const validations = frameworks
    .map(framework => {
      const variable = `${frameworkSettingPrefix(framework.id)}_FRAMEWORK`;
      return `validate_framework "\${${variable}:-}" "${framework.frameworkName}.framework"`;
    })
    .join('\n');
  const copies = frameworks
    .map(framework => {
      const variable = `${frameworkSettingPrefix(framework.id)}_FRAMEWORK`;
      return `copy_and_sign "\${${variable}:-}" "${framework.frameworkName}.framework"`;
    })
    .join('\n');
  return `set -euo pipefail

destination="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH"
mkdir -p "$destination"

validate_framework() {
  source="$1"
  name="$2"
  if [ -z "$source" ] || [ ! -d "$source" ]; then
    echo "error: React Native SwiftPM framework '$name' is unavailable for configuration '$CONFIGURATION' and SDK '$SDK_NAME': $source"
    exit 1
  fi
  binary="\${name%.framework}"
  if [ ! -e "$source/$binary" ] && [ ! -e "$source/Versions/Current/$binary" ]; then
    echo "error: React Native SwiftPM framework '$name' is invalid for configuration '$CONFIGURATION': expected $source/$binary or $source/Versions/Current/$binary"
    exit 1
  fi
}

copy_and_sign() {
  source="$1"
  name="$2"
  /usr/bin/rsync -a --delete "$source/" "$destination/$name/"
  if [ "\${CODE_SIGNING_ALLOWED:-YES}" != "NO" ]; then
    identity="\${EXPANDED_CODE_SIGN_IDENTITY:--}"
    if [ "$identity" = "-" ]; then
      /usr/bin/codesign --force --sign - --timestamp=none --preserve-metadata=identifier,entitlements,flags "$destination/$name"
    else
      /usr/bin/codesign --force --sign "$identity" --preserve-metadata=identifier,entitlements,flags "$destination/$name"
    fi
  fi
}

${validations}
${copies}
`;
}

function addBuildPhaseAfter(
  text /*: string */,
  target /*: {bodyOpen: number, bodyClose: number, ...} */,
  afterUuid /*: string */,
  member /*: {uuid: string, comment: string} */,
) /*: string */ {
  const field = findField(text, target, 'buildPhases');
  if (field == null || field.value.includes(member.uuid)) {
    return text;
  }
  const after = new RegExp(`(^|\\n)([\\t ]*)${afterUuid}\\b[^\\n]*,`).exec(
    field.value,
  );
  if (after == null) {
    return addArrayMembers(text, target, 'buildPhases', [member]);
  }
  const absoluteStart = field.valueStart + after.index;
  const lineEnd = text.indexOf('\n', absoluteStart + after[0].length);
  const indent = after[2];
  const line = `\n${indent}${member.uuid} /* ${member.comment} */,`;
  return text.slice(0, lineEnd) + line + text.slice(lineEnd);
}

// The node + react-native-dir resolution preamble shared by the sync build
// phase and scheme pre-action. Both dispatch DIRECTLY into react-native's
// scripts rather than through 'npx react-native' — that CLI requires
// @react-native-community/cli (absent in e.g. Expo apps), so it would exit
// non-zero and the failure would be silently swallowed.
function nodeAndRnDirPreamble(reactNativePath /*: string */) /*: string */ {
  return `set -euo pipefail

# ---------------------------------------------------------------------------
# Resolve a node binary and the react-native package dir at BUILD TIME.
# ---------------------------------------------------------------------------
NODE_BINARY="\${NODE_BINARY:-}"
if [ -z "$NODE_BINARY" ]; then
  # Source RN's standard app-local node-path files. They reference vars that
  # may be unset and may return non-zero, so relax nounset AND errexit while
  # sourcing — a buggy user .xcode.env must degrade to PATH-based node
  # resolution below, not silently abort every build.
  set +eu
  if [ -f "$SRCROOT/.xcode.env" ]; then
    . "$SRCROOT/.xcode.env"
  fi
  if [ -f "$SRCROOT/.xcode.env.local" ]; then
    . "$SRCROOT/.xcode.env.local"
  fi
  set -eu
  NODE_BINARY="\${NODE_BINARY:-}"
fi
if [ -z "$NODE_BINARY" ]; then
  NODE_BINARY="$(command -v node 2>/dev/null || true)"
fi

# Resolve react-native's dir FROM THE APP (require.resolve), not a
# generation-time baked path — the baked path goes stale in pnpm / hoisted
# stores. Fall back to the baked path if resolution fails or the resolved dir
# has no setup-apple-spm.js.
RN_DIR=""
if [ -n "$NODE_BINARY" ]; then
  RN_DIR="$(cd "$SRCROOT" && "$NODE_BINARY" --print "require('path').dirname(require.resolve('react-native/package.json'))" 2>/dev/null || true)"
fi
if [ -z "$RN_DIR" ] || [ ! -f "$RN_DIR/scripts/setup-apple-spm.js" ]; then
  RN_DIR="${reactNativePath}"
fi`;
}

// Shared: the STALE-input check + conditional codegen/autolinking sync dispatch.
// Runtime framework slots are never touched here; add/update owns them.
function syncStaleCheckAndDispatch() /*: string */ {
  return `STAMP="$SRCROOT/build/generated/autolinking/.spm-sync-stamp"
STALE=0

# Find project root (where package.json lives — may be an ancestor of SRCROOT)
PROJECT_ROOT="$SRCROOT"
while [ "$PROJECT_ROOT" != "/" ] && [ ! -f "$PROJECT_ROOT/package.json" ]; do
  PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  PROJECT_ROOT="$SRCROOT"
fi

# Check 1: dependency inputs (covers app projects after any package manager install)
for INPUT in \\
  "$PROJECT_ROOT/package.json" \\
  "$PROJECT_ROOT/react-native.config.js"; do
  if [ -f "$INPUT" ] && [ "$INPUT" -nt "$STAMP" ]; then
    STALE=1
    break
  fi
done

# Check workspace lockfiles and package-manager metadata. These cover package
# managers that do not reliably bump node_modules mtimes, and Yarn PnP projects
# that do not have node_modules at all.
if [ "$STALE" -eq 0 ]; then
  DIR="$PROJECT_ROOT"
  while [ "$DIR" != "/" ]; do
    for INPUT in \\
      "$DIR/package-lock.json" \\
      "$DIR/npm-shrinkwrap.json" \\
      "$DIR/yarn.lock" \\
      "$DIR/pnpm-lock.yaml" \\
      "$DIR/bun.lock" \\
      "$DIR/bun.lockb" \\
      "$DIR/.pnp.cjs" \\
      "$DIR/.pnp.loader.mjs"; do
      if [ -f "$INPUT" ] && [ "$INPUT" -nt "$STAMP" ]; then
        STALE=1
        break
      fi
    done
    if [ "$STALE" -eq 1 ]; then
      break
    fi
    DIR="$(dirname "$DIR")"
  done
fi

# Check node_modules mtime. In monorepos, node_modules may be hoisted to any
# ancestor between the app package and the workspace root.
if [ "$STALE" -eq 0 ]; then
  DIR="$PROJECT_ROOT"
  while [ "$DIR" != "/" ]; do
    NM_DIR="$DIR/node_modules"
    if [ -d "$NM_DIR" ] && [ "$NM_DIR" -nt "$STAMP" ]; then
      STALE=1
      break
    fi
    DIR="$(dirname "$DIR")"
  done
fi

# Also check the app root directly when SRCROOT is not the package root.
if [ "$STALE" -eq 0 ] && [ "$SRCROOT" != "$PROJECT_ROOT" ]; then
  if [ -d "$SRCROOT/node_modules" ] && [ "$SRCROOT/node_modules" -nt "$STAMP" ]; then
    STALE=1
  fi
fi

# Check 1.5: watched paths (mixed dirs AND files). Dirs catch add/remove of
# source files in spm.modules and autolinked deps (dir mtime updates on both);
# files catch edits to a dep's checked-in Package.swift / plugin manifests that
# would not bump any parent dir mtime. A path that has VANISHED (renamed/moved
# module root) forces a re-sync so the autolinker surfaces the real, actionable
# config error rather than the build failing later on dangling-symlink noise.
WATCH_FILE="$SRCROOT/build/generated/autolinking/.spm-sync-watch-paths"
if [ "$STALE" -eq 0 ] && [ -f "$WATCH_FILE" ]; then
  while IFS= read -r P; do
    [ -z "$P" ] && continue
    if [ -d "$P" ]; then
      if [ -n "$(find "$P" -newer "$STAMP" -print -quit 2>/dev/null)" ]; then
        STALE=1
        break
      fi
    elif [ -f "$P" ]; then
      if [ "$P" -nt "$STAMP" ]; then
        STALE=1
        break
      fi
    else
      STALE=1
      break
    fi
  done < "$WATCH_FILE"
fi

# Check 2: codegen spec files changed via git (covers monorepo after git pull)
if [ "$STALE" -eq 0 ] && [ -f "$STAMP" ]; then
  STAMP_TIME=$(stat -f %m "$STAMP" 2>/dev/null || stat -c %Y "$STAMP" 2>/dev/null || echo 0)
  LATEST_SPEC_COMMIT=$(git -C "$SRCROOT" log -1 --format=%ct -- '*.js' '*.ts' 2>/dev/null || echo 0)
  if [ "$LATEST_SPEC_COMMIT" -gt "$STAMP_TIME" ]; then
    STALE=1
  fi
fi

if [ ! -f "$STAMP" ]; then
  STALE=1
fi

# Re-sync codegen + autolinking when a dependency input changed. Runtime
# framework slots and Xcode linker settings are only changed by spm update.
if [ "$STALE" -eq 1 ]; then
  echo "SPM sync inputs changed — re-syncing (codegen + autolinking)..."

  WITH_ENVIRONMENT="$RN_DIR/scripts/xcode/with-environment.sh"

  if [ -f "$WITH_ENVIRONMENT" ]; then
    # with-environment.sh references PODS_ROOT and $1, which may be unset.
    # Temporarily disable nounset to avoid failures when sourcing.
    export PODS_ROOT="\${PODS_ROOT:-$SRCROOT}"
    set +u
    . "$WITH_ENVIRONMENT"
    set -u
  fi

  cd "$SRCROOT"
  # \`|| RC=$?\` so a non-zero exit is CAPTURED rather than aborting the phase
  # under \`set -e\` — the whole point is to branch on the code below (2 = fail
  # the build with a scaffold hint; other non-zero = warn but don't break).
  RC=0
  if [ -n "$NODE_BINARY" ] && [ -f "$RN_DIR/scripts/setup-apple-spm.js" ]; then
    # Direct, dependency-free dispatch (no \`npx react-native\`, which needs
    # @react-native-community/cli).
    "$NODE_BINARY" "$RN_DIR/scripts/setup-apple-spm.js" sync || RC=$?
  elif command -v npx >/dev/null 2>&1; then
    npx react-native spm sync || RC=$?
  else
    echo "warning: node/npx not found — skipping SPM sync"
  fi
  if [ "$RC" -eq 2 ]; then
    # Exit 2 = an autolinked community dependency has no Package.swift. The
    # autolinker already printed an \`error:\` line per dep (so Xcode shows them
    # and the fix). Fail the build — the developer must run
    # \`npx react-native spm scaffold\` from a terminal to generate the manifest.
    exit 1
  elif [ "$RC" -ne 0 ]; then
    echo "warning: SPM sync failed — build may use stale codegen/autolinking"
  fi
fi
`;
}

// Scheme pre-action: re-run codegen + autolinking before package resolution.
function buildSchemePreActionScript(
  reactNativePath /*: string */,
) /*: string */ {
  return `${nodeAndRnDirPreamble(reactNativePath)}

${syncStaleCheckAndDispatch()}
`;
}

// The in-target phase is only an autolinking safety net. Runtime framework
// selection is expressed entirely through build settings and the independent
// Embed React Native Flavored Frameworks phase.
function buildSyncAutolinkingScript(
  reactNativePath /*: string */,
) /*: string */ {
  return `${nodeAndRnDirPreamble(reactNativePath)}

${syncStaleCheckAndDispatch()}
`;
}
// XML-attribute escape (the five named entities). The sync script uses `>`
// and `&` for redirection and bg/and chains, plus `<` for heredocs and
// comparisons — all of which break Xcode's scheme parser if left raw.
function escapeXmlAttribute(s /*: string */) /*: string */ {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateXcscheme(
  appName /*: string */,
  targetUUID /*: string */,
  projName /*: string */,
  syncScript /*: string */,
) /*: string */ {
  const escapedSync = escapeXmlAttribute(syncScript);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1600"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <PreActions>
         <ExecutionAction
            ActionType = "Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction">
            <ActionContent
               title = "Sync SPM Autolinking"
               scriptText = "${escapedSync}">
               <EnvironmentBuildable>
                  <BuildableReference
                     BuildableIdentifier = "primary"
                     BlueprintIdentifier = "${targetUUID}"
                     BuildableName = "${appName}.app"
                     BlueprintName = "${appName}"
                     ReferencedContainer = "container:${projName}.xcodeproj">
                  </BuildableReference>
               </EnvironmentBuildable>
            </ActionContent>
         </ExecutionAction>
      </PreActions>
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${targetUUID}"
               BuildableName = "${appName}.app"
               BlueprintName = "${appName}"
               ReferencedContainer = "container:${projName}.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES"
      shouldAutocreateTestPlan = "YES">
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "${targetUUID}"
            BuildableName = "${appName}.app"
            BlueprintName = "${appName}"
            ReferencedContainer = "container:${projName}.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "${targetUUID}"
            BuildableName = "${appName}.app"
            BlueprintName = "${appName}"
            ReferencedContainer = "container:${projName}.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
`;
}

// When the xcodeproj is generated, the referenced SPM package directories
// (build/xcframeworks, autolinked, build/generated/ios) may not exist yet.
// Xcode resolves packages before any build phase runs, so we write minimal
// stub Package.swift files to let resolution succeed. The real generators
// (sync-spm-autolinking.js) overwrite these during the first build.

/*::
type StubPackageDef = {
  packageName: string,
  products: Array<string>,
};
*/

function generateStubPackageSwift(def /*: StubPackageDef */) /*: string */ {
  const {packageName, products} = def;
  const stubTarget = `${packageName.replace(/[^a-zA-Z0-9]/g, '')}Stub`;
  const productLines = products
    .map(p => `        .library(name: "${p}", targets: ["${stubTarget}"]),`)
    .join('\n');
  return `// swift-tools-version: 5.9
// GENERATED STUB — will be overwritten by sync-spm-autolinking.js during build.
import PackageDescription

let package = Package(
    name: "${packageName}",
    products: [
${productLines}
    ],
    targets: [
        .target(name: "${stubTarget}", path: "_stub", sources: ["Stub.swift"]),
    ]
)
`;
}

/**
 * Ensures each referenced SPM sub-package directory has a valid Package.swift
 * so Xcode can resolve packages before any build phase runs.
 * Skips directories that already contain a Package.swift (from a previous build).
 */
function ensureStubPackages(appRoot /*: string */) /*: void */ {
  // Derive stub definitions from SPM_PRODUCT_PACKAGES
  const byPath = new Map /*:: <string, StubPackageDef> */();
  for (const entry of SPM_PRODUCT_PACKAGES) {
    const existing = byPath.get(entry.packagePath);
    if (existing != null) {
      existing.products.push(entry.product);
    } else {
      byPath.set(entry.packagePath, {
        packageName: entry.packageName,
        products: [entry.product],
      });
    }
  }

  for (const [relPath, def] of byPath) {
    const pkgDir = path.join(appRoot, relPath);
    const pkgSwiftPath = path.join(pkgDir, 'Package.swift');

    if (fs.existsSync(pkgSwiftPath)) {
      continue;
    }

    fs.mkdirSync(pkgDir, {recursive: true});
    fs.writeFileSync(pkgSwiftPath, generateStubPackageSwift(def), 'utf8');

    // Create minimal stub source file required by SPM
    const stubDir = path.join(pkgDir, '_stub');
    fs.mkdirSync(stubDir, {recursive: true});
    const stubSwift = path.join(stubDir, 'Stub.swift');
    if (!fs.existsSync(stubSwift)) {
      fs.writeFileSync(
        stubSwift,
        '// Placeholder — replaced during first build.\n',
        'utf8',
      );
    }

    log(`Wrote stub Package.swift: ${relPath}/Package.swift`);
  }
}

// ---------------------------------------------------------------------------
// In-place injection: add SPM packages to a user's EXISTING xcodeproj.
//
// This never creates a target or scans sources — it splices the SPM dependency
// graph, the React build settings, and the sync build phase / scheme pre-action
// into the project the user already owns, leaving everything else
// byte-identical. The whole `spm add` / `spm update` xcodeproj strategy, so
// hand-tuned signing / capabilities / extra targets survive. Fails loud (the
// caller surfaces the error) when the project is CocoaPods-integrated or its
// shape can't be safely anchored.
// ---------------------------------------------------------------------------

// The React build settings the app target needs to compile against the SPM
// products.
const INJECTED_ARRAY_SETTINGS = [
  {
    key: 'HEADER_SEARCH_PATHS',
    values: ['"$(SRCROOT)/build/generated/autolinking/headers"'],
  },
];

/** The XCBuildConfiguration UUIDs of a target (via its buildConfigurationList). */
function targetBuildConfigUuids(
  text /*: string */,
  targetObj /*: {bodyOpen: number, bodyClose: number, ...} */,
) /*: Array<string> */ {
  const listField = findField(text, targetObj, 'buildConfigurationList');
  if (listField == null) {
    return [];
  }
  const listMatch = listField.value.match(/[0-9A-Fa-f]{24}/);
  if (listMatch == null) {
    return [];
  }
  const listObj = findObjectByUuid(text, listMatch[0]);
  if (listObj == null) {
    return [];
  }
  const configs = findField(text, listObj, 'buildConfigurations');
  if (configs == null) {
    return [];
  }
  const matches = configs.value.match(/[0-9A-Fa-f]{24}/g);
  return matches != null ? Array.from(matches) : [];
}

/** True when a build config layers a CocoaPods `Pods-*.xcconfig`. */
function configUsesPods(
  text /*: string */,
  configUuid /*: string */,
) /*: boolean */ {
  const obj = findObjectByUuid(text, configUuid);
  if (obj == null) {
    return false;
  }
  const base = findField(text, obj, 'baseConfigurationReference');
  return base != null && /Pods[-/]/.test(base.value);
}

/**
 * Inspect an existing pbxproj and decide whether it can be injected. Returns
 * the chosen app target + its config/frameworks anchors, or a refusal reason
 * the caller surfaces (fail-loud).
 */
function planInjection(text /*: string */, opts /*: {appName?: ?string} */) /*:
  | {ok: true, rootUuid: string, target: {uuid: string, name: string, bodyOpen: number, bodyClose: number}, configUuids: Array<string>, frameworksPhaseUuid: string, sourcesPhaseUuid: ?string}
  | {ok: false, reason: string} */ {
  const project = findProjectObject(text);
  if (project == null) {
    return {ok: false, reason: 'no PBXProject object found'};
  }
  const apps = findApplicationTargets(text);
  if (apps.length === 0) {
    return {ok: false, reason: 'no application target found'};
  }
  let target;
  if (apps.length === 1) {
    target = apps[0];
  } else {
    const appName = opts.appName;
    if (appName == null) {
      return {
        ok: false,
        reason: `multiple application targets (${apps
          .map(a => a.name)
          .join(', ')}); pass --app-name to disambiguate`,
      };
    }
    target = apps.find(a => a.name === appName);
    if (target == null) {
      return {
        ok: false,
        reason: `no application target named "${appName}"`,
      };
    }
  }
  const configUuids = targetBuildConfigUuids(text, target);
  if (configUuids.length === 0) {
    return {ok: false, reason: 'could not resolve target build configurations'};
  }
  if (configUuids.some(c => configUsesPods(text, c))) {
    return {
      ok: false,
      reason:
        'target uses CocoaPods (Pods-*.xcconfig) — in-place injection only ' +
        'supports SPM-only targets',
    };
  }
  // The target's own Frameworks build phase (where product build files link).
  const buildPhases = findField(text, target, 'buildPhases');
  const phaseUuids =
    buildPhases != null
      ? (buildPhases.value.match(/[0-9A-Fa-f]{24}/g) ?? [])
      : [];
  let frameworksPhaseUuid = null;
  // Also capture the Sources phase — plugin generated sources compile into it
  // (see injectSpmIntoPbxproj step 8). Nullable: a target may legitimately
  // lack one, in which case generated-source wiring is skipped (not fatal).
  let sourcesPhaseUuid = null;
  for (const pu of phaseUuids) {
    const po = findObjectByUuid(text, pu);
    if (po == null) {
      continue;
    }
    const isa = findField(text, po, 'isa');
    if (isa == null) {
      continue;
    }
    if (
      frameworksPhaseUuid == null &&
      /PBXFrameworksBuildPhase/.test(isa.value)
    ) {
      frameworksPhaseUuid = pu;
    } else if (
      sourcesPhaseUuid == null &&
      /PBXSourcesBuildPhase/.test(isa.value)
    ) {
      sourcesPhaseUuid = pu;
    }
  }
  if (frameworksPhaseUuid == null) {
    return {ok: false, reason: 'target has no Frameworks build phase'};
  }
  return {
    ok: true,
    rootUuid: project.uuid,
    target,
    configUuids,
    frameworksPhaseUuid,
    sourcesPhaseUuid,
  };
}

/**
 * Splice the SPM dependency graph + React build settings + sync build phase
 * into `text` and return the modified pbxproj. Pure string transform (no I/O),
 * idempotent: objects already present (by UUID) and array members / settings
 * already applied are skipped, so a second run is a no-op.
 */
function injectSpmIntoPbxproj(
  input /*: string */,
  plan /*: {rootUuid: string, targetUuid: string, configUuids: Array<string>, frameworksPhaseUuid: string, sourcesPhaseUuid?: ?string} */,
  reactNativePath /*: string */,
  remote /*: ?RemoteCfg */,
  hermesCliPath /*: ?string */ = null,
  generatedSources /*: ReadonlyArray<GeneratedSource> */ = [],
  flavoredFrameworks /*: ReadonlyArray<FlavoredFrameworkManifestEntry> */ = [],
) /*: {text: string, injectedUuids: Array<string>, createdArrayFields: Array<{container: 'project' | 'target', key: string}>, buildSettingChanges: Array<BuildSettingChange>, generatedSourceUuids: {[string]: Array<string>}} */ {
  let text = input;
  const mkUuid = (section /*: string */, id /*: string */) =>
    namespacedUUID(plan.rootUuid, section, id);
  const graph = buildSpmDependencyGraph(mkUuid, remote);
  const entries = spmGraphToEntries(graph);
  const injectedUuids /*: Array<string> */ = [];

  // 1. Insert the new objects (skip any UUID already present — idempotency).
  const insertObjects = (
    sectionName /*: string */,
    objs /*: ReadonlyArray<{readonly uuid: string, readonly comment?: ?string, readonly fields: {readonly [string]: string}, ...}> */,
  ) => {
    const fresh = objs.filter(o => !text.includes(o.uuid));
    for (const o of objs) {
      injectedUuids.push(o.uuid);
    }
    if (fresh.length === 0) {
      return;
    }
    text = insertObjectsIntoSection(
      text,
      sectionName,
      fresh.map(serializeEntry).join('\n'),
    );
  };
  insertObjects('XCLocalSwiftPackageReference', entries.localRefs);
  if (entries.remoteRef != null) {
    insertObjects('XCRemoteSwiftPackageReference', [entries.remoteRef]);
  }
  insertObjects('XCSwiftPackageProductDependency', entries.productDeps);
  insertObjects('PBXBuildFile', entries.buildFiles);

  // Track array fields we CREATE (vs. append to a pre-existing one) so deinit
  // can remove the whole field and land byte-identical to the original.
  const createdArrayFields /*: Array<{container: 'project' | 'target', key: string}> */ =
    [];

  // 2. packageReferences on the PBXProject.
  const pkgRefMembers = [
    ...(graph.remotePkgRef != null
      ? [{uuid: graph.remotePkgRef.uuid, comment: graph.remotePkgRef.comment}]
      : []),
    ...graph.localPkgRefs.map(r => ({uuid: r.uuid, comment: r.comment})),
  ];
  const project = findProjectObject(text);
  if (project != null) {
    if (findField(text, project, 'packageReferences') == null) {
      createdArrayFields.push({container: 'project', key: 'packageReferences'});
    }
    text = addArrayMembers(text, project, 'packageReferences', pkgRefMembers);
  }

  // 3. packageProductDependencies on the app target.
  const productMembers = graph.products.map(p => ({
    uuid: p.depUuid,
    comment: p.product,
  }));
  if (
    findField(
      text,
      findApplicationTargetByUuid(text, plan.targetUuid),
      'packageProductDependencies',
    ) == null
  ) {
    createdArrayFields.push({
      container: 'target',
      key: 'packageProductDependencies',
    });
  }
  text = addArrayMembers(
    text,
    findApplicationTargetByUuid(text, plan.targetUuid),
    'packageProductDependencies',
    productMembers,
  );

  // 4. product build files into the target's Frameworks phase.
  const phase = findObjectByUuid(text, plan.frameworksPhaseUuid);
  if (phase != null) {
    text = addArrayMembers(
      text,
      phase,
      'files',
      graph.products.map(p => ({
        uuid: p.buildFileUuid,
        comment: `${p.product} in Frameworks`,
      })),
    );
  }

  // 5. React build settings into every build config (Debug + Release).
  const buildSettingChanges /*: Array<BuildSettingChange> */ = [];
  for (const configUuid of plan.configUuids) {
    const merged = mergeReactBuildSettings(
      text,
      configUuid,
      buildConfigurationName(text, configUuid),
      reactNativePath,
      hermesCliPath,
      flavoredFrameworks,
    );
    text = merged.text;
    buildSettingChanges.push(merged.change);
  }

  // 6. The Sync SPM Autolinking build phase (safety net; the scheme pre-action
  //    is what fires before SPM resolution). Prepended so it runs before
  //    Sources. We do NOT add a JS-bundle phase — an existing app already
  //    bundles JS via its own phase.
  const syncScript = buildSyncAutolinkingScript(reactNativePath);
  const syncPhaseUuid = mkUuid('PBXShellScriptBuildPhase', 'SyncAutolinking');
  if (!text.includes(syncPhaseUuid)) {
    text = insertObjectsIntoSection(
      text,
      'PBXShellScriptBuildPhase',
      serializeEntry(
        shellScriptPhase(syncPhaseUuid, 'Sync SPM Autolinking', syncScript),
      ),
    );
  } else {
    // Already injected on a prior run — the phase object owns its
    // shellScript, so refresh it in place (same quoting used at creation) in
    // case the generated script changed since. Byte-identical when it
    // didn't; field order and every other byte of the phase are untouched.
    const existingPhase = findObjectByUuid(text, syncPhaseUuid);
    if (existingPhase != null) {
      text = setScalarField(
        text,
        existingPhase,
        'shellScript',
        quoteIfNeeded(syncScript),
      );
    }
  }
  injectedUuids.push(syncPhaseUuid);
  text = addArrayMembers(
    text,
    findApplicationTargetByUuid(text, plan.targetUuid),
    'buildPhases',
    [{uuid: syncPhaseUuid, comment: 'Sync SPM Autolinking'}],
    {prepend: true},
  );

  // 7. The sole writer of flavored frameworks under the final app bundle.
  //    SwiftPM owns only invariant header/source products, so no implicit SPM
  //    embed task competes with this phase.
  const embedPhaseUuid = mkUuid(
    'PBXShellScriptBuildPhase',
    'EmbedFlavoredFrameworks',
  );
  const embedScript = buildEmbedFrameworksScript(flavoredFrameworks);
  const embedInputs = [
    '$(SRCROOT)/build/xcframeworks/.artifact-stamp',
    ...flavoredFrameworks.map(
      framework => `$(${frameworkSettingPrefix(framework.id)}_FRAMEWORK)`,
    ),
  ];
  const embedOutputs = flavoredFrameworks.map(
    framework =>
      `$(TARGET_BUILD_DIR)/$(FRAMEWORKS_FOLDER_PATH)/${framework.frameworkName}.framework`,
  );
  const embedEntry = shellScriptPhase(
    embedPhaseUuid,
    'Embed React Native Flavored Frameworks',
    embedScript,
    {
      inputPaths: pbxPathList(embedInputs),
      outputPaths: pbxPathList(embedOutputs),
    },
  );
  if (!text.includes(embedPhaseUuid)) {
    text = insertObjectsIntoSection(
      text,
      'PBXShellScriptBuildPhase',
      serializeEntry(embedEntry),
    );
  } else {
    const existingPhase = findObjectByUuid(text, embedPhaseUuid);
    if (existingPhase != null) {
      for (const key of ['shellScript', 'inputPaths', 'outputPaths']) {
        const current = findObjectByUuid(text, embedPhaseUuid);
        if (current != null) {
          text = setScalarField(text, current, key, embedEntry.fields[key]);
        }
      }
    }
  }
  injectedUuids.push(embedPhaseUuid);
  text = addBuildPhaseAfter(
    text,
    findApplicationTargetByUuid(text, plan.targetUuid),
    plan.frameworksPhaseUuid,
    {
      uuid: embedPhaseUuid,
      comment: 'Embed React Native Flavored Frameworks',
    },
  );

  // 8. Plugin generated sources compiled INTO THE APP TARGET (e.g. Expo's
  //    ExpoModulesProvider.swift). An `@objc` class only reaches the ObjC
  //    classlist — required for NSClassFromString discovery — when it compiles
  //    into the app target, not the static Autolinked aggregate. Each source
  //    gets a PBXFileReference + PBXBuildFile + a Sources-phase entry, parented
  //    under a single "SPM Generated Sources" group. Every UUID is keyed on the
  //    normalized path (deterministic → idempotent) and recorded so `deinit`
  //    reverts it and `update` reconciles it (removal is done by the caller,
  //    which owns the prior marker; emission here is purely additive).
  const generatedSourceUuids /*: {[string]: Array<string>} */ = {};
  const sourcesPhaseUuid = plan.sourcesPhaseUuid;
  if (generatedSources.length > 0) {
    if (sourcesPhaseUuid == null) {
      log(
        'warning: the app target has no Sources build phase — cannot compile ' +
          `${generatedSources.length} SPM plugin generated source(s) into the ` +
          'app target; skipping. Any @objc classes they define will not be ' +
          'discoverable via NSClassFromString.',
      );
    } else {
      const fileRefs = [];
      const buildFiles = [];
      const sourcesMembers = [];
      const groupChildren = [];
      for (const src of generatedSources) {
        const fileRefUuid = mkUuid('PBXFileReference', `gensrc:${src.path}`);
        const buildFileUuid = mkUuid('PBXBuildFile', `gensrc:${src.path}`);
        generatedSourceUuids[src.path] = [fileRefUuid, buildFileUuid];
        fileRefs.push({
          uuid: fileRefUuid,
          comment: src.name,
          fields: {
            isa: 'PBXFileReference',
            lastKnownFileType: src.fileType,
            name: quoteIfNeeded(src.name),
            path: quoteIfNeeded(src.path),
            sourceTree: src.sourceTree,
          },
        });
        buildFiles.push({
          uuid: buildFileUuid,
          comment: `${src.name} in Sources`,
          fields: {
            isa: 'PBXBuildFile',
            fileRef: `${fileRefUuid} /* ${src.name} */`,
          },
        });
        sourcesMembers.push({
          uuid: buildFileUuid,
          comment: `${src.name} in Sources`,
        });
        groupChildren.push({uuid: fileRefUuid, comment: src.name});
      }
      insertObjects('PBXFileReference', fileRefs);
      insertObjects('PBXBuildFile', buildFiles);

      // Compile membership — the actual reason these are wired into the app.
      const sourcesPhase = findObjectByUuid(text, sourcesPhaseUuid);
      if (sourcesPhase != null) {
        text = addArrayMembers(text, sourcesPhase, 'files', sourcesMembers);
      }

      // The "SPM Generated Sources" group (created on first use, then reused).
      // Insert with empty children so the ONE population path (addArrayMembers)
      // handles both create and reconcile, keeping formatting identical.
      const groupUuid = mkUuid('PBXGroup', SPM_GENERATED_SOURCES_GROUP_ID);
      if (!text.includes(groupUuid)) {
        text = insertObjectsIntoSection(
          text,
          'PBXGroup',
          serializeEntry({
            uuid: groupUuid,
            comment: SPM_GENERATED_SOURCES_GROUP_NAME,
            fields: {
              isa: 'PBXGroup',
              children: '(\n\t\t\t)',
              name: quoteIfNeeded(SPM_GENERATED_SOURCES_GROUP_NAME),
              sourceTree: '"<group>"',
            },
          }),
        );
      }
      injectedUuids.push(groupUuid);
      const groupObj = findObjectByUuid(text, groupUuid);
      if (groupObj != null) {
        text = addArrayMembers(text, groupObj, 'children', groupChildren);
      }

      // Parent the group under the project's main group (idempotent). Appends
      // to a pre-existing children array, so no createdArrayField is recorded —
      // deinit removes the group's membership via removeArrayMembersByUuid and
      // the group object itself via removeObjectByUuid (groupUuid is injected).
      const proj = findProjectObject(text);
      const mainGroupField =
        proj != null ? findField(text, proj, 'mainGroup') : null;
      const mainGroupMatch =
        mainGroupField != null
          ? mainGroupField.value.match(/[0-9A-Fa-f]{24}/)
          : null;
      const mainGroupObj =
        mainGroupMatch != null
          ? findObjectByUuid(text, mainGroupMatch[0])
          : null;
      if (mainGroupObj != null) {
        text = addArrayMembers(text, mainGroupObj, 'children', [
          {uuid: groupUuid, comment: SPM_GENERATED_SOURCES_GROUP_NAME},
        ]);
      }
    }
  }

  return {
    text,
    injectedUuids,
    createdArrayFields,
    buildSettingChanges,
    generatedSourceUuids,
  };
}

/** Re-locate an application target by UUID against the current text. */
function findApplicationTargetByUuid(
  text /*: string */,
  targetUuid /*: string */,
) /*: {uuid: string, bodyOpen: number, bodyClose: number} */ {
  const obj = findObjectByUuid(text, targetUuid);
  if (obj == null) {
    throw new Error(`pbxproj: app target ${targetUuid} disappeared mid-edit`);
  }
  return obj;
}

/**
 * Merge the React build settings into one XCBuildConfiguration's dict. Returns
 * the modified text plus a precise record of what was actually added — so
 * `deinit` (removeSpmInjection) can reverse exactly these edits, never touching
 * a value the user already had (key insight: ensureScalarField/
 * addArrayStringValues are no-ops / dedupe when a value is already present).
 */
/**
 * Resolves the host `hermesc` from the `hermes-compiler` npm package and returns
 * its ABSOLUTE path as the HERMES_CLI_PATH value, or null when it can't be found
 * (e.g. USE_HERMES=false apps without the package). require.resolve (anchored at
 * reactNativeRoot) follows Node's lookup, so a hoisted monorepo layout — where
 * hermes-compiler sits in the workspace-root node_modules, NOT next to
 * react-native — resolves correctly.
 *
 * The value is intentionally ABSOLUTE, not `$(REACT_NATIVE_PATH)/../...`: when
 * react-native is a symlink (the monorepo default, and common in real apps), a
 * `..` after it resolves — kernel-side — to the symlink TARGET's parent, not the
 * node_modules dir, so the relative form points at a non-existent
 * `<rn-target>/../hermes-compiler`. An absolute path sidesteps that entirely
 * (and matches how the CocoaPods hermes-engine pod sets HERMES_CLI_PATH). It is
 * regenerated on every `spm add`, so machine-specificity is a non-issue.
 */
function resolveHermesCliPathSetting(
  reactNativeRoot /*: string */,
) /*: ?string */ {
  try {
    const pkg = require.resolve('hermes-compiler/package.json', {
      paths: [reactNativeRoot],
    });
    const hermesc = path.join(
      path.dirname(pkg),
      'hermesc',
      'osx-bin',
      'hermesc',
    );
    return fs.existsSync(hermesc) ? hermesc : null;
  } catch {
    return null;
  }
}

function mergeReactBuildSettings(
  input /*: string */,
  configUuid /*: string */,
  configurationName /*: string */,
  reactNativePath /*: string */,
  hermesCliPath /*: ?string */ = null,
  flavoredFrameworks /*: ReadonlyArray<FlavoredFrameworkManifestEntry> */ = [],
) /*: {text: string, change: BuildSettingChange} */ {
  let text = input;
  const scalars = [
    {key: 'CLANG_CXX_LANGUAGE_STANDARD', value: '"c++20"'},
    {key: 'REACT_NATIVE_PATH', value: quoteIfNeeded(reactNativePath)},
    // Under SwiftPM there is no hermes-engine pod, so react-native-xcode.sh's
    // fallback ($PODS_ROOT/hermes-engine/destroot/bin/hermesc) resolves to a
    // non-existent "/hermes-engine/..." and the Release JS→Hermes bundling
    // fails. Point HERMES_CLI_PATH at the hermes-compiler npm package's host
    // hermesc (an ABSOLUTE path resolved by the caller — see
    // resolveHermesCliPathSetting). react-native-xcode.sh honors an already-set
    // HERMES_CLI_PATH before its pod fallback; ensureScalarField leaves any
    // user-provided value untouched.
    ...(hermesCliPath != null
      ? [{key: 'HERMES_CLI_PATH', value: quoteIfNeeded(hermesCliPath)}]
      : []),
  ];
  // Re-locate the buildSettings dict before each edit (offsets shift).
  const dict = () => {
    const cfg = findObjectByUuid(text, configUuid);
    if (cfg == null) {
      return null;
    }
    const bs = findField(text, cfg, 'buildSettings');
    if (bs == null) {
      return null;
    }
    return {
      uuid: configUuid,
      bodyOpen: bs.valueStart,
      bodyClose: bs.tokenEnd - 1,
    };
  };
  const createdArrayKeys /*: Array<string> */ = [];
  const appendedArrayValues /*: {[string]: Array<string>} */ = {};
  const createdScalars /*: Array<string> */ = [];
  const arraySettings = [
    ...INJECTED_ARRAY_SETTINGS,
    ...frameworkArrayBuildSettings(flavoredFrameworks),
  ];
  for (const {key, values} of arraySettings) {
    const d = dict();
    if (d == null) {
      continue;
    }
    const existing = findField(text, d, key);
    if (existing == null) {
      createdArrayKeys.push(key);
    } else {
      const fresh = values.filter(v => !existing.value.includes(v));
      if (fresh.length > 0) {
        appendedArrayValues[key] = fresh;
      }
    }
    text = addArrayStringValues(text, d, key, values);
  }
  const replacedScalars /*: {[string]: string} */ = {};
  for (const {key, value} of scalars) {
    const d = dict();
    if (d == null) {
      continue;
    }
    const existing = findField(text, d, key);
    if (existing == null) {
      createdScalars.push(key);
    } else if (
      key === 'REACT_NATIVE_PATH' &&
      existing.value.includes('PODS_ROOT')
    ) {
      // A ${PODS_ROOT}-anchored REACT_NATIVE_PATH (the CocoaPods template
      // default) dangles once CocoaPods is deintegrated: PODS_ROOT resolves
      // empty at build time, so the Bundle React Native code and images
      // phase looks for "/../…/scripts/xcode/with-environment.sh". Replace
      // it with the SPM-computed path, recording the original for deinit.
      replacedScalars[key] = existing.value;
      text = removeField(text, d, key);
      const d2 = dict();
      if (d2 == null) {
        continue;
      }
      text = ensureScalarField(text, d2, key, value);
      continue;
    }
    text = ensureScalarField(text, d, key, value);
  }
  const ownedScalars = [
    {
      key: 'RN_SPM_FLAVOR',
      value: flavorForBuildConfiguration(configurationName),
    },
    ...frameworkConditionalSettings(flavoredFrameworks),
  ];
  for (const {key, value} of ownedScalars) {
    const d = dict();
    if (d == null) {
      continue;
    }
    const existing = findField(text, d, key);
    if (existing == null) {
      createdScalars.push(key);
    } else if (existing.value !== value) {
      replacedScalars[key] = existing.value;
    }
    text = setScalarField(text, d, key, value);
  }
  return {
    text,
    change: {
      configUuid,
      createdArrayKeys,
      appendedArrayValues,
      createdScalars,
      replacedScalars,
    },
  };
}

// Write only when content changed (avoids spurious Xcode reloads / git churn).
function writeIfChanged(
  filePath /*: string */,
  content /*: string */,
) /*: boolean */ {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  try {
    if (fs.readFileSync(filePath, 'utf8') === content) {
      return false;
    }
  } catch {
    /* file doesn't exist yet */
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

/**
 * Add the "Sync SPM Autolinking" pre-action to an existing scheme's
 * BuildAction, reusing the scheme's own primary BuildableReference. Returns
 * the XML unchanged when the pre-action is already present.
 */
function addPreActionToScheme(
  xml /*: string */,
  targetUuid /*: string */,
  syncScript /*: string */,
) /*: string */ {
  const titleIdx = xml.indexOf('title = "Sync SPM Autolinking"');
  if (titleIdx >= 0) {
    // Already injected on a prior run — refresh a possibly-stale scriptText
    // in place (same escaping used at creation) rather than leaving it
    // forever. Splice by index (not a regex/string replace) since the script
    // itself may contain `$`-sequences that String.replace's replacement-
    // pattern syntax would otherwise misinterpret. Byte-identical when the
    // script is unchanged; every other byte of the scheme is untouched.
    const scriptTextMarker = 'scriptText = "';
    const stIdx = xml.indexOf(scriptTextMarker, titleIdx);
    if (stIdx < 0) {
      return xml; // malformed — leave untouched rather than guess
    }
    const valueStart = stIdx + scriptTextMarker.length;
    // escapeXmlAttribute maps a literal `"` to `&quot;`, so the attribute
    // value itself never contains one — the next `"` is always the closing
    // delimiter.
    const valueEnd = xml.indexOf('"', valueStart);
    return (
      xml.slice(0, valueStart) +
      escapeXmlAttribute(syncScript) +
      xml.slice(valueEnd)
    );
  }
  const refMatch = xml.match(
    new RegExp(
      `<BuildableReference\\b[^>]*BlueprintIdentifier = "${targetUuid}"[^>]*>`,
    ),
  );
  const attr = (name /*: string */) => {
    const m =
      refMatch != null
        ? refMatch[0].match(new RegExp(`${name} = "([^"]*)"`))
        : null;
    return m != null ? m[1] : '';
  };
  const cleanRef =
    `<BuildableReference\n` +
    `                     BuildableIdentifier = "primary"\n` +
    `                     BlueprintIdentifier = "${targetUuid}"\n` +
    `                     BuildableName = "${attr('BuildableName')}"\n` +
    `                     BlueprintName = "${attr('BlueprintName')}"\n` +
    `                     ReferencedContainer = "${attr('ReferencedContainer')}">\n` +
    `                  </BuildableReference>`;
  const executionAction =
    `         <ExecutionAction\n` +
    `            ActionType = "Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction">\n` +
    `            <ActionContent\n` +
    `               title = "Sync SPM Autolinking"\n` +
    `               scriptText = "${escapeXmlAttribute(syncScript)}">\n` +
    `               <EnvironmentBuildable>\n` +
    `                  ${cleanRef}\n` +
    `               </EnvironmentBuildable>\n` +
    `            </ActionContent>\n` +
    `         </ExecutionAction>`;

  if (/<PreActions>/.test(xml)) {
    return xml.replace(
      '</PreActions>',
      `${executionAction}\n      </PreActions>`,
    );
  }
  const openEnd = xml.indexOf('>', xml.indexOf('<BuildAction'));
  if (openEnd < 0) {
    return xml; // no BuildAction — leave the scheme untouched
  }
  const block = `\n      <PreActions>\n${executionAction}\n      </PreActions>`;
  return xml.slice(0, openEnd + 1) + block + xml.slice(openEnd + 1);
}

/**
 * Ensure the app target's shared scheme runs the sync pre-action before SPM
 * resolution. Updates the scheme that builds the target if one exists,
 * otherwise creates a fresh shared scheme. Returns 'updated' | 'created' |
 * 'unchanged'.
 */
function injectOrCreateScheme(
  xcodeprojDir /*: string */,
  opts /*: {appName: string, targetUuid: string, projName: string, syncScript: string} */,
) /*: {status: 'updated' | 'unchanged' | 'created', file: string} */ {
  const schemesDir = path.join(xcodeprojDir, 'xcshareddata', 'xcschemes');
  let schemeFiles /*: Array<string> */ = [];
  try {
    schemeFiles = fs
      .readdirSync(schemesDir)
      .filter(f => f.endsWith('.xcscheme'));
  } catch {
    /* no shared schemes dir yet */
  }
  for (const f of schemeFiles) {
    const p = path.join(schemesDir, f);
    const xml = fs.readFileSync(p, 'utf8');
    if (xml.includes(`BlueprintIdentifier = "${opts.targetUuid}"`)) {
      const updated = addPreActionToScheme(
        xml,
        opts.targetUuid,
        opts.syncScript,
      );
      return {
        status: writeIfChanged(p, updated) ? 'updated' : 'unchanged',
        file: f,
      };
    }
  }
  const file = `${opts.appName}.xcscheme`;
  const xml = generateXcscheme(
    opts.appName,
    opts.targetUuid,
    opts.projName,
    opts.syncScript,
  );
  writeIfChanged(path.join(schemesDir, file), xml);
  return {status: 'created', file};
}

/**
 * Strip the empty `Pods` group `pod deintegrate` leaves in the navigator.
 * Called by `add --deintegrate` after deintegration so the converted project is
 * visually clean. No-op when absent or when the group still has children.
 */
function cleanupLeftoverPodsGroup(xcodeprojPath /*: string */) /*: boolean */ {
  const pbxprojPath = path.join(xcodeprojPath, 'project.pbxproj');
  if (!fs.existsSync(pbxprojPath)) {
    return false;
  }
  const original = fs.readFileSync(pbxprojPath, 'utf8');
  const cleaned = removeEmptyPodsGroup(original);
  return cleaned !== original ? writeIfChanged(pbxprojPath, cleaned) : false;
}

/**
 * Strip the dangling `JavaScriptCore.framework` file reference the community
 * template has carried since RN 0.60 (navigator-only, meaningless under
 * Hermes) — see `removeDanglingJavaScriptCoreRef` for the full rationale and
 * the safety gate that leaves a still-linked reference untouched. No-op when
 * absent or when the pbxproj is missing.
 */
function cleanupDanglingJavaScriptCoreRef(
  xcodeprojPath /*: string */,
) /*: boolean */ {
  const pbxprojPath = path.join(xcodeprojPath, 'project.pbxproj');
  if (!fs.existsSync(pbxprojPath)) {
    return false;
  }
  const original = fs.readFileSync(pbxprojPath, 'utf8');
  const cleaned = removeDanglingJavaScriptCoreRef(original);
  return cleaned !== original ? writeIfChanged(pbxprojPath, cleaned) : false;
}

/**
 * Normalize one plugin generated-source path into the fields a PBXFileReference
 * needs. Stores an SRCROOT-relative path (`sourceTree = SOURCE_ROOT`) when the
 * source lives under the app root — the typical case (build/generated/…) — and
 * an absolute path (`sourceTree = "<absolute>"`) otherwise. Returns null (with a
 * loud log) for an extension the pbxproj can't compile.
 */
function normalizeGeneratedSource(
  appRoot /*: string */,
  srcPath /*: string */,
) /*: ?GeneratedSource */ {
  const ext = path.extname(srcPath).toLowerCase();
  const fileType = GENERATED_SOURCE_FILE_TYPES[ext];
  if (fileType == null) {
    log(
      `warning: unsupported generated-source extension "${ext}" for ` +
        `${srcPath}; skipping (SPM plugin sources must be .swift/.m/.mm).`,
    );
    return null;
  }
  const abs = path.isAbsolute(srcPath)
    ? srcPath
    : path.resolve(appRoot, srcPath);
  const rel = path.relative(appRoot, abs);
  const underAppRoot =
    rel !== '' &&
    rel !== '..' &&
    !rel.startsWith('..' + path.sep) &&
    !path.isAbsolute(rel);
  return {
    path: underAppRoot ? rel : abs,
    name: path.basename(abs),
    sourceTree: underAppRoot ? 'SOURCE_ROOT' : '"<absolute>"',
    fileType,
  };
}

/**
 * Read + normalize the plugin generated-sources manifest at
 * `<appRoot>/build/generated/autolinking/.spm-plugin-generated-sources.json`.
 * Absent, empty, or malformed → `[]` (the feature stays inert for non-plugin
 * apps and never breaks injection). The file need not exist yet at inject time:
 * the build-time sync regenerates it before compile, and a PBXFileReference to a
 * not-yet-created path is valid.
 */
function readGeneratedSourcesManifest(
  appRoot /*: string */,
) /*: Array<GeneratedSource> */ {
  const manifestPath = path.join(appRoot, SPM_GENERATED_SOURCES_MANIFEST);
  let raw: string;
  try {
    raw = fs.readFileSync(manifestPath, 'utf8');
  } catch {
    return [];
  }
  let entries: unknown;
  try {
    entries = JSON.parse(raw);
  } catch {
    log(
      `warning: could not parse ${SPM_GENERATED_SOURCES_MANIFEST}; ` +
        'skipping generated sources.',
    );
    return [];
  }
  if (!Array.isArray(entries)) {
    return [];
  }
  const out /*: Array<GeneratedSource> */ = [];
  for (const entry of entries) {
    if (
      entry == null ||
      typeof entry !== 'object' ||
      typeof entry.path !== 'string'
    ) {
      continue;
    }
    const normalized = normalizeGeneratedSource(appRoot, entry.path);
    // Dedupe by normalized path — a duplicate manifest entry would otherwise
    // double-insert identical-UUID pbxproj objects.
    if (normalized != null && !out.some(s => s.path === normalized.path)) {
      out.push(normalized);
    }
  }
  return out;
}

/**
 * Read the `.spm-injected.json` marker of a previously-injected project, or
 * null when absent/unreadable. Used to reconcile generated sources on `update`
 * and to read back a pinned `artifactsVersionOverride` (see below).
 */
function readMarker(
  xcodeprojPath /*: string */,
) /*: ?{generatedSources?: {[string]: Array<string>}, artifactsVersionOverride?: ?string, buildSettingChanges?: Array<BuildSettingChange>, ...} */ {
  const markerPath = path.join(xcodeprojPath, SPM_INJECTED_MARKER);
  try {
    // $FlowFixMe[incompatible-return] JSON.parse returns any
    return JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  } catch {
    return null;
  }
}

// Returns the `*.xcodeproj` under `appRoot` carrying a `.spm-injected.json`
// marker (the user-owned project SPM packages were injected into in place),
// or null when none has been injected yet. Pure fs reads — safe for the
// build-time sync (sync-spm-autolinking.js, via readArtifactsVersionOverride
// below) to call without pulling in any pbxproj-editing machinery at runtime.
function findInjectedXcodeproj(appRoot /*: string */) /*: string | null */ {
  let entries: Array<{name: string, isDirectory(): boolean}>;
  try {
    // $FlowFixMe[incompatible-type] Dirent typing
    entries = fs.readdirSync(appRoot, {withFileTypes: true});
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow stubs
    const name /*: string */ = entry.name;
    if (!name.endsWith('.xcodeproj')) continue;
    if (fs.existsSync(path.join(appRoot, name, SPM_INJECTED_MARKER))) {
      return path.join(appRoot, name);
    }
  }
  return null;
}

/**
 * Read the `artifactsVersionOverride` a previous `spm add --version` / `spm
 * update --version` pinned into the injected xcodeproj's `.spm-injected.json`
 * marker (see the field's doc comment in injectSpmIntoExistingXcodeproj
 * below), or null when no project is injected yet, no override is pinned, or
 * the marker can't be read (never throws). Pure fs reads — the build-time
 * sync (sync-spm-autolinking.js) calls this to prefer the pinned version over
 * the one derived from node_modules/react-native/package.json, so a
 * version-mismatched setup keeps healing against the SAME artifact slot the
 * explicit `--version` selected.
 */
function readArtifactsVersionOverride(appRoot /*: string */) /*: ?string */ {
  const xcodeprojPath = findInjectedXcodeproj(appRoot);
  if (xcodeprojPath == null) {
    return null;
  }
  const override = readMarker(xcodeprojPath)?.artifactsVersionOverride;
  return typeof override === 'string' && override.length > 0 ? override : null;
}

/**
 * Add SPM packages to a user's EXISTING xcodeproj in place. Returns
 * {status: 'injected', target} on success, or {status: 'refused', reason}
 * when the project can't be safely edited (caller surfaces it; fail-loud).
 */
function injectSpmIntoExistingXcodeproj(
  opts /*: {appRoot: string, reactNativeRoot: string, xcodeprojPath: string, appName?: ?string, artifactsVersionOverride?: ?string} */,
) /*: {status: 'injected', target: string} | {status: 'refused', reason: string} */ {
  const {appRoot, reactNativeRoot, xcodeprojPath} = opts;
  const pbxprojPath = path.join(xcodeprojPath, 'project.pbxproj');
  if (!fs.existsSync(pbxprojPath)) {
    return {
      status: 'refused',
      reason: `no project.pbxproj at ${xcodeprojPath}`,
    };
  }
  const original = fs.readFileSync(pbxprojPath, 'utf8');
  const plan = planInjection(original, {appName: opts.appName});
  if (!plan.ok) {
    return {status: 'refused', reason: plan.reason};
  }
  const reactNativePath = path.relative(appRoot, reactNativeRoot);
  const remote = remotePackageConfig(appRoot);
  const hermesCliPath = resolveHermesCliPathSetting(reactNativeRoot);
  const generatedSources = readGeneratedSourcesManifest(appRoot);
  const flavoredFrameworks = readFlavoredFrameworksManifest(appRoot).frameworks;

  const prevMarker = readMarker(xcodeprojPath);

  // Reconcile generated sources injected on a PRIOR run that are no longer in
  // the manifest (a plugin's entry was dropped, or the plugin was removed).
  // Diff the marker's `generatedSources` map against the current manifest and
  // delete only the stale UUIDs — the additive injection below re-emits (and
  // idempotently skips) everything that remains, so an unchanged run stays
  // byte-identical. deinit needs none of this: the removed objects live in
  // `injectedUuids`.
  const prevGeneratedSources /*: {[string]: Array<string>} */ =
    prevMarker?.generatedSources ?? {};
  const currentPaths = new Set(generatedSources.map(s => s.path));
  const staleUuids /*: Array<string> */ = [];
  for (const p of Object.keys(prevGeneratedSources)) {
    if (!currentPaths.has(p)) {
      staleUuids.push(...prevGeneratedSources[p]);
    }
  }
  // When the last generated source is gone, retire the now-empty group too.
  if (
    generatedSources.length === 0 &&
    Object.keys(prevGeneratedSources).length > 0
  ) {
    staleUuids.push(
      namespacedUUID(plan.rootUuid, 'PBXGroup', SPM_GENERATED_SOURCES_GROUP_ID),
    );
  }
  // Re-apply generated settings from a clean recorded baseline. This removes
  // linker entries for plugin frameworks that disappeared and keeps the new
  // marker a complete inverse after an idempotent update.
  let base = removeRecordedBuildSettings(
    original,
    prevMarker?.buildSettingChanges ?? [],
  );
  if (staleUuids.length > 0) {
    base = removeArrayMembersByUuid(base, staleUuids);
    for (const u of staleUuids) {
      base = removeObjectByUuid(base, u);
    }
  }

  const {
    text,
    injectedUuids,
    createdArrayFields,
    buildSettingChanges,
    generatedSourceUuids,
  } = injectSpmIntoPbxproj(
    base,
    {
      rootUuid: plan.rootUuid,
      targetUuid: plan.target.uuid,
      configUuids: plan.configUuids,
      frameworksPhaseUuid: plan.frameworksPhaseUuid,
      sourcesPhaseUuid: plan.sourcesPhaseUuid,
    },
    reactNativePath,
    remote,
    hermesCliPath,
    generatedSources,
    flavoredFrameworks,
  );

  const changed = writeIfChanged(pbxprojPath, text);
  log(
    changed
      ? `Injected SPM packages into ${path.relative(appRoot, pbxprojPath)}`
      : `${path.relative(appRoot, pbxprojPath)} already up to date`,
  );

  const projName = path.basename(xcodeprojPath, '.xcodeproj');
  const schemeResult = injectOrCreateScheme(xcodeprojPath, {
    appName: plan.target.name,
    targetUuid: plan.target.uuid,
    projName,
    // The scheme pre-action is SYNC-ONLY (no flavor swap). A pre-action swap
    // could win its race and mask a mismatch from the in-target detector.
    syncScript: buildSchemePreActionScript(reactNativePath),
  });
  log(`Scheme sync pre-action: ${schemeResult.status}`);

  // The RN version this app's xcframework artifact-cache slot should be
  // pinned to, when `add`/`update` was given an EXPLICIT `--version` — SETS
  // the pin. Omitting `--version` (opts.artifactsVersionOverride is null)
  // PRESERVES whatever was recorded on a prior run, since it's an
  // intentional pin, not something to silently re-derive from
  // node_modules/react-native/package.json. There is no "clear" verb yet;
  // `deinit` (removeSpmInjection) drops the whole marker, including this
  // field. Read back by readArtifactsVersionOverride (above) so the
  // build-time sync (sync-spm-autolinking.js) heals against the SAME slot
  // `add`/`update` selected, even on a version-mismatched setup.
  const artifactsVersionOverride =
    opts.artifactsVersionOverride ??
    prevMarker?.artifactsVersionOverride ??
    null;

  // Marker: idempotency signal + the exact, reversible record of every edit so
  // `deinit` (removeSpmInjection) can undo precisely what was added.
  writeIfChanged(
    path.join(xcodeprojPath, SPM_INJECTED_MARKER),
    JSON.stringify(
      {
        rootUuid: plan.rootUuid,
        target: plan.target.name,
        targetUuid: plan.target.uuid,
        injectedUuids: Array.from(new Set(injectedUuids)).sort(),
        createdArrayFields,
        buildSettingChanges,
        // Normalized path → [fileRefUuid, buildFileUuid]. Read back on the next
        // `update` to reconcile away entries that left the manifest.
        generatedSources: generatedSourceUuids,
        artifactsVersionOverride,
        scheme: {
          file: schemeResult.file,
          created: schemeResult.status === 'created',
        },
      },
      null,
      2,
    ) + '\n',
  );

  ensureStubPackages(appRoot);
  return {status: 'injected', target: plan.target.name};
}

/**
 * Remove the "Sync SPM Autolinking" pre-action that addPreActionToScheme added
 * to a scheme, and drop the `<PreActions>` wrapper if it is left empty (the
 * byte-identical inverse for the common case where injection created it).
 */
function removePreActionFromScheme(xml /*: string */) /*: string */ {
  const withoutAction = xml.replace(
    /[ \t]*<ExecutionAction\b(?:(?!<\/ExecutionAction>)[\s\S])*?title = "Sync SPM Autolinking"(?:(?!<\/ExecutionAction>)[\s\S])*?<\/ExecutionAction>\n?/,
    '',
  );
  return withoutAction.replace(/\n[ \t]*<PreActions>\s*<\/PreActions>/, '');
}

function removeRecordedBuildSettings(
  input /*: string */,
  changes /*: ReadonlyArray<BuildSettingChange> */,
) /*: string */ {
  let text = input;
  for (const change of changes) {
    const dict = () => {
      const config = findObjectByUuid(text, change.configUuid);
      if (config == null) {
        return null;
      }
      const buildSettings = findField(text, config, 'buildSettings');
      if (buildSettings == null) {
        return null;
      }
      return {
        uuid: change.configUuid,
        bodyOpen: buildSettings.valueStart,
        bodyClose: buildSettings.tokenEnd - 1,
      };
    };
    for (const key of Object.keys(change.appendedArrayValues ?? {})) {
      const current = dict();
      if (current != null) {
        text = removeArrayStringValues(
          text,
          current,
          key,
          change.appendedArrayValues[key],
        );
      }
    }
    for (const key of change.createdArrayKeys ?? []) {
      const current = dict();
      if (current != null) {
        text = removeField(text, current, key);
      }
    }
    for (const key of change.createdScalars ?? []) {
      const current = dict();
      if (current != null) {
        text = removeField(text, current, key);
      }
    }
    const replacedScalars /*: {[string]: string} */ =
      change.replacedScalars ?? {};
    for (const key of Object.keys(replacedScalars)) {
      const current = dict();
      if (current != null) {
        text = removeField(text, current, key);
        const replacement = dict();
        if (replacement != null) {
          const originalValue = replacedScalars[key];
          if (typeof originalValue === 'string') {
            text = ensureScalarField(text, replacement, key, originalValue);
          }
        }
      }
    }
  }
  return text;
}

/**
 * The exact inverse of `add` (injectSpmIntoExistingXcodeproj): using the
 * `.spm-injected.json` marker's precise record of every edit, remove only what
 * injection added — leaving any other (user) edits made afterwards intact. No
 * `git checkout`, no prompt. Returns {status:'absent'} when the project was
 * never injected.
 */
function removeSpmInjection(
  opts /*: {appRoot: string, xcodeprojPath: string} */,
) /*: {status: 'removed', target: string} | {status: 'absent'} */ {
  const {appRoot, xcodeprojPath} = opts;
  const markerPath = path.join(xcodeprojPath, SPM_INJECTED_MARKER);
  if (!fs.existsSync(markerPath)) {
    return {status: 'absent'};
  }
  // $FlowFixMe[incompatible-type] JSON.parse returns any
  const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  const pbxprojPath = path.join(xcodeprojPath, 'project.pbxproj');
  let text = fs.readFileSync(pbxprojPath, 'utf8');

  const injectedUuids /*: Array<string> */ = marker.injectedUuids ?? [];

  // 1. Drop our array members, then the array fields we created (now empty),
  //    then the injected object definitions.
  text = removeArrayMembersByUuid(text, injectedUuids);
  for (const f of marker.createdArrayFields ?? []) {
    const obj =
      f.container === 'project'
        ? findProjectObject(text)
        : findObjectByUuid(text, marker.targetUuid);
    if (obj != null) {
      text = removeField(text, obj, f.key);
    }
  }
  for (const uuid of injectedUuids) {
    text = removeObjectByUuid(text, uuid);
  }
  // Drop any section that injection created and we just emptied (e.g.
  // XCLocalSwiftPackageReference) — a well-formed pbxproj never carries an
  // empty `/* Begin X *​/ /* End X *​/` section, so this lands byte-identical.
  text = text.replace(
    /\/\* Begin (\w+) section \*\/\n\/\* End \1 section \*\/\n\n/g,
    '',
  );

  // 2. Reverse the per-config build-setting edits (only what we added).
  text = removeRecordedBuildSettings(text, marker.buildSettingChanges ?? []);
  writeIfChanged(pbxprojPath, text);
  log(`Removed SPM injection from ${path.relative(appRoot, pbxprojPath)}`);

  // 3. Scheme: delete it if injection created it, else strip the pre-action.
  const scheme = marker.scheme;
  if (scheme != null && scheme.file != null) {
    const schemePath = path.join(
      xcodeprojPath,
      'xcshareddata',
      'xcschemes',
      scheme.file,
    );
    if (scheme.created === true) {
      fs.rmSync(schemePath, {force: true});
    } else if (fs.existsSync(schemePath)) {
      const xml = fs.readFileSync(schemePath, 'utf8');
      writeIfChanged(schemePath, removePreActionFromScheme(xml));
    }
  }

  // 4. Drop the marker — the project is no longer SPM-injected.
  fs.rmSync(markerPath, {force: true});
  return {status: 'removed', target: marker.target};
}

module.exports = {
  generateXcscheme,
  buildSyncAutolinkingScript,
  buildSchemePreActionScript,
  buildEmbedFrameworksScript,
  flavorForBuildConfiguration,
  frameworkConditionalSettings,
  ensureStubPackages,
  buildSpmDependencyGraph,
  spmGraphToEntries,
  planInjection,
  injectSpmIntoPbxproj,
  injectSpmIntoExistingXcodeproj,
  removeSpmInjection,
  cleanupLeftoverPodsGroup,
  cleanupDanglingJavaScriptCoreRef,
  addPreActionToScheme,
  removePreActionFromScheme,
  findInjectedXcodeproj,
  readArtifactsVersionOverride,
  SPM_INJECTED_MARKER,
};
