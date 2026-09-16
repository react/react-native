/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTUIManagerUtils.h>

#import "RCTValueAnimatedNode.h"

@interface RCTNativeAnimatedTurboModule : RCTEventEmitter <
                                              RCTBridgeModule,
                                              RCTValueAnimatedNodeObserver,
                                              RCTEventDispatcherObserver,
                                              RCTSurfacePresenterObserver>

@end
