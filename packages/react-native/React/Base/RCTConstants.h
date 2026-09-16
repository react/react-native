/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

RCT_EXTERN NSString *const RCTPlatformName;

RCT_EXTERN NSString *const RCTUserInterfaceStyleDidChangeNotification;
RCT_EXTERN NSString *const RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey;

RCT_EXTERN NSString *const RCTWindowFrameDidChangeNotification;

RCT_EXTERN NSString *const RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED;

/**
 * This notification fires when the bridge initializes.
 */
RCT_EXTERN NSString *const RCTJavaScriptWillStartLoadingNotification;

/**
 * This notification fires when the bridge starts executing the JS bundle.
 */
RCT_EXTERN NSString *const RCTJavaScriptWillStartExecutingNotification;

/**
 * This notification fires when the bridge has finished loading the JS bundle.
 */
RCT_EXTERN NSString *const RCTJavaScriptDidLoadNotification;

/**
 * This notification fires when the bridge failed to load the JS bundle. The
 * `error` key can be used to determine the error that occurred.
 */
RCT_EXTERN NSString *const RCTJavaScriptDidFailToLoadNotification;

/**
 * This notification fires each time a native module is instantiated. The
 * `module` key will contain a reference to the newly-created module instance.
 * Note that this notification may be fired before the module is available via
 * the `[bridge moduleForClass:]` method.
 */
RCT_EXTERN NSString *const RCTDidInitializeModuleNotification;
RCT_EXTERN NSString *const RCTDidInitializeModuleNotificationModuleKey;

/*
 * W3C Pointer Events
 */
RCT_EXTERN BOOL RCTGetDispatchW3CPointerEvents(void);
RCT_EXTERN void RCTSetDispatchW3CPointerEvents(BOOL value);
