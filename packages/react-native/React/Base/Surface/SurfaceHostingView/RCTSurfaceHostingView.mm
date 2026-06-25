/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceHostingView.h"

#import <React/RCTDefines.h>

#import "RCTConstants.h"
#import "RCTSurface.h"
#import "RCTSurfaceDelegate.h"
#import "RCTSurfaceView.h"
#import "RCTUtils.h"

@interface RCTSurfaceHostingView ()

@property (nonatomic, assign) BOOL isActivityIndicatorViewVisible;
@property (nonatomic, assign) BOOL isSurfaceViewVisible;

@end

@implementation RCTSurfaceHostingView {
  UIView *_Nullable _activityIndicatorView;
  UIView *_Nullable _surfaceView;
  RCTSurfaceStage _stage;
  BOOL _autoHideDisabled;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
RCT_NOT_IMPLEMENTED(-(nullable instancetype)initWithCoder : (NSCoder *)coder)

- (instancetype)initWithSurface:(id<RCTSurfaceProtocol>)surface
                sizeMeasureMode:(RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  if (self = [super initWithFrame:CGRectZero]) {
    _surface = surface;
    _sizeMeasureMode = sizeMeasureMode;
    _autoHideDisabled = NO;

    _surface.delegate = self;
    _stage = surface.stage;
    [self _updateViews];

    // For backward compatibility with RCTRootView, set a color here instead of transparent (OS default).
    self.backgroundColor = [UIColor whiteColor];
  }

  return self;
}

- (void)dealloc
{
  [_surface stop];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  CGSize minimumSize;
  CGSize maximumSize;

  RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(
      self.bounds.size, _sizeMeasureMode, &minimumSize, &maximumSize);
  CGRect windowFrame = [self.window convertRect:self.frame fromView:self.superview];

  [_surface setMinimumSize:minimumSize maximumSize:maximumSize viewportOffset:windowFrame.origin];
}

- (CGSize)intrinsicContentSize
{
  if (RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return _activityIndicatorView.intrinsicContentSize;
    }

    return CGSizeZero;
  }

  return _surface.intrinsicSize;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  if (RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return [_activityIndicatorView sizeThatFits:size];
    }

    return CGSizeZero;
  }

  CGSize minimumSize;
  CGSize maximumSize;

  RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(size, _sizeMeasureMode, &minimumSize, &maximumSize);

  return [_surface sizeThatFitsMinimumSize:minimumSize maximumSize:maximumSize];
}

- (void)setStage:(RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  BOOL shouldInvalidateLayout = RCTSurfaceStageIsRunning(stage) != RCTSurfaceStageIsRunning(_stage) ||
      RCTSurfaceStageIsPreparing(stage) != RCTSurfaceStageIsPreparing(_stage);

  _stage = stage;

  if (shouldInvalidateLayout) {
    [self _invalidateLayout];
    [self _updateViews];
  }
}

- (void)setSizeMeasureMode:(RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  if (sizeMeasureMode == _sizeMeasureMode) {
    return;
  }

  _sizeMeasureMode = sizeMeasureMode;
  [self _invalidateLayout];
}
- (void)disableActivityIndicatorAutoHide:(BOOL)disabled
{
  _autoHideDisabled = disabled;
}

#pragma mark - isActivityIndicatorViewVisible

- (void)setIsActivityIndicatorViewVisible:(BOOL)visible
{
  if (_isActivityIndicatorViewVisible == visible) {
    return;
  }

  _isActivityIndicatorViewVisible = visible;

  if (visible) {
    if (_activityIndicatorViewFactory) {
      _activityIndicatorView = _activityIndicatorViewFactory();
      _activityIndicatorView.frame = self.bounds;
      _activityIndicatorView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      [self addSubview:_activityIndicatorView];
    }
  } else {
    [_activityIndicatorView removeFromSuperview];
    _activityIndicatorView = nil;
  }
}

#pragma mark - isSurfaceViewVisible

- (void)setIsSurfaceViewVisible:(BOOL)visible
{
  if (_isSurfaceViewVisible == visible) {
    return;
  }

  _isSurfaceViewVisible = visible;

  if (visible) {
    _surfaceView = _surface.view;
    _surfaceView.frame = self.bounds;
    _surfaceView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    if (_activityIndicatorView && _autoHideDisabled) {
      // The activity indicator is still showing and the surface is set to
      // prevent the auto hide. This means that the application will take care of
      // hiding it when it's ready.
      // Let's add the surfaceView below the activity indicator so it's ready once
      // the activity indicator is hidden.
      [self insertSubview:_surfaceView belowSubview:_activityIndicatorView];
    } else {
      [self addSubview:_surfaceView];
    }
  } else {
    [_surfaceView removeFromSuperview];
    _surfaceView = nil;
  }
}

#pragma mark - activityIndicatorViewFactory

- (void)setActivityIndicatorViewFactory:(RCTSurfaceHostingViewActivityIndicatorViewFactory)activityIndicatorViewFactory
{
  _activityIndicatorViewFactory = activityIndicatorViewFactory;
  if (_isActivityIndicatorViewVisible) {
    self.isActivityIndicatorViewVisible = NO;
    self.isActivityIndicatorViewVisible = YES;
  }
}

#pragma mark - UITraitCollection updates

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];

  if (RCTSharedApplication().applicationState == UIApplicationStateBackground) {
    return;
  }

  [[NSNotificationCenter defaultCenter]
      postNotificationName:RCTUserInterfaceStyleDidChangeNotification
                    object:self
                  userInfo:@{
                    RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey : self.traitCollection,
                  }];
}

#pragma mark - Private stuff

- (void)_invalidateLayout
{
  [self invalidateIntrinsicContentSize];
  [self.superview setNeedsLayout];
}

- (void)_updateViews
{
  self.isSurfaceViewVisible = RCTSurfaceStageIsRunning(_stage);
  self.isActivityIndicatorViewVisible = _autoHideDisabled || RCTSurfaceStageIsPreparing(_stage);
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self _updateViews];
}

#pragma mark - RCTSurfaceDelegate

- (void)surface:(__unused RCTSurface *)surface didChangeStage:(RCTSurfaceStage)stage
{
  RCTExecuteOnMainQueue(^{
    [self setStage:stage];
  });
}

- (void)surface:(__unused RCTSurface *)surface didChangeIntrinsicSize:(__unused CGSize)intrinsicSize
{
  RCTExecuteOnMainQueue(^{
    [self _invalidateLayout];
  });
}

@end
