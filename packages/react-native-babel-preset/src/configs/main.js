/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const passthroughSyntaxPlugins = require('../passthrough-syntax-plugins');
const lazyImports = require('./lazy-imports');

const EXCLUDED_FIRST_PARTY_PATHS = [
  /[/\\]node_modules[/\\]/,
  /[/\\]packages[/\\]react-native[/\\]/,
  /[/\\]packages[/\\]jest-preset[/\\]/,
  /[/\\]packages[/\\]virtualized-lists[/\\]/,
  /[/\\]private[/\\]react-native-fantom[/\\]/,
];

// customTransformOptions may be strings from URL params, or booleans passed
// programatically. For strings, handle them as Metro does when parsing URLs.
const TRUE_VALS = new Set([true, 'true', '1']);

function isTypeScriptSource(fileName) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName) {
  return !!fileName && fileName.endsWith('.tsx');
}

function isFirstParty(fileName) {
  return (
    !!fileName &&
    !EXCLUDED_FIRST_PARTY_PATHS.some(regex => regex.test(fileName))
  );
}

// Called by Babel whenever caller information changes between transform calls
// for a given config. If the return value changes, Babel re-evaluates
// getPreset, which is otherwise cached based on `options`. This must be pure,
// and should be cheap.
function getTransformProfile(caller) {
  return caller?.unstable_transformProfile ?? 'hermes-stable';
}

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

const getPreset = (src, options, babel) => {
  const transformProfile =
    options?.unstable_transformProfile ?? babel?.caller(getTransformProfile);

  const dev = options?.dev ?? babel?.env('development') ?? false;

  // Hermes V1 uses more optimised transform profiles. There is currently no
  // difference between stable and canary, but canary may in future be used to
  // test features in pre-prod Hermes V1 versions.
  const isHermesProfile =
    transformProfile === 'hermes-stable' ||
    transformProfile === 'hermes-canary';

  // We enable regenerator in Hermes V1 dev builds for the time being because
  // Hermes V1 doesn't yet fully support debugging native generators.
  // (e.g. - it's not possible to inspect local variables when paused in a
  // generator).
  //
  // Use native generators in release mode because it has already yielded perf
  // wins. The next release of Hermes V1 will close this gap, so this won't
  // be permanent.
  const enableRegenerator = isHermesProfile && dev;

  // Preserve class syntax and related features for Hermes V1 profiles.
  const preserveClasses = isHermesProfile;

  // Preserve private class fields and methods if the experiment is enabled.
  const preserveClassPrivate = TRUE_VALS.has(
    options?.customTransformOptions?.unstable_preserveClassPrivate,
  );

  // Preserve async/await syntax if the experiment is enabled.
  const preserveAsync = TRUE_VALS.has(
    options?.customTransformOptions?.unstable_preserveAsync,
  );

  // Preserve block scoping (let/const) if the experiment is enabled.
  const preserveBlockScoping = TRUE_VALS.has(
    options?.customTransformOptions?.unstable_preserveBlockScoping,
  );

  // Preserve destructuring syntax if the experiment is enabled.
  const preserveDestructuring = TRUE_VALS.has(
    options?.customTransformOptions?.unstable_preserveDestructuring,
  );

  const isNull = src == null;
  const hasClass = isNull || src.indexOf('class') !== -1;

  const extraPlugins = [];
  const firstPartyPlugins = [];

  if (!options.useTransformReactJSXExperimental) {
    extraPlugins.push([
      require('@babel/plugin-transform-react-jsx'),
      {runtime: 'automatic'},
    ]);
  }

  if (
    !options.disableStaticViewConfigsCodegen &&
    (src === null || /\bcodegenNativeComponent</.test(src))
  ) {
    extraPlugins.push([require('@react-native/babel-plugin-codegen')]);
  }

  if (!options || !options.disableImportExportTransform) {
    extraPlugins.push(
      [require('@babel/plugin-proposal-export-default-from')],
      [
        require('@babel/plugin-transform-modules-commonjs'),
        {
          strict: false,
          strictMode: false, // prevent "use strict" injections
          lazy:
            options && options.lazyImportExportTransform != null
              ? options.lazyImportExportTransform
              : importSpecifier => lazyImports.has(importSpecifier),
          allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
        },
      ],
    );
  }

  if (hasClass && !preserveClasses) {
    extraPlugins.push([require('@babel/plugin-transform-classes')]);
  }

  extraPlugins.push([
    require('@babel/plugin-transform-named-capturing-groups-regex'),
  ]);
  // Needed for regenerator
  if (enableRegenerator) {
    extraPlugins.push([
      require('@babel/plugin-transform-optional-catch-binding'),
    ]);
  }

  if (!preserveDestructuring) {
    extraPlugins.push([
      require('@babel/plugin-transform-destructuring'),
      {useBuiltIns: true},
    ]);
  }
  if (!preserveAsync && (isNull || src.indexOf('async') !== -1)) {
    extraPlugins.push([
      require('@babel/plugin-transform-async-generator-functions'),
    ]);
    extraPlugins.push([require('@babel/plugin-transform-async-to-generator')]);
  }
  if (
    isNull ||
    src.indexOf('React.createClass') !== -1 ||
    src.indexOf('createReactClass') !== -1
  ) {
    extraPlugins.push([require('@babel/plugin-transform-react-display-name')]);
  }
  // This is also needed for regenerator
  if (enableRegenerator && (isNull || src.indexOf('?.') !== -1)) {
    extraPlugins.push([
      require('@babel/plugin-transform-optional-chaining'),
      {loose: true},
    ]);
  }
  // This is also needed for regenerator
  if (enableRegenerator && (isNull || src.indexOf('??') !== -1)) {
    extraPlugins.push([
      require('@babel/plugin-transform-nullish-coalescing-operator'),
      {loose: true},
    ]);
  }

  if (options && dev && !options.disableDeepImportWarnings) {
    firstPartyPlugins.push([require('../plugin-warn-on-deep-imports.js')]);
  }

  if (options && dev && !options.useTransformReactJSXExperimental) {
    extraPlugins.push([require('@babel/plugin-transform-react-jsx-source')]);
    extraPlugins.push([require('@babel/plugin-transform-react-jsx-self')]);
  }

  if (
    enableRegenerator &&
    (isNull || (src.indexOf('for') !== -1 && src.indexOf('of') !== -1))
  ) {
    // Needed for regenerator
    extraPlugins.push([
      require('@babel/plugin-transform-for-of'),
      {loose: true},
    ]);
  }

  if (!options || options.enableBabelRuntime !== false) {
    // Allows configuring a specific runtime version to optimize output
    const isVersion = typeof options?.enableBabelRuntime === 'string';

    extraPlugins.push([
      require('@babel/plugin-transform-runtime'),
      {
        helpers: true,
        regenerator: enableRegenerator,
        ...(isVersion && {version: options.enableBabelRuntime}),
      },
    ]);
  } else if (enableRegenerator) {
    extraPlugins.push([require('@babel/plugin-transform-regenerator')]);
  }

  return {
    comments: false,
    compact: options.compact !== false,
    overrides: [
      // the flow strip types plugin must go BEFORE class properties!
      // there'll be a test case that fails if you don't.
      {
        plugins: [require('@babel/plugin-transform-flow-strip-types')],
      },
      {
        plugins: [
          [
            require('babel-plugin-syntax-hermes-parser'),
            {
              parseLangTypes: 'flow',
              reactRuntimeTarget: '19',
              ...options.hermesParserOptions,
            },
          ],
          [require('babel-plugin-transform-flow-enums')],
          ...(preserveBlockScoping
            ? []
            : [[require('@babel/plugin-transform-block-scoping')]]),
          ...(preserveClasses
            ? []
            : [[require('@babel/plugin-transform-class-properties'), {loose}]]),
          ...(preserveClassPrivate
            ? []
            : [
                [require('@babel/plugin-transform-private-methods'), {loose}],
                [
                  require('@babel/plugin-transform-private-property-in-object'),
                  {loose},
                ],
              ]),
          [require('@babel/plugin-syntax-dynamic-import')],
          [require('@babel/plugin-syntax-export-default-from')],
          ...passthroughSyntaxPlugins,
          [require('@babel/plugin-transform-unicode-regex')],
        ],
      },
      {
        test: isTypeScriptSource,
        plugins: [
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: false,
              allowNamespaces: true,
            },
          ],
        ],
      },
      {
        test: isTSXSource,
        plugins: [
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: true,
              allowNamespaces: true,
            },
          ],
        ],
      },
      {
        test: isFirstParty,
        plugins: firstPartyPlugins,
      },
      {
        plugins: extraPlugins,
      },
    ],
  };
};

module.exports = (options, babel) => {
  return getPreset(null, options, babel);
};

module.exports.getPreset = getPreset;
