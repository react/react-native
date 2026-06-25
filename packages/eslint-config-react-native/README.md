# @react-native/eslint-config

[![npm]](https://www.npmjs.com/package/@react-native/eslint-config) [![npm downloads]](https://www.npmjs.com/package/@react-native/eslint-config)

[npm]: https://img.shields.io/npm/v/@react-native/eslint-config.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/eslint-config.svg

ESLint and Prettier configuration used by React Native apps.

## Installation

```sh
yarn add --dev eslint prettier @react-native/eslint-config
```

## Usage

### For ESLint 9+ (Flat Config)

Add to your `eslint.config.js`:

```javascript
const reactNativeConfig = require('@react-native/eslint-config/flat');

module.exports = [
  ...reactNativeConfig,
  // Your custom config here
];
```

Or with ES modules:

```javascript
import reactNativeConfig from '@react-native/eslint-config/flat';

export default [
  ...reactNativeConfig,
  // Your custom config here
];
```

### For ESLint 8 (Legacy Config)

Add to your eslint config (`.eslintrc`, or `eslintConfig` field in `package.json`):

```json
{
    "extends": "@react-native"
}
```
