/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import SettingsStore from './SettingsStore.js';

const path = require('path');
const util = require('util');

// $FlowFixMe[unclear-type] We have no Flow types for the Electron API.
const {BrowserWindow, Menu, app, shell, ipcMain} = require('electron') as any;

const appSettings = new SettingsStore();
const windowMetadata = new WeakMap<
  typeof BrowserWindow,
  Readonly<{
    windowKey: string,
  }>,
>();

function handleLaunchArgs(argv: string[]) {
  const {
    values: {frontendUrl, windowKey},
  } = util.parseArgs({
    options: {
      frontendUrl: {
        type: 'string',
      },
      windowKey: {
        type: 'string',
      },
    },
    args: argv,
  });

  // Find an existing window for this app and launch configuration.
  let frontendWindow = BrowserWindow.getAllWindows().find(window => {
    const metadata = windowMetadata.get(window);
    if (!metadata) {
      return false;
    }
    return metadata.windowKey === windowKey;
  });

  if (frontendWindow) {
    // If the window is already visible, flash it.
    if (frontendWindow.isVisible()) {
      frontendWindow.flashFrame(true);
      setTimeout(() => {
        frontendWindow.flashFrame(false);
      }, 1000);
    }
  } else {
    frontendWindow = new BrowserWindow({
      ...(getSavedWindowPosition(windowKey) ?? {
        width: 1200,
        height: 600,
      }),
      minWidth: 400,
      minHeight: 300,
      webPreferences: {
        partition: 'persist:react-native-devtools',
        preload: require.resolve('./preload.js'),
      },
      // Icon for Linux
      icon: path.join(__dirname, 'resources', 'icon.png'),
      // Enable tabs for this window (macOS 10.12+)
      tabbingIdentifier: 'main',
    });
    // Auto-hide the Windows/Linux menu bar
    frontendWindow.setMenuBarVisibility(false);
    // Observe and update saved window position
    setupWindowResizeListeners(frontendWindow, windowKey);
  }

  // Open links in the default browser instead of in new Electron windows.
  frontendWindow.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: 'deny'};
  });

  // TODO: If the window contains a live, working frontend instance with a valid connection to the backend,
  // we should avoid this reload and instead send the frontend a message to handle the launch arguments
  // dynamically (e.g. update the launch ID for telemetry purposes, handle deeplinking to a specific CDT panel, etc).
  frontendWindow.loadURL(frontendUrl);

  windowMetadata.set(frontendWindow, {
    windowKey,
  });

  if (process.platform === 'darwin') {
    app.focus({
      steal: true,
    });
  }
  frontendWindow.focus();
}

function configureAppMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{role: 'appMenu'}] : []),
    {role: 'fileMenu'},
    {role: 'editMenu'},
    {role: 'viewMenu'},
    {role: 'windowMenu'},
    {
      role: 'help',
      submenu: [
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

function getSavedWindowPosition(
  windowKey: string,
): ?{width: number, height: number, x?: number, y?: number} {
  return appSettings.get('windowArrangements', {})[windowKey];
}

function saveWindowPosition(
  windowKey: string,
  position: {x: number, y: number, width: number, height: number},
) {
  const windowArrangements = appSettings.get('windowArrangements', {});
  windowArrangements[windowKey] = position;
  appSettings.set('windowArrangements', windowArrangements);
}

function setupWindowResizeListeners(
  browserWindow: typeof BrowserWindow,
  windowKey: string,
) {
  const savePosition = () => {
    if (!browserWindow.isDestroyed()) {
      const [x, y] = browserWindow.getPosition();
      const [width, height] = browserWindow.getSize();
      saveWindowPosition(windowKey, {x, y, width, height});
    }
  };
  browserWindow.on('moved', savePosition);
  browserWindow.on('resized', savePosition);
  browserWindow.on('closed', savePosition);
}

app.whenReady().then(() => {
  handleLaunchArgs(process.argv.slice(app.isPackaged ? 1 : 2));
  configureAppMenu();

  app.on(
    'second-instance',
    (event, electronArgv, workingDirectory, additionalData) => {
      handleLaunchArgs(additionalData.argv);
    },
  );
});

app.on('window-all-closed', function () {
  app.quit();
});

ipcMain.on('bringToFront', (event, title) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (win) {
    win.focus();
  }
  if (process.platform === 'darwin') {
    app.focus({
      steal: true,
    });
  }
});
