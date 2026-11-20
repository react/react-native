/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeProxy.h>

extern NSString *const RCTAccessibilityManagerDidUpdateMultiplierNotification; // posted when multiplier is changed

@interface RCTAccessibilityManager : NSObject <RCTBridgeModule>

@property (nonatomic, readonly) CGFloat multiplier;

/// map from UIKit categories to multipliers
@property (nonatomic, copy) NSDictionary<NSString *, NSNumber *> *multipliers;

@property (nonatomic, assign) BOOL isBoldTextEnabled;
@property (nonatomic, assign) BOOL isGrayscaleEnabled;
@property (nonatomic, assign) BOOL isInvertColorsEnabled;
@property (nonatomic, assign) BOOL isReduceMotionEnabled;
@property (nonatomic, assign) BOOL isDarkerSystemColorsEnabled;
@property (nonatomic, assign) BOOL prefersCrossFadeTransitions;
@property (nonatomic, assign) BOOL isReduceTransparencyEnabled;
@property (nonatomic, assign) BOOL isShowBordersEnabled;
@property (nonatomic, assign) BOOL isVoiceOverEnabled;

@end

@interface RCTBridgeProxy (RCTAccessibilityManager)

@property (nonatomic, readonly) RCTAccessibilityManager *accessibilityManager;

@end
