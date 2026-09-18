/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalHostViewComponentView.h"

#import <React/RCTBridge+Private.h>
#import <React/UIView+React.h>
#import <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>
#import <react/renderer/components/modal/ModalHostViewComponentDescriptor.h>
#import <react/renderer/components/modal/ModalHostViewState.h>

#import "RCTConversions.h"

#import "RCTFabricModalHostViewController.h"

using namespace facebook::react;

#if !TARGET_OS_TV
static UIInterfaceOrientationMask supportedOrientationsMask(ModalHostViewSupportedOrientationsMask mask)
{
  UIInterfaceOrientationMask supportedOrientations = 0;

  if (mask & ModalHostViewSupportedOrientations::Portrait) {
    supportedOrientations |= UIInterfaceOrientationMaskPortrait;
  }

  if (mask & ModalHostViewSupportedOrientations::PortraitUpsideDown) {
    supportedOrientations |= UIInterfaceOrientationMaskPortraitUpsideDown;
  }

  if (mask & ModalHostViewSupportedOrientations::Landscape) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscape;
  }

  if (mask & ModalHostViewSupportedOrientations::LandscapeLeft) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscapeLeft;
  }

  if (mask & ModalHostViewSupportedOrientations::LandscapeRight) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscapeRight;
  }

  if (supportedOrientations == 0) {
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
      return UIInterfaceOrientationMaskAll;
    } else {
      return UIInterfaceOrientationMaskPortrait;
    }
  }

  return supportedOrientations;
}
#endif

static std::tuple<BOOL, UIModalTransitionStyle> animationConfiguration(const ModalHostViewAnimationType animation)
{
  switch (animation) {
    case ModalHostViewAnimationType::None:
      return std::make_tuple(NO, UIModalTransitionStyleCoverVertical);
    case ModalHostViewAnimationType::Slide:
      return std::make_tuple(YES, UIModalTransitionStyleCoverVertical);
    case ModalHostViewAnimationType::Fade:
      return std::make_tuple(YES, UIModalTransitionStyleCrossDissolve);
  }
}

static UIModalPresentationStyle presentationConfiguration(const ModalHostViewProps &props)
{
  if (props.transparent) {
    return UIModalPresentationOverFullScreen;
  }
  switch (props.presentationStyle) {
    case ModalHostViewPresentationStyle::FullScreen:
      return UIModalPresentationFullScreen;
    case ModalHostViewPresentationStyle::PageSheet:
#if !TARGET_OS_TV
      return UIModalPresentationPageSheet;
#else
      return UIModalPresentationFullScreen;
#endif
    case ModalHostViewPresentationStyle::FormSheet:
#if TARGET_OS_TV
      if (@available(tvOS 26.0, *)) {
        return UIModalPresentationFormSheet;
      } else {
        return UIModalPresentationFullScreen;
      }
#else
      return UIModalPresentationFormSheet;
#endif
    case ModalHostViewPresentationStyle::OverFullScreen:
      return UIModalPresentationOverFullScreen;
  }
}

static ModalHostViewEventEmitter::OnOrientationChange onOrientationChangeStruct(CGRect rect)
{
  ;
  auto orientation = rect.size.width < rect.size.height
      ? ModalHostViewEventEmitter::OnOrientationChangeOrientation::Portrait
      : ModalHostViewEventEmitter::OnOrientationChangeOrientation::Landscape;
  return {orientation};
}

@interface RCTModalHostViewComponentView () <RCTFabricModalHostViewControllerDelegate>

@property (nonatomic, weak) UIView *accessibilityFocusedView;

@end

@implementation RCTModalHostViewComponentView {
  RCTFabricModalHostViewController *_viewController;
  ModalHostViewShadowNode::ConcreteState::Shared _state;
  BOOL _shouldAnimatePresentation;
  BOOL _shouldPresent;
  BOOL _isPresented;
  BOOL _isTransitioning;
  BOOL _modalInPresentation;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ModalHostViewShadowNode::defaultSharedProps();
    _shouldAnimatePresentation = YES;

    _isPresented = NO;
    _modalInPresentation = YES;
  }

  return self;
}

- (RCTFabricModalHostViewController *)viewController
{
  if (!_viewController) {
    _viewController = [RCTFabricModalHostViewController new];
    _viewController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
    _viewController.delegate = self;
    _viewController.modalInPresentation = _modalInPresentation;
  }
  return _viewController;
}

- (void)presentViewController:(UIViewController *)modalViewController
                     animated:(BOOL)animated
                   completion:(void (^)(void))completion
{
  UIViewController *controller = [self reactViewController];
  [controller presentViewController:modalViewController animated:animated completion:completion];
}

- (void)dismissViewController:(UIViewController *)modalViewController
                     animated:(BOOL)animated
                   completion:(void (^)(void))completion
{
  if (modalViewController.presentedViewController) {
    // Dismissing a controller that is itself presenting only dismisses its child, so dismiss both.
    UIViewController *presentingViewController = modalViewController.presentingViewController ?: modalViewController;
    [presentingViewController dismissViewControllerAnimated:animated completion:completion];
  } else {
    [modalViewController dismissViewControllerAnimated:animated completion:completion];
  }
}

- (void)ensurePresentedOnlyIfNeeded
{
  // UIKit presentation and dismissal are asynchronous. Reconcile the latest
  // visibility only after the current transition has completed.
  if (_isTransitioning) {
    return;
  }

  BOOL shouldBePresented = !_isPresented && _shouldPresent && self.window;
  if (shouldBePresented) {
    [self saveAccessibilityFocusedView];
    self.viewController.presentationController.delegate = self;
    self.viewController.modalInPresentation = _modalInPresentation;

    RCTFabricModalHostViewController *viewController = self.viewController;
    _isPresented = YES;
    _isTransitioning = YES;
    [self presentViewController:viewController
                       animated:_shouldAnimatePresentation
                     completion:^{
                       if (self->_viewController != viewController) {
                         // The host was recycled while UIKit was presenting it.
                         [self dismissViewController:viewController animated:NO completion:nil];
                         return;
                       }
                       self->_isTransitioning = NO;
                       auto eventEmitter = [self modalEventEmitter];
                       if (eventEmitter) {
                         eventEmitter->onShow(ModalHostViewEventEmitter::OnShow{});
                       }
                       [self ensurePresentedOnlyIfNeeded];
                     }];
    return;
  }

  BOOL shouldBeHidden = _isPresented && (!_shouldPresent || !self.superview);
  if (shouldBeHidden) {
    _isTransitioning = YES;
    RCTFabricModalHostViewController *viewController = self.viewController;
    // To animate dismissal of view controller, snapshot of
    // view hierarchy needs to be added to the UIViewController.
    UIView *snapshot = [viewController.view snapshotViewAfterScreenUpdates:NO];
    if (_shouldPresent) {
      [viewController.view addSubview:snapshot];
    }

    [self dismissViewController:viewController
                       animated:_shouldAnimatePresentation
                     completion:^{
                       [snapshot removeFromSuperview];
                       if (self->_viewController != viewController) {
                         return;
                       }
                       self->_isPresented = NO;
                       self->_isTransitioning = NO;
                       // A dismissal for an earlier visibility request must not
                       // unmount the contents of a modal that is reopening.
                       if (!self->_shouldPresent || !self.superview) {
                         auto eventEmitter = [self modalEventEmitter];
                         if (eventEmitter) {
                           eventEmitter->onDismiss(ModalHostViewEventEmitter::OnDismiss{});
                         }
                         [self restoreAccessibilityFocusedView];
                       }
                       [self ensurePresentedOnlyIfNeeded];
                     }];
  }
}

- (std::shared_ptr<const ModalHostViewEventEmitter>)modalEventEmitter
{
  if (!_eventEmitter) {
    return nullptr;
  }

  assert(std::dynamic_pointer_cast<const ModalHostViewEventEmitter>(_eventEmitter));
  return std::static_pointer_cast<const ModalHostViewEventEmitter>(_eventEmitter);
}

#pragma mark - UIView methods

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self ensurePresentedOnlyIfNeeded];
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  [self ensurePresentedOnlyIfNeeded];
}

- (void)saveAccessibilityFocusedView
{
  id focusedElement = UIAccessibilityFocusedElement(nil);
  if (focusedElement && [focusedElement isKindOfClass:[UIView class]]) {
    self.accessibilityFocusedView = (UIView *)focusedElement;
  }
}

- (void)restoreAccessibilityFocusedView
{
  id viewToFocus = self.accessibilityFocusedView;
  if (viewToFocus) {
    UIAccessibilityPostNotification(UIAccessibilityScreenChangedNotification, viewToFocus);
    self.accessibilityFocusedView = nil;
  }
}

#pragma mark - RCTFabricModalHostViewControllerDelegate

- (void)boundsDidChange:(CGRect)newBounds
{
  auto eventEmitter = [self modalEventEmitter];
  if (eventEmitter) {
    eventEmitter->onOrientationChange(onOrientationChangeStruct(newBounds));
  }

  if (_state != nullptr) {
    auto newState = ModalHostViewState{RCTSizeFromCGSize(newBounds.size)};
    _state->updateState(std::move(newState));
  }
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ModalHostViewComponentDescriptor>();
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _viewController.delegate = nil;
  _viewController.presentationController.delegate = nil;
  if (_isPresented && !_isTransitioning) {
    [self dismissViewController:_viewController animated:NO completion:nil];
  }
  // In-flight completions retain the old controller and clean it up without
  // mutating a subsequently reused host.
  _viewController = nil;
  _isTransitioning = NO;
  _isPresented = NO;
  _shouldPresent = NO;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldViewProps = static_cast<const ModalHostViewProps &>(*_props);
  const auto &newProps = static_cast<const ModalHostViewProps &>(*props);

#if !TARGET_OS_TV
  self.viewController.supportedInterfaceOrientations = supportedOrientationsMask(newProps.supportedOrientations);
#endif

  const auto [shouldAnimate, transitionStyle] = animationConfiguration(newProps.animationType);
  _shouldAnimatePresentation = shouldAnimate;
  self.viewController.modalTransitionStyle = transitionStyle;

  self.viewController.modalPresentationStyle = presentationConfiguration(newProps);

  if (oldViewProps.allowSwipeDismissal != newProps.allowSwipeDismissal) {
    _modalInPresentation = !newProps.allowSwipeDismissal;
    self.viewController.modalInPresentation = _modalInPresentation;
  }

  _shouldPresent = newProps.visible;
  [self ensurePresentedOnlyIfNeeded];

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const facebook::react::State::Shared &)state
           oldState:(const facebook::react::State::Shared &)oldState
{
  _state = std::static_pointer_cast<const ModalHostViewShadowNode::ConcreteState>(state);
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [self.viewController.view insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

#pragma mark - UIAdaptivePresentationControllerDelegate

- (void)presentationControllerDidAttemptToDismiss:(UIPresentationController *)controller
{
  auto eventEmitter = [self modalEventEmitter];
  if (eventEmitter) {
    eventEmitter->onRequestClose({});
  }
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  auto eventEmitter = [self modalEventEmitter];
  const auto &props = static_cast<const ModalHostViewProps &>(*_props);

  if (eventEmitter && props.allowSwipeDismissal) {
    eventEmitter->onRequestClose({});
  }
}

@end

#ifdef __cplusplus
extern "C" {
#endif

// Can't the import generated Plugin.h because plugins are not in this BUCK target
Class<RCTComponentViewProtocol> RCTModalHostViewCls(void);

#ifdef __cplusplus
}
#endif

Class<RCTComponentViewProtocol> RCTModalHostViewCls(void)
{
  return RCTModalHostViewComponentView.class;
}
