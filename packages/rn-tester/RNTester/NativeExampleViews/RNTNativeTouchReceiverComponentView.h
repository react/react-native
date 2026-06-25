/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Fabric component view whose touchesEnded: fires onNativeTouch.
 * Used as the parent wrapper in the blockNativeResponder repro:
 *   <RNTNativeTouchReceiver onNativeTouch={...}>
 *     <Pressable blockNativeResponder={true} ...>...</Pressable>
 *   </RNTNativeTouchReceiver>
 */
@interface RNTNativeTouchReceiverComponentView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
