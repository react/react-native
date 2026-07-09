/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UpdatePropertiesExampleView.h"

#import <React/RCTRootView.h>
#import <React/RCTUtils.h>
#import <React/RCTViewManager.h>
#import <RCTReactNativeFactory.h>

@interface UpdatePropertiesExampleViewManager : RCTViewManager

@end

@implementation UpdatePropertiesExampleViewManager

RCT_EXPORT_MODULE();

- (UIView *)view
{
  return [UpdatePropertiesExampleView new];
}

@end

@implementation UpdatePropertiesExampleView {
  RCTRootView *_rootView;
  UIButton *_button;
  BOOL _beige;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    _beige = YES;

    RCTReactNativeFactory *reactNativeFactory = RCTGetActiveReactNativeFactory();

    _rootView =
        (RCTRootView *)[reactNativeFactory.rootViewFactory viewWithModuleName:@"SetPropertiesExampleApp"
                                                                        initialProperties:@{@"color" : @"beige"}];

    _button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    [_button setTitle:@"Native Button" forState:UIControlStateNormal];
    [_button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    [_button setBackgroundColor:[UIColor grayColor]];

    [_button addTarget:self action:@selector(changeColor) forControlEvents:UIControlEventTouchUpInside];

    [self addSubview:_button];
    [self addSubview:_rootView];
  }
  return self;
}

- (void)layoutSubviews
{
  float spaceHeight = 20;
  float buttonHeight = 40;
  float rootViewWidth = self.bounds.size.width;
  float rootViewHeight = self.bounds.size.height - spaceHeight - buttonHeight;

  [_rootView setFrame:CGRectMake(0, 0, rootViewWidth, rootViewHeight)];
  [_button setFrame:CGRectMake(0, rootViewHeight + spaceHeight, rootViewWidth, buttonHeight)];
}

- (void)changeColor
{
  _beige = !_beige;

  NSMutableDictionary *newProperties = [_rootView.appProperties mutableCopy];
  newProperties[@"color"] = _beige ? @"beige" : @"purple";

  [_rootView setAppProperties:newProperties];
}

- (NSArray<UIView<RCTComponent> *> *)reactSubviews
{
  // this is to avoid unregistering our RCTRootView when the component is removed from RN hierarchy
  (void)[super reactSubviews];
  return @[];
}

@end
