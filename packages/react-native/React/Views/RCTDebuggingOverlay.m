/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDebuggingOverlay.h"

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

@implementation TraceUpdateTuple

- (instancetype)initWithView:(UIView *)view cleanupBlock:(dispatch_block_t)cleanupBlock
{
  if (self = [super init]) {
    _view = view;
    _cleanupBlock = cleanupBlock;
  }

  return self;
}

@end

@implementation RCTDebuggingOverlay {
  NSMutableArray<UIView *> *_highlightedElements;
  NSMutableDictionary<NSNumber *, TraceUpdateTuple *> *_idToTraceUpdateMap;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _idToTraceUpdateMap = [NSMutableDictionary new];
  }
  return self;
}

- (void)highlightTraceUpdates:(NSArray *)updates
{
  for (NSDictionary *update in updates) {
    NSNumber *identifier = [RCTConvert NSNumber:update[@"id"]];
    NSDictionary *nodeRectangle = update[@"rectangle"];
    UIColor *nodeColor = [RCTConvert UIColor:update[@"color"]];

    CGRect rect = [RCTConvert CGRect:nodeRectangle];

    TraceUpdateTuple *possiblyRegisteredTraceUpdateTuple = [_idToTraceUpdateMap objectForKey:identifier];
    if (possiblyRegisteredTraceUpdateTuple != nil) {
      dispatch_block_t cleanupBlock = [possiblyRegisteredTraceUpdateTuple cleanupBlock];
      UIView *view = [possiblyRegisteredTraceUpdateTuple view];

      dispatch_block_cancel(cleanupBlock);

      view.frame = rect;
      view.layer.borderColor = nodeColor.CGColor;

      dispatch_block_t newCleanupBlock = dispatch_block_create(0, ^{
        [self->_idToTraceUpdateMap removeObjectForKey:identifier];
        [view removeFromSuperview];
      });

      [_idToTraceUpdateMap setObject:[[TraceUpdateTuple alloc] initWithView:view cleanupBlock:newCleanupBlock]
                              forKey:identifier];

      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC), dispatch_get_main_queue(), newCleanupBlock);

      continue;
    }

    UIView *box = [[UIView alloc] initWithFrame:rect];
    box.backgroundColor = [UIColor clearColor];

    box.layer.borderWidth = 2.0f;
    box.layer.borderColor = nodeColor.CGColor;

    dispatch_block_t unmountViewAndPerformCleanup = dispatch_block_create(0, ^{
      [self->_idToTraceUpdateMap removeObjectForKey:identifier];
      [box removeFromSuperview];
    });

    TraceUpdateTuple *traceUpdateTuple = [[TraceUpdateTuple alloc] initWithView:box
                                                                   cleanupBlock:unmountViewAndPerformCleanup];

    [_idToTraceUpdateMap setObject:traceUpdateTuple forKey:identifier];
    [self addSubview:box];

    dispatch_after(
        dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC), dispatch_get_main_queue(), unmountViewAndPerformCleanup);
  }
}

- (void)highlightElements:(NSArray *)rectangles
{
  if (_highlightedElements == nil) {
    _highlightedElements = [NSMutableArray new];
  }

  for (NSDictionary *rectangle in rectangles) {
    UIView *view = [[UIView alloc] initWithFrame:[RCTConvert CGRect:rectangle]];
    view.backgroundColor = [UIColor colorWithRed:200 / 255.0 green:230 / 255.0 blue:255 / 255.0 alpha:0.8];

    [self addSubview:view];
    [_highlightedElements addObject:view];
  }
}

- (void)clearElementsHighlights
{
  if (_highlightedElements != nil) {
    for (UIView *v in _highlightedElements) {
      [v removeFromSuperview];
    }
  }

  _highlightedElements = nil;
}

@end
