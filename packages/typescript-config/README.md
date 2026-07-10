# @react-native/typescript-config

[![npm]](https://www.npmjs.com/package/@react-native/typescript-config) [![npm downloads]](https://www.npmjs.com/package/@react-native/typescript-config)

[npm]: https://img.shields.io/npm/v/@react-native/typescript-config.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/typescript-config.svg

This package provides the default `tsconfig.json` used by newly built React Native apps.

This template is customized for specific versions of React Native, and should be updated in sync with the rest of your app.

## Opting out of the Strict TypeScript API (default in 0.87)

To opt out of the new [Strict TypeScript API](https://reactnative.dev/docs/strict-typescript-api) you can extend from `@react-native/typescript-config/strict`

If your app still needs access to deep `'react-native/Libraries/*'` imports (deprecated in 0.80), you can opt out via `customConditions` in your `tsconfig.json`:

```jsonc
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    // ...
    "customConditions": ["react-native", "react-native-legacy-deep-imports"]
  }
}
```
