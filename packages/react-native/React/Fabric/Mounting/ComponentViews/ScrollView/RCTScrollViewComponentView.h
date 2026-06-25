/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>
#import <React/RCTGenericDelegateSplitter.h>
#import <React/RCTMountingTransactionObserving.h>
#import <React/RCTScrollableProtocol.h>
#import <React/RCTViewComponentView.h>

#import "RCTVirtualViewContainerProtocol.h"

NS_ASSUME_NONNULL_BEGIN

/*
 * UIView class for <ScrollView> component.
 *
 * By design, the class does not implement any logic that contradicts to the normal behavior of UIScrollView and does
 * not contain any special/custom support for things like floating headers, pull-to-refresh components,
 * keyboard-avoiding functionality and so on. All that complexity must be implemented inside those components in order
 * to keep the complexity of this component manageable.
 */
@interface RCTScrollViewComponentView
    : RCTViewComponentView <RCTMountingTransactionObserving, RCTVirtualViewContainerProtocol>

/*
 * Finds and returns the closet RCTScrollViewComponentView component to the given view
 */
+ (nullable RCTScrollViewComponentView *)findScrollViewComponentViewForView:(UIView *)view;

/*
 * Returns an actual UIScrollView that this component uses under the hood.
 */
@property (nonatomic, strong, readwrite) UIScrollView *scrollView;

/** Focus area of newly-activated text input relative to the window to compare against UIKeyboardFrameBegin/End */
@property (nonatomic, assign) CGRect firstResponderFocus;

/** newly-activated text input outside of the scroll view */
@property (nonatomic, weak) UIView *firstResponderViewOutsideScrollView;

/*
 * Returns the subview of the scroll view that the component uses to mount all subcomponents into. That's useful to
 * separate component views from auxiliary views to be able to reliably implement pull-to-refresh- and RTL-related
 * functionality.
 */
@property (nonatomic, strong, readonly) UIView *containerView;

/*
 * Returns a delegate splitter that can be used to subscribe for UIScrollView delegate.
 */
@property (nonatomic, strong, readonly)
    RCTGenericDelegateSplitter<id<UIScrollViewDelegate>> *scrollViewDelegateSplitter;

@end

/*
 * RCTScrollableProtocol is a protocol which RCTScrollViewManager uses to communicate with all kinds of `UIScrollView`s.
 * Until Fabric has own command-execution pipeline we have to support that to some extent. The implementation shouldn't
 * be perfect though because very soon we will migrate that to the new commands infra and get rid of this.
 */
@interface RCTScrollViewComponentView (ScrollableProtocol) <RCTScrollableProtocol>

@end

@interface UIView (RCTScrollViewComponentView)

- (void)reactUpdateResponderOffsetForScrollView:(RCTScrollViewComponentView *)scrollView;

@end

NS_ASSUME_NONNULL_END
