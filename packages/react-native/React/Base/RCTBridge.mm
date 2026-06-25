/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBridge.h"
#import "RCTBridge+Inspector.h"
#import "RCTBridge+Private.h"

#import <objc/runtime.h>

#import "RCTConvert.h"
#if RCT_ENABLE_INSPECTOR
#import "RCTInspectorDevServerHelper.h"
#endif
#import <jsinspector-modern/InspectorFlags.h>
#import <jsinspector-modern/InspectorInterfaces.h>
#import <jsinspector-modern/ReactCdp.h>
#import <optional>
#import "RCTDevLoadingViewProtocol.h"
#import "RCTInspectorNetworkHelper.h"
#import "RCTInspectorUtils.h"
#import "RCTJSThread.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTPausedInDebuggerOverlayController.h"
#import "RCTPerformanceLogger.h"
#import "RCTProfile.h"
#import "RCTReloadCommand.h"
#import "RCTUtils.h"

static NSMutableArray<Class> *RCTModuleClasses;
static dispatch_queue_t RCTModuleClassesSyncQueue;
NSArray<Class> *RCTGetModuleClasses(void)
{
  __block NSArray<Class> *result;
  dispatch_sync(RCTModuleClassesSyncQueue, ^{
    result = [RCTModuleClasses copy];
  });
  return result;
}

NSSet<NSString *> *getCoreModuleClasses(void);
NSSet<NSString *> *getCoreModuleClasses(void)
{
  static NSSet<NSString *> *coreModuleClasses = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    coreModuleClasses = [NSSet setWithArray:@[
      @"RCTViewManager",
      @"RCTActivityIndicatorViewManager",
      @"RCTDebuggingOverlayManager",
      @"RCTModalHostViewManager",
      @"RCTModalManager",
      @"RCTRefreshControlManager",
      @"RCTSafeAreaViewManager",
      @"RCTScrollContentViewManager",
      @"RCTScrollViewManager",
      @"RCTSwitchManager",
      @"RCTUIManager",
      @"RCTAccessibilityManager",
      @"RCTActionSheetManager",
      @"RCTAlertManager",
      @"RCTAppearance",
      @"RCTAppState",
      @"RCTClipboard",
      @"RCTDeviceInfo",
      @"RCTDevLoadingView",
      @"RCTDevMenu",
      @"RCTDevSettings",
      @"RCTDevToolsRuntimeSettingsModule",
      @"RCTEventDispatcher",
      @"RCTExceptionsManager",
      @"RCTI18nManager",
      @"RCTKeyboardObserver",
      @"RCTLogBox",
      @"RCTPerfMonitor",
      @"RCTPlatform",
      @"RCTRedBox",
      @"RCTSourceCode",
      @"RCTStatusBarManager",
      @"RCTTiming",
      @"RCTWebSocketModule",
      @"RCTNativeAnimatedModule",
      @"RCTNativeAnimatedTurboModule",
      @"RCTBlobManager",
      @"RCTFileReaderModule",
      @"RCTBundleAssetImageLoader",
      @"RCTGIFImageDecoder",
      @"RCTImageEditingManager",
      @"RCTImageLoader",
      @"RCTImageStoreManager",
      @"RCTImageViewManager",
      @"RCTLocalAssetImageLoader",
      @"RCTLinkingManager",
      @"RCTDataRequestHandler",
      @"RCTFileRequestHandler",
      @"RCTHTTPRequestHandler",
      @"RCTNetworking",
      @"RCTPushNotificationManager",
      @"RCTSettingsManager",
      @"RCTBaseTextViewManager",
      @"RCTBaseTextInputViewManager",
      @"RCTInputAccessoryViewManager",
      @"RCTMultilineTextInputViewManager",
      @"RCTRawTextViewManager",
      @"RCTSinglelineTextInputViewManager",
      @"RCTTextViewManager",
      @"RCTVirtualTextViewManager",
      @"RCTVibration",
    ]];
  });

  return coreModuleClasses;
}

static NSMutableArray<NSString *> *modulesLoadedWithOldArch;
void addModuleLoadedWithOldArch(NSString * /*moduleName*/);
void addModuleLoadedWithOldArch(NSString *moduleName)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    modulesLoadedWithOldArch = [NSMutableArray new];
  });

  [modulesLoadedWithOldArch addObject:moduleName];
}

NSMutableArray<NSString *> *getModulesLoadedWithOldArch(void)
{
  return modulesLoadedWithOldArch;
}

/**
 * Register the given class as a bridge module. All modules must be registered
 * prior to the first bridge initialization.
 * TODO: (T115656171) Refactor RCTRegisterModule out of Bridge.m since it doesn't use the Bridge.
 */
void RCTRegisterModule(Class /*moduleClass*/);
void RCTRegisterModule(Class moduleClass)
{
  if (RCTAreLegacyLogsEnabled() && ![getCoreModuleClasses() containsObject:[moduleClass description]]) {
    addModuleLoadedWithOldArch([moduleClass description]);
  }
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTModuleClasses = [NSMutableArray new];
    RCTModuleClassesSyncQueue =
        dispatch_queue_create("com.facebook.react.ModuleClassesSyncQueue", DISPATCH_QUEUE_CONCURRENT);
  });

  RCTAssert(
      [moduleClass conformsToProtocol:@protocol(RCTBridgeModule)],
      @"%@ does not conform to the RCTBridgeModule protocol",
      moduleClass);

  // Register module
  dispatch_barrier_async(RCTModuleClassesSyncQueue, ^{
    [RCTModuleClasses addObject:moduleClass];
  });
}

/**
 * This function returns the module name for a given class.
 */
NSString *RCTBridgeModuleNameForClass(Class cls)
{
#if RCT_DEBUG
  RCTAssert(
      [cls conformsToProtocol:@protocol(RCTBridgeModule)],
      @"Bridge module `%@` does not conform to RCTBridgeModule",
      cls);
#endif

  NSString *name = [cls moduleName];
  if (name.length == 0) {
    name = NSStringFromClass(cls);
  }

  return RCTDropReactPrefixes(name);
}

BOOL RCTTurboModuleEnabled(void)
{
  return YES;
}

void RCTEnableTurboModule(BOOL enabled)
{
  // The new Architecture is enabled by default and we are ignoring changes to the TurboModule system.
}

#ifndef RCT_REMOVE_LEGACY_MODULE_INTEROP
static BOOL turboModuleInteropEnabled = NO;
BOOL RCTTurboModuleInteropEnabled(void)
{
  return turboModuleInteropEnabled;
}
void RCTEnableTurboModuleInterop(BOOL enabled)
{
  turboModuleInteropEnabled = enabled;
}
#endif // RCT_REMOVE_LEGACY_MODULE_INTEROP

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP
static BOOL fabricInteropLayerEnabled = YES;
BOOL RCTFabricInteropLayerEnabled()
{
  return fabricInteropLayerEnabled;
}

void RCTEnableFabricInteropLayer(BOOL enabled)
{
  fabricInteropLayerEnabled = enabled;
}
#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP

static RCTBridgeProxyLoggingLevel bridgeProxyLoggingLevel = kRCTBridgeProxyLoggingLevelNone;
RCTBridgeProxyLoggingLevel RCTTurboModuleInteropBridgeProxyLogLevel(void)
{
  return bridgeProxyLoggingLevel;
}

void RCTSetTurboModuleInteropBridgeProxyLogLevel(RCTBridgeProxyLoggingLevel logLevel)
{
  bridgeProxyLoggingLevel = logLevel;
}

BOOL kDispatchAccessibilityManagerInitOntoMain = NO;
BOOL RCTUIManagerDispatchAccessibilityManagerInitOntoMain(void)
{
  return kDispatchAccessibilityManagerInitOntoMain;
}

void RCTUIManagerSetDispatchAccessibilityManagerInitOntoMain(BOOL enabled)
{
  kDispatchAccessibilityManagerInitOntoMain = enabled;
}

@implementation RCTBridge
- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(__strong RCTBridgeModuleListProvider)block
                    launchOptions:(NSDictionary *)launchOptions
{
  return self;
}

- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
}

- (void)enqueueJSCall:(NSString *)module
               method:(NSString *)method
                 args:(NSArray *)args
           completion:(__strong dispatch_block_t)completion
{
}

- (void)registerSegmentWithId:(NSUInteger)segmentId path:(NSString *)path
{
}

- (id)moduleForName:(NSString *)moduleName
{
  return nil;
}

- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  return nil;
}

- (id)moduleForClass:(Class)moduleClass
{
  return nil;
}

- (void)setRCTTurboModuleRegistry:(id<RCTTurboModuleRegistry>)turboModuleRegistry
{
}

- (RCTBridgeModuleDecorator *)bridgeModuleDecorator
{
  return nil;
}

- (NSArray *)modulesConformingToProtocol:(Protocol *)protocol
{
  return @[];
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  return NO;
}

- (void)reload __attribute__((deprecated("Use RCTReloadCommand instead")))
{
}

- (void)reloadWithReason:(NSString *)reason __attribute__((deprecated("Use RCTReloadCommand instead")))
{
}

- (void)onFastRefresh
{
}

- (void)requestReload __attribute__((deprecated("Use RCTReloadCommand instead")))
{
}

- (BOOL)isBatchActive
{
  return NO;
}

- (void)setUp
{
}

- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args
{
}

+ (void)setCurrentBridge:(RCTBridge *)bridge
{
}

- (void)invalidate
{
}

+ (instancetype)currentBridge
{
  return nil;
}

@end
