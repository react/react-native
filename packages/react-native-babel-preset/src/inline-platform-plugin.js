/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// This file uses Flow comment syntax so that it may be used from source as part
// of a transformer without itself requiring transformation, matching
// ./index.js.

'use strict';

/*::
import type {PluginObj} from '@babel/core';
import type {Binding, NodePath} from '@babel/traverse';
import type {
  CallExpression,
  MemberExpression,
  Node,
  ObjectExpression,
  ObjectPattern,
} from '@babel/types';
// Type-only import. No runtime dependency.
// eslint-disable-next-line import/no-extraneous-dependencies
import typeof * as Types from '@babel/types';

export type Options = {
  platform: ?string,
};

// What a proven expression refers to.
//
// PLATFORM        the Platform object itself
// RN_BARREL       the `react-native` module's exports object
// PLATFORM_MODULE the exports object of Libraries/Utilities/Platform
type Provenance = 'platform' | 'rn-barrel' | 'platform-module';

type State = {
  opts: Options,
  filename?: ?string,
  ...
};
*/

const nodePath = require('node:path');

const RN_PACKAGE_NAME = 'react-native';
const PLATFORM_MODULE_PATH = 'Libraries/Utilities/Platform';
const RN_PLATFORM_SPECIFIER = RN_PACKAGE_NAME + '/' + PLATFORM_MODULE_PATH;
const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

const PLATFORM /*: Provenance */ = 'platform';
const RN_BARREL /*: Provenance */ = 'rn-barrel';
const PLATFORM_MODULE /*: Provenance */ = 'platform-module';

// Sentinel stored while a binding is being resolved, to break alias cycles.
const RESOLVING = 'resolving';

function toPosix(filePath /*: string */) /*: string */ {
  return filePath.split(nodePath.sep).join('/').split('\\').join('/');
}

function stripSourceExtension(filePath /*: string */) /*: string */ {
  for (const extension of SOURCE_EXTENSIONS) {
    if (filePath.endsWith(extension)) {
      return filePath.slice(0, -extension.length);
    }
  }
  return filePath;
}

/**
 * Whether a relative specifier in `filename` logically refers to React
 * Native's own Platform module.
 *
 * This is a purely lexical judgement - we never touch the filesystem, and we
 * never resolve the platform-specific implementation (Platform.ios.js,
 * Platform.android.js). Metro does that later; the identity we care about here
 * is the extension-less module `<rn-root>/Libraries/Utilities/Platform`.
 *
 * `filename` may be absolute or project-root-relative: Metro passes
 * `path.relative(projectRoot, filePath)`, while Babel callers generally pass an
 * absolute path. Both work, because everything below is relative arithmetic on
 * the importer's own path. It does mean a relative importer path is interpreted
 * as being rooted at the project root, so this assumes the project root is not
 * itself inside the react-native package - true for any real app, and for RN's
 * own repo, where the project root is the monorepo root.
 *
 * The React Native package root is identified by its directory name, which
 * holds for every layout we need to support:
 *
 *   node_modules/react-native/...
 *   packages/react-native/...
 *   node_modules/.pnpm/react-native@x.y.z/node_modules/react-native/...
 *
 * We deliberately do not accept a path that merely ends in
 * `Libraries/Utilities/Platform`: an app with its own module of that name must
 * not be inlined.
 */
function isRelativeReactNativePlatformImport(
  specifier /*: string */,
  filename /*: ?string */,
) /*: boolean */ {
  if (filename == null || filename === '') {
    return false;
  }

  const importer = toPosix(filename);
  // Resolve with posix semantics against the importer's directory, so that a
  // relative importer path stays relative rather than being resolved against
  // the process cwd (which has nothing to do with the bundle).
  const target = stripSourceExtension(
    nodePath.posix.join(nodePath.posix.dirname(importer), specifier),
  );
  const suffix = '/' + PLATFORM_MODULE_PATH;

  if (!target.endsWith(suffix)) {
    return false;
  }

  const reactNativeRoot = target.slice(0, -suffix.length);

  // A specifier that climbs above the root it was resolved against cannot be
  // trusted; `join` leaves the leading `..` segments in place.
  if (reactNativeRoot.startsWith('..')) {
    return false;
  }

  // The importer must live inside the same React Native package.
  if (!importer.startsWith(reactNativeRoot + '/')) {
    return false;
  }

  return nodePath.posix.basename(reactNativeRoot) === RN_PACKAGE_NAME;
}

function isRelativeSpecifier(specifier /*: string */) /*: boolean */ {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

/**
 * Non-computed, identifier-keyed property name, or null.
 */
function getStaticPropertyName(
  node /*: MemberExpression */,
) /*: string | null */ {
  if (node.computed === true) {
    return null;
  }
  if (node.property.type === 'Identifier') {
    return node.property.name;
  }
  return null;
}

module.exports = function inlinePlatformPlugin(
  {types: t} /*: {types: Types} */,
) /*: PluginObj<State> */ {
  // Per-file cache of resolved binding provenance, reset in `pre()`. Held in a
  // closure rather than on the plugin pass so the visitor need not reference
  // `this`.
  let rnBindingCache /*: WeakMap<Binding, Provenance | null | 'resolving'> */ =
    new WeakMap();

  /**
   * What module a specifier resolves to, from React Native's point of view.
   */
  function getModuleProvenance(
    specifier /*: string */,
    state /*: State */,
  ) /*: Provenance | null */ {
    if (specifier === RN_PACKAGE_NAME) {
      return RN_BARREL;
    }
    if (specifier === RN_PLATFORM_SPECIFIER) {
      return PLATFORM_MODULE;
    }
    if (!isRelativeSpecifier(specifier)) {
      return null;
    }
    return isRelativeReactNativePlatformImport(specifier, state.filename)
      ? PLATFORM_MODULE
      : null;
  }

  /**
   * Reading `propertyName` off an expression with `objectProvenance`.
   */
  function getMemberProvenance(
    objectProvenance /*: Provenance | null */,
    propertyName /*: string */,
  ) /*: Provenance | null */ {
    if (objectProvenance === RN_BARREL && propertyName === 'Platform') {
      return PLATFORM;
    }
    if (objectProvenance === PLATFORM_MODULE && propertyName === 'default') {
      return PLATFORM;
    }
    return null;
  }

  function getRequireCallProvenance(
    path /*: NodePath<CallExpression> */,
    state /*: State */,
  ) /*: Provenance | null */ {
    if (!path.get('callee').isIdentifier({name: 'require'})) {
      return null;
    }
    // Only a free `require` is a module import. A local binding named
    // `require` may be anything at all.
    if (path.scope.getBinding('require') != null) {
      return null;
    }
    const args = path.node.arguments;
    if (args.length !== 1 || args[0].type !== 'StringLiteral') {
      return null;
    }
    return getModuleProvenance(args[0].value, state);
  }

  function getExpressionProvenance(
    path /*: NodePath<$FlowFixMe> */,
    state /*: State */,
  ) /*: Provenance | null */ {
    if (path.isIdentifier()) {
      const binding = path.scope.getBinding(path.node.name);
      return binding == null ? null : getBindingProvenance(binding, state);
    }
    if (path.isMemberExpression()) {
      const propertyName = getStaticPropertyName(path.node);
      if (propertyName == null) {
        return null;
      }
      return getMemberProvenance(
        getExpressionProvenance(path.get('object'), state),
        propertyName,
      );
    }
    if (path.isCallExpression()) {
      return getRequireCallProvenance(path, state);
    }
    return null;
  }

  function getImportBindingProvenance(
    binding /*: Binding */,
    state /*: State */,
  ) /*: Provenance | null */ {
    const specifierPath = binding.path;
    const declaration = specifierPath.parent;

    if (declaration.type !== 'ImportDeclaration') {
      return null;
    }
    // `import type {Platform} from ...` binds nothing at runtime.
    if (
      declaration.importKind === 'type' ||
      declaration.importKind === 'typeof'
    ) {
      return null;
    }

    const moduleProvenance = getModuleProvenance(
      declaration.source.value,
      state,
    );
    if (moduleProvenance == null) {
      return null;
    }

    switch (specifierPath.node.type) {
      case 'ImportNamespaceSpecifier':
        // A namespace object stands in for the module's exports.
        return moduleProvenance;
      case 'ImportDefaultSpecifier':
        // `react-native` is CommonJS, so interop hands back the barrel itself.
        return moduleProvenance === RN_BARREL
          ? RN_BARREL
          : getMemberProvenance(moduleProvenance, 'default');
      case 'ImportSpecifier': {
        if (specifierPath.node.importKind === 'type') {
          return null;
        }
        const imported = specifierPath.node.imported;
        const importedName =
          imported.type === 'Identifier' ? imported.name : imported.value;
        return getMemberProvenance(moduleProvenance, importedName);
      }
      default:
        return null;
    }
  }

  /**
   * Provenance of a `const {Platform} = require('react-native')` style
   * binding.
   */
  function getDestructuredProvenance(
    binding /*: Binding */,
    pattern /*: ObjectPattern */,
    initProvenance /*: Provenance | null */,
  ) /*: Provenance | null */ {
    if (initProvenance == null) {
      return null;
    }
    for (const property of pattern.properties) {
      if (property.type !== 'ObjectProperty' || property.computed === true) {
        continue;
      }
      // Identity, not name: `const {Platform: P}` binds `P`.
      if (property.value !== binding.identifier) {
        continue;
      }
      const key = property.key;
      const keyName =
        key.type === 'Identifier'
          ? key.name
          : key.type === 'StringLiteral'
            ? key.value
            : null;
      return keyName == null
        ? null
        : getMemberProvenance(initProvenance, keyName);
    }
    return null;
  }

  function getVariableBindingProvenance(
    binding /*: Binding */,
    state /*: State */,
  ) /*: Provenance | null */ {
    const declaratorPath = binding.path;
    const declarator = declaratorPath.node;
    if (declarator == null || declarator.type !== 'VariableDeclarator') {
      return null;
    }
    const initPath = declaratorPath.get('init');
    if (Array.isArray(initPath) || initPath.node == null) {
      return null;
    }

    const id = declarator.id;
    if (id.type === 'ObjectPattern') {
      return getDestructuredProvenance(
        binding,
        id,
        getExpressionProvenance(initPath, state),
      );
    }
    if (id.type !== 'Identifier') {
      return null;
    }
    return getExpressionProvenance(initPath, state);
  }

  function getBindingProvenance(
    binding /*: Binding */,
    state /*: State */,
  ) /*: Provenance | null */ {
    const cache = rnBindingCache;
    const cached = cache.get(binding);
    if (cached !== undefined) {
      // An alias cycle is not resolvable.
      return cached === RESOLVING ? null : cached;
    }
    cache.set(binding, RESOLVING);

    let provenance = null;
    if (binding.kind === 'module') {
      provenance = getImportBindingProvenance(binding, state);
    } else if (binding.constant && binding.constantViolations.length === 0) {
      // Only immutable bindings can be followed - a reassignable one may hold
      // something else by the time it is read.
      provenance = getVariableBindingProvenance(binding, state);
    }

    cache.set(binding, provenance);
    return provenance;
  }

  function isPlatform(
    path /*: NodePath<$FlowFixMe> */,
    state /*: State */,
  ) /*: boolean */ {
    return getExpressionProvenance(path, state) === PLATFORM;
  }

  /**
   * Contexts in which replacing an expression with a literal is invalid.
   */
  function isWriteTarget(
    path /*: NodePath<MemberExpression> */,
  ) /*: boolean */ {
    const {parent, node} = path;
    if (parent.type === 'AssignmentExpression' && parent.left === node) {
      return true;
    }
    if (parent.type === 'UpdateExpression' && parent.argument === node) {
      return true;
    }
    if (parent.type === 'UnaryExpression' && parent.operator === 'delete') {
      return true;
    }
    return false;
  }

  // The following two helpers intentionally mirror Metro's inline-plugin so
  // that a Platform.select call inlines identically whichever pass reaches it
  // first.
  function hasStaticProperties(
    objectExpression /*: ObjectExpression */,
  ) /*: boolean */ {
    return objectExpression.properties.every(property => {
      if (property.computed === true || t.isSpreadElement(property)) {
        return false;
      }
      if (t.isObjectMethod(property) && property.kind !== 'method') {
        return false;
      }
      return t.isIdentifier(property.key) || t.isStringLiteral(property.key);
    });
  }

  function findProperty(
    objectExpression /*: ObjectExpression */,
    key /*: string */,
    fallback /*: () => Node */,
  ) /*: Node */ {
    for (const property of objectExpression.properties) {
      if (!t.isObjectProperty(property) && !t.isObjectMethod(property)) {
        continue;
      }
      if (
        (t.isIdentifier(property.key) && property.key.name === key) ||
        (t.isStringLiteral(property.key) && property.key.value === key)
      ) {
        if (t.isObjectProperty(property)) {
          return property.value;
        }
        return t.toExpression(property);
      }
    }
    return fallback();
  }

  /**
   * The target platform, or null if there is nothing safe to inline to.
   *
   * Callers without a concrete platform are not consistent about how they say
   * so: Metro passes `null` for platform-agnostic builds, while React Native's
   * own Jest preprocessor passes the empty string. Inlining to `""` in either
   * case would be actively wrong, so treat both as "no platform".
   */
  function getTargetPlatform(state /*: State */) /*: string | null */ {
    const platform = state.opts.platform;
    return platform == null || platform === '' ? null : platform;
  }

  return {
    name: 'inline-platform',
    pre() /*: void */ {
      rnBindingCache = new WeakMap();
    },
    visitor: {
      MemberExpression(
        path /*: NodePath<MemberExpression> */,
        state /*: State */,
      ) /*: void */ {
        const platform = getTargetPlatform(state);
        if (platform == null) {
          return;
        }
        if (getStaticPropertyName(path.node) !== 'OS') {
          return;
        }
        if (isWriteTarget(path)) {
          return;
        }
        if (!isPlatform(path.get('object'), state)) {
          return;
        }
        path.replaceWith(t.stringLiteral(platform));
      },
      CallExpression(
        path /*: NodePath<CallExpression> */,
        state /*: State */,
      ) /*: void */ {
        const platform = getTargetPlatform(state);
        if (platform == null) {
          return;
        }
        const callee = path.get('callee');
        const calleeNode = callee.node;
        if (calleeNode.type !== 'MemberExpression') {
          return;
        }
        if (getStaticPropertyName(calleeNode) !== 'select') {
          return;
        }
        const args = path.node.arguments;
        const spec = args[0];
        if (
          args.length !== 1 ||
          spec == null ||
          spec.type !== 'ObjectExpression'
        ) {
          return;
        }
        if (!hasStaticProperties(spec)) {
          return;
        }
        const calleeObject = callee.get('object');
        if (Array.isArray(calleeObject) || !isPlatform(calleeObject, state)) {
          return;
        }

        path.replaceWith(
          findProperty(spec, platform, () =>
            findProperty(spec, 'native', () =>
              findProperty(spec, 'default', () => t.identifier('undefined')),
            ),
          ),
        );
      },
    },
  };
};
