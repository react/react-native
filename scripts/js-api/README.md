# scripts/js-api

TypeScript build pipeline for React Native's JavaScript API.

## Overview

`yarn build-types` is a custom build pipeline for translating React Native's Flow source code to TypeScript.

Specifically, it reduces the runtime JavaScript API of `react-native` into two outputs:

- **Generated TypeScript types**\
Public user types for react-native, shipped to npm\
`packages/react-native/types_generated/`
- **‌Public API snapshot**\
Snapshot file of the public API shape, used by maintainers\
`packages/react-native/ReactNativeApi.d.ts`

#### Dependencies

`yarn build-types` makes use of the following dependencies, composed with other pre/post transformation steps and dependency resolution.

- Flow → TypeScript conversion: [flow-api-translator](https://www.npmjs.com/package/flow-api-translator)
- TypeScript → (initial) API rollup: [@microsoft/api-extractor](https://api-extractor.com/)

## Usage

#### Build generated types + API snapshot

Maintainers should run this script whenever making intentional API changes.

```sh
# Build types + API snapshot
yarn build-types [--validate]

# Build types without API snapshot
yarn build-types --skip-snapshot
```

#### Diff API snapshot compatibility

This script is run by CI to compare changes to `ReactNativeApi.d.ts` between commits.

```sh
# Compare two versions of the API snapshot
yarn js-api-diff <before.d.ts> <after.d.ts>
```
```json
{
  "result": "BREAKING",
  "changedApis": [
    "ViewStyle"
  ]
}
```

#### Configuration

Sparse configuration options are defined and documented in `scripts/js-api/config.js`.

## About the two output formats

### Generated TypeScript types

`types_generated/`

Directory providing TypeScript user types for the `react-native` package, distributed via npm.

- Gitignored.
- Scoped to the `index.d.ts` entry point via `package.json#exports`.
- Preserves `unstable_` and `experimental_` APIs.
- Preserves doc comments.
- Preserves source file names (for go to definition).

### Public API snapshot

`ReactNativeApi.d.ts`

Provides a human-readable, maintainable reference of the React Native's public JavaScript API, optimized for developers and diff tooling.

- Committed to the repo.
- Strips `unstable_` and `experimental_` APIs.
- Strips doc comments.
- Strips source file names (types are merged into a single program).
- Versions exported APIs with an 8 char SHA hash, which will be updated when any input type dependencies change shape.
