/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTSurfacePointerHandler.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTSurfacePointerHandler (Internal)

/*
 * Cancels the active pointers that landed on `view` or on one of its
 * descendants, and leaves every other pointer alone.
 *
 * The pointer counterpart of `-[RCTSurfaceTouchHandler cancelTouchesInView:]`:
 * each pointer on `view` gets its `pointerCancel` now, and dispatches nothing
 * more while UIKit keeps delivering the touch behind it. The two handlers sit
 * on the same root view, and a caller that lets one go lets the other go too.
 */
- (void)cancelTouchesInView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
