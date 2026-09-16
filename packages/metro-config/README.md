# @react-native/metro-config

[![npm]](https://www.npmjs.com/package/@react-native/metro-config) [![npm downloads]](https://www.npmjs.com/package/@react-native/metro-config)

[npm]: https://img.shields.io/npm/v/@react-native/metro-config.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/metro-config.svg

Metro configuration for React Native. In React Native, your Metro config should extend either `@react-native/metro-config` or `@expo/metro-config`. These packages contain essential defaults necessary to build and run React Native apps.

See [Configuring Metro](https://reactnative.dev/docs/next/metro#configuring-metro) for the full guide.

## Usage

```js
const {
  getDefaultConfig,
  mergeConfig,
} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://metrobundler.dev/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```
