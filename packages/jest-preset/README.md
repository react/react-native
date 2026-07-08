# @react-native/jest-preset

[![npm]](https://www.npmjs.com/package/@react-native/jest-preset) [![npm downloads]](https://www.npmjs.com/package/@react-native/jest-preset)

[npm]: https://img.shields.io/npm/v/@react-native/jest-preset.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/jest-preset.svg

Jest preset for [React Native](https://reactnative.dev) apps.

## Usage

### Installation

Install `@react-native/jest-preset` in your app:

with `npm`:

```sh
npm i @react-native/jest-preset --save-dev
```

or with `yarn`:

```sh
yarn add -D @react-native/jest-preset
```

### Configuring Jest

Then, create a file called `jest.config.js` in your project's root directory. Then load this preset:

```
module.exports = {
  preset: '@react-native/jest-preset',
};
```

You can further customize your Jest configuration by specifying other options. See [Jest's `jest.config.js` documentation](https://jestjs.io/docs/configuration) to learn more.
