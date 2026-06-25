# @react-native/debugger-frontend

[![npm]](https://www.npmjs.com/package/@react-native/debugger-frontend) [![npm downloads]](https://www.npmjs.com/package/@react-native/debugger-frontend)

[npm]: https://img.shields.io/npm/v/@react-native/debugger-frontend.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/debugger-frontend.svg

Debugger frontend for React Native based on Chrome DevTools. It is intended to be used via [`@react-native/dev-middleware`](https://www.npmjs.com/package/@react-native/dev-middleware).

## Usage

The package exports the absolute path to the directory containing the frontend assets.

```js
const frontendPath = require('@react-native/debugger-frontend');

// Pass frontendPath to a static server, etc
```

## Contributing

### Source repo

Source code for this package lives in the [react/react-native-devtools-frontend](https://github.com/react/react-native-devtools-frontend) repo. See below for how we build and check in changes.

### Updating the frontend assets

The compiled assets for the debugger frontend are periodically checked into this package under the `dist/` folder. To update these, run `node scripts/debugger-frontend/sync-and-build` from the root of your `react-native` checkout.

```sh
# For main
node scripts/debugger-frontend/sync-and-build --branch main

# For stable branches (e.g. '0.73-stable')
node scripts/debugger-frontend/sync-and-build --branch 0.73-stable
```

By default, this will clone and build from [react/react-native-devtools-frontend](https://github.com/react/react-native-devtools-frontend).
