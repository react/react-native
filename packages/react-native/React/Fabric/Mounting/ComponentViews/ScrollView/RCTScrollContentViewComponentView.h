/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * UIView class for the <ScrollContentView> component, the content container of a <ScrollView>.
 */
@interface RCTScrollContentViewComponentView : RCTViewComponentView

/*
 * The safe area the content is laid out clear of, as padding on top of the content container's own. The enclosing
 * scroll view sets the pair of insets across its scrollable axis, and zero while its `contentInsetAdjustmentBehavior`
 * is `never`.
 */
@property (nonatomic, assign) UIEdgeInsets safeAreaPadding;

@end

NS_ASSUME_NONNULL_END
