/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLinkingManager.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "RCTLinkingPlugins.h"

static NSString *const kOpenURLNotification = @"RCTOpenURLNotification";

static void postNotificationWithURL(NSURL *URL, id sender, NSDictionary *additionalInfo)
{
  NSMutableDictionary<NSString *, id> *payload = [@{@"url": URL.absoluteString} mutableCopy];
  if (additionalInfo) {
    [payload addEntriesFromDictionary:additionalInfo];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:kOpenURLNotification
                                                      object:sender
                                                    userInfo:payload];
}

@interface RCTLinkingManager () <NativeLinkingManagerSpec>
@end

@implementation RCTLinkingManager

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleOpenURLNotification:)
                                               name:kOpenURLNotification
                                             object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"url" ];
}

+ (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)URL
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  postNotificationWithURL(URL, self, options);
  return YES;
}

// Corresponding api deprecated in iOS 9
+ (BOOL)application:(UIApplication *)application
              openURL:(NSURL *)URL
    sourceApplication:(NSString *)sourceApplication
           annotation:(id)annotation
{
  NSDictionary *options = @{
    @"sourceApplication": RCTNullIfNil(sourceApplication),
    @"annotation": RCTNullIfNil(annotation)
  };
  postNotificationWithURL(URL, self, options);
  return YES;
}

+ (BOOL)application:(UIApplication *)application
    continueUserActivity:(NSUserActivity *)userActivity
      restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> *_Nullable))restorationHandler
{
  // This can be nullish when launching an App Clip.
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb] && userActivity.webpageURL != nil) {
    NSDictionary *options = @{
      @"activityType": userActivity.activityType,
      @"title": RCTNullIfNil(userActivity.title),
      @"referrerURL": RCTNullIfNil(userActivity.referrerURL.absoluteString),
      @"webpageURL": RCTNullIfNil(userActivity.webpageURL.absoluteString)
    };
    postNotificationWithURL(userActivity.webpageURL, self, options);
  }
  return YES;
}

- (void)handleOpenURLNotification:(NSNotification *)notification
{
  [self sendEventWithName:@"url" body:notification.userInfo];
}

- (void)openURL:(NSString *)urlString resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  NSURL *URL = [RCTConvert NSURL:urlString];
  [RCTSharedApplication() openURL:URL
                          options:@{}
                completionHandler:^(BOOL success) {
                  if (success) {
                    resolve(@YES);
                  } else {
#if TARGET_OS_SIMULATOR
                    // Simulator-specific code
                    if ([URL.absoluteString hasPrefix:@"tel:"]) {
                      RCTLogWarn(@"Unable to open the Phone app in the simulator for telephone URLs. URL:  %@", URL);
                      resolve(@NO);
                    } else {
                      reject(RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
                    }
#else
          // Device-specific code
          reject(RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
#endif
                  }
                }];
}

- (void)canOpenURL:(NSString *)urlString
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(__unused RCTPromiseRejectBlock)reject
{
  NSURL *URL = [RCTConvert NSURL:urlString];
  if (RCTRunningInAppExtension()) {
    // Technically Today widgets can open urls, but supporting that would require
    // a reference to the NSExtensionContext
    resolve(@NO);
    return;
  }

  // This can be expensive, so we deliberately don't call on main thread
  BOOL canOpen = [RCTSharedApplication() canOpenURL:URL];
  NSString *scheme = [URL scheme];
  if (canOpen) {
    resolve(@YES);
  } else if (![[scheme lowercaseString] hasPrefix:@"http"] && ![[scheme lowercaseString] hasPrefix:@"https"]) {
    // On iOS 9 and above canOpenURL returns NO without a helpful error.
    // Check if a custom scheme is being used, and if it exists in LSApplicationQueriesSchemes
    NSArray *querySchemes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"LSApplicationQueriesSchemes"];
    if (querySchemes != nil &&
        ([querySchemes containsObject:scheme] || [querySchemes containsObject:[scheme lowercaseString]])) {
      resolve(@NO);
    } else {
      reject(
          RCTErrorUnspecified,
          [NSString
              stringWithFormat:@"Unable to open URL: %@. Add %@ to LSApplicationQueriesSchemes in your Info.plist.",
                               URL,
                               scheme],
          nil);
    }
  } else {
    resolve(@NO);
  }
}

- (void)getInitialURL:(RCTPromiseResolveBlock)resolve reject:(__unused RCTPromiseRejectBlock)reject
{
  NSURL *initialURL = nil;
  if (self.bridge.launchOptions[UIApplicationLaunchOptionsURLKey] != nullptr) {
    initialURL = self.bridge.launchOptions[UIApplicationLaunchOptionsURLKey];
  } else {
    NSDictionary *userActivityDictionary =
        self.bridge.launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];
    if ([userActivityDictionary[UIApplicationLaunchOptionsUserActivityTypeKey] isEqual:NSUserActivityTypeBrowsingWeb]) {
      initialURL = ((NSUserActivity *)userActivityDictionary[@"UIApplicationLaunchOptionsUserActivityKey"]).webpageURL;
    }
  }
  resolve(RCTNullIfNil(initialURL.absoluteString));
}

- (void)openSettings:(RCTPromiseResolveBlock)resolve reject:(__unused RCTPromiseRejectBlock)reject
{
  NSURL *url = [NSURL URLWithString:UIApplicationOpenSettingsURLString];
  [RCTSharedApplication() openURL:url
                          options:@{}
                completionHandler:^(BOOL success) {
                  if (success) {
                    resolve(nil);
                  } else {
                    reject(RCTErrorUnspecified, @"Unable to open app settings", nil);
                  }
                }];
}

RCT_EXPORT_METHOD(
    sendIntent : (NSString *)action extras : (NSArray *_Nullable)extras resolve : (RCTPromiseResolveBlock)
        resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeLinkingManagerSpecJSI>(params);
}

@end

Class RCTLinkingManagerCls(void)
{
  return RCTLinkingManager.class;
}
