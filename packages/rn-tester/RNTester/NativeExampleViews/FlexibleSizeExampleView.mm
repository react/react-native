/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FlexibleSizeExampleView.h"

#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTRootViewDelegate.h>
#import <React/RCTUtils.h>
#import <React/RCTViewManager.h>
#import <RCTReactNativeFactory.h>

@interface FlexibleSizeExampleViewManager : RCTViewManager

@end

@implementation FlexibleSizeExampleViewManager

RCT_EXPORT_MODULE();

- (UIView *)view
{
  return [FlexibleSizeExampleView new];
}

@end

@interface FlexibleSizeExampleView () <RCTRootViewDelegate>

@end

@implementation FlexibleSizeExampleView {
  RCTRootView *_resizableRootView;
  UITextView *_currentSizeTextView;
  BOOL _sizeUpdated;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _sizeUpdated = NO;

    RCTReactNativeFactory *reactNativeFactory = RCTGetActiveReactNativeFactory();

    _resizableRootView = (RCTRootView *)[reactNativeFactory.rootViewFactory
        viewWithModuleName:@"RootViewSizeFlexibilityExampleApp"];

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
