/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTSurface.h>
#import <React/RCTSurfaceStage.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTSurfaceDelegate <NSObject>

@optional

/**
 * Notifies a receiver that a surface transitioned to a new stage.
 * See `RCTSurfaceStage` for more details.
 */
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
- (void)surface:(RCTSurface *)surface didChangeStage:(RCTSurfaceStage)stage;
#pragma clang diagnostic pop
/**
 * Notifies a receiver that root view got a new (intrinsic) size during the last
 * layout pass.
 */
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
- (void)surface:(RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize;
#pragma clang diagnostic pop

@end

NS_ASSUME_NONNULL_END
