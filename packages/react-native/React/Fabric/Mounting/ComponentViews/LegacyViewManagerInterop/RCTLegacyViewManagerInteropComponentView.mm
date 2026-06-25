/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLegacyViewManagerInteropComponentView.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTConstants.h>
#import <React/UIView+React.h>
#import <react/renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropComponentDescriptor.h>
#import <react/renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>
#import <react/utils/ManagedObjectWrapper.h>
#import "RCTLegacyViewManagerInteropCoordinatorAdapter.h"

using namespace facebook::react;

static NSString *const kRCTLegacyInteropChildComponentKey = @"childComponentView";
static NSString *const kRCTLegacyInteropChildIndexKey = @"index";

@implementation RCTLegacyViewManagerInteropComponentView {
  NSMutableArray<NSDictionary *> *_viewsToBeMounted;
  NSMutableArray<UIView *> *_viewsToBeUnmounted;
  RCTLegacyViewManagerInteropCoordinatorAdapter *_adapter;
  LegacyViewManagerInteropShadowNode::ConcreteState::Shared _state;
  BOOL _hasInvokedForwardingWarning;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = LegacyViewManagerInteropShadowNode::defaultSharedProps();
    _viewsToBeMounted = [NSMutableArray new];
    _viewsToBeUnmounted = [NSMutableArray new];
    _hasInvokedForwardingWarning = NO;
  }

  return self;
}

- (RCTLegacyViewManagerInteropCoordinator *)_coordinator
{
  if (_state != nullptr) {
    const auto &state = _state->getData();
    return unwrapManagedObject(state.coordinator);
  } else {
    return nil;
  }
}

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  const auto &state = _state->getData();
  RCTLegacyViewManagerInteropCoordinator *coordinator = unwrapManagedObject(state.coordinator);
  return coordinator.componentViewName;
}

#pragma mark - Method forwarding

- (void)forwardInvocation:(NSInvocation *)anInvocation
{
  if (!_hasInvokedForwardingWarning) {
    _hasInvokedForwardingWarning = YES;
    NSLog(
        @"Invoked unsupported method on RCTLegacyViewManagerInteropComponentView. Resulting to noop instead of a crash.");
  }
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector
{
  return [super methodSignatureForSelector:aSelector] ?: [self.contentView methodSignatureForSelector:aSelector];
}

#pragma mark - Supported ViewManagers

+ (NSMutableSet<NSString *> *)supportedViewManagers
{
  static NSMutableSet<NSString *> *supported = [NSMutableSet setWithObjects:@"DatePicker",
                                                                            @"ProgressView",
                                                                            @"MaskedView",
                                                                            @"ARTSurfaceView",
                                                                            @"ARTText",
                                                                            @"ARTShape",
                                                                            @"ARTGroup",
                                                                            nil];
  return supported;
}

+ (NSMutableSet<NSString *> *)supportedViewManagersPrefixes
{
  static NSMutableSet<NSString *> *supported = [NSMutableSet new];
  return supported;
}

+ (NSMutableDictionary<NSString *, Class> *)_supportedLegacyViewComponents
{
  static NSMutableDictionary<NSString *, Class> *supported = [NSMutableDictionary new];
  return supported;
}

+ (BOOL)isSupported:(NSString *)componentName
{
  // Step 1: check if ViewManager with specified name is supported.
  BOOL isComponentNameSupported =
      [[RCTLegacyViewManagerInteropComponentView supportedViewManagers] containsObject:componentName];
  if (isComponentNameSupported) {
    return YES;
  }

  // Step 2: check if component has supported prefix.
  for (NSString *item in [RCTLegacyViewManagerInteropComponentView supportedViewManagersPrefixes]) {
    if ([componentName hasPrefix:item]) {
      return YES;
    }
  }

  // Step 3: check if the module has been registered
  // TODO(T174674274): Implement lazy loading of legacy view managers in the new architecture.
  NSArray<Class> *registeredModules = RCTGetModuleClasses();
  NSMutableDictionary<NSString *, Class> *supportedLegacyViewComponents =
      [RCTLegacyViewManagerInteropComponentView _supportedLegacyViewComponents];
  if (supportedLegacyViewComponents[componentName] != NULL) {
    return YES;
  }

  for (Class moduleClass in registeredModules) {
    id<RCTBridgeModule> bridgeModule = (id<RCTBridgeModule>)moduleClass;
    NSString *moduleName = [[bridgeModule moduleName] isEqualToString:@""]
        ? [NSStringFromClass(moduleClass) stringByReplacingOccurrencesOfString:@"Manager" withString:@""]
        : [bridgeModule moduleName];

    if (supportedLegacyViewComponents[moduleName] == NULL) {
      supportedLegacyViewComponents[moduleName] = moduleClass;
    }

    if ([moduleName isEqualToString:componentName] ||
        [moduleName isEqualToString:[@"RCT" stringByAppendingString:componentName]]) {
      return YES;
    }
  }

  return NO;
}

+ (void)supportLegacyViewManagersWithPrefix:(NSString *)prefix
{
  [[RCTLegacyViewManagerInteropComponentView supportedViewManagersPrefixes] addObject:prefix];
}

+ (void)supportLegacyViewManagerWithName:(NSString *)componentName
{
  [[RCTLegacyViewManagerInteropComponentView supportedViewManagers] addObject:componentName];
}

#pragma mark - RCTComponentViewProtocol

- (void)prepareForRecycle
{
  _adapter = nil;
  [_viewsToBeMounted removeAllObjects];
  [_viewsToBeUnmounted removeAllObjects];
  _state.reset();
  self.contentView = nil;
  _hasInvokedForwardingWarning = NO;
  [super prepareForRecycle];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (_adapter && index == _adapter.paperView.reactSubviews.count) {
    // This is a new child view that is being added to the end of the children array.
    // After the children is added, we need to call didUpdateReactSubviews to make sure that it is rendered.
    // Without this change, the new child will not be rendered right away because the didUpdateReactSubviews is not
    // called and the `finalizeUpdate` is not invoked.
    if ([childComponentView isKindOfClass:[RCTLegacyViewManagerInteropComponentView class]]) {
      UIView *target = ((RCTLegacyViewManagerInteropComponentView *)childComponentView).contentView;
      [_adapter.paperView insertReactSubview:target atIndex:index];
    } else {
      [_adapter.paperView insertReactSubview:childComponentView atIndex:index];
    }
    [_adapter.paperView didUpdateReactSubviews];
  } else {
    [_viewsToBeMounted addObject:@{
      kRCTLegacyInteropChildIndexKey : [NSNumber numberWithInteger:index],
      kRCTLegacyInteropChildComponentKey : childComponentView
    }];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (_adapter && index < _adapter.paperView.reactSubviews.count) {
    [_adapter.paperView removeReactSubview:_adapter.paperView.reactSubviews[index]];
  } else {
    [_viewsToBeUnmounted addObject:childComponentView];
  }
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<LegacyViewManagerInteropComponentDescriptor>();
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  _state = std::static_pointer_cast<const LegacyViewManagerInteropShadowNode::ConcreteState>(state);
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  __block BOOL propsUpdated = NO;

  __weak __typeof(self) weakSelf = self;
  void (^updatePropsIfNeeded)(RNComponentViewUpdateMask) = ^void(RNComponentViewUpdateMask mask) {
    __typeof(self) strongSelf = weakSelf;
    if (!propsUpdated) {
      [strongSelf _setPropsWithUpdateMask:mask];
      propsUpdated = YES;
    }
  };

  if (!_adapter) {
    _adapter = [[RCTLegacyViewManagerInteropCoordinatorAdapter alloc] initWithCoordinator:[self _coordinator]
                                                                                 reactTag:self.tag];
    _adapter.eventInterceptor = ^(std::string eventName, folly::dynamic &&event) {
      if (weakSelf) {
        __typeof(self) strongSelf = weakSelf;
        const auto &eventEmitter = static_cast<const ViewEventEmitter &>(*strongSelf->_eventEmitter);
        eventEmitter.dispatchEvent(eventName, std::move(event));
      }
    };
    // Set props immediately. This is required to set the initial state of the view.
    // In the case where some events are fired in relationship of a change in the frame
    // or layout of the view, they will fire as soon as the contentView is set and if the
    // event block is nil, the app will crash.
    updatePropsIfNeeded(updateMask);
    propsUpdated = YES;

    self.contentView = _adapter.paperView;
  }

  for (NSDictionary *mountInstruction in _viewsToBeMounted) {
    NSNumber *index = mountInstruction[kRCTLegacyInteropChildIndexKey];
    UIView *childView = mountInstruction[kRCTLegacyInteropChildComponentKey];
    if ([childView isKindOfClass:[RCTLegacyViewManagerInteropComponentView class]]) {
      UIView *target = ((RCTLegacyViewManagerInteropComponentView *)childView).contentView;
      [_adapter.paperView insertReactSubview:target atIndex:index.integerValue];
    } else {
      [_adapter.paperView insertReactSubview:childView atIndex:index.integerValue];
    }
  }

  [_viewsToBeMounted removeAllObjects];

  for (UIView *view in _viewsToBeUnmounted) {
    [_adapter.paperView removeReactSubview:view];
  }

  [_viewsToBeUnmounted removeAllObjects];

  [_adapter.paperView didUpdateReactSubviews];

  updatePropsIfNeeded(updateMask);
}

- (void)_setPropsWithUpdateMask:(RNComponentViewUpdateMask)updateMask
{
  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &newProps = static_cast<const LegacyViewManagerInteropViewProps &>(*_props);
    [_adapter setProps:newProps.otherProps];
  }
}

- (UIView *)paperView
{
  return _adapter.paperView;
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  [_adapter handleCommand:(NSString *)commandName args:(NSArray *)args];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  UIView *result = [super hitTest:point withEvent:event];

  if (result == self) {
    return nil;
  }

  return result;
}

@end

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
