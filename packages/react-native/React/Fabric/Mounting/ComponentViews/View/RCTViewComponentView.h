/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewProtocol.h>
#import <React/RCTConstants.h>
#import <React/RCTTouchableComponentViewProtocol.h>
#import <React/UIView+ComponentViewProtocol.h>
#import <react/renderer/components/view/ViewEventEmitter.h>
#import <react/renderer/components/view/ViewProps.h>
#import <react/renderer/core/EventEmitter.h>
#import <react/renderer/core/LayoutMetrics.h>
#import <react/renderer/core/Props.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for <View> component.
 */
@interface RCTViewComponentView : UIView <RCTComponentViewProtocol, RCTTouchableComponentViewProtocol> {
 @protected
  facebook::react::LayoutMetrics _layoutMetrics;
  facebook::react::SharedViewProps _props;
  facebook::react::SharedViewEventEmitter _eventEmitter;
}

/**
 * Represents the `UIView` instance that is being automatically attached to
 * the component view and laid out using on `layoutMetrics` (especially `size`
 * and `padding`) of the component.
 * This view must not be a component view; it's just a convenient way
 * to embed/bridge pure native views as component views.
 * Defaults to `nil`. Assign `nil` to remove view as subview.
 */
@property (nonatomic, strong, nullable) UIView *contentView;

/**
 * Provides access to `nativeId` prop of the component.
 * It might be used by subclasses (which need to refer to the view from
 * other platform-specific external views or systems by some id) or
 * by debugging/inspection tools.
 * Defaults to `nil`.
 */
@property (nonatomic, strong, nullable) NSString *nativeId;

/**
 * Returns the object - usually (sub)view - which represents this
 * component view in terms of accessibility.
 * All accessibility properties will be applied to this object.
 * May be overridden in subclass which needs to be accessiblitywise
 * transparent in favour of some subview.
 * Defaults to `self`.
 */
@property (nonatomic, strong, nullable, readonly) NSObject *accessibilityElement;

/**
 * Insets used when hit testing inside this view.
 */
@property (nonatomic, assign) UIEdgeInsets hitTestEdgeInsets;

/**
 * Enforcing `call super` semantic for overridden methods from `RCTComponentViewProtocol`.
 * The methods update the instance variables.
 */
- (void)updateProps:(const facebook::react::Props::Shared &)props
           oldProps:(const facebook::react::Props::Shared &)oldProps NS_REQUIRES_SUPER;
- (void)updateEventEmitter:(const facebook::react::EventEmitter::Shared &)eventEmitter NS_REQUIRES_SUPER;
- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics NS_REQUIRES_SUPER;
- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask NS_REQUIRES_SUPER;
- (void)prepareForRecycle NS_REQUIRES_SUPER;
- (UIView *)betterHitTest:(CGPoint)point withEvent:(UIEvent *)event;
#if TARGET_OS_TV
- (UIView *)viewToFocus;
- (void)focus;
- (void)blur;
#endif

/*
 * This is the label that would be coopted by another element
 */
- (NSString *)accessibilityLabelForCoopting;

/*
 * This View has no label and will look to coopt something below it
 */
- (BOOL)wantsToCooptLabel;

/*
 * This is a fragment of temporary workaround that we need only temporary and will get rid of soon.
 */
- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN;

@end

NS_ASSUME_NONNULL_END
