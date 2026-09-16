/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDeviceInfo.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTAccessibilityManager.h>
#import <React/RCTAssert.h>
#import <React/RCTConstants.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTInitializing.h>
#import <React/RCTInvalidating.h>
#import <React/RCTUtils.h>
#import <atomic>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTDeviceInfo () <NativeDeviceInfoSpec, RCTInitializing, RCTInvalidating>
@end

@implementation RCTDeviceInfo {
#if TARGET_OS_IOS && !TARGET_OS_MACCATALYST
  UIInterfaceOrientation _currentInterfaceOrientation;
#endif
  NSDictionary *_currentInterfaceDimensions;
  BOOL _isFullscreen;
  std::atomic<BOOL> _invalidated;
  NSDictionary *_constants;

  __weak UIWindow *_applicationWindow;
  NSDictionary * (^_dimensionsProvider)(void);
}

static NSString *const kFrameKeyPath = @"frame";

@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    _applicationWindow = RCTKeyWindow();
    [_applicationWindow addObserver:self forKeyPath:kFrameKeyPath options:NSKeyValueObservingOptionNew context:nil];
  }
  return self;
}

- (instancetype)initWithDimensionsProvider:(NSDictionary * (^)(void))dimensionsProvider
{
  if (self = [self init]) {
    _dimensionsProvider = dimensionsProvider;
  }
  return self;
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
  if ([keyPath isEqualToString:kFrameKeyPath]) {
    [self interfaceFrameDidChange];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:self];
  }
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)initialize
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:[_moduleRegistry moduleForName:"AccessibilityManager"]];

  _currentInterfaceDimensions = [self _exportedDimensions];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:RCTUserInterfaceStyleDidChangeNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

#if TARGET_OS_IOS && !TARGET_OS_MACCATALYST
  _currentInterfaceOrientation = RCTKeyWindow().windowScene.interfaceOrientation;
#endif

#if TARGET_OS_IOS
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:UIDeviceOrientationDidChangeNotification
                                             object:nil];
#endif

  // TODO T175901725 - Registering the RCTDeviceInfo module to the notification is a short-term fix to unblock 0.73
  // The actual behavior should be that the module is properly registered in the TurboModule/Bridge infrastructure
  // and the infrastructure imperatively invoke the `invalidate` method, rather than listening to a notification.
  // This is a temporary workaround until we can investigate the issue better as there might be other modules in a
  // similar situation.
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(invalidate)
                                               name:RCTBridgeWillInvalidateModulesNotification
                                             object:nil];

  [self invalidateCachedConstants];
}

- (void)invalidateCachedConstants
{
  RCTAssertMainQueue();
  _constants = @{
    @"Dimensions" : [self _exportedDimensions],
    // Note:
    // This prop is deprecated and will be removed in a future release.
    // Please use this only for a quick and temporary solution.
    // Use <SafeAreaView> instead.
    @"isIPhoneX_deprecated" : @(RCTIsIPhoneNotched()),
  };
}

- (void)invalidate
{
  if (_invalidated.exchange(YES)) {
    return;
  }
  [self _cleanupObservers];
}

- (void)_cleanupObservers
{
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                                object:[_moduleRegistry moduleForName:"AccessibilityManager"]];

  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidBecomeActiveNotification object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTUserInterfaceStyleDidChangeNotification object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTBridgeWillInvalidateModulesNotification object:nil];

  [_applicationWindow removeObserver:self forKeyPath:kFrameKeyPath];

#if TARGET_OS_IOS
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
#endif
}

static BOOL RCTIsIPhoneNotched()
{
  static BOOL isIPhoneNotched = NO;

#if TARGET_OS_IOS
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTAssertMainQueue();

    // 20pt is the top safeArea value in non-notched devices
    UIWindow *keyWindow = RCTKeyWindow();
    if (keyWindow) {
      isIPhoneNotched = keyWindow.safeAreaInsets.top > 20;
    }
  });
#endif

  return isIPhoneNotched;
}

static NSDictionary *RCTExportedDimensions(CGFloat fontScale)
{
  RCTAssertMainQueue();
  UIWindow *mainWindow = RCTKeyWindow();
  UIScreen *screen = mainWindow.screen;
  if (screen == nil) {
    screen = UIScreen.screens.firstObject;
  }
  CGSize screenSize = screen.bounds.size;

  // We fallback to screen size if a key window is not found.
  CGSize windowSize = mainWindow != nil ? mainWindow.bounds.size : screenSize;

  NSDictionary<NSString *, NSNumber *> *dimsWindow = @{
    @"width" : @(windowSize.width),
    @"height" : @(windowSize.height),
    @"scale" : @(screen.scale),
    @"fontScale" : @(fontScale)
  };

  NSDictionary<NSString *, NSNumber *> *dimsScreen = @{
    @"width" : @(screenSize.width),
    @"height" : @(screenSize.height),
    @"scale" : @(screen.scale),
    @"fontScale" : @(fontScale)
  };
  return @{@"window" : dimsWindow, @"screen" : dimsScreen};
}

- (NSDictionary *)_exportedDimensions
{
  // if a window size provider has been set, use that. If nil is returned from the provider
  // it will fall back to the default behavior.
  if (_dimensionsProvider != nil) {
    auto dimensions = _dimensionsProvider();
    if (dimensions != nil) {
      return dimensions;
    }
  }

  RCTAssert(!_invalidated, @"Failed to get exported dimensions: RCTDeviceInfo has been invalidated");
  RCTAssert(_moduleRegistry, @"Failed to get exported dimensions: RCTModuleRegistry is nil");
  RCTAccessibilityManager *accessibilityManager =
      (RCTAccessibilityManager *)[_moduleRegistry moduleForName:"AccessibilityManager"];
  // TODO(T225745315): For some reason, accessibilityManager is nil in some cases.
  // We default the fontScale to 1.0 in this case. This should be okay: if we assume
  // that accessibilityManager will eventually become available, js will eventually
  // be updated with the correct fontScale.
  CGFloat fontScale = accessibilityManager ? accessibilityManager.multiplier : 1.0;
  return RCTExportedDimensions(fontScale);
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  return _constants;
}

- (void)didReceiveNewContentSizeMultiplier
{
  [self invalidateCachedConstants];
  NSDictionary *nextInterfaceDimensions = _constants[@"Dimensions"];

  RCTModuleRegistry *moduleRegistry = _moduleRegistry;
  RCTExecuteOnMainQueue(^{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                         body:nextInterfaceDimensions];
#pragma clang diagnostic pop
  });
}

- (void)interfaceOrientationDidChange
{
  [self invalidateCachedConstants];

#if TARGET_OS_IOS && !TARGET_OS_MACCATALYST
  UIWindow *window = RCTKeyWindow();
  UIInterfaceOrientation nextOrientation = window.windowScene.interfaceOrientation;

  BOOL isRunningInFullScreen = window ? CGRectEqualToRect(window.frame, window.screen.bounds) : YES;
  // We are catching here two situations for multitasking view:
  // a) The app is in Split View and the container gets resized -> !isRunningInFullScreen
  // b) The app changes to/from fullscreen example: App runs in slide over mode and goes into fullscreen->
  // isRunningInFullScreen != _isFullscreen The above two cases a || b can be shortened to !isRunningInFullScreen ||
  // !_isFullscreen;
  BOOL isResizingOrChangingToFullscreen = !isRunningInFullScreen || !_isFullscreen;
  BOOL isOrientationChanging = (UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
                                !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsLandscape(nextOrientation));

  // Update when we go from portrait to landscape, or landscape to portrait
  // Also update when the fullscreen state changes (multitasking) and only when the app is in active state.
  if ((isOrientationChanging || isResizingOrChangingToFullscreen) && RCTIsAppActive()) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    NSDictionary *nextInterfaceDimensions = _constants[@"Dimensions"];
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                          body:nextInterfaceDimensions];
    // We only want to track the current _currentInterfaceOrientation and _isFullscreen only
    // when it happens and only when it is published.
    _currentInterfaceOrientation = nextOrientation;
    _isFullscreen = isRunningInFullScreen;
#pragma clang diagnostic pop
  }
#endif
}

- (void)interfaceFrameDidChange
{
  __weak __typeof(self) weakSelf = self;
  RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceFrameDidChange];
  });
}

- (void)_interfaceFrameDidChange
{
  [self invalidateCachedConstants];
  NSDictionary *nextInterfaceDimensions = _constants[@"Dimensions"];

  // update and publish the even only when the app is in active state
  if (!([nextInterfaceDimensions isEqual:_currentInterfaceDimensions]) && RCTIsAppActive()) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                          body:nextInterfaceDimensions];
    // We only want to track the current _currentInterfaceOrientation only
    // when it happens and only when it is published.
    _currentInterfaceDimensions = nextInterfaceDimensions;
#pragma clang diagnostic pop
  }
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDeviceInfoSpecJSI>(params);
}

@end

Class RCTDeviceInfoCls(void)
{
  return RCTDeviceInfo.class;
}
