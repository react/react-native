/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConstants.h"

#import <stdatomic.h>

NSString *const RCTPlatformName = @"ios";

NSString *const RCTUserInterfaceStyleDidChangeNotification = @"RCTUserInterfaceStyleDidChangeNotification";
NSString *const RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

NSString *const RCTWindowFrameDidChangeNotification = @"RCTWindowFrameDidChangeNotification";

NSString *const RCTJavaScriptDidFailToLoadNotification = @"RCTJavaScriptDidFailToLoadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";
NSString *const RCTJavaScriptWillStartExecutingNotification = @"RCTJavaScriptWillStartExecutingNotification";
NSString *const RCTJavaScriptWillStartLoadingNotification = @"RCTJavaScriptWillStartLoadingNotification";

NSString *const RCTDidInitializeModuleNotification = @"RCTDidInitializeModuleNotification";
NSString *const RCTDidInitializeModuleNotificationModuleKey = @"module";

NSString *const RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED =
    @"RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED";

static atomic_bool *RCTJavaScriptStartedExecuting(void)
{
  static atomic_bool started = false;
  return &started;
}

BOOL RCTHasJavaScriptStartedExecuting(void)
{
  return atomic_load(RCTJavaScriptStartedExecuting());
}

void RCTMarkJavaScriptStartedExecuting(void)
{
  atomic_store(RCTJavaScriptStartedExecuting(), true);
}

/*
 * W3C Pointer Events
 */
static BOOL RCTDispatchW3CPointerEvents = NO;

BOOL RCTGetDispatchW3CPointerEvents(void)
{
  return RCTDispatchW3CPointerEvents;
}

void RCTSetDispatchW3CPointerEvents(BOOL value)
{
  RCTDispatchW3CPointerEvents = value;
}
