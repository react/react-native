/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTInitializing.h>
/**
 * This class wraps the -[RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
@interface RCTEventDispatcher : NSObject <RCTEventDispatcherProtocol, RCTInitializing>
@end
