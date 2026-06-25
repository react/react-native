/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTSurfaceDelegate.h>
#import <React/RCTSurfaceProtocol.h>
#import <React/RCTSurfaceSizeMeasureMode.h>
#import <React/RCTSurfaceStage.h>

typedef UIView *_Nullable (^RCTSurfaceHostingViewActivityIndicatorViewFactory)(void);

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView subclass which providers interoperability between UIKit and
 * Surface regarding layout and life-cycle.
 * This class can be used as easy-to-use general purpose integration point
 * of ReactNative-powered experiences in UIKit based apps.
 */
@interface RCTSurfaceHostingView : UIView <RCTSurfaceDelegate>

/**
 * Designated initializer.
 * Instantiates a view with given Surface object.
 * Note: The view retains the surface object.
 */
- (instancetype)initWithSurface:(id<RCTSurfaceProtocol>)surface
                sizeMeasureMode:(RCTSurfaceSizeMeasureMode)sizeMeasureMode NS_DESIGNATED_INITIALIZER;

/**
 * Surface object which is currently using to power the view.
 * Read-only.
 */
@property (nonatomic, strong, readonly) id<RCTSurfaceProtocol> surface;

/**
 * Size measure mode which are defining relationship between UIKit and ReactNative
 * layout approaches.
 * Defaults to `RCTSurfaceSizeMeasureModeWidthAtMost | RCTSurfaceSizeMeasureModeHeightAtMost`.
 */
@property (nonatomic, assign) RCTSurfaceSizeMeasureMode sizeMeasureMode;

/**
 * Activity indicator factory.
 * A hosting view may use this block to instantiate and display custom activity
 * (loading) indicator (aka "spinner") when it needed.
 * Defaults to `nil` (no activity indicator).
 */
@property (nonatomic, copy, nullable) RCTSurfaceHostingViewActivityIndicatorViewFactory activityIndicatorViewFactory;

/**
 * When set to `YES`, the activity indicator is not automatically hidden when the Surface stage changes.
 * In this scenario, users should invoke `hideActivityIndicator` to remove it.
 *
 * @param disabled if `YES`, the auto-hide is disabled. Otherwise the loading view will be hidden automatically
 */
- (void)disableActivityIndicatorAutoHide:(BOOL)disabled;
@end

NS_ASSUME_NONNULL_END
