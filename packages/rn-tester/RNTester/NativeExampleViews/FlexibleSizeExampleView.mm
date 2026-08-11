/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FlexibleSizeExampleView.h"

#if __has_include(<React/RCTRootViewFactory.h>)
#import <React/RCTRootViewFactory.h>
#else
#import <RCTRootViewFactory.h>
#endif
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTRootViewDelegate.h>

@interface FlexibleSizeExampleView () <RCTRootViewDelegate>

- (instancetype)initWithFrame:(CGRect)frame rootViewFactory:(RCTRootViewFactory *)rootViewFactory;

@end

@implementation FlexibleSizeExampleViewManager {
  RCTRootViewFactory *_rootViewFactory;
}

RCT_EXPORT_MODULE();

- (instancetype)initWithRootViewFactory:(RCTRootViewFactory *)rootViewFactory
{
  if ((self = [super init]) != nil) {
    _rootViewFactory = rootViewFactory;
  }
  return self;
}

- (UIView *)view
{
  return [[FlexibleSizeExampleView alloc] initWithFrame:CGRectZero rootViewFactory:_rootViewFactory];
}

@end

@implementation FlexibleSizeExampleView {
  RCTRootView *_resizableRootView;
  UITextView *_currentSizeTextView;
  BOOL _sizeUpdated;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  return [self initWithFrame:frame rootViewFactory:nil];
}

- (instancetype)initWithFrame:(CGRect)frame rootViewFactory:(RCTRootViewFactory *)rootViewFactory
{
  if ((self = [super initWithFrame:frame])) {
    _sizeUpdated = NO;

    _resizableRootView = (RCTRootView *)[rootViewFactory viewWithModuleName:@"RootViewSizeFlexibilityExampleApp"];

    [_resizableRootView setSizeFlexibility:RCTRootViewSizeFlexibilityHeight];

    _currentSizeTextView = [UITextView new];
#ifndef TARGET_OS_TV
    _currentSizeTextView.editable = NO;
#endif
    _currentSizeTextView.text = @"Resizable view has not been resized yet";
    _currentSizeTextView.textColor = [UIColor blackColor];
    _currentSizeTextView.backgroundColor = [UIColor whiteColor];
    _currentSizeTextView.font = [UIFont boldSystemFontOfSize:10];

    _resizableRootView.delegate = self;

    [self addSubview:_currentSizeTextView];
    [self addSubview:_resizableRootView];
  }
  return self;
}

- (void)layoutSubviews
{
  float textViewHeight = 60;
  float spacingHeight = 10;
  [_resizableRootView
      setFrame:CGRectMake(
                   0, textViewHeight + spacingHeight, self.frame.size.width, _resizableRootView.frame.size.height)];
  [_currentSizeTextView setFrame:CGRectMake(0, 0, self.frame.size.width, textViewHeight)];
}

- (NSArray<UIView<RCTComponent> *> *)reactSubviews
{
  // this is to avoid unregistering our RCTRootView when the component is removed from RN hierarchy
  (void)[super reactSubviews];
  return @[];
}

#pragma mark - RCTRootViewDelegate

- (void)rootViewDidChangeIntrinsicSize:(RCTRootView *)rootView
{
  CGRect newFrame = rootView.frame;
  newFrame.size = rootView.intrinsicContentSize;

  if (!_sizeUpdated) {
    _sizeUpdated = TRUE;
    _currentSizeTextView.text = [NSString
        stringWithFormat:
            @"RCTRootViewDelegate: content with initially unknown size has appeared, updating root view's size so the content fits."];

  } else {
    _currentSizeTextView.text =
        [NSString stringWithFormat:
                      @"RCTRootViewDelegate: content size has been changed to (%ld, %ld), updating root view's size.",
                      (long)newFrame.size.width,
                      (long)newFrame.size.height];
  }

  rootView.frame = newFrame;
}

@end
