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
 * The safe area the content is laid out clear of, as a floor on the content container's own padding. The enclosing
 * scroll view sets the pair of insets across its scrollable axis while its `contentInsetAdjustmentBehavior` is
 * `automatic` or `always`, and zero otherwise.
 */
@property (nonatomic, readonly) UIEdgeInsets safeAreaPadding;

/*
 * The content inset UIKit adds for the safe area along the scrollable axis, which the content container's own padding
 * on those edges counts toward. The enclosing scroll view sets the pair of insets along its scrollable axis.
 */
@property (nonatomic, readonly) UIEdgeInsets contentInsetAdjustment;

- (void)setSafeAreaPadding:(UIEdgeInsets)safeAreaPadding contentInsetAdjustment:(UIEdgeInsets)contentInsetAdjustment;

@end

NS_ASSUME_NONNULL_END
