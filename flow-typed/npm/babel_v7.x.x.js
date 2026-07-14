/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

type _BabelSourceMap = Readonly<{
  file?: string,
  mappings: string,
  names: Array<string>,
  sourceRoot?: string,
  sources: Array<string>,
  sourcesContent?: Array<?string>,
  version: number,
}>;

type _BabelSourceMapSegment = {
  generated: {column: number, line: number, ...},
  name?: ?string,
  original?: {column: number, line: number, ...},
  source?: ?string,
  ...
};

// A "decoded" source map (as produced by `@jridgewell/gen-mapping`), grouped by
// generated line. Segment fields are all 0-based: generated column, source
// index, source line, source column, name index.
type _BabelDecodedSourceMapSegment =
  | [number]
  | [number, number, number, number]
  | [number, number, number, number, number];

type _BabelDecodedSourceMap = Readonly<{
  file?: string,
  mappings: Array<Array<_BabelDecodedSourceMapSegment>>,
  names: Array<string>,
  sourceRoot?: string,
  sources: Array<string>,
  sourcesContent?: Array<?string>,
  version: number,
}>;

export type BabelSourceLocation = Readonly<{
  start: Readonly<{line: number, column: number}>,
  end: Readonly<{line: number, column: number}>,
}>;

declare module '@babel/parser' {
  // See https://github.com/babel/babel/blob/master/packages/babel-parser/typings/babel-parser.d.ts
  declare export type ParserPlugin =
    | 'asyncGenerators'
    | 'bigInt'
    | 'classPrivateMethods'
    | 'classPrivateProperties'
    | 'classProperties'
    | 'decorators'
    | 'decorators-legacy'
    | 'doExpressions'
    | 'dynamicImport'
    | 'estree'
    | 'exportDefaultFrom'
    | 'exportNamespaceFrom' // deprecated
    | 'flow'
    | 'flowComments'
    | 'functionBind'
    | 'functionSent'
    | 'importMeta'
    | 'jsx'
    | 'logicalAssignment'
    | 'moduleAttributes'
    | 'nullishCoalescingOperator'
    | 'numericSeparator'
    | 'objectRestSpread'
    | 'optionalCatchBinding'
    | 'optionalChaining'
    | 'partialApplication'
    | 'pipelineOperator'
    | 'placeholders'
    | 'privateIn'
    | 'throwExpressions'
    | 'topLevelAwait'
    | 'typescript'
    | 'v8intrinsic'
    | ParserPluginWithOptions;

  declare export type ParserPluginWithOptions =
    | ['decorators', DecoratorsPluginOptions]
    | ['pipelineOperator', PipelineOperatorPluginOptions]
    | ['flow', FlowPluginOptions];

  declare type DecoratorsPluginOptions = {
    decoratorsBeforeExport?: boolean,
  };

  declare type PipelineOperatorPluginOptions = {
    proposal: 'minimal' | 'smart',
  };

  declare type FlowPluginOptions = {
    all?: boolean,
    enums?: boolean,
  };

  declare export type ParserOptions = {
    /**
     * By default, import and export declarations can only appear at a program's top level.
     * Setting this option to true allows them anywhere where a statement is allowed.
     * @default false
     */
    allowImportExportEverywhere?: boolean,

    /**
     * By default, await use is only allowed inside of an async function or, when the topLevelAwait plugin is enabled, in the top-level scope of modules.
     * Set this to true to also accept it in the top-level scope of scripts.
     * @default false
     */
    allowAwaitOutsideFunction?: boolean,

    /**
     * By default, a return statement at the top level raises an error. Set this to true to accept such code.
     * @default false
     */
    allowReturnOutsideFunction?: boolean,

    /**
     * By default, super use is not allowed outside of class and object methods. Set this to true to accept such code.
     * @default false
     */
    allowSuperOutsideMethod?: boolean,

    /**
     * By default, exporting an identifier that was not declared in the current module scope will raise an error.
     * While this behavior is required by the ECMAScript modules specification,
     * Babel's parser cannot anticipate transforms later in the plugin pipeline that might insert the appropriate declarations,
     * so it is sometimes important to set this option to true to prevent the parser from prematurely complaining about undeclared exports that will be added later.
     * @default false
     */
    allowUndeclaredExports?: boolean,

    /**
     * By default, the parser sets extra.parenthesized on the expression nodes.
     * When this option is set to true, ParenthesizedExpression AST nodes are created instead.
     * @default false
     */
    createParenthesizedExpressions?: boolean,

    /**
     * By default, Babel always throws an error when it finds some invalid code.
     * When this option is set to true, it will store the parsing error and try to continue parsing the invalid input file.
     * The resulting AST will have an errors property representing an array of all the parsing errors.
     * Note that even when this option is enabled, @babel/parser could throw for unrecoverable errors.
     * @default false
     */
    errorRecovery?: boolean,

    /**
     * Array containing the plugins that you want to enable.
     */
    plugins?: Array<ParserPlugin>,

    /**
     * Indicate the mode the code should be parsed in. Can be one of "script", "module", or "unambiguous".
     * Defaults to "script". "unambiguous" will make @babel/parser attempt to guess, based on the presence of ES6 import or export statements.
     * Files with ES6 imports and exports are considered "module" and are otherwise "script".
     * @default 'script'
     */
    sourceType?: 'script' | 'module' | 'unambiguous',

    /**
     * Correlate output AST nodes with their source filename.
     * Useful when generating code and source maps from the ASTs of multiple input files.
     */
    sourceFilename?: string,

    /**
     * By default, the first line of code parsed is treated as line 1.
     * You can provide a line number to alternatively start with. Useful for integration with other source tools.
     * @default 1
     */
    startLine?: number,

    /**
     * By default, ECMAScript code is parsed as strict only if a "use strict"; directive is present or if the parsed file is an ECMAScript module.
     * Set this option to true to always parse files in strict mode.
     * @default false
     */
    strictMode?: boolean,

    /**
     * Adds a range property to each node: [node.start, node.end]
     * @default false
     */
    ranges?: boolean,

    /**
     * Adds all parsed tokens to a tokens property on the File node
     * default false
     */
    tokens?: boolean,
  };

  /**
   * Parse the provided code as an entire ECMAScript program.
   */
  declare export function parse(
    input: string,
    options?: ParserOptions,
  ): BabelNodeFile;

  /**
   * Parse the provided code as a single expression.
   */
  declare export function parseExpression(
    input: string,
    options?: ParserOptions,
  ): BabelNodeExpression;

  declare type TokenOptions = {
    keyword?: string,
    beforeExpr?: boolean,
    startsExpr?: boolean,
    rightAssociative?: boolean,
    isLoop?: boolean,
    isAssign?: boolean,
    prefix?: boolean,
    postfix?: boolean,
    binop?: ?number,
  };

  declare class TokenType {
    label: string;
    keyword: ?string;
    beforeExpr: boolean;
    startsExpr: boolean;
    rightAssociative: boolean;
    isLoop: boolean;
    isAssign: boolean;
    prefix: boolean;
    postfix: boolean;
    binop: ?number;
    updateContext: ?(prevType: TokenType) => void;

    constructor(label: string, conf?: TokenOptions): TokenType;
  }

  declare export var tokTypes: {[name: string]: TokenType};
}

declare module '@babel/core' {
  import type {Visitor, Scope, Hub, NodePath} from '@babel/traverse';
  import type {ParserOptions} from '@babel/parser';
  import typeof {tokTypes as TokTypes} from '@babel/parser';
  import type {Options as GeneratorOptions} from '@babel/generator';
  import typeof Template from '@babel/template';
  import typeof Traverse from '@babel/traverse';
  import typeof * as Types from '@babel/types';

  declare export var version: string;
  declare export var tokTypes: TokTypes;

  declare type ImportSpecifier =
    | {
        kind: 'named',
        imported: string,
        local: string,
      }
    | {
        kind: 'namespace',
        local: string,
      };

  declare type ExportSpecifier =
    | {
        kind: 'local',
        name: string,
        exported: string,
      }
    | {
        kind: 'external',
        local: string,
        exported: string,
        source: string | null,
      }
    | {
        kind: 'external-namespace',
        exported: string,
        source: string | null,
      }
    | {
        kind: 'external-all',
        source: string | null,
      };

  declare export type BabelFileModulesMetadata = {
    imports: Array<{
      source: string,
      imported: Array<string>,
      specifiers: Array<ImportSpecifier>,
    }>,
    exports: {
      exported: Array<BabelNode>,
      specifiers: Array<ExportSpecifier>,
    },
  };

  declare export type BabelFileMetadata = {
    usedHelpers?: Array<string>,
    marked?: Array<{
      type: string,
      message: string,
      loc: BabelNodeSourceLocation,
    }>,
    modules?: BabelFileModulesMetadata,
    ...
  };

  declare class Store {
    constructor(): Store;
    setDynamic(key: string, fn: () => unknown): void;
    set(key: string, val: unknown): void;
    get(key: string): unknown;
  }

  declare export class File extends Store {
    static helpers: Array<string>;

    opts: BabelCoreOptions;
    pluginPasses: Array<Array<{...}>>;
    parserOpts: ParserOptions;
    dynamicImportTypes: {...};
    dynamicImportIds: {...};
    dynamicImports: Array<{...}>;
    declarations: {...};
    usedHelpers: {...};
    code: string;
    shebang: string;
    ast: BabelNode | {};
    scope: Scope;
    hub: Hub;
    path: NodePath<> | null;
    metadata: BabelFileMetadata;

    constructor(
      options: BabelCoreOptions,
      input: Readonly<{ast: BabelNode, code: string, inputMap: any}>,
    ): File;

    getMetadata(): void;

    getModuleName(): ?string;

    resolveModuleSource(source: string): string;

    addImport(
      source: string,
      imported: string,
      name?: string,
    ): BabelNodeIdentifier;

    addHelper(name: string): BabelNodeIdentifier;

    addTemplateObject(
      helperName: string,
      strings: Array<{...}>,
      raw: BabelNodeArrayExpression,
    ): BabelNodeIdentifier;

    buildCodeFrameError<TError extends Error>(
      node: BabelNode,
      msg: string,
      Class<TError>,
    ): TError;

    mergeSourceMap(map: _BabelSourceMap): _BabelSourceMap;

    parse(code: string): BabelNode;

    addAst(ast: BabelNode): void;

    transform(): TransformResult<>;

    wrap(code: string, callback: () => unknown): TransformResult<>;

    addCode(code: string): void;

    parseCode(): void;

    parseInputSourceMap(code: string): string;

    parseShebang(): void;

    makeResult<T>(TransformResult<T>): TransformResult<T>;

    generate(): TransformResult<>;
  }

  declare export type MatchPattern =
    | string
    | RegExp
    | ((
        filename: string | void,
        context: {caller: {name: string} | void},
        envName: string,
        dirname: string,
      ) => boolean);

  declare export type PluginObj<TVisitorState = void> = {
    name?: string,
    inherits?: unknown,
    maniuplateOptions?: (
      opts: BabelCoreOptions,
      parserOpts: ParserOptions,
    ) => void,
    // this is a PluginPass
    pre?: (file: File) => void,
    visitor: Visitor<TVisitorState>,
    // this is a PluginPass
    post?: (file: File) => void,
  };

  // Represents a plugin or presets at a given location in a config object.
  // At this point these have been resolved to a specific object or function,
  // but have not yet been executed to call functions with options.
  declare export type UnloadedDescriptor = {
    name: string | void,
    value: PluginObj<unknown> | (() => PluginObj<unknown>),
    options: EntryOptions,
    dirname: string,
    alias: string,
    ownPass?: boolean,
    file?: {
      request: string,
      resolved: string,
    } | void,
  };

  declare export class ConfigItem {
    +value: PluginObj<unknown> | (() => PluginObj<unknown>);
    +options: EntryOptions;
    +dirname: string;
    +name: string | void;
    +file: {
      +request: string,
      +resolved: string,
    } | void;

    constructor(descriptor: UnloadedDescriptor): ConfigItem;
  }

  declare export type EntryTarget = string | {...} | Function;
  declare export type EntryOptions = {...} | false | void;
  declare export type PluginEntry =
    | EntryTarget
    | ConfigItem
    | [EntryTarget]
    | [EntryTarget, EntryOptions]
    | [EntryTarget, EntryOptions, string | void];

  declare export type Plugins = Array<PluginEntry>;
  declare export type PresetEntry = PluginEntry;
  declare export type Presets = Array<PresetEntry>;

  // See https://babeljs.io/docs/en/next/options#code-generator-options
  declare export type BabelCoreOptions = {|
    // Primary options

    /**
     * The working directory that all paths in the programmatic options will be resolved relative to.
     * default process.cwd()
     */
    cwd?: string,

    caller?: {
      name: string,
      supportsStaticESM?: boolean,
      supportsDynamicImport?: boolean,
      supportsTopLevelAwait?: boolean,
      supportsExportNamespaceFrom?: boolean,
      ...
    },

    /**
     * The filename associated with the code currently being compiled, if there is one.
     * The filename is optional, but not all of Babel's functionality is available when the filename is unknown, because a subset of options rely on the filename for their functionality.
     *
     * The three primary cases users could run into are:
     * - The filename is exposed to plugins. Some plugins may require the presence of the filename.
     * - Options like "test", "exclude", and "ignore" require the filename for string/RegExp matching.
     * - .babelrc.json files are loaded relative to the file being compiled. If this option is omitted, Babel will behave as if babelrc: false has been set.
     */
    filename?: string,

    /**
     * Used as the default value for Babel's sourceFileName option, and used as part of generation of filenames for the AMD / UMD / SystemJS module transforms.
     * @default path.relative(opts.cwd, opts.filename) (if opts.filename was passed)
     */
    filenameRelative?: string,

    /**
     * Babel's default return value includes code and map properties with the resulting generated code.
     * In some contexts where multiple calls to Babel are being made,
     * it can be helpful to disable code generation and instead use ast: true to get the AST directly in order to avoid doing unnecessary work.
     * @default true
     */
    code?: boolean,

    /**
     * Babel's default is to generate a string and a sourcemap, but in some contexts it can be useful to get the AST itself.
     * The primary use case for this would be a chain of multiple transform passes.
     * @default false
     */
    ast?: boolean,

    /**
     * By default babel.transformFromAst will clone the input AST to avoid mutations.
     * Specifying cloneInputAst: false can improve parsing performance if the input AST is not used elsewhere.
     */
    cloneInputAst?: boolean,

    // Config Loading options

    /**
     * The initial path that will be processed based on the "rootMode" to determine the conceptual root folder for the current Babel project.
     * This is used in two primary cases:
     *
     * - The base directory when checking for the default "configFile" value
     * - The default value for "babelrcRoots".
     * @default opts.cwd
     */
    root?: string,

    /**
     * This option, combined with the "root" value, defines how Babel chooses its project root.
     * The different modes define different ways that Babel can process the "root" value to get the final project root.
     * - "root" - Passes the "root" value through as unchanged.
     * - "upward" - Walks upward from the "root" directory, looking for a directory containing a babel.config.json file,
     *              and throws an error if a babel.config.json is not found.
     * - "upward-optional" - Walk upward from the "root" directory, looking for a directory containing a babel.config.json file,
     *            and falls back to "root" if a babel.config.json is not found.
     *
     * "root" is the default mode because it avoids the risk that Babel will accidentally load a babel.config.json
     * that is entirely outside of the current project folder. If you use "upward-optional",
     * be aware that it will walk up the directory structure all the way to the filesystem root,
     * and it is always possible that someone will have a forgotten babel.config.json in their home directory,
     * which could cause unexpected errors in your builds.
     *
     * Users with monorepo project structures that run builds/tests on a per-package basis may well want to use "upward"
     * since monorepos often have a babel.config.json in the project root.
     * Running Babel in a monorepo subdirectory without "upward",
     * will cause Babel to skip loading any babel.config.json files in the project root,
     * which can lead to unexpected errors and compilation failure.
     * @default "root"
     */
    rootMode?: 'root' | 'upward' | 'upward-optional',

    /**
     * The current active environment used during configuration loading.
     * This value is used as the key when resolving "env" configs, and is also available inside configuration functions,
     * plugins, and presets, via the api.env() function.
     * @default process.env.BABEL_ENV || process.env.NODE_ENV || "development"
     */
    envName?: string,

    /**
     * Defaults to searching for a default babel.config.json file, but can be passed the path of any JS or JSON5 config file.
     *
     * NOTE: This option does not affect loading of .babelrc.json files, so while it may be tempting to do configFile: "./foo/.babelrc.json",
     * it is not recommended. If the given .babelrc.json is loaded via the standard file-relative logic,
     * you'll end up loading the same config file twice, merging it with itself.
     * If you are linking a specific config file, it is recommended to stick with a naming scheme that is independent of the "babelrc" name.
     *
     * @default path.resolve(opts.root, "babel.config.json"), if exists, false otherwise
     */
    configFile?: string | boolean,

    /**
     * true will enable searching for configuration files relative to the "filename" provided to Babel.
     * A babelrc value passed in the programmatic options will override one set within a configuration file.
     *
     * Note: .babelrc.json files are only loaded if the current "filename" is inside of a package that matches one of the "babelrcRoots" packages.
     *
     * @default true as long as the filename option has been specified
     */
    babelrc?: boolean,

    /**
     * By default, Babel will only search for .babelrc.json files within the "root" package
     * because otherwise Babel cannot know if a given .babelrc.json is meant to be loaded,
     * or if it's "plugins" and "presets" have even been installed, since the file being compiled could be inside node_modules,
     * or have been symlinked into the project.
     *
     * This option allows users to provide a list of other packages that should be considered "root" packages
     * when considering whether to load .babelrc.json files.
     *
     * @default opts.root
     */
    babelrcRoots?: boolean | MatchPattern | Array<MatchPattern>,

    // Plugin and Preset options

    /**
     * An array of plugins to activate when processing this file.
     * For more information on how individual entries interact, especially when used across multiple nested "env" and "overrides" configs,
     * see merging.
     *
     * Note: The option also allows Plugin instances from Babel itself, but using these directly is not recommended.
     * If you need to create a persistent representation of a plugin or preset, you should use babel.createConfigItem().
     *
     * @default []
     */
    plugins?: Plugins,

    /**
     * An array of presets to activate when processing this file.
     * For more information on how individual entries interact,
     * especially when used across multiple nested "env" and "overrides" configs, see merging.
     *
     * Note: The format of presets is identical to plugins,
     * except for the fact that name normalization expects "preset-" instead of "plugin-", and presets cannot be instances of Plugin.
     *
     * @default []
     */
    presets?: Presets,

    /**
     * Instructs Babel to run each of the presets in the presets array as an independent pass.
     * This option tends to introduce a lot of confusion around the exact ordering of plugins,
     * but can be useful if you absolutely need to run a set of operations as independent compilation passes.
     *
     * Note: This option may be removed in future Babel versions as we add better support for defining ordering between plugins.
     *
     * @default false
     * @deprecated
     */
    passPerPreset?: boolean,

    // Output targets

    /**
     * Describes the environments you support/target for your project.
     * When no targets are specified: Babel will assume you are targeting the oldest browsers possible. For example, @babel/preset-env will transform all ES2015-ES2020 code to be ES5 compatible.
     */
    targets?:
      | string
      | Array<string>
      | {[env: string]: string}
      | {
          esmodules?: boolean,
          node?: string | 'current' | true,
          safari?: string | 'tp',
          browsers?: string | Array<string>,
        },

    /**
     * Toggles whether or not browserslist config sources are used,
     * which includes searching for any browserslist files or referencing the browserslist key inside package.json.
     * This is useful for projects that use a browserslist config for files that won't be compiled with Babel.
     *
     * If a string is specified, it must represent the path of a browserslist configuration file.
     * Relative paths are resolved relative to the configuration file which specifies this option,
     * or to cwd when it's passed as part of the programmatic options.
     */
    browserslistConfigFile?: boolean | string,

    /**
     * The Browserslist environment to use.
     *
     * @see https://github.com/browserslist/browserslist#configuring-for-different-environments
     */
    browserslistEnv?: string | void,

    // Config Merging options

    /**
     * Configs may "extend" other configuration files.
     * Config fields in the current config will be merged on top of the extended file's configuration.
     */
    extends?: string,

    /**
     * Placement: May not be nested inside of another env block.
     *
     * Allows for entire nested configuration options that will only be enabled if the envKey matches the envName option.
     *
     * Note: env[envKey] options will be merged on top of the options specified in the root object.
     */
    env?: {[envKey: string]: BabelCoreOptions},

    /**
     * Placement: May not be nested inside of another overrides object, or within an env block.
     *
     * Allows users to provide an array of options that will be merged into the current configuration one at a time.
     * This feature is best used alongside the "test"/"include"/"exclude" options to provide conditions for which an override should apply.
     * For example:
     *
     * ```
     * overrides: [{
     *  test: "./vendor/large.min.js",
     *  compact: true,
     * }],
     * ```
     *
     * could be used to enable the compact option for one specific file that is known to be large and minified,
     * and tell Babel not to bother trying to print the file nicely.
     */
    overrides?: Array<BabelCoreOptions>,

    /**
     * If all patterns fail to match, the current configuration object is considered inactive and is ignored during config processing.
     * This option is most useful when used within an overrides option object, but it's allowed anywhere.
     *
     * Note: These toggles do not affect the programmatic and config-loading options in earlier sections,
     * since they are taken into account long before the configuration that is prepared for merging.
     */
    test?: MatchPattern | Array<MatchPattern>,

    /**
     * This option is a synonym for "test".
     */
    include?: MatchPattern | Array<MatchPattern>,

    /**
     * If any of patterns match, the current configuration object is considered inactive and is ignored during config processing.
     * This option is most useful when used within an overrides option object, but it's allowed anywhere.
     *
     * Note: These toggles do not affect the programmatic and config-loading options in earlier sections,
     * since they are taken into account long before the configuration that is prepared for merging.
     */
    exclude?: MatchPattern | Array<MatchPattern>,

    /**
     * If any of the patterns match, Babel will immediately stop all processing of the current build.
     * For example, a user may want to do something like: `ignore: ['./lib']` to explicitly disable Babel compilation of files inside the lib directory.
     *
     * Note: This option disables all Babel processing of a file. While that has its uses,
     * it is also worth considering the "exclude" option as a less aggressive alternative.
     */
    ignore?: MatchPattern | Array<MatchPattern>,

    /**
     * If all of the patterns fail to match, Babel will immediately stop all processing of the current build.
     * For example, a user may want to do something like `only: ['./src']` to explicitly enable Babel compilation of files inside the src directory while disabling everything else.
     *
     * Note: This option disables all Babel processing of a file. While that has its uses,
     * it is also worth considering the "test"/"include" options as a less aggressive alternative.
     */
    only?: MatchPattern | Array<MatchPattern>,

    extensions?: Array<string>,

    // Source Map options

    /**
     * true will attempt to load an input sourcemap from the file itself, if it contains a //# sourceMappingURL=... comment.
     * If no map is found, or the map fails to load and parse, it will be silently discarded.
     *
     * If an object is provided, it will be treated as the source map object itself.
     *
     * @default true
     */
    inputSourceMap?: boolean | _BabelSourceMap,

    /**
     * - true to generate a sourcemap for the code and include it in the result object.
     * - "inline" to generate a sourcemap and append it as a data URL to the end of the code, but not include it in the result object.
     * - "both" is the same as inline, but will include the map in the result object.
     *
     * @babel/cli overloads some of these to also affect how maps are written to disk:
     * - true will write the map to a .map file on disk
     * - "inline" will write the file directly, so it will have a data: containing the map
     * - "both" will write the file with a data: URL and also a .map.
     *
     * Note: These options are bit weird, so it may make the most sense to just use true and handle the rest in your own code, depending on your use case.
     *
     * @default true
     */
    sourceMaps?: boolean | 'inline' | 'both',

    /**
     * This is an synonym for sourceMaps. Using sourceMaps is recommended.
     */
    sourceMap?: boolean,

    /**
     * The name to use for the file inside the source map object.
     * @default path.basename(opts.filenameRelative) when available, or "unknown"
     */
    sourceFileName?: string,

    /**
     * The sourceRoot fields to set in the generated source map, if one is desired.
     */
    sourceRoot?: string,

    // Misc options

    /**
     * - "script" - Parse the file using the ECMAScript Script grammar. No import/export statements allowed, and files are not in strict mode.
     * - "module" - Parse the file using the ECMAScript Module grammar. Files are automatically strict, and import/export statements are allowed.
     * - "unambiguous" - Consider the file a "module" if import/export statements are present, or else consider it a "script".
     *
     * unambiguous can be quite useful in contexts where the type is unknown,
     * but it can lead to false matches because it's perfectly valid to have a module file that does not use import/export statements.
     *
     * This option is important because the type of the current file affects both parsing of input files,
     * and certain transforms that may wish to add import/require usage to the current file.
     *
     * For instance, @babel/plugin-transform-runtime relies on the type of the current document to decide whether to insert an import declaration,
     * or a require() call. @babel/preset-env also does the same for its "useBuiltIns" option.
     * Since Babel defaults to treating files are ES modules, generally these plugins/presets will insert import statements.
     * Setting the correct sourceType can be important because having the wrong type
     * can lead to cases where Babel would insert import statements into files that are meant to be CommonJS files.
     * This can be particularly important in projects where compilation of node_modules dependencies is being performed,
     * because inserting an import statements can cause Webpack and other tooling to see a file as an ES module,
     * breaking what would otherwise be a functional CommonJS file.
     *
     * Note: This option will not affect parsing of .mjs files, as they are currently hard-coded to always parse as "module" files.
     *
     * @default 'module'
     */
    sourceType?: 'script' | 'module' | 'unambiguous',

    /**
     * Highlight tokens in code snippets in Babel's error messages to make them easier to read.
     *
     * @default true
     */
    highlightCode?: boolean,

    /**
     * Set assumptions that Babel can make in order to produce smaller output
     * @see https://babel.dev/assumptions
     */
    assumptions?: {[assumption: string]: boolean},

    /**
     * Allows users to add a wrapper on each visitor in order to inspect the visitor process as Babel executes the plugins.
     *
     * - key is a simple opaque string that represents the plugin being executed.
     * - nodeType is the type of AST node currently being visited.
     * - fn is the visitor function itself.
     *
     * Users can return a replacement function that should call the original function after performing whatever logging
     * and analysis they wish to do.
     */
    wrapPluginVisitorMethod?: (
      key: string,
      nodeType: BabelNode['type'],
      fn: Function,
    ) => Function,

    /**
     * An opaque object containing options to pass through to the parser being used.
     */
    parserOpts?: ParserOptions,

    /**
     * An opaque object containing options to pass through to the code generator being used.
     */
    generatorOpts?: GeneratorOptions,

    // Code Generator options

    /**
     * Optional string to add as a block comment at the start of the output file
     */
    auxiliaryCommentBefore?: string,

    /**
     * Optional string to add as a block comment at the end of the output file
     */
    auxiliaryCommentAfter?: string,

    /**
     * Function that takes a comment (as a string) and returns true if the comment should be included in the output.
     * By default, comments are included if opts.comments is true or if opts.minified is false and the comment contains @preserve or @license
     */
    shouldPrintComment?: (comment: string) => boolean,

    /**
     * Attempt to use the same line numbers in the output code as in the source code (helps preserve stack traces)
     * @default false
     */
    retainLines?: boolean,

    /**
     * Should comments be included in output
     * @default true
     */
    comments?: boolean,

    /**
     * Set to true to avoid adding whitespace for formatting
     * @default opts.minified
     */
    compact?: boolean | 'auto',

    /**
     * Should the output be minified
     * @default false
     */
    minified?: boolean,

    // AMD / UMD / SystemJS module options

    /**
     * Enables module ID generation.
     *
     * @default !!opts.moduleId
     */
    moduleIds?: boolean,

    /**
     * A hard-coded ID to use for the module. Cannot be used alongside getModuleId.
     */
    moduleId?: string,

    /**
     * Given the babel-generated module name, return the name to use. Returning a falsy value will use the original name.
     */
    getModuleId?: (name: string) => string,

    /**
     * A root path to include on generated module names.
     */
    moduleRoot?: string,
  |};

  declare export type TransformResult<T = BabelFileMetadata> = {|
    metadata: T,
    options: BabelCoreOptions,
    code: string,
    map: _BabelSourceMap | null,
    ast: BabelNodeFile | null,
    ignored?: boolean,
  |};

  declare type TransformCallback<TMetadata> =
    | ((Error, null) => unknown)
    | ((null, TransformResult<TMetadata> | null) => unknown);

  /**
   * Transforms the passed in code. Calling a callback with an object with the generated code, source map, and AST.
   */
  declare export function transform<TMetadata = BabelFileMetadata>(
    code: string,
    options: ?BabelCoreOptions,
    callback: TransformCallback<TMetadata>,
  ): void;

  /***
   * Transforms the passed in code. Returning an object with the generated code, source map, and AST.
   */
  declare export function transformSync<TMetadata = BabelFileMetadata>(
    code: string,
    options?: BabelCoreOptions,
  ): TransformResult<TMetadata>;

  /**
   * Transforms the passed in code. Returning an promise for an object with the generated code, source map, and AST.
   */
  declare export function transformAsync<TMetadata = BabelFileMetadata>(
    code: string,
    options?: BabelCoreOptions,
  ): Promise<TransformResult<TMetadata>>;

  /**
   * Asynchronously transforms the entire contents of a file.
   */
  declare export function transformFile<TMetadata = BabelFileMetadata>(
    filename: string,
    options?: BabelCoreOptions,
    callback: TransformCallback<TMetadata>,
  ): void;

  /**
   * Synchronous version of babel.transformFile. Returns the transformed contents of the filename.
   */
  declare export function transformFileSync<TMetadata = BabelFileMetadata>(
    filename: string,
    options?: BabelCoreOptions,
  ): TransformResult<TMetadata>;

  /**
   * Promise version of babel.transformFile. Returns a promise for the transformed contents of the filename.
   */
  declare export function transformFileAsync<TMetadata = BabelFileMetadata>(
    filename: string,
    options?: BabelCoreOptions,
  ): Promise<TransformResult<TMetadata>>;

  /**
   * Given an AST, transform it.
   */
  declare export function transformFromAst<TMetadata = BabelFileMetadata>(
    ast: BabelNodeFile | BabelNodeProgram,
    code?: string,
    options?: BabelCoreOptions,
    callback: TransformCallback<TMetadata>,
  ): void;

  /**
   * Given an AST, transform it.
   */
  declare export function transformFromAstSync<TMetadata = BabelFileMetadata>(
    ast: BabelNodeFile | BabelNodeProgram,
    code?: string,
    options?: BabelCoreOptions,
  ): TransformResult<TMetadata>;

  /**
   * Given an AST, transform it.
   */
  declare export function transformFromAstAsync<TMetadata = BabelFileMetadata>(
    ast: BabelNodeFile | BabelNodeProgram,
    code?: string,
    options?: BabelCoreOptions,
  ): Promise<TransformResult<TMetadata>>;

  /**
   * Given some code, parse it using Babel's standard behavior. Referenced presets and plugins will be loaded such that optional syntax plugins are automatically enabled.
   */
  declare export function parse(
    code: string,
    options?: BabelCoreOptions,
    callback: ((error: Error) => void) | ((void, BabelNodeFile) => void),
  ): void;

  declare export function parseSync(
    code: string,
    options?: BabelCoreOptions,
  ): BabelNodeFile;

  declare export function parseAsync(
    code: string,
    options?: BabelCoreOptions,
  ): Promise<BabelNodeFile>;

  declare export var template: Template;
  declare export var traverse: Traverse;
  declare export var types: Types;
  declare export var DEFAULT_EXTENSIONS: ReadonlyArray<string>;

  declare export function buildExternalHelpers(
    whitelist?: Array<string>,
    outputType?: 'global' | 'module' | 'umd' | 'var',
  ): string;

  declare export function getEnv(defaultValue?: string): string;

  declare export function resolvePlugin(
    name: string,
    dirname: string,
  ): string | null;

  declare export function resolvePreset(
    name: string,
    dirname: string,
  ): string | null;

  declare export function createConfigItem(
    value:
      | EntryTarget
      | [EntryTarget, EntryOptions]
      | [EntryTarget, EntryOptions, string | void],
    options: ?{
      dirname?: string,
      type?: 'preset' | 'plugin',
    },
  ): ConfigItem;

  declare export type ResolvedConfig = {
    options: BabelCoreOptions,
    passes: Array<Array<PluginObj<unknown> | (() => PluginObj<unknown>)>>,
  };

  declare export function loadOptions(
    options?: unknown,
    callback:
      | ((error: Error, null) => unknown)
      | ((null, config: ResolvedConfig | null) => unknown),
  ): void;
  declare export function loadOptionsSync(
    options?: unknown,
  ): ResolvedConfig | null;
  declare export function loadOptionsAsync(
    options?: unknown,
  ): Promise<ResolvedConfig | null>;

  // For now
  declare type ValidatedOptions = BabelCoreOptions;

  declare class PartialConfig {
    +options: Readonly<ValidatedOptions>;
    +babelrc: string | void;
    +babelignore: string | void;
    +config: string | void;
    +files: ReadonlySet<string>;
    +fileHandling: 'ignored' | 'transpile' | 'unsupported';

    constructor(options: ValidatedOptions): PartialConfig;

    hasFilesystemConfig(): boolean;
  }

  declare export function loadPartialConfig(
    options?: unknown,
    callback:
      | ((error: Error, null) => unknown)
      | ((null, config: PartialConfig | null) => unknown),
  ): void;
  declare export function loadPartialConfigSync(
    options?: unknown,
  ): PartialConfig | null;
  declare export function loadPartialConfigAsync(
    options?: unknown,
  ): Promise<PartialConfig | null>;
}

declare module '@babel/generator' {
  declare export type BabelSourceMapSegment = _BabelSourceMapSegment;

  declare export type GeneratorResult = {
    code: string,
    map: ?_BabelSourceMap,
    decodedMap: ?_BabelDecodedSourceMap,
    rawMappings: ?Array<BabelSourceMapSegment>,
  };

  declare export class CodeGenerator {
    constructor(ast: BabelNode, opts: {...}, code: string): CodeGenerator;

    generate(): GeneratorResult;
  }

  declare export type Options = {
    /**
     * Optional string to add as a block comment at the start of the output file
     */
    auxiliaryCommentBefore?: string,

    /**
     * Optional string to add as a block comment at the end of the output file
     */
    auxiliaryCommentAfter?: string,

    /**
     * Function that takes a comment (as a string) and returns true if the comment should be included in the output.
     * By default, comments are included if opts.comments is true or if opts.minified is false and the comment contains @preserve or @license
     */
    shouldPrintComment?: (comment: string) => boolean,

    /**
     * Attempt to use the same line numbers in the output code as in the source code (helps preserve stack traces)
     * @default false
     */
    retainLines?: boolean,

    /**
     * Retain parens around function expressions (could be used to change engine parsing behavior)
     * @default false
     */
    retainFunctionParens?: boolean,

    /**
     * Should comments be included in output
     * @default true
     */
    comments?: boolean,

    /**
     * Set to true to avoid adding whitespace for formatting
     * @default opts.minified
     */
    compact?: boolean | 'auto',

    /**
     * Should the output be minified
     * @default false
     */
    minified?: boolean,

    /**
     * Set to true to reduce whitespace (but not as much as opts.compact)
     * @default false
     */
    concise?: boolean,

    /**
     * Used in warning messages
     */
    filename?: string,

    /**
     * Set to true to run jsesc with "json": true to print "\u00A9" vs. "©";
     * @default false
     */
    jsonCompatibleStrings?: boolean,

    /**
     * Use jsesc to process literals. jsesc is applied to numbers only if jsescOption.numbers is present.
     * You can customize jsesc by passing options to it.
     */
    jsecsOption?: {...},

    decoratorsBeforeExport?: boolean,
    recordAndTupleSyntaxType?: unknown,

    /**
     * Enable generating source maps
     * @default false
     */
    sourceMaps?: boolean,

    /**
     * A root for all relative URLs in the source map
     */
    sourceRoot?: string,

    /**
     * The filename for the source code (i.e. the code in the code argument). This will only be used if code is a string.
     */
    sourceFileName?: string,
    /**
     * The filename of the generated code that the source map will be associated with
     */
    sourceMapTarget?: string,
  };

  declare export default (
    ast: BabelNode,
    options?: Options,
    code?: string | {[string]: string, ...},
  ) => GeneratorResult;

  declare export default (
    ast: BabelNode,
    options?: Options,
    code?: string | {|[filename: string]: string|},
  ) => GeneratorResult;
}

declare module '@babel/register' {
  import type {BabelCoreOptions} from '@babel/core';

  declare module.exports: (options?: BabelCoreOptions) => void;
}

declare module '@babel/template' {
  import type {Node, Statement, Expression, Program} from '@babel/types';

  declare export type PublicOpts = {
    /**
     * A set of placeholder names to automatically accept, ignoring the given
     * pattern entirely.
     *
     * This option can be used when using %%foo%% style placeholders.
     */
    placeholderWhitelist?: ?Set<string>,

    /**
     * A pattern to search for when looking for Identifier and StringLiteral
     * nodes that can be replaced.
     *
     * 'false' will disable placeholder searching entirely, leaving only the
     * 'placeholderWhitelist' value to find replacements.
     *
     * Defaults to /^[_$A-Z0-9]+$/.
     *
     * This option can be used when using %%foo%% style placeholders.
     */
    placeholderPattern?: ?(RegExp | false),

    /**
     * 'true' to pass through comments from the template into the resulting AST,
     * or 'false' to automatically discard comments. Defaults to 'false'.
     */
    preserveComments?: ?boolean,

    /**
     * 'true' to use %%foo%% style placeholders, 'false' to use legacy placeholders
     * described by placeholderPattern or placeholderWhitelist.
     * When it is not set, it behaves as 'true' if there are syntactic placeholders,
     * otherwise as 'false'.
     */
    syntacticPlaceholders?: ?boolean,
  };

  declare export type PublicReplacements =
    {[string]: ?BabelNode} | Array<?BabelNode>;

  declare export type TemplateBuilder<T> = {
    // Build a new builder, merging the given options with the previous ones.
    (opts: PublicOpts): TemplateBuilder<T>,

    // Building from a string produces an AST builder function by default.
    (tpl: string, opts: ?PublicOpts): (?PublicReplacements) => T,

    // Building from a template literal produces an AST builder function by default.
    (tpl: Array<string>, ...args: Array<unknown>): (?PublicReplacements) => T,

    // Allow users to explicitly create templates that produce ASTs, skipping
    // the need for an intermediate function.
    ast: {
      (tpl: string, opts: ?PublicOpts): T,
      (tpl: Array<string>, ...args: Array<unknown>): T,
    },
  };

  declare export type smart = TemplateBuilder<Statement | Array<Statement>>;
  declare export type expression = TemplateBuilder<Expression>;
  declare export type statement = TemplateBuilder<Statement>;
  declare export type statements = TemplateBuilder<Array<Statement>>;
  declare export type program = TemplateBuilder<Program>;

  declare export type DefaultTemplateBuilder = {
    smart: smart,
    statement: statement,
    statements: statements,
    expression: expression,
    program: program,

    // The call signatures are missing if I spread the `TemplateBuilder` type for whatever reason
    // Copy paste the definition in here solves the problem.

    // Build a new builder, merging the given options with the previous ones.
    (opts: PublicOpts): TemplateBuilder<Statement | Array<Statement>>,

    // Building from a string produces an AST builder function by default.
    (
      tpl: string,
      opts: ?PublicOpts,
    ): (?PublicReplacements) => Statement | Array<Statement>,

    // Building from a template literal produces an AST builder function by default.
    (
      tpl: Array<string>,
      ...args: Array<unknown>
    ): (?PublicReplacements) => Statement | Array<Statement>,

    // Allow users to explicitly create templates that produce ASTs, skipping
    // the need for an intermediate function.
    ast: {
      (tpl: string, opts: ?PublicOpts): Statement | Array<Statement>,
      (
        tpl: Array<string>,
        ...args: Array<unknown>
      ): Statement | Array<Statement>,
    },
  };

  declare export default DefaultTemplateBuilder;
}
