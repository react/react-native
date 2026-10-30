/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for <KeyboardAvoidingView> component.
 *
 * Follows the keyboard with `UIKeyboardLayoutGuide` and sends the keyboard
 * inset to the shared animation backend on each frame.
 */
@interface RCTKeyboardAvoidingViewComponentView : RCTViewComponentView

@end

NS_ASSUME_NONNULL_END
