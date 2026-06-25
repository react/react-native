/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDevSettings.h"

#import <objc/runtime.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge+Inspector.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTConstants.h>
#import <React/RCTDevMenu.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTLog.h>
#import <React/RCTProfile.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>
#import <atomic>

#import "CoreModulesPlugins.h"

static NSString *const kRCTDevSettingProfilingEnabled = @"profilingEnabled";
static NSString *const kRCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";
static NSString *const kRCTDevSettingIsInspectorShown = @"showInspector";
static NSString *const kRCTDevSettingShakeToShowDevMenu = @"shakeToShow";
static NSString *const kRCTDevSettingIsPerfMonitorShown = @"RCTPerfMonitorKey";

static NSString *const kRCTDevSettingsUserDefaultsKey = @"RCTDevMenu";

#if RCT_DEV
#import <React/RCTPackagerConnection.h>
#endif

#ifndef RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
#if RCT_DEV && (__has_include("RCTPackagerConnection.h") || __has_include(<React/RCTPackagerConnection.h>))
#define RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION 1
#else
#define RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION 0
#endif
#endif

#if RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
#import <React/RCTPackagerClient.h>
#endif

#if RCT_ENABLE_INSPECTOR
#import <React/RCTInspectorDevServerHelper.h>
#endif

#if RCT_DEV
static BOOL devSettingsMenuEnabled = YES;
#else
static BOOL devSettingsMenuEnabled = NO;
#endif

void RCTDevSettingsSetEnabled(BOOL enabled)
{
  devSettingsMenuEnabled = enabled;
}

#if RCT_DEV_MENU || RCT_REMOTE_PROFILE

@interface RCTDevSettingsUserDefaultsDataSource : NSObject <RCTDevSettingsDataSource>

@end

@implementation RCTDevSettingsUserDefaultsDataSource {
  NSMutableDictionary *_settings;
  NSUserDefaults *_userDefaults;
}

- (instancetype)init
{
  return [self initWithDefaultValues:nil];
}

- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues
{
  if (self = [super init]) {
    _userDefaults = [NSUserDefaults standardUserDefaults];
    if (defaultValues) {
      [self _reloadWithDefaults:defaultValues];
    }
  }
  return self;
}

- (void)updateSettingWithValue:(id)value forKey:(NSString *)key
{
  RCTAssert((key != nil), @"%@", [NSString stringWithFormat:@"%@: Tried to update nil key", [self class]]);

  id currentValue = [self settingForKey:key];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[key] = value;
  } else {
    [_settings removeObjectForKey:key];
  }
  [_userDefaults setObject:_settings forKey:kRCTDevSettingsUserDefaultsKey];
}

- (id)settingForKey:(NSString *)key
{
  return _settings[key];
}

- (void)_reloadWithDefaults:(NSDictionary *)defaultValues
{
  NSDictionary *existingSettings = [_userDefaults objectForKey:kRCTDevSettingsUserDefaultsKey];
  _settings = existingSettings ? [existingSettings mutableCopy] : [NSMutableDictionary dictionary];
  for (NSString *key in [defaultValues keyEnumerator]) {
    if (!_settings[key]) {
      _settings[key] = defaultValues[key];
    }
  }
  [_userDefaults setObject:_settings forKey:kRCTDevSettingsUserDefaultsKey];
}

@end

#if RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
static RCTHandlerToken reloadToken;
static RCTHandlerToken devMenuToken;
static std::atomic<int> numInitializedModules{0};
#endif

@interface RCTDevSettings () <RCTBridgeModule, RCTInvalidating, NativeDevSettingsSpec, RCTDevSettingsInspectable> {
  BOOL _isJSLoaded;
}

@property (nonatomic, strong) Class executorClass;
@property (nonatomic, readwrite, strong) id<RCTDevSettingsDataSource> dataSource;

@end

@implementation RCTDevSettings

@synthesize isInspectable = _isInspectable;
@synthesize bundleManager = _bundleManager;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  // Default behavior is to use NSUserDefaults with shake and hot loading enabled.
  NSDictionary *defaultValues = @{
    kRCTDevSettingShakeToShowDevMenu : @YES,
    kRCTDevSettingHotLoadingEnabled : @YES,
  };
  RCTDevSettingsUserDefaultsDataSource *dataSource =
      [[RCTDevSettingsUserDefaultsDataSource alloc] initWithDefaultValues:defaultValues];
#if RCT_DEV
  _packagerConnection = [RCTPackagerConnection new];
#endif
  _isShakeGestureEnabled = true;
  return [self initWithDataSource:dataSource];
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (BOOL)_isBridgeMode
{
  return [self.bridge isKindOfClass:[RCTBridge class]];
}

- (instancetype)initWithDataSource:(id<RCTDevSettingsDataSource>)dataSource
{
  if (self = [super init]) {
    _dataSource = dataSource;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(jsLoaded:)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(jsLoaded:)
                                                 name:@"RCTInstanceDidLoadBundle"
                                               object:nil];
  }
  return self;
}

- (void)initialize
{
#if RCT_DEV
  [_packagerConnection startWithBundleManager:_bundleManager];
#endif

#if RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
  if (numInitializedModules++ == 0) {
    reloadToken = [self
        addNotificationHandler:^(id params) {
          RCTTriggerReloadCommandListeners(@"Global hotkey");
        }
                         queue:dispatch_get_main_queue()
                     forMethod:@"reload"];
#if RCT_DEV_MENU
    __weak __typeof(self) weakSelf = self;
    devMenuToken = [self
        addNotificationHandler:^(id params) {
          __typeof(self) strongSelf = weakSelf;
          if (strongSelf == nullptr) {
            return;
          }
          [[strongSelf.moduleRegistry moduleForName:"DevMenu"] show];
        }
                         queue:dispatch_get_main_queue()
                     forMethod:@"devMenu"];
#endif
  }
#endif

#if RCT_ENABLE_INSPECTOR
  if ([self _isBridgeMode]) {
    // We need this dispatch to the main thread because the bridge is not yet
    // finished with its initialisation. By the time it relinquishes control of
    // the main thread, this operation can be performed.
    __weak __typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      id dispatchBlock = ^{
        __typeof(self) strongSelf2 = weakSelf;
        if (!strongSelf2) {
          return;
        }
        NSURL *url = strongSelf2.bundleManager.bundleURL;
        [RCTInspectorDevServerHelper connectWithBundleURL:url];
      };
      [strongSelf.bridge dispatchBlock:dispatchBlock queue:RCTJSThread];
    });
  } else {
    NSURL *url = self.bundleManager.bundleURL;
    [RCTInspectorDevServerHelper connectWithBundleURL:url];
  }
#endif

  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf _synchronizeAllSettings];
  });
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  [super invalidate];
#if RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
  if (--numInitializedModules == 0) {
    [_packagerConnection removeHandler:reloadToken];
#if RCT_DEV_MENU
    [_packagerConnection removeHandler:devMenuToken];
#endif
  }
#endif
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"didPressMenuItem" ];
}

- (void)_updateSettingWithValue:(id)value forKey:(NSString *)key
{
  [_dataSource updateSettingWithValue:value forKey:key];
}

- (id)settingForKey:(NSString *)key
{
  return [_dataSource settingForKey:key];
}

- (void)setIsShakeGestureEnabled:(BOOL)isShakeGestureEnabled
{
  _isShakeGestureEnabled = isShakeGestureEnabled;
  [self setIsShakeToShowDevMenuEnabled:isShakeGestureEnabled];
}

- (BOOL)isDeviceDebuggingAvailable
{
#if RCT_ENABLE_INSPECTOR
  if ([self _isBridgeMode]) {
    return self.bridge.isInspectable;
  } else {
    return self.isInspectable;
  }
#else
  return false;
#endif // RCT_ENABLE_INSPECTOR
}

- (BOOL)isHotLoadingAvailable
{
  if (self.bundleManager.bundleURL) {
    return !self.bundleManager.bundleURL.fileURL;
  }
  return NO;
}

RCT_EXPORT_METHOD(reload)
{
  RCTTriggerReloadCommandListeners(@"Unknown From JS");
}

RCT_EXPORT_METHOD(reloadWithReason : (NSString *)reason)
{
  RCTTriggerReloadCommandListeners(reason);
}

RCT_EXPORT_METHOD(onFastRefresh)
{
  [self.bridge onFastRefresh];
}

RCT_EXPORT_METHOD(setIsShakeToShowDevMenuEnabled : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kRCTDevSettingShakeToShowDevMenu];
}

- (BOOL)isShakeToShowDevMenuEnabled
{
  return _isShakeGestureEnabled && [[self settingForKey:kRCTDevSettingShakeToShowDevMenu] boolValue];
}

RCT_EXPORT_METHOD(setProfilingEnabled : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kRCTDevSettingProfilingEnabled];
  [self _profilingSettingDidChange];
}

- (BOOL)isProfilingEnabled
{
  return [[self settingForKey:kRCTDevSettingProfilingEnabled] boolValue];
}

- (void)_profilingSettingDidChange
{
  BOOL enabled = self.isProfilingEnabled;
  if (self.isHotLoadingAvailable && enabled != RCTProfileIsProfiling()) {
    if (enabled) {
      [self.bridge startProfiling];
    } else {
      __weak __typeof(self) weakSelf = self;
      [self.bridge stopProfiling:^(NSData *logData) {
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf) {
          return;
        }
        RCTProfileSendResult(strongSelf.bridge, @"systrace", logData);
      }];
    }
  }
}

RCT_EXPORT_METHOD(setHotLoadingEnabled : (BOOL)enabled)
{
  if (self.isHotLoadingEnabled != enabled) {
    [self _updateSettingWithValue:@(enabled) forKey:kRCTDevSettingHotLoadingEnabled];
    if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      if (enabled) {
        [self.callableJSModules invokeModule:@"HMRClient" method:@"enable" withArgs:@[]];
      } else {
        [self.callableJSModules invokeModule:@"HMRClient" method:@"disable" withArgs:@[]];
      }
#pragma clang diagnostic pop
    }
  }
}

- (BOOL)isHotLoadingEnabled
{
  return [[self settingForKey:kRCTDevSettingHotLoadingEnabled] boolValue];
}

RCT_EXPORT_METHOD(toggleElementInspector)
{
  BOOL value = [[self settingForKey:kRCTDevSettingIsInspectorShown] boolValue];
  [self _updateSettingWithValue:@(!value) forKey:kRCTDevSettingIsInspectorShown];

  if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[self.moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
  }
}

RCT_EXPORT_METHOD(addMenuItem : (NSString *)title)
{
  __weak __typeof(self) weakSelf = self;
  [(RCTDevMenu *)[self.moduleRegistry moduleForName:"DevMenu"]
      addItem:[RCTDevMenuItem buttonItemWithTitle:title
                                          handler:^{
                                            [weakSelf sendEventWithName:@"didPressMenuItem" body:@{@"title" : title}];
                                          }]];
}

- (BOOL)isElementInspectorShown
{
  return [[self settingForKey:kRCTDevSettingIsInspectorShown] boolValue];
}

- (void)setIsPerfMonitorShown:(BOOL)isPerfMonitorShown
{
  [self _updateSettingWithValue:@(isPerfMonitorShown) forKey:kRCTDevSettingIsPerfMonitorShown];
}

- (BOOL)isPerfMonitorShown
{
  return [[self settingForKey:kRCTDevSettingIsPerfMonitorShown] boolValue];
}

- (void)setExecutorClass:(Class)executorClass
{
  _executorClass = executorClass;
  if (self.bridge.executorClass != executorClass) {
    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil) {
      return;
    }

    self.bridge.executorClass = executorClass;
    RCTTriggerReloadCommandListeners(@"Custom executor class reset");
  }
}

#if RCT_DEV
- (RCTHandlerToken)addNotificationHandler:(RCTNotificationHandler)handler
                                    queue:(dispatch_queue_t)queue
                                forMethod:(NSString *)method
{
  return [_packagerConnection addNotificationHandler:handler queue:queue forMethod:method];
}

- (RCTHandlerToken)addRequestHandler:(RCTRequestHandler)handler
                               queue:(dispatch_queue_t)queue
                           forMethod:(NSString *)method
{
  return [_packagerConnection addRequestHandler:handler queue:queue forMethod:method];
}

#endif

- (void)addHandler:(id<RCTPackagerClientMethod>)handler forPackagerMethod:(NSString *)name
{
#if RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
  [_packagerConnection addHandler:handler forMethod:name];
#endif
}

- (void)setupHMRClientWithBundleURL:(NSURL *)bundleURL
{
  if (bundleURL && !bundleURL.fileURL) {
    NSURLComponents *urlComponents = [[NSURLComponents alloc] initWithURL:bundleURL resolvingAgainstBaseURL:NO];
    NSString *const path = [urlComponents.path substringFromIndex:1]; // Strip initial slash.
    NSString *const host = urlComponents.host;
    NSNumber *const port = urlComponents.port;
    NSString *const scheme = urlComponents.scheme;
    BOOL isHotLoadingEnabled = self.isHotLoadingEnabled;
    [self.callableJSModules
        invokeModule:@"HMRClient"
              method:@"setup"
            withArgs:@[ RCTPlatformName, path, host, RCTNullIfNil(port), @(isHotLoadingEnabled), scheme ]];
  }
}

- (void)setupHMRClientWithAdditionalBundleURL:(NSURL *)bundleURL
{
  if (bundleURL && !bundleURL.fileURL) { // isHotLoadingAvailable check
    [self.callableJSModules invokeModule:@"HMRClient"
                                  method:@"registerBundle"
                                withArgs:@[ [bundleURL absoluteString] ]];
  }
}

RCT_EXPORT_METHOD(openDebugger)
{
#if RCT_ENABLE_INSPECTOR
  [RCTInspectorDevServerHelper
          openDebugger:self.bundleManager.bundleURL
      withErrorMessage:@"Failed to open debugger. Please check that the dev server is running and reload the app."];
#endif
}

#pragma mark - Internal

/**
 *  Query the data source for all possible settings and make sure we're doing the right
 *  thing for the state of each setting.
 */
- (void)_synchronizeAllSettings
{
  [self _profilingSettingDidChange];
}

- (void)jsLoaded:(NSNotification *)notification
{
  // In bridge mode, the bridge that sent the notif must be the same as the one stored in this module.
  // In bridgless mode, we don't care about this.
  if ([notification.name isEqualToString:RCTJavaScriptDidLoadNotification] &&
      notification.userInfo[@"bridge"] != self.bridge) {
    return;
  }

  _isJSLoaded = YES;
  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    // update state again after the bridge has finished loading
    [strongSelf _synchronizeAllSettings];

    // Inspector can only be shown after JS has loaded
    if ([strongSelf isElementInspectorShown]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [[strongSelf.moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"toggleElementInspector"
                                                                                      body:nil];
#pragma clang diagnostic pop
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeDevSettingsSpecJSI>(params);
}

@end

#else // #if RCT_DEV_MENU || RCT_REMOTE_PROFILE

@interface RCTDevSettings () <NativeDevSettingsSpec>
@end

@implementation RCTDevSettings

- (instancetype)initWithDataSource:(id<RCTDevSettingsDataSource>)dataSource
{
  return [super init];
}
- (void)initialize
{
}
- (BOOL)isHotLoadingAvailable
{
  return NO;
}
+ (BOOL)requiresMainQueueSetup
{
  return NO;
}
- (id)settingForKey:(NSString *)key
{
  return nil;
}
- (void)reload
{
}
- (void)reloadWithReason:(NSString *)reason
{
}
- (void)onFastRefresh
{
}
- (void)setHotLoadingEnabled:(BOOL)isHotLoadingEnabled
{
}
- (void)setProfilingEnabled:(BOOL)isProfilingEnabled
{
}
- (void)toggleElementInspector
{
}
- (void)setupHMRClientWithBundleURL:(NSURL *)bundleURL
{
}
- (void)setupHMRClientWithAdditionalBundleURL:(NSURL *)bundleURL
{
}
- (void)openDebugger
{
}
- (void)addMenuItem:(NSString *)title
{
}
- (void)setIsShakeToShowDevMenuEnabled:(BOOL)enabled
{
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeDevSettingsSpecJSI>(params);
}

- (void)addHandler:(id<RCTPackagerClientMethod>)handler forPackagerMethod:(NSString *)name
{
}

@end

#endif // #if RCT_DEV_MENU

@implementation RCTBridge (RCTDevSettings)

- (RCTDevSettings *)devSettings
{
#if RCT_REMOTE_PROFILE
  return [self moduleForClass:[RCTDevSettings class]];
#elif RCT_DEV_MENU
  return devSettingsMenuEnabled ? [self moduleForClass:[RCTDevSettings class]] : nil;
#else
  return nil;
#endif
}

@end

@implementation RCTBridgeProxy (RCTDevSettings)

- (RCTDevSettings *)devSettings
{
#if RCT_REMOTE_PROFILE
  return [self moduleForClass:[RCTDevSettings class]];
#elif RCT_DEV_MENU
  return devSettingsMenuEnabled ? [self moduleForClass:[RCTDevSettings class]] : nil;
#else
  return nil;
#endif
}

@end

Class RCTDevSettingsCls(void)
{
  return RCTDevSettings.class;
}
