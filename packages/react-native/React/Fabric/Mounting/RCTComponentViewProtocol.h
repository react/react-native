/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#import <react/renderer/core/EventEmitter.h>
#import <react/renderer/core/LayoutMetrics.h>
#import <react/renderer/core/Props.h>
#import <react/renderer/core/State.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Bitmask for all types of possible updates performing during mounting.
 */
typedef NS_OPTIONS(NSInteger, RNComponentViewUpdateMask) {
  RNComponentViewUpdateMaskNone = 0,
  RNComponentViewUpdateMaskProps = 1 << 0,
  RNComponentViewUpdateMaskEventEmitter = 1 << 1,
  RNComponentViewUpdateMaskState = 1 << 2,
  RNComponentViewUpdateMaskLayoutMetrics = 1 << 3,

  RNComponentViewUpdateMaskAll = RNComponentViewUpdateMaskProps | RNComponentViewUpdateMaskEventEmitter |
      RNComponentViewUpdateMaskState | RNComponentViewUpdateMaskLayoutMetrics
};

/*
 * Represents a `UIView` instance managed by React.
 * All methods are non-@optional.
 * `UIView+ComponentViewProtocol` category provides default implementation
 * for all of them.
 */
@protocol RCTComponentViewProtocol <NSObject>

/*
 * Returns a `ComponentDescriptorProvider` of a particular `ComponentDescriptor` which this component view
 * represents.
 */
+ (facebook::react::ComponentDescriptorProvider)componentDescriptorProvider;

/*
 * Returns a list of supplemental  `ComponentDescriptorProvider`s (with do not have `ComponentView` counterparts) that
 * require for this component view.
 */
+ (std::vector<facebook::react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

/*
 * Called for mounting (attaching) a child component view inside `self`
 * component view.
 * Receiver must add `childComponentView` as a subview.
 */
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

/*
 * Called for unmounting (detaching) a child component view from `self`
 * component view.
 * Receiver must remove `childComponentView` as a subview.
 */
- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

/*
 * Called for updating component's props.
 * Receiver must update native view props accordingly changed props.
 */
- (void)updateProps:(const facebook::react::Props::Shared &)props
           oldProps:(const facebook::react::Props::Shared &)oldProps;

/*
 * Called for updating component's state.
 * Receiver must update native view according to changed state.
 */
- (void)updateState:(const facebook::react::State::Shared &)state
           oldState:(const facebook::react::State::Shared &)oldState;

/*
 * Called for updating component's event handlers set.
 * Receiver must cache `eventEmitter` object inside and use it for emitting
 * events when needed.
 */
- (void)updateEventEmitter:(const facebook::react::EventEmitter::Shared &)eventEmitter;

/*
 * Called for updating component's layout metrics.
 * Receiver must update `UIView` layout-related fields (such as `frame`,
 * `bounds`, `layer.zPosition`, and so on) accordingly.
 */
- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics;

/*
 * Called when receiving a command
 */
- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args;

/*
 * Called right after all update methods were called for a particular component view.
 * Useful for performing updates that require knowledge of several independent aspects of the compound mounting change
 * (e.g. props *and* layout constraints).
 */
- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask;

/*
 * Called right after the component view is moved to a recycle pool.
 * Receiver must reset any local state and release associated
 * non-reusable resources.
 */
- (void)prepareForRecycle;

/*
 * Called for unmounted components that won't be moved to a recycle pool.
 * Useful for releasing any associated resources.
 */
- (void)invalidate;

/*
 * Read the last props used to update the view.
 */
- (facebook::react::Props::Shared)props;

- (BOOL)isJSResponder;
- (void)setIsJSResponder:(BOOL)isJSResponder;

/*
 * This is broken. Do not use.
 */
- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)props;
- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;

@end

NS_ASSUME_NONNULL_END
