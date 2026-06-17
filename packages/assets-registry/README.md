# @react-native/assets-registry

![npm package](https://img.shields.io/npm/v/@react-native/assets-registry?color=brightgreen&label=npm%20package)

Runtime registry that maps asset IDs generated in a Metro bundle to asset metadata. It backs `<Image>`, `Image.resolveAssetSource()`, and any code that resolves `require('./img.png')` on native.

Most apps never import this directly — assets are handled through `<Image>`.

## API

### `@react-native/assets-registry/registry`

| Export | Signature | Notes |
|---|---|---|
| `registerAsset` | `(asset: PackagerAsset) => number` | Stores the asset; returns a numeric ID |
| `getAssetByID` | `(assetId: number) => PackagerAsset` | Looks an asset back up by ID |

### `@react-native/assets-registry/path-support`

Android resource-path helpers, used when copying assets into `drawable-*` folders.

| Export | Signature | Notes |
|---|---|---|
| `getAndroidResourceFolderName` | `(asset: PackagerAsset, scale: number) => string` | e.g. `drawable-xhdpi`; non-drawable types resolve to `raw` |
| `getAndroidResourceIdentifier` | `(asset: PackagerAsset) => string` | Sanitised resource name |
| `getBasePath` | `(asset: PackagerAsset) => string` | `httpServerLocation` without the leading slash |
