# @react-native/debugger-shell

[![npm]](https://www.npmjs.com/package/@react-native/debugger-shell) [![npm downloads]](https://www.npmjs.com/package/@react-native/debugger-shell)

[npm]: https://img.shields.io/npm/v/@react-native/debugger-shell.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/debugger-shell.svg

Experimental Electron-based shell for React Native DevTools.

## Why Electron?

The React Native DevTools frontend is based on Chrome DevTools, which is a web app, but is not particularly portable: it's designed to run in Chromium, and Chromium only. Prior to `@react-native/debugger-shell`, we would run it in [hosted mode](https://chromium.googlesource.com/devtools/devtools-frontend/+/main/docs/get_the_code.md#running-in-hosted-mode) in an instance of Chrome or Edge.

Relying on hosted mode presents a variety of UX issues in the debugging workflow, such as the need to ask developers to install a particular browser before they can debug in React Native, and the inability to foreground/reuse existing debugger windows when relaunching the debugger for the same app. In order to address these issues effectively, we fundamentally need to leave the browser sandbox and run the debugger in a shell we can bundle with React Native, and whose behavior we can control.

Electron is a tried-and-tested framework for the *specific* task of embedding a Chromium browser in a portable, customized shell. As a rule we'll hold a high bar for performance and reliability, and we'll only add features to the shell if they are strictly necessary to complement the DevTools frontend's built-in capabilities.
