/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// TODO: Split this up into separate files.
const NativeModules = {
  AlertManager: {
    alertWithArgs: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  AsyncLocalStorage: {
    multiGet: jest.fn((keys, callback) =>
      process.nextTick(() => callback(null, [])),
    ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
    multiSet: jest.fn((entries, callback) =>
      process.nextTick(() => callback(null)),
    ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
    multiRemove: jest.fn((keys, callback) =>
      process.nextTick(() => callback(null)),
    ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
    multiMerge: jest.fn((entries, callback) =>
      process.nextTick(() => callback(null)),
    ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
    clear: jest.fn(callback =>
      process.nextTick(() => callback(null)),
    ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
    getAllKeys: jest.fn(callback =>
      process.nextTick(() => callback(null, [])),
    ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  DeviceInfo: {
    getConstants(): $FlowFixMe {
      return {
        Dimensions: {
          window: {
            fontScale: 2,
            height: 1334,
            scale: 2,
            width: 750,
          },
          screen: {
            fontScale: 2,
            height: 1334,
            scale: 2,
            width: 750,
          },
        },
      };
    },
  },
  DevSettings: {
    addMenuItem: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    reload: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  ImageLoader: {
    getSize: jest.fn(url => Promise.resolve([320, 240])) as JestMockFn<
      $FlowFixMe,
      $FlowFixMe,
    >,
    getSizeWithHeaders: jest.fn((url, headers) =>
      Promise.resolve({height: 222, width: 333}),
    ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
    prefetchImage: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    prefetchImageWithMetadata: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    queryCache: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  ImageViewManager: {
    getSize: jest.fn((uri, success) =>
      process.nextTick(() => success(320, 240)),
    ) as JestMockFn<$FlowFixMe, $FlowFixMe>,
    prefetchImage: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  KeyboardObserver: {
    addListener: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    removeListeners: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  NativeAnimatedModule: {
    createAnimatedNode: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    updateAnimatedNodeConfig: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    getValue: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    startListeningToAnimatedNodeValue: jest.fn() as JestMockFn<
      $FlowFixMe,
      $FlowFixMe,
    >,
    stopListeningToAnimatedNodeValue: jest.fn() as JestMockFn<
      $FlowFixMe,
      $FlowFixMe,
    >,
    connectAnimatedNodes: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    disconnectAnimatedNodes: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    startAnimatingNode: jest.fn((animationId, nodeTag, config, endCallback) => {
      setTimeout(() => endCallback({finished: true}), 16);
    }) as JestMockFn<$FlowFixMe, $FlowFixMe>,
    stopAnimation: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    setAnimatedNodeValue: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    setAnimatedNodeOffset: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    flattenAnimatedNodeOffset: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    extractAnimatedNodeOffset: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    connectAnimatedNodeToView: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    disconnectAnimatedNodeFromView: jest.fn() as JestMockFn<
      $FlowFixMe,
      $FlowFixMe,
    >,
    restoreDefaultValues: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    dropAnimatedNode: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    addAnimatedEventToView: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    removeAnimatedEventFromView: jest.fn() as JestMockFn<
      $FlowFixMe,
      $FlowFixMe,
    >,
    addListener: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    removeListener: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    removeListeners: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  Networking: {
    sendRequest: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    abortRequest: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    addListener: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    removeListeners: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  PlatformConstants: {
    getConstants(): $FlowFixMe {
      return {
        reactNativeVersion: {
          major: 1000,
          minor: 0,
          patch: 0,
          prerelease: undefined,
        },
      };
    },
  },
  SourceCode: {
    getConstants(): $FlowFixMe {
      return {
        scriptURL: null,
      };
    },
  },
  StatusBarManager: {
    setStyle: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    setHidden: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    getConstants: (): $FlowFixMe => ({
      HEIGHT: 42,
    }),
  },
  Timing: {
    createTimer: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    deleteTimer: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  UIManager: {},
  BlobModule: {
    getConstants: (): $FlowFixMe => ({
      BLOB_URI_SCHEME: 'content',
      BLOB_URI_HOST: null,
    }),
    addNetworkingHandler: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    enableBlobSupport: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    disableBlobSupport: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    createFromParts: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    sendBlob: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    release: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  WebSocketModule: {
    connect: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    send: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    sendBinary: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    ping: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    close: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    addListener: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    removeListeners: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  },
  I18nManager: {
    allowRTL: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    forceRTL: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    swapLeftAndRightInRTL: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    getConstants: (): $FlowFixMe => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: true,
    }),
  },
};

export default NativeModules;
