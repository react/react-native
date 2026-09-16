/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if __has_include(<React/RCTDefaultReactNativeFactoryDelegate.h>)
#import <React/RCTDefaultReactNativeFactoryDelegate.h>
#import <React/RCTReactNativeFactory.h>
#else
#import <RCTDefaultReactNativeFactoryDelegate.h>
#import <RCTReactNativeFactory.h>
#endif
#import <UIKit/UIKit.h>

@interface SceneDelegate : RCTDefaultReactNativeFactoryDelegate <UIWindowSceneDelegate>

@property (nonatomic, strong, nullable) UIWindow *window;
@property (nonatomic, strong, nullable) RCTReactNativeFactory *reactNativeFactory;

- (NSDictionary *)prepareInitialProps;

@end
