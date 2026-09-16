# @react-native/babel-preset

[![npm]](https://www.npmjs.com/package/@react-native/babel-preset) [![npm downloads]](https://www.npmjs.com/package/@react-native/babel-preset)

[npm]: https://img.shields.io/npm/v/@react-native/babel-preset.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/babel-preset.svg

Babel preset for [React Native](https://reactnative.dev) applications. React Native uses this Babel preset by default when transforming your app's source code.

You only need to use this preset directly if you provide a custom `babel.config.js` file in your project's root directory. React Native does not apply its default Babel configuration in that case, so you must specify all the plugins necessary to transform your code — start from this preset to get the defaults and add more plugins on top.

## Usage

### Installation

Install `@react-native/babel-preset` in your app:

with `npm`:

```sh
npm i @react-native/babel-preset --save-dev
```

or with `yarn`:

```sh
yarn add -D @react-native/babel-preset
```

### Configuring Babel

Then, create a file called `babel.config.js` in your project's root directory. The existence of this `babel.config.js` file tells React Native to use your custom Babel configuration instead of its own. Then load this preset:

```json
{
  "presets": ["module:@react-native/babel-preset"]
}
```

You can further customize your Babel configuration by specifying plugins and other options. See [Babel's `babel.config.js` documentation](https://babeljs.io/docs/en/config-files/) to learn more.
