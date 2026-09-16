# @react-native/community-cli-plugin

[![npm]](https://www.npmjs.com/package/@react-native/community-cli-plugin) [![npm downloads]](https://www.npmjs.com/package/@react-native/community-cli-plugin)

[npm]: https://img.shields.io/npm/v/@react-native/community-cli-plugin.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/community-cli-plugin.svg

> This is an internal dependency of React Native. **Please don't depend on it directly.**

CLI entry points supporting core React Native development features.

Formerly [@react-native-community/cli-plugin-metro](https://www.npmjs.com/package/@react-native-community/cli-plugin-metro).

## Commands

### `start`

Start the React Native development server.

#### Usage

```sh
npx @react-native-community/cli start [options]
```

#### Options

| Option | Description |
| - | - |
| `--port <number>` | Set the server port. |
| `--host <string>` | Set the server host. |
| `--projectRoot <path>` | Set the path to the project root. |
| `--watchFolders <list>` | Specify additional folders to be added to the watch list. |
| `--assetPlugins <list>` | Specify additional asset plugins. |
| `--sourceExts <list>` | Specify additional source extensions to bundle. |
| `--max-workers <number>` | Set the maximum number of workers the worker-pool will spawn for transforming files. Defaults to the number of the cores available on your machine. |
| `--transformer <string>` | Specify a custom transformer. |
| `--reset-cache` | Remove cached files. |
| `--custom-log-reporter-path <string>` | Specify a module path exporting a replacement for `TerminalReporter`. |
| `--https` | Enable HTTPS connections. |
| `--key <path>`| Specify path to a custom SSL key. |
| `--cert <path>` | Specify path to a custom SSL cert. |
| `--config <string>` | Path to the CLI configuration file. |
| `--no-interactive` | Disable interactive mode. |
| `--client-logs` | **[Deprecated]** Enable plain text JavaScript log streaming for all connected apps. |

### `bundle`

Build the bundle for the provided JavaScript entry file.

#### Usage

```sh
npx @react-native-community/cli bundle --entry-file <path> [options]
```

#### Options

| Option | Description |
| - | - |
| `--entry-file <path>` | Set the path to the root JavaScript entry file. |
| `--platform <string>` | Set the target platform (either `"android"` or `"ios"`). Defaults to `"ios"`. |
| `--transformer <string>` | Specify a custom transformer. |
| `--dev [boolean]` | If `false`, warnings are disabled and the bundle is minified. Defaults to `true`. |
| `--minify [boolean]` | Allows overriding whether bundle is minified. Defaults to `false` if `--dev` is set. Disabling minification can be useful for speeding up production builds for testing purposes. |
| `--bundle-output <string>` | Specify the path to store the resulting bundle. |
| `--bundle-encoding <string>` | Specify the encoding for writing the bundle (<https://nodejs.org/api/buffer.html#buffer_buffer>). |
| `--resolver-option <string...>` | Custom resolver options of the form key=value. URL-encoded. May be specified multiple times. |
| `--sourcemap-output <string>` | Specify the path to store the source map file for the resulting bundle. |
| `--sourcemap-sources-root <string>` | Set the root path for source map entries. |
| `--sourcemap-use-absolute-path` | Report `SourceMapURL` using its full path. |
| `--max-workers <number>` | Set the maximum number of workers the worker-pool will spawn for transforming files. Defaults to the number of the cores available on your machine. |
| `--assets-dest <string>` | Specify the directory path for storing assets referenced in the bundle. |
| `--reset-cache` | Remove cached files. |
| `--read-global-cache` | Attempt to fetch transformed JS code from the global cache, if configured. Defaults to `false`. |
| `--config <string>` | Path to the CLI configuration file. |

### `codegen`

Run the React Native codegen, generating native boilerplate from JS spec files.

#### Usage

```sh
npx @react-native-community/cli codegen [options]
```

#### Options

| Option | Description |
| - | - |
| `--path <path>` | Path to the React Native project root. Defaults to the current working directory. |
| `--platform <string>` | Target platform. Supported values: `"android"`, `"ios"`, `"all"`. Defaults to `"all"`. |
| `--outputPath <path>` | Path where generated artifacts will be output to. |
| `--source <string>` | Whether the script is invoked from an `app` or a `library`. Defaults to `"app"`. |

### `spm [action]`

Set up or maintain Swift Package Manager support for the iOS/macOS app. Actions: `add`, `update`, `deinit`, `scaffold`. With no action: `add` (or `update` if SPM is already set up).

#### Usage

```sh
npx @react-native-community/cli spm [action] [options]
```

#### Options

| Option | Description |
| - | - |
| `--version <string>` | React Native version (e.g. `0.80.0`). Defaults to the version in `node_modules/react-native/package.json`. |
| `--yes` | Skip the dirty-pbxproj confirmation prompt. |
| `--xcodeproj <path>` | **[add]** Path to the `.xcodeproj` to inject SPM packages into (disambiguates when several exist). |
| `--productName <string>` | **[add]** App target to inject into (disambiguates when several exist). |
| `--deintegrate` | **[add]** Run `pod deintegrate` and strip React Native from the Podfile before injecting (CocoaPods → SwiftPM migration). |
| `--artifacts <path>` | **[advanced]** Local artifact root containing complete `debug/` and `release/` slots. |
| `--download <string>` | **[advanced]** Artifact download policy: `auto` (default), `skip`, or `force`. |
| `--skipCodegen` | **[advanced]** Skip the react-native codegen step. |

## Contributing

Changes to this package can be made locally and tested against the `rn-tester` app, per the [Contributing guide](https://reactnative.dev/contributing/overview#contributing-code). During development, this package is automatically run from source with no build step.
