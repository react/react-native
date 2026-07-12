/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {BrowserWindow, Menu, app, nativeImage, shell} =
  // $FlowFixMe[unclear-type] We have no Flow types for the Electron API.
  require('electron') as any;

const {isMacOSAtLeast} = require('./utils');

export function configureAppMenu(): void {
  const template = [
    ...(process.platform === 'darwin' ? [{role: 'appMenu'}] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload App',
          accelerator:
            process.platform === 'darwin' ? 'Command+R' : 'Control+R',
          click: () => invokeCommand('inspector-main.reload'),
        },
        {
          label: 'Reload DevTools',
          accelerator: process.platform === 'darwin' ? 'Option+R' : 'Alt+R',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.reload(),
        },
        {type: 'separator'},
        {
          label: 'Quick Open…',
          ...menuSymbol('doc.text.magnifyingglass'),
          accelerator:
            process.platform === 'darwin' ? 'Command+P' : 'Control+P',
          click: () => invokeCommand('quick-open.show'),
        },
        {type: 'separator'},
        {role: 'close'},
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'selectAll'},
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Command Palette…',
          ...menuSymbol('filemenu.and.selection'),
          accelerator:
            process.platform === 'darwin'
              ? 'Command+Shift+P'
              : 'Control+Shift+P',
          click: () => invokeCommand('quick-open.show-command-menu'),
        },
        // Enable Developer Tools only in development
        ...(!app.isPackaged
          ? [{type: 'separator'}, {role: 'toggleDevTools'}]
          : []),
        {type: 'separator'},
        {role: 'resetZoom'},
        {role: 'zoomIn'},
        {role: 'zoomOut'},
        {type: 'separator'},
        {role: 'togglefullscreen'},
      ],
    },
    {role: 'windowMenu'},
    {
      role: 'help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          ...menuSymbol('keyboard'),
          click: () => invokeCommand('settings.shortcuts'),
        },
        {type: 'separator'},
        {
          label: 'React Native Website',
          click: () => shell.openExternal('https://reactnative.dev'),
        },
        {
          label: 'Release Notes',
          click: () =>
            shell.openExternal(
              'https://github.com/facebook/react-native/releases',
            ),
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function menuSymbol(symbolName: string): {icon?: unknown} {
  if (!isMacOSAtLeast(26)) {
    return {};
  }
  return {
    icon: nativeImage.createMenuSymbol(symbolName),
  };
}

function invokeCommand(commandId: string): void {
  const win = BrowserWindow.getFocusedWindow();
  win?.webContents.executeJavaScript(
    `(async () => {
      const UI = await import('./ui/legacy/legacy.js');
      return UI.ActionRegistry.ActionRegistry.instance()
        .getAction(${JSON.stringify(commandId)})?.execute();
    })()`,
    true,
  );
}
