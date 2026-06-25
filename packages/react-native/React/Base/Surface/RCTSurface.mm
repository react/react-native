/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurface.h"
#import "RCTSurfaceView+Internal.h"

#import <mutex>

#import <stdatomic.h>

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTConstants.h"
#import "RCTShadowView+Layout.h"
#import "RCTSurfaceDelegate.h"
#import "RCTSurfaceRootShadowView.h"
#import "RCTSurfaceRootShadowViewDelegate.h"
#import "RCTSurfaceRootView.h"
#import "RCTSurfaceView.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUIManagerObserverCoordinator.h"
#import "RCTUIManagerUtils.h"

@implementation RCTSurface
@synthesize stage;
@synthesize moduleName;
@synthesize delegate;
@synthesize rootViewTag;
@synthesize properties;
@synthesize rootTag;
@synthesize intrinsicSize;

- (nonnull instancetype)initWithBridge:(nonnull RCTBridge *)bridge
                            moduleName:(nonnull NSString *)moduleName
                     initialProperties:(nonnull NSDictionary *)initialProperties
{
  return self;
}

- (void)setSize:(CGSize)size
{
}

- (BOOL)synchronouslyWaitForStage:(RCTSurfaceStage)stage timeout:(NSTimeInterval)timeout
{
  return NO;
}

- (void)mountReactComponentWithBridge:(nonnull RCTBridge *)bridge
                           moduleName:(nonnull NSString *)moduleName
                               params:(nonnull NSDictionary *)params
{
}

- (void)unmountReactComponentWithBridge:(nonnull RCTBridge *)bridge rootViewTag:(nonnull NSNumber *)rootViewTag
{
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize viewportOffset:(CGPoint)viewportOffset
{
}

- (nonnull RCTSurfaceView *)view
{
  // NOLINTNEXTLINE(clang-analyzer-nullability.NullReturnedFromNonnull)
  return nil;
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  return {};
}

- (void)start
{
}

- (void)stop
{
}

@end
