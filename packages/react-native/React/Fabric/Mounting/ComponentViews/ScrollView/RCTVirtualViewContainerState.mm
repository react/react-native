/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTScrollViewComponentView.h>
#import <React/RCTVirtualViewMode.h>
#import <UIKit/UIKit.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import "RCTVirtualViewContainerState.h"

using namespace facebook;
using namespace facebook::react;

#define ENABLE_DEBUG_LOGGING 0 && RCT_DEBUG

#if ENABLE_DEBUG_LOGGING
static void debugLog(NSString *msg, ...)
{
  va_list args;
  va_start(args, msg);
  NSString *msgString = [[NSString alloc] initWithFormat:msg arguments:args];
  RCTLogInfo(@"%@", msgString);
  va_end(args); // Don't forget to call va_end to clean up
}

#define DEBUG_LOG(...) debugLog(__VA_ARGS__)
#else
#define DEBUG_LOG(...) ((void)0)
#endif

/**
 * Checks whether one CGRect overlaps with another CGRect.
 *
 * This is different from CGRectIntersectsRect because a CGRect representing
 * a line or a point is considered to overlap with another CGRect if the line
 * or point is within the rect bounds. However, two CGRects are not considered
 * to overlap if they only share a boundary.
 */
static BOOL CGRectOverlaps(CGRect rect1, CGRect rect2)
{
  CGFloat minY1 = CGRectGetMinY(rect1);
  CGFloat maxY1 = CGRectGetMaxY(rect1);
  CGFloat minY2 = CGRectGetMinY(rect2);
  CGFloat maxY2 = CGRectGetMaxY(rect2);
  if (minY1 >= maxY2 || minY2 >= maxY1) {
    // No overlap on the y-axis.
    return NO;
  }
  CGFloat minX1 = CGRectGetMinX(rect1);
  CGFloat maxX1 = CGRectGetMaxX(rect1);
  CGFloat minX2 = CGRectGetMinX(rect2);
  CGFloat maxX2 = CGRectGetMaxX(rect2);
  if (minX1 >= maxX2 || minX2 >= maxX1) {
    // No overlap on the x-axis.
    return NO;
  }
  return YES;
}

@interface RCTVirtualViewContainerState () <UIScrollViewDelegate>
@end

@interface RCTVirtualViewContainerState () {
  NSMutableSet<id<RCTVirtualViewProtocol>> *_virtualViews;
  CGRect _emptyRect;
  CGRect _prerenderRect;
  __weak RCTScrollViewComponentView *_scrollViewComponentView;
  CGFloat _prerenderRatio;
}
@end

@implementation RCTVirtualViewContainerState

- (instancetype)initWithScrollView:(RCTScrollViewComponentView *)scrollView
{
  self = [super init];
  if (self != nil) {
    _virtualViews = [NSMutableSet set];
    _emptyRect = CGRectZero;
    _prerenderRect = CGRectZero;
    _scrollViewComponentView = scrollView;
    _prerenderRatio = ReactNativeFeatureFlags::virtualViewPrerenderRatio();
    [_scrollViewComponentView addScrollListener:self];

    DEBUG_LOG(@"initWithScrollView");
  }
  return self;
}

- (void)dealloc
{
  DEBUG_LOG(@"dealloc");
  if (_scrollViewComponentView != nil) {
    [_scrollViewComponentView removeScrollListener:self];
    _scrollViewComponentView = nil;
  }
  [_virtualViews removeAllObjects];
}

#pragma mark - Public API

- (void)onChange:(id<RCTVirtualViewProtocol>)virtualView
{
  if (![_virtualViews containsObject:virtualView]) {
    [_virtualViews addObject:virtualView];
    DEBUG_LOG(@"Add virtualViewID=%@", virtualView.virtualViewID);
  } else {
    DEBUG_LOG(@"Update virtualViewID=%@", virtualView.virtualViewID);
  }
  [self _updateModes:virtualView];
}

- (void)remove:(id<RCTVirtualViewProtocol>)virtualView
{
  if (![_virtualViews containsObject:virtualView]) {
    RCTLogError(@"Attempting to remove non-existent VirtualView: %@", virtualView.virtualViewID);
  }

  [_virtualViews removeObject:virtualView];
  DEBUG_LOG(@"Remove virtualViewID=%@", virtualView.virtualViewID);
}

#pragma mark - Private Helpers

- (void)_updateModes:(id<RCTVirtualViewProtocol>)virtualView
{
  auto scrollView = _scrollViewComponentView.scrollView;
  CGRect visibleRect = CGRectMake(
      scrollView.contentOffset.x,
      scrollView.contentOffset.y,
      scrollView.frame.size.width,
      scrollView.frame.size.height);

  _prerenderRect = visibleRect;
  _prerenderRect = CGRectInset(
      _prerenderRect, -_prerenderRect.size.width * _prerenderRatio, -_prerenderRect.size.height * _prerenderRatio);

  NSArray<id<RCTVirtualViewProtocol>> *virtualViewsIt =
      (virtualView != nullptr) ? @[ virtualView ] : [_virtualViews allObjects];

  for (id<RCTVirtualViewProtocol> vv = nullptr in virtualViewsIt) {
    CGRect rect = [vv containerRelativeRect:scrollView];

    RCTVirtualViewMode mode = RCTVirtualViewModeHidden;
    CGRect thresholdRect = _emptyRect;

    if (CGRectOverlaps(rect, visibleRect)) {
      thresholdRect = visibleRect;
      mode = RCTVirtualViewModeVisible;
    } else if (CGRectOverlaps(rect, _prerenderRect)) {
      mode = RCTVirtualViewModePrerender;
      thresholdRect = _prerenderRect;
    }

    DEBUG_LOG(
        @"UpdateModes virtualView=%@ mode=%ld rect=%@ thresholdRect=%@",
        vv.virtualViewID,
        (long)mode,
        NSStringFromCGRect(rect),
        NSStringFromCGRect(thresholdRect));
    [vv onModeChange:mode targetRect:rect thresholdRect:thresholdRect];
  }
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  [self _updateModes:nil];
}
@end
