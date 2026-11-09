/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTSurfaceTouchHandler.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTSurfaceTouchHandler (Internal)

/*
 * Cancels the active touches that landed on `view` or on one of its
 * descendants, and leaves every other touch alone.
 *
 * A touch that a native control inside the surface takes over, such as the
 * long press that selects text, has to stop reaching React Native, or lifting
 * the finger presses the view under it. Disabling the handler would cancel
 * every touch it tracks. This cancels only the touches on `view`: each one
 * gets its `touchCancel` now, and dispatches nothing more while UIKit keeps
 * delivering it.
 */
- (void)cancelTouchesInView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
