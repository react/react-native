# @react-native/assets-registry

![npm package](https://img.shields.io/npm/v/@react-native/assets-registry?color=brightgreen&label=npm%20package)

> [!Warning]
> **This package is deprecated (since 0.87)** and will be removed in a future release. Use [`AssetRegistry`](https://reactnative.dev/docs/assetregistry) from `react-native` (or the `react-native/asset-registry` build entry point) instead of `@react-native/assets-registry/registry`, and [`@react-native/asset-utils`](https://www.npmjs.com/package/@react-native/asset-utils) instead of `@react-native/assets-registry/path-support`.

Runtime registry that maps asset IDs generated in a Metro bundle to asset metadata. It backs `<Image>`, `Image.resolveAssetSource()`, and any code that resolves `require('./img.png')` on native.

Most apps never import this directly — assets are handled through `<Image>`.

## API

### `@react-native/assets-registry/registry` (DEPRECATED)

> [!Warning]
> **Deprecated**: Aliases to [`AssetRegistry`](https://reactnative.dev/docs/assetregistry) (since 0.87).
>
> Please use:
> - `import { AssetRegistry } from 'react-native';` (apps/library code)
> - `'react-native/asset-registry'` (entrypoint for Metro/build configs)

| Export | Signature | Notes |
|---|---|---|
| `registerAsset` | `(asset: PackagerAsset) => number` | Stores the asset; returns a numeric ID |
| `getAssetByID` | `(assetId: number) => PackagerAsset` | Looks an asset back up by ID |

### `@react-native/assets-registry/path-support` (DEPRECATED)

> [!Warning]
> **Deprecated**: Use [`@react-native/asset-utils`](https://www.npmjs.com/package/@react-native/asset-utils) (since 0.87).

Android resource-path helpers, used when copying assets into `drawable-*` folders.

| Export | Signature | Notes |
|---|---|---|
| `getAndroidResourceFolderName` | `(asset: PackagerAsset, scale: number) => string` | e.g. `drawable-xhdpi`; non-drawable types resolve to `raw` |
| `getAndroidResourceIdentifier` | `(asset: PackagerAsset) => string` | Sanitised resource name |
| `getBasePath` | `(asset: PackagerAsset) => string` | `httpServerLocation` without the leading slash |
