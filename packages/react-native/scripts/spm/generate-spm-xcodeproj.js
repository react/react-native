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
const {parseConfigCommandJson} = require('./generate-spm-autolinking-config');
const {
  addArrayMembers,
  addArrayStringValues,
  commentSafe,
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
  uuidComment,
} = require('./spm-pbxproj');
const {
  isValidScriptPhaseId,
  isValidScriptPhaseName,
  makeLogger,
  remotePackageConfig,
} = require('./spm-utils');
const fs = require('node:fs');
const path = require('node:path');

/*:: import type {
  FlavoredFrameworkManifestEntry,
  PluginScriptPhase,
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

// Manifest of plugin-contributed build-time shell phases for the app target —
// SwiftPM has no `script_phase`, so a framework that must generate content into
// the app bundle (expo-constants' `EXConstants.bundle/app.config`) declares one
// through the plugin contract.
const SPM_SCRIPT_PHASES_MANIFEST = path.join(
  'build',
  'generated',
  'autolinking',
  '.spm-plugin-script-phases.json',
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
  // Array settings that existed as a SCALAR and were promoted to a `( … )`
  // array (key → the pre-injection raw value text, quotes included). Deinit
  // restores that value verbatim; removing the injected members would leave
  // the promoted array and its `"$(inherited)"` seed behind.
  promotedArrayScalars?: {[string]: string},
};
// An array field injection CREATED (rather than appended to a pre-existing
// one), so deinit removes the whole field and lands byte-identical.
type CreatedArrayField = {container: 'project' | 'target', key: string};
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

/**
 * Build a PBXShellScriptBuildPhase entry. `inputPaths`/`outputPaths` accept
 * either a plain path array or an already-serialized pbxproj list.
 * `alwaysOutOfDate` emits Xcode's own `alwaysOutOfDate = 1;` (unquoted, right
 * after `isa`, so a project Xcode rewrites stays diff-free) and is omitted
 * entirely when false. `comment` overrides the cosmetic `/* … *​/` label, which
 * otherwise derives from `name`.
 */
function shellScriptPhase(
  phaseUUID /*: string */,
  name /*: string */,
  script /*: string */,
  options /*: {inputPaths?: ?(string | ReadonlyArray<string>), outputPaths?: ?(string | ReadonlyArray<string>), alwaysOutOfDate?: ?boolean, comment?: string} */ = {},
) /*: {uuid: string, comment: string, fields: {[string]: string}} */ {
  const empty = '(\n\t\t\t)';
  const pathList = (
    value /*: ?(string | ReadonlyArray<string>) */,
  ) /*: string */ => {
    if (value == null) {
      return empty;
    }
    return typeof value === 'string' ? value : pbxPathList(value);
  };
  return {
    uuid: phaseUUID,
    comment: options.comment ?? name,
    fields: {
      isa: 'PBXShellScriptBuildPhase',
      ...(options.alwaysOutOfDate === true ? {alwaysOutOfDate: '1'} : {}),
      buildActionMask: '2147483647',
      files: empty,
      inputFileListPaths: empty,
      inputPaths: pathList(options.inputPaths),
      name: quoteIfNeeded(name),
      outputFileListPaths: empty,
      outputPaths: pathList(options.outputPaths),
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

/**
 * The app target's `buildPhases` members, in the order the file lists them.
 * Line-leading UUIDs only: a member's trailing comment carries a plugin-supplied
 * phase name, and one that happens to look like a UUID would otherwise read as an
 * extra member — leaving the actual order permanently at odds with the declared
 * one, and offering a non-member as a re-seating anchor.
 */
function buildPhaseOrder(
  text /*: string */,
  target /*: {bodyOpen: number, bodyClose: number, ...} */,
) /*: Array<string> */ {
  const field = findField(text, target, 'buildPhases');
  if (field == null) {
    return [];
  }
  return [...field.value.matchAll(/^[\t ]*([0-9A-Fa-f]{24})\b/gm)].map(
    m => m[1],
  );
}

/**
 * Rewrite the trailing comment Xcode keeps beside a UUID — on the object's own
 * definition line and on every array-member line referencing it. Xcode
 * normalizes those comments on its next write, so leaving a stale one behind
 * (after a plugin renames a phase) plants a spurious diff in the user's repo.
 * No-op when the comment already reads `comment`.
 */
function setUuidComment(
  text /*: string */,
  uuid /*: string */,
  comment /*: string */,
) /*: string */ {
  return text.replace(
    new RegExp(`(\\n[\\t ]*${uuid})(?: /\\* [^\\n]*? \\*/)?( = \\{|,)`, 'g'),
    (_match, head, tail) => `${head}${uuidComment(comment)}${tail}`,
  );
}

/*:: type SeatedPhase = {uuid: string, comment: string, position: 'beforeCompile' | 'end'}; */

/**
 * Seat the plugin phases in the order the manifest declares: `beforeCompile`
 * ones directly after the Sync SPM Autolinking phase (which stays first — it
 * regenerates the content everything else reads) and always before Sources,
 * `end` ones at the true end of `buildPhases`, after the app's own JS-bundle
 * phase. The other members keep their relative order.
 *
 * `beforeCompile` is anchored on Sources, not merely on the sync phase: RN never
 * re-seats its own sync phase, so a user who drags it below Sources would
 * otherwise have every `beforeCompile` phase seated after compilation — the one
 * thing the position promises not to do. Without a Sources phase the sync phase
 * is the anchor.
 *
 * Rewrites the membership lines ONLY when the actual order differs from that,
 * which is what keeps an unchanged sync byte-identical — `addBuildPhaseAfter`
 * and `addArrayMembers` both short-circuit on a UUID that is already a member,
 * so re-placing has to be driven from here. A phase a user dragged elsewhere in
 * Xcode is therefore moved back: the declared position wins.
 */
function seatScriptPhases(
  input /*: string */,
  targetUuid /*: string */,
  syncPhaseUuid /*: string */,
  phases /*: ReadonlyArray<SeatedPhase> */,
  sourcesPhaseUuid /*: ?string */,
) /*: string */ {
  const pluginUuids = new Set(phases.map(p => p.uuid));
  const actual = buildPhaseOrder(
    input,
    findApplicationTargetByUuid(input, targetUuid),
  );
  const others = actual.filter(uuid => !pluginUuids.has(uuid));
  const beforeCompile = phases.filter(p => p.position === 'beforeCompile');
  const atEnd = phases.filter(p => p.position !== 'beforeCompile');
  const sourcesAt =
    sourcesPhaseUuid != null ? others.indexOf(sourcesPhaseUuid) : -1;
  const afterSyncAt = others.indexOf(syncPhaseUuid) + 1;
  // 0 — no sync phase member, or Sources ahead of it — makes the beforeCompile
  // phases lead the array, matching addArrayMembers' prepend fallback below.
  const insertAt =
    sourcesAt >= 0 ? Math.min(afterSyncAt, sourcesAt) : afterSyncAt;
  const desired = [
    ...others.slice(0, insertAt),
    ...beforeCompile.map(p => p.uuid),
    ...others.slice(insertAt),
    ...atEnd.map(p => p.uuid),
  ];
  if (
    desired.length === actual.length &&
    desired.every((uuid, i) => uuid === actual[i])
  ) {
    return input;
  }
  // File-wide removal is safe for a shell-phase UUID: it appears on its own
  // definition line (which ends `= {`, never matched) and on `buildPhases`
  // member lines. The uncovered case is a user who copied the same phase object
  // into a SECOND target's buildPhases — it is stripped there too.
  let text = removeArrayMembersByUuid(input, [...pluginUuids]);
  const target = () => findApplicationTargetByUuid(text, targetUuid);
  let anchor = insertAt > 0 ? others[insertAt - 1] : null;
  for (const member of beforeCompile) {
    text =
      anchor == null
        ? addArrayMembers(text, target(), 'buildPhases', [member], {
            prepend: true,
          })
        : addBuildPhaseAfter(text, target(), anchor, member);
    anchor = member.uuid;
  }
  for (const member of atEnd) {
    text = addArrayMembers(text, target(), 'buildPhases', [member]);
  }
  return text;
}

function addBuildPhaseAfter(
  text /*: string */,
  target /*: {bodyOpen: number, bodyClose: number, ...} */,
  afterUuid /*: string */,
  member /*: {uuid: string, comment: string, ...} */,
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
  const line = `\n${indent}${member.uuid}${uuidComment(member.comment)},`;
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

// The inverse of escapeXmlAttribute. `&amp;` is expanded LAST so an entity that
// was itself escaped (`&lt;` → `&amp;lt;`) round-trips back to its own text
// rather than to `<`.
function unescapeXmlAttribute(s /*: string */) /*: string */ {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
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

// Array build settings injected only into debug-flavored configurations.
//
// Swift's `#if DEBUG` is gated by SWIFT_ACTIVE_COMPILATION_CONDITIONS, NOT by
// GCC_PREPROCESSOR_DEFINITIONS (which only reaches C/ObjC/C++). The app
// template does not commit the setting: CocoaPods injects it at `pod install`
// time (react_native_post_install → set_build_setting
// SWIFT_ACTIVE_COMPILATION_CONDITIONS = ["$(inherited)", "DEBUG"] on Debug).
// An SPM app never runs CocoaPods, so without this `#if DEBUG` is false even
// in a Debug build — AppDelegate.swift's `bundleURL()` skips the Metro URL,
// falls back to a main.jsbundle that a Debug build never produced, and the app
// dies at launch with "No script url provided … unsanitizedScriptURLString =
// (null)" while Metro is running right there.
//
// Paired with RN_SPM_FLAVOR via flavorForBuildConfiguration, so a config that
// links the debug xcframeworks also compiles its Swift with DEBUG.
const DEBUG_ARRAY_SETTINGS = [
  {key: 'SWIFT_ACTIVE_COMPILATION_CONDITIONS', values: ['DEBUG']},
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
  scriptPhases /*: ReadonlyArray<PluginScriptPhase> */ = [],
) /*: {text: string, injectedUuids: Array<string>, createdArrayFields: Array<CreatedArrayField>, buildSettingChanges: Array<BuildSettingChange>, generatedSourceUuids: {[string]: Array<string>}, scriptPhaseUuids: {[string]: string}} */ {
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

  const createdArrayFields /*: Array<CreatedArrayField> */ = [];

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
        // The name/path VALUES stay verbatim (escaped) — only the cosmetic
        // comments are normalized, falling back to the normalized path (the
        // ledger key) and then to no comment at all, which is well-formed.
        const label = commentSafe(src.name) || commentSafe(src.path);
        const inSources = label === '' ? '' : `${label} in Sources`;
        fileRefs.push({
          uuid: fileRefUuid,
          comment: label,
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
          comment: inSources,
          fields: {
            isa: 'PBXBuildFile',
            fileRef: `${fileRefUuid}${uuidComment(label)}`,
          },
        });
        sourcesMembers.push({uuid: buildFileUuid, comment: inSources});
        groupChildren.push({uuid: fileRefUuid, comment: label});
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

  // 9. Plugin-declared build phases (SwiftPM has no `script_phase`). Each
  //    phase's UUID is keyed on its plugin id, so re-runs refresh in place and
  //    `deinit` reverses it.
  const scriptPhaseUuids /*: {[string]: string} */ = {};
  if (scriptPhases.length > 0) {
    const seated /*: Array<SeatedPhase> */ = [];
    for (const scriptPhase of scriptPhases) {
      const uuid = mkUuid(
        'PBXShellScriptBuildPhase',
        `plugin:${scriptPhase.id}`,
      );
      scriptPhaseUuids[scriptPhase.id] = uuid;
      // The full name goes into the `name` field (escaped) — that is what Xcode
      // displays. The cosmetic comments get it normalized, falling back to the
      // normalized id and then to no comment at all, which is well-formed. The
      // fallback is sanitized rather than trusted to the id charset, so widening
      // that charset can never reach a comment.
      const comment =
        commentSafe(scriptPhase.name) || commentSafe(scriptPhase.id);
      const entry = shellScriptPhase(
        uuid,
        scriptPhase.name,
        scriptPhase.script,
        {
          inputPaths: scriptPhase.inputPaths,
          outputPaths: scriptPhase.outputPaths,
          alwaysOutOfDate: scriptPhase.alwaysOutOfDate,
          comment,
        },
      );
      if (!text.includes(uuid)) {
        text = insertObjectsIntoSection(
          text,
          'PBXShellScriptBuildPhase',
          serializeEntry(entry),
        );
      } else {
        // Rewrite the fields we own unconditionally — byte-identical when the
        // plugin's declaration hasn't changed, so no content hashing is needed.
        // Each write shifts offsets, hence the re-lookup per field.
        for (const key of [
          'name',
          'shellScript',
          'inputPaths',
          'outputPaths',
        ]) {
          const current = findObjectByUuid(text, uuid);
          if (current != null) {
            text = setScalarField(text, current, key, entry.fields[key]);
          }
        }
        // Flipping alwaysOutOfDate back off means REMOVING the field —
        // setScalarField would only ever write a value.
        const current = findObjectByUuid(text, uuid);
        if (current != null) {
          text =
            scriptPhase.alwaysOutOfDate === true
              ? setScalarField(text, current, 'alwaysOutOfDate', '1')
              : removeField(text, current, 'alwaysOutOfDate');
        }
      }
      injectedUuids.push(uuid);
      text = setUuidComment(text, uuid, comment);
      seated.push({uuid, comment, position: scriptPhase.position});
    }
    text = seatScriptPhases(
      text,
      plan.targetUuid,
      syncPhaseUuid,
      seated,
      sourcesPhaseUuid,
    );
  }

  return {
    text,
    injectedUuids,
    createdArrayFields,
    buildSettingChanges,
    generatedSourceUuids,
    scriptPhaseUuids,
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

/** Strip the surrounding plist quotes from a build-setting token, if any. */
function unquotePlist(s /*: string */) /*: string */ {
  return s.replace(/^"/, '').replace(/"$/, '');
}

/**
 * The individual values a build setting already carries, unquoted — for both
 * shapes a pbxproj uses: the array form Xcode writes for a multi-value setting
 * (`("$(inherited)", DEBUG)`) and the scalar form the app template and
 * hand-edits use (`"$(inherited) DEBUG"`). Membership, not substring: the
 * latter would read `MY_DEBUG_FLAG` as `DEBUG` already being set and silently
 * skip the injection.
 */
function buildSettingValueTokens(value /*: string */) /*: Set<string> */ {
  return new Set(
    value
      .split(/[\s,()]+/)
      .filter(Boolean)
      .map(unquotePlist),
  );
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
  const promotedArrayScalars /*: {[string]: string} */ = {};
  const createdScalars /*: Array<string> */ = [];
  const arraySettings = [
    ...INJECTED_ARRAY_SETTINGS,
    ...(flavorForBuildConfiguration(configurationName) === 'debug'
      ? DEBUG_ARRAY_SETTINGS
      : []),
    ...frameworkArrayBuildSettings(flavoredFrameworks),
  ];
  for (const {key, values} of arraySettings) {
    const d = dict();
    if (d == null) {
      continue;
    }
    const existing = findField(text, d, key);
    // Non-null only for a scalar addArrayStringValues would promote to an array
    // (same array-vs-scalar test it uses). Kept RAW: findField's token for a
    // bare scalar ends at the `;`, so it carries any whitespace before it, and
    // deinit has to write those bytes back verbatim.
    const priorScalar =
      existing != null && !existing.value.trimStart().startsWith('(')
        ? existing.value
        : null;
    if (existing == null) {
      createdArrayKeys.push(key);
    } else {
      const present = buildSettingValueTokens(existing.value);
      const fresh = values.filter(v => !present.has(unquotePlist(v)));
      if (fresh.length === 0) {
        // Nothing to add. Skip addArrayStringValues entirely: its dedupe is by
        // EXACT array member, so a value the user carries in the scalar form
        // (`SWIFT_ACTIVE_COMPILATION_CONDITIONS = "$(inherited) DEBUG"`) would
        // otherwise be promoted to an array and re-appended — an edit `deinit`
        // has no record of and so could never reverse.
        continue;
      }
      if (priorScalar == null) {
        appendedArrayValues[key] = fresh;
      }
    }
    const beforeAdd = text;
    text = addArrayStringValues(text, d, key, values);
    // Record only a promotion that actually happened: addArrayStringValues
    // no-ops when `values` is empty or every value is already a member, and a
    // recorded-but-untouched field would have deinit clobber whatever the user
    // has there by then. Restoring the scalar subsumes removing the injected
    // members, so the two records stay mutually exclusive per key.
    if (priorScalar != null && text !== beforeAdd) {
      promotedArrayScalars[key] = priorScalar;
    }
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
      ...(Object.keys(promotedArrayScalars).length > 0
        ? {promotedArrayScalars}
        : {}),
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
  let raw /*: string */ = '';
  try {
    raw = fs.readFileSync(manifestPath, 'utf8');
  } catch {
    return [];
  }
  let entries /*: unknown */ = null;
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

const nonEmptyStrings = (value /*: unknown */) /*: ?Array<string> */ =>
  Array.isArray(value)
    ? value.filter(p => typeof p === 'string' && p.length > 0)
    : null;

/**
 * Read the plugin script-phases manifest at
 * `<appRoot>/build/generated/autolinking/.spm-plugin-script-phases.json`.
 * Absent, unparseable, or malformed → `[]`. Lenient by design even though the
 * plugin contract validates these entries fatally at invoke time: the sidecar
 * legitimately does not exist yet on a first `spm add`, and a stale or
 * hand-edited file must not break injection. This reader is the ONLY gate on
 * such a file, so it applies the same id/name rules (from spm-utils) that
 * invokePlugins enforces fatally.
 */
function readScriptPhasesManifest(
  appRoot /*: string */,
) /*: Array<PluginScriptPhase> */ {
  const manifestPath = path.join(appRoot, SPM_SCRIPT_PHASES_MANIFEST);
  let raw /*: string */ = '';
  try {
    raw = fs.readFileSync(manifestPath, 'utf8');
  } catch {
    return [];
  }
  let entries /*: unknown */ = null;
  try {
    entries = JSON.parse(raw);
  } catch {
    log(
      `warning: could not parse ${SPM_SCRIPT_PHASES_MANIFEST}; ` +
        'skipping script phases.',
    );
    return [];
  }
  if (!Array.isArray(entries)) {
    return [];
  }
  const out /*: Array<PluginScriptPhase> */ = [];
  for (const entry of entries) {
    if (
      entry == null ||
      typeof entry !== 'object' ||
      !isValidScriptPhaseId(entry.id) ||
      !isValidScriptPhaseName(entry.name) ||
      typeof entry.script !== 'string' ||
      entry.script.length === 0 ||
      // An unknown position is a malformed entry, not something to coerce: it
      // would silently run somewhere the plugin didn't ask for.
      (entry.position != null &&
        entry.position !== 'beforeCompile' &&
        entry.position !== 'end') ||
      // Dedupe by id — the id seeds the phase's UUID, so a duplicate would
      // insert two objects with identical UUIDs.
      out.some(phase => phase.id === entry.id)
    ) {
      continue;
    }
    const phase /*: PluginScriptPhase */ = {
      id: entry.id,
      name: entry.name,
      script: entry.script,
      position: entry.position ?? 'end',
    };
    const inputPaths = nonEmptyStrings(entry.inputPaths);
    const outputPaths = nonEmptyStrings(entry.outputPaths);
    if (inputPaths != null) {
      phase.inputPaths = inputPaths;
    }
    if (outputPaths != null) {
      phase.outputPaths = outputPaths;
    }
    if (typeof entry.alwaysOutOfDate === 'boolean') {
      phase.alwaysOutOfDate = entry.alwaysOutOfDate;
    }
    out.push(phase);
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
) /*: ?{generatedSources?: {[string]: Array<string>}, scriptPhases?: {[string]: string}, artifactsVersionOverride?: ?string, configCommand?: ?Array<string>, buildSettingChanges?: Array<BuildSettingChange>, createdArrayFields?: Array<CreatedArrayField>, scheme?: {file?: ?string, created?: ?boolean}, ...} */ {
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
// marker readers below, and for callers that only locate the project (setup-
// apple-spm.js's action defaulting and `deinit`), to call without exercising
// any pbxproj-editing machinery.
function findInjectedXcodeproj(appRoot /*: string */) /*: string | null */ {
  let entries /*: Array<{name: string, isDirectory(): boolean}> */ = [];
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
 * the marker can't be read (never throws). Pure fs reads — setup-apple-spm.js's
 * determineVersion prefers the pinned version over the one derived from
 * node_modules/react-native/package.json, so a later flagless `add`/`update`
 * (and `download`) stays on the SAME artifact slot the explicit `--version`
 * selected.
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
 * Read the autolinking config command a previous `spm add`/`update` pinned into
 * the injected xcodeproj's `.spm-injected.json` marker, or null when nothing
 * usable is pinned. Pure fs reads, like readArtifactsVersionOverride above, but
 * this one IS wired: setup-apple-spm.js's resolveExplicitConfigCommand reads it
 * on add/update/scaffold and on the build-time `sync`. Re-validated through the
 * same parseConfigCommandJson the flag goes through, and never throws, so a
 * hand-edited marker degrades to the env-var/default command instead of
 * injecting a bogus argv into the build.
 */
function readPinnedConfigCommand(appRoot /*: string */) /*: ?Array<string> */ {
  const xcodeprojPath = findInjectedXcodeproj(appRoot);
  if (xcodeprojPath == null) {
    return null;
  }
  const pinned = readMarker(xcodeprojPath)?.configCommand;
  if (pinned == null) {
    return null;
  }
  try {
    return parseConfigCommandJson(JSON.stringify(pinned), SPM_INJECTED_MARKER);
  } catch {
    return null;
  }
}

/**
 * Union the array fields RN has created across syncs, deduped by container+key.
 *
 * THE CANONICAL STATEMENT of why anything RN created is recorded stickily (the
 * marker's `scheme.created` carries it forward for the same reason): a re-sync
 * re-injects from a baseline with only the BUILD SETTINGS reversed, so it finds
 * whatever the first run created already there and reports creating nothing. Once
 * RN has created something, that fact has to be carried forward, or the new
 * marker forgets it and `deinit` leaves an empty `packageReferences` /
 * `packageProductDependencies` behind and the generated scheme on disk.
 *
 * The record licenses removal; it does not order it. `deinit` still checks that
 * what it is about to remove is RN's (see its step 1 and isGeneratedScheme), so
 * carrying forward a field the user has since taken over — or deleted by hand —
 * is safe.
 */
function mergeCreatedArrayFields(
  previous /*: ReadonlyArray<CreatedArrayField> */,
  current /*: ReadonlyArray<CreatedArrayField> */,
) /*: Array<CreatedArrayField> */ {
  const merged = [...previous];
  for (const field of current) {
    if (
      !merged.some(
        seen => seen.container === field.container && seen.key === field.key,
      )
    ) {
      merged.push(field);
    }
  }
  return merged;
}

/**
 * Add SPM packages to a user's EXISTING xcodeproj in place. Returns
 * {status: 'injected', target} on success, or {status: 'refused', reason}
 * when the project can't be safely edited (caller surfaces it; fail-loud).
 */
function injectSpmIntoExistingXcodeproj(
  opts /*: {appRoot: string, reactNativeRoot: string, xcodeprojPath: string, appName?: ?string, artifactsVersionOverride?: ?string, configCommand?: ?Array<string>} */,
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
  const scriptPhases = readScriptPhasesManifest(appRoot);
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
  // Same reconciliation for script phases, keyed on the plugin-supplied id.
  const prevScriptPhases /*: {[string]: string} */ =
    prevMarker?.scriptPhases ?? {};
  const currentPhaseIds = new Set(scriptPhases.map(p => p.id));
  for (const id of Object.keys(prevScriptPhases)) {
    if (!currentPhaseIds.has(id)) {
      staleUuids.push(prevScriptPhases[id]);
    }
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
    scriptPhaseUuids,
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
    scriptPhases,
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
  // field. Read back by readArtifactsVersionOverride (above) so a later
  // flagless `add`/`update`/`download` resolves to the SAME slot, even on a
  // version-mismatched setup.
  const artifactsVersionOverride =
    opts.artifactsVersionOverride ??
    prevMarker?.artifactsVersionOverride ??
    null;

  // Same set-or-preserve contract as the version pin above, for the autolinking
  // config command `add`/`update` resolved (`--config-command` or
  // RCT_SPM_AUTOLINKING_CONFIG_COMMAND) — the build-time sync sees neither the
  // flag nor the developer's shell environment, so without the pin it
  // re-derives autolinking.json with the default @react-native-community/cli
  // command and breaks apps that replace it. Read back by
  // readPinnedConfigCommand (above). No "clear" verb yet either; `deinit` drops
  // the whole marker, this field with it.
  const configCommand = opts.configCommand ?? prevMarker?.configCommand ?? null;

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
        createdArrayFields: mergeCreatedArrayFields(
          prevMarker?.createdArrayFields ?? [],
          createdArrayFields,
        ),
        buildSettingChanges,
        // Normalized path → [fileRefUuid, buildFileUuid]. Read back on the next
        // `update` to reconcile away entries that left the manifest.
        generatedSources: generatedSourceUuids,
        // Plugin phase id → its PBXShellScriptBuildPhase UUID, reconciled the
        // same way.
        scriptPhases: scriptPhaseUuids,
        artifactsVersionOverride,
        configCommand,
        scheme: {
          file: schemeResult.file,
          // Sticky — see mergeCreatedArrayFields for why a later sync cannot
          // observe this for itself.
          created:
            schemeResult.status === 'created' ||
            prevMarker?.scheme?.created === true,
        },
      },
      null,
      2,
    ) + '\n',
  );

  ensureStubPackages(appRoot);
  return {status: 'injected', target: plan.target.name};
}

/** The sync pre-action's script, unescaped, or null when the scheme has none. */
function schemePreActionScript(xml /*: string */) /*: ?string */ {
  const titleIdx = xml.indexOf('title = "Sync SPM Autolinking"');
  if (titleIdx < 0) {
    return null;
  }
  const marker = 'scriptText = "';
  const start = xml.indexOf(marker, titleIdx);
  if (start < 0) {
    return null;
  }
  const valueStart = start + marker.length;
  // escapeXmlAttribute maps a literal `"` to `&quot;`, so the next `"` is always
  // the closing delimiter.
  const valueEnd = xml.indexOf('"', valueStart);
  return valueEnd < 0
    ? null
    : unescapeXmlAttribute(xml.slice(valueStart, valueEnd));
}

/**
 * Whether `xml` is still, byte for byte, the scheme RN generates for this target
 * — everything but the pre-action's script, which RN rewrites in place on every
 * sync and which varies with the app's react-native path, so it cannot be part of
 * an ownership test.
 *
 * `deinit` deletes a scheme the marker says RN created only while this holds. A
 * user may replace a generated scheme with one of their own under the same name
 * (same target, so `injectOrCreateScheme` finds and updates it, and the created
 * record stays), and destroying that is unrecoverable where leaving a scheme
 * behind is not — so the harmless way of being wrong wins: a generated scheme the
 * user has since edited leaks, minus its pre-action.
 */
function isGeneratedScheme(
  xml /*: string */,
  appName /*: string */,
  targetUuid /*: string */,
  projName /*: string */,
) /*: boolean */ {
  const script = schemePreActionScript(xml);
  return (
    script != null &&
    xml === generateXcscheme(appName, targetUuid, projName, script)
  );
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
    const promotedArrayScalars /*: {[string]: string} */ =
      change.promotedArrayScalars ?? {};
    for (const key of Object.keys(promotedArrayScalars)) {
      const current = dict();
      const originalValue = promotedArrayScalars[key];
      // A field that is gone was deleted by the user after injection; restoring
      // it would resurrect it, at the top of the dict, matching neither state.
      if (
        current != null &&
        typeof originalValue === 'string' &&
        findField(text, current, key) != null
      ) {
        // Rewriting the whole value is what makes the promotion reversible at
        // all — its members and its `"$(inherited)"` seed are indistinguishable
        // from the user's own once folded together. The tradeoff: members the
        // user hand-added to the promoted array afterwards are discarded.
        text = setScalarField(text, current, key, originalValue);
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
    if (obj == null) {
      continue;
    }
    // The record says the field did not exist before RN created it, which is
    // necessary but not sufficient: anything still in it after our own members
    // are gone is the user's (their own SPM package, added to the same field),
    // and dropping the field would orphan it.
    const field = findField(text, obj, f.key);
    if (field != null && /^\(\s*\)$/.test(field.value)) {
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

  // 3. Scheme: delete it if injection created it AND still owns its contents,
  //    else strip the pre-action and leave the file (see isGeneratedScheme).
  const scheme = marker.scheme;
  if (scheme != null && scheme.file != null) {
    const schemePath = path.join(
      xcodeprojPath,
      'xcshareddata',
      'xcschemes',
      scheme.file,
    );
    if (fs.existsSync(schemePath)) {
      const xml = fs.readFileSync(schemePath, 'utf8');
      const ours =
        scheme.created === true &&
        isGeneratedScheme(
          xml,
          marker.target,
          marker.targetUuid,
          path.basename(xcodeprojPath, '.xcodeproj'),
        );
      if (ours) {
        fs.rmSync(schemePath, {force: true});
      } else {
        writeIfChanged(schemePath, removePreActionFromScheme(xml));
      }
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
  buildPhaseOrder,
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
  readPinnedConfigCommand,
  readScriptPhasesManifest,
  SPM_INJECTED_MARKER,
};
