# @react-native/asset-utils

[![npm]](https://www.npmjs.com/package/@react-native/asset-utils) [![npm downloads]](https://www.npmjs.com/package/@react-native/asset-utils)

[npm]: https://img.shields.io/npm/v/@react-native/asset-utils.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/asset-utils.svg

Android resource-path helpers used when copying React Native assets into `drawable-*` / `raw` folders. Consumed by bundling and build tooling; most apps never import this directly.

## API

```js
import {
  getAndroidResourceFolderName,
  getAndroidResourceIdentifier,
} from '@react-native/asset-utils';
```

| Export | Signature | Notes |
|---|---|---|
| `getAndroidResourceFolderName` | `(asset: PackagerAsset, scale: number) => string` | e.g. `drawable-xhdpi`; non-drawable types resolve to `raw` |
| `getAndroidResourceIdentifier` | `(asset: PackagerAsset) => string` | Sanitised resource name |
| `drawableFileTypes` | `Set<string>` | Asset types that map to a `drawable-*` folder |
