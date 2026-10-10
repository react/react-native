/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSettingsManager.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTInvalidating.h>
#import <React/RCTUtils.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <atomic>

#import "RCTSettingsPlugins.h"

@interface RCTSettingsManager () <NativeSettingsManagerSpec, RCTInvalidating>
@end

@implementation RCTSettingsManager {
  std::atomic<bool> _ignoringUpdates;
  std::atomic<bool> _updateScheduled;
  std::atomic<bool> _invalidated;
  bool _useAsyncUpdates;
  NSUserDefaults *_defaults;
  dispatch_queue_t _methodQueue;
}

@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  return [self initWithUserDefaults:[NSUserDefaults standardUserDefaults]];
}

- (instancetype)initWithUserDefaults:(NSUserDefaults *)defaults
{
  if ((self = [super init]) != nullptr) {
    _ignoringUpdates = false;
    _updateScheduled = false;
    _invalidated = false;
    _defaults = defaults;
    _useAsyncUpdates = facebook::react::ReactNativeFeatureFlags::enableAsyncSettingsManagerUpdatesIOS();
    if (_useAsyncUpdates) {
      _methodQueue = dispatch_queue_create("com.facebook.react.SettingsManager", DISPATCH_QUEUE_SERIAL);
    }

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(userDefaultsDidChange:)
                                                 name:NSUserDefaultsDidChangeNotification
                                               object:_defaults];
  }
  return self;
}

- (facebook::react::ModuleConstants<JS::NativeSettingsManager::Constants>)constantsToExport
{
  return [self getConstants];
}

- (facebook::react::ModuleConstants<JS::NativeSettingsManager::Constants>)getConstants
{
  return facebook::react::typedConstants<JS::NativeSettingsManager::Constants>(
      {.settings = RCTJSONClean([_defaults dictionaryRepresentation])});
}

- (dispatch_queue_t)methodQueue
{
  return _methodQueue;
}

- (BOOL)respondsToSelector:(SEL)selector
{
  if (selector == @selector(invalidate) && !_useAsyncUpdates) {
    return NO;
  }
  return [super respondsToSelector:selector];
}

- (void)invalidate
{
  if (!_useAsyncUpdates) {
    return;
  }
  _invalidated = true;
  [[NSNotificationCenter defaultCenter] removeObserver:self name:NSUserDefaultsDidChangeNotification object:_defaults];
}

- (void)userDefaultsDidChange:(NSNotification *)note
{
  if (_ignoringUpdates) {
    return;
  }

  if (!_useAsyncUpdates) {
    NSDictionary *settings = RCTJSONClean([_defaults dictionaryRepresentation]);
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"settingsUpdated" body:settings];
#pragma clang diagnostic pop
    return;
  }

  if (_invalidated || _updateScheduled.exchange(true)) {
    return;
  }

  __weak RCTSettingsManager *weakSelf = self;
  dispatch_async(_methodQueue, ^{
    RCTSettingsManager *strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }

    // Clear before reading so a notification during the snapshot schedules a trailing update.
    strongSelf->_updateScheduled = false;
    if (strongSelf->_invalidated) {
      return;
    }

    NSDictionary *settings = RCTJSONClean([strongSelf->_defaults dictionaryRepresentation]);
    if (strongSelf->_invalidated) {
      return;
    }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[strongSelf->_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"settingsUpdated"
                                                                                      body:settings];
#pragma clang diagnostic pop
  });
}

/**
 * Set one or more values in the settings.
 * TODO: would it be useful to have a callback for when this has completed?
 */
- (void)setValues:(NSDictionary *)values
{
  _ignoringUpdates = YES;
  [values enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, BOOL *stop) {
    id plist = [RCTConvert NSPropertyList:json];
    if (plist != nullptr) {
      [self->_defaults setObject:plist forKey:key];
    } else {
      [self->_defaults removeObjectForKey:key];
    }
  }];

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

/**
 * Remove some values from the settings.
 */
- (void)deleteValues:(NSArray *)keysRaw
{
  NSArray<NSString *> *keys = [RCTConvert NSStringArray:keysRaw];
  _ignoringUpdates = YES;
  for (NSString *key in keys) {
    [_defaults removeObjectForKey:key];
  }

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSettingsManagerSpecJSI>(params);
}

@end

Class RCTSettingsManagerCls(void)
{
  return RCTSettingsManager.class;
}
