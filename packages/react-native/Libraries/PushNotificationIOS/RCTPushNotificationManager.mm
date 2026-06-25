/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTPushNotificationManager.h>

#import <UserNotifications/UserNotifications.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>

#import "RCTPushNotificationPlugins.h"

NSString *const RCTRemoteNotificationReceived = @"RemoteNotificationReceived";

static NSString *const kLocalNotificationReceived = @"LocalNotificationReceived";
static NSString *const kRemoteNotificationsRegistered = @"RemoteNotificationsRegistered";
static NSString *const kRemoteNotificationRegistrationFailed = @"RemoteNotificationRegistrationFailed";

static NSString *const kErrorUnableToRequestPermissions = @"E_UNABLE_TO_REQUEST_PERMISSIONS";
static UNNotification *kInitialNotification = nil;

@interface RCTPushNotificationManager () <NativePushNotificationManagerIOSSpec>
@property (nonatomic, strong) NSMutableDictionary *remoteNotificationCallbacks;
@end

@implementation RCTConvert (UNNotificationContent)

+ (UNNotificationContent *)UNNotificationContent:(id)json
{
  NSDictionary<NSString *, id> *details = [self NSDictionary:json];
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
#if !TARGET_OS_TV
  BOOL isSilent = [RCTConvert BOOL:details[@"isSilent"]];
  content.title = [RCTConvert NSString:details[@"alertTitle"]];
  content.body = [RCTConvert NSString:details[@"alertBody"]];
  content.userInfo = [RCTConvert NSDictionary:details[@"userInfo"]];
  content.categoryIdentifier = [RCTConvert NSString:details[@"category"]];
  if (!isSilent) {
    NSString *soundName = [RCTConvert NSString:details[@"soundName"]];
    content.sound =
        soundName ? [UNNotificationSound soundNamed:details[@"soundName"]] : [UNNotificationSound defaultSound];
  }
#endif
  if (details[@"applicationIconBadgeNumber"]) {
    content.badge = [RCTConvert NSNumber:details[@"applicationIconBadgeNumber"]];
  }

  return content;
}

+ (NSDictionary<NSString *, id> *)NSDictionaryForNotification:
    (JS::NativePushNotificationManagerIOS::Notification &)notification
{
  // Note: alertAction is not set, as it is no longer relevant with UNNotification
  NSMutableDictionary *notificationDict = [NSMutableDictionary new];
  notificationDict[@"alertTitle"] = notification.alertTitle();
  notificationDict[@"alertBody"] = notification.alertBody();
  notificationDict[@"userInfo"] = notification.userInfo();
  notificationDict[@"category"] = notification.category();
  if (notification.fireIntervalSeconds()) {
    notificationDict[@"fireIntervalSeconds"] = @(*notification.fireIntervalSeconds());
  }
  if (notification.fireDate()) {
    notificationDict[@"fireDate"] = @(*notification.fireDate());
  }
  if (notification.applicationIconBadgeNumber()) {
    notificationDict[@"applicationIconBadgeNumber"] = @(*notification.applicationIconBadgeNumber());
  }
  if (notification.isSilent()) {
    notificationDict[@"isSilent"] = @(*notification.isSilent());
    if ([notificationDict[@"isSilent"] isEqualToNumber:@(NO)]) {
      notificationDict[@"soundName"] = notification.soundName();
    }
  }
  return notificationDict;
}

@end

@implementation RCTConvert (UIBackgroundFetchResult)

RCT_ENUM_CONVERTER(
    UIBackgroundFetchResult,
    (@{
      @"UIBackgroundFetchResultNewData" : @(UIBackgroundFetchResultNewData),
      @"UIBackgroundFetchResultNoData" : @(UIBackgroundFetchResultNoData),
      @"UIBackgroundFetchResultFailed" : @(UIBackgroundFetchResultFailed),
    }),
    UIBackgroundFetchResultNoData,
    integerValue)

@end

@implementation RCTPushNotificationManager

/** For delivered notifications */
static NSDictionary<NSString *, id> *RCTFormatUNNotification(UNNotification *notification)
{
  NSMutableDictionary *formattedLocalNotification = [NSMutableDictionary dictionary];
  if (notification.date) {
    formattedLocalNotification[@"fireDate"] = RCTFormatNotificationDateFromNSDate(notification.date);
  }
  [formattedLocalNotification addEntriesFromDictionary:RCTFormatUNNotificationContent(notification.request.content)];
  return formattedLocalNotification;
}

/** For scheduled notification requests */
static NSDictionary<NSString *, id> *RCTFormatUNNotificationRequest(UNNotificationRequest *request)
{
  NSMutableDictionary *formattedLocalNotification = [NSMutableDictionary dictionary];
  if (request.trigger) {
    NSDate *triggerDate = nil;
    if ([request.trigger isKindOfClass:[UNTimeIntervalNotificationTrigger class]]) {
      triggerDate = [(UNTimeIntervalNotificationTrigger *)request.trigger nextTriggerDate];
    } else if ([request.trigger isKindOfClass:[UNCalendarNotificationTrigger class]]) {
      triggerDate = [(UNCalendarNotificationTrigger *)request.trigger nextTriggerDate];
    }

    if (triggerDate) {
      formattedLocalNotification[@"fireDate"] = RCTFormatNotificationDateFromNSDate(triggerDate);
    }
  }
  [formattedLocalNotification addEntriesFromDictionary:RCTFormatUNNotificationContent(request.content)];
  return formattedLocalNotification;
}

static NSDictionary<NSString *, id> *RCTFormatUNNotificationContent(UNNotificationContent *content)
{
  // Note: soundName is not set because this can't be read from UNNotificationSound.
  // Note: alertAction is no longer relevant with UNNotification
  NSMutableDictionary *formattedLocalNotification = [NSMutableDictionary dictionary];
#if !TARGET_OS_TV
  formattedLocalNotification[@"alertTitle"] = RCTNullIfNil(content.title);
  formattedLocalNotification[@"alertBody"] = RCTNullIfNil(content.body);
  formattedLocalNotification[@"userInfo"] = RCTNullIfNil(RCTJSONClean(content.userInfo));
  formattedLocalNotification[@"category"] = content.categoryIdentifier;
#endif
  formattedLocalNotification[@"applicationIconBadgeNumber"] = content.badge;
  formattedLocalNotification[@"remote"] = @NO;
  return formattedLocalNotification;
}

static NSString *RCTFormatNotificationDateFromNSDate(NSDate *date)
{
  NSDateFormatter *formatter = [NSDateFormatter new];
  [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
  return [formatter stringFromDate:date];
}

static BOOL IsNotificationRemote(UNNotification *notification)
{
  return [notification.request.trigger isKindOfClass:[UNPushNotificationTrigger class]];
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleLocalNotificationReceived:)
                                               name:kLocalNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationReceived:)
                                               name:RCTRemoteNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationsRegistered:)
                                               name:kRemoteNotificationsRegistered
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationRegistrationError:)
                                               name:kRemoteNotificationRegistrationFailed
                                             object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"localNotificationReceived",
    @"remoteNotificationReceived",
    @"remoteNotificationsRegistered",
    @"remoteNotificationRegistrationError"
  ];
}

+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSMutableString *hexString = [NSMutableString string];
  NSUInteger deviceTokenLength = deviceToken.length;
  const unsigned char *bytes = reinterpret_cast<const unsigned char *>(deviceToken.bytes);
  for (NSUInteger i = 0; i < deviceTokenLength; i++) {
    [hexString appendFormat:@"%02x", bytes[i]];
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:kRemoteNotificationsRegistered
                                                      object:self
                                                    userInfo:@{@"deviceToken" : [hexString copy]}];
}

+ (void)didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [[NSNotificationCenter defaultCenter] postNotificationName:kRemoteNotificationRegistrationFailed
                                                      object:self
                                                    userInfo:@{@"error" : error}];
}

+ (void)didReceiveNotification:(UNNotification *)notification
{
  BOOL const isRemoteNotification = IsNotificationRemote(notification);
  if (isRemoteNotification) {
#if !TARGET_OS_TV
    NSDictionary *userInfo = @{@"notification" : notification.request.content.userInfo};
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                        object:self
                                                      userInfo:userInfo];
#endif
  } else {
    [[NSNotificationCenter defaultCenter] postNotificationName:kLocalNotificationReceived
                                                        object:self
                                                      userInfo:RCTFormatUNNotification(notification)];
  }
}

+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
              fetchCompletionHandler:(RCTRemoteNotificationCallback)completionHandler
{
  NSDictionary *userInfo = completionHandler
      ? @{@"notification" : notification, @"completionHandler" : completionHandler}
      : @{@"notification" : notification};
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:userInfo];
}

+ (void)setInitialNotification:(UNNotification *)notification
{
  kInitialNotification = notification;
}

- (void)invalidate
{
  [super invalidate];

  kInitialNotification = nil;
}

- (void)dealloc
{
  kInitialNotification = nil;
}

- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  [self sendEventWithName:@"localNotificationReceived" body:notification.userInfo];
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  NSMutableDictionary *remoteNotification =
      [NSMutableDictionary dictionaryWithDictionary:notification.userInfo[@"notification"]];
  RCTRemoteNotificationCallback completionHandler = notification.userInfo[@"completionHandler"];
  NSString *notificationId = [[NSUUID UUID] UUIDString];
  remoteNotification[@"notificationId"] = notificationId;
  remoteNotification[@"remote"] = @YES;
  if (completionHandler) {
    if (!self.remoteNotificationCallbacks) {
      // Lazy initialization
      self.remoteNotificationCallbacks = [NSMutableDictionary dictionary];
    }
    self.remoteNotificationCallbacks[notificationId] = completionHandler;
  }

  [self sendEventWithName:@"remoteNotificationReceived" body:remoteNotification];
}

- (void)handleRemoteNotificationsRegistered:(NSNotification *)notification
{
  [self sendEventWithName:@"remoteNotificationsRegistered" body:notification.userInfo];
}

- (void)handleRemoteNotificationRegistrationError:(NSNotification *)notification
{
  NSError *error = notification.userInfo[@"error"];
  NSDictionary *errorDetails = @{
    @"message" : error.localizedDescription,
    @"code" : @(error.code),
    @"details" : error.userInfo,
  };
  [self sendEventWithName:@"remoteNotificationRegistrationError" body:errorDetails];
}

RCT_EXPORT_METHOD(onFinishRemoteNotification : (NSString *)notificationId fetchResult : (NSString *)fetchResult)
{
  UIBackgroundFetchResult result = [RCTConvert UIBackgroundFetchResult:fetchResult];
  RCTRemoteNotificationCallback completionHandler = self.remoteNotificationCallbacks[notificationId];
  if (!completionHandler) {
    RCTLogError(@"There is no completion handler with notification id: %@", notificationId);
    return;
  }
  completionHandler(result);
  [self.remoteNotificationCallbacks removeObjectForKey:notificationId];
}

/**
 * Update the application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(setApplicationIconBadgeNumber : (double)number)
{
  RCTSharedApplication().applicationIconBadgeNumber = number;
}

/**
 * Get the current application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(getApplicationIconBadgeNumber : (RCTResponseSenderBlock)callback)
{
  callback(@[ @(RCTSharedApplication().applicationIconBadgeNumber) ]);
}

RCT_EXPORT_METHOD(
    requestPermissions : (JS::NativePushNotificationManagerIOS::SpecRequestPermissionsPermission &)
        permissions resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  if (RCTRunningInAppExtension()) {
    reject(
        kErrorUnableToRequestPermissions,
        nil,
        RCTErrorWithMessage(@"Requesting push notifications is currently unavailable in an app extension"));
    return;
  }

  // Add a listener to make sure that startObserving has been called
  [self addListener:@"remoteNotificationsRegistered"];

  UNAuthorizationOptions options = UNAuthorizationOptionNone;

  if (permissions.alert()) {
    options |= UNAuthorizationOptionAlert;
  }
  if (permissions.badge()) {
    options |= UNAuthorizationOptionBadge;
  }
  if (permissions.sound()) {
    options |= UNAuthorizationOptionSound;
  }

  [UNUserNotificationCenter.currentNotificationCenter
      requestAuthorizationWithOptions:options
                    completionHandler:^(BOOL granted, NSError *_Nullable error) {
                      if (error != NULL) {
                        reject(@"-1", @"Error - Push authorization request failed.", error);
                      } else {
                        dispatch_async(dispatch_get_main_queue(), ^{
                          [RCTSharedApplication() registerForRemoteNotifications];
                          [UNUserNotificationCenter.currentNotificationCenter
                              getNotificationSettingsWithCompletionHandler:^(
                                  UNNotificationSettings *_Nonnull settings) {
                                resolve(RCTPromiseResolveValueForUNNotificationSettings(settings));
                              }];
                        });
                      }
                    }];
}

RCT_EXPORT_METHOD(abandonPermissions)
{
  [RCTSharedApplication() unregisterForRemoteNotifications];
}

RCT_EXPORT_METHOD(checkPermissions : (RCTResponseSenderBlock)callback)
{
  if (RCTRunningInAppExtension()) {
    callback(@[ RCTSettingsDictForUNNotificationSettings(NO, NO, NO, NO, NO, NO, UNAuthorizationStatusNotDetermined) ]);
    return;
  }

  [UNUserNotificationCenter.currentNotificationCenter
      getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *_Nonnull settings) {
        callback(@[ RCTPromiseResolveValueForUNNotificationSettings(settings) ]);
      }];
}

static inline NSDictionary *RCTPromiseResolveValueForUNNotificationSettings(UNNotificationSettings *_Nonnull settings)
{
#if TARGET_OS_TV
  return RCTSettingsDictForUNNotificationSettings(
      NO, settings.badgeSetting == UNNotificationSettingEnabled, NO, NO, NO, NO, settings.authorizationStatus);
#else
  return RCTSettingsDictForUNNotificationSettings(
      settings.alertSetting == UNNotificationSettingEnabled,
      settings.badgeSetting == UNNotificationSettingEnabled,
      settings.soundSetting == UNNotificationSettingEnabled,
      settings.criticalAlertSetting == UNNotificationSettingEnabled,
      settings.lockScreenSetting == UNNotificationSettingEnabled,
      settings.notificationCenterSetting == UNNotificationSettingEnabled,
      settings.authorizationStatus);
#endif
}

static inline NSDictionary *RCTSettingsDictForUNNotificationSettings(
    BOOL alert,
    BOOL badge,
    BOOL sound,
    BOOL critical,
    BOOL lockScreen,
    BOOL notificationCenter,
    UNAuthorizationStatus authorizationStatus)
{
  return @{
    @"alert" : @(alert),
    @"badge" : @(badge),
    @"sound" : @(sound),
    @"critical" : @(critical),
    @"lockScreen" : @(lockScreen),
    @"notificationCenter" : @(notificationCenter),
    @"authorizationStatus" : @(authorizationStatus)
  };
}

RCT_EXPORT_METHOD(presentLocalNotification : (JS::NativePushNotificationManagerIOS::Notification &)notification)
{
  NSDictionary<NSString *, id> *notificationDict = [RCTConvert NSDictionaryForNotification:notification];
  UNNotificationContent *content = [RCTConvert UNNotificationContent:notificationDict];
  UNTimeIntervalNotificationTrigger *trigger = [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:0.1
                                                                                                  repeats:NO];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:[[NSUUID UUID] UUIDString]
                                                                        content:content
                                                                        trigger:trigger];

  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center addNotificationRequest:request withCompletionHandler:nil];
}

RCT_EXPORT_METHOD(scheduleLocalNotification : (JS::NativePushNotificationManagerIOS::Notification &)notification)
{
  NSDictionary<NSString *, id> *notificationDict = [RCTConvert NSDictionaryForNotification:notification];
  UNNotificationContent *content = [RCTConvert UNNotificationContent:notificationDict];

  UNNotificationTrigger *trigger = nil;
  if (notificationDict[@"fireDate"]) {
    NSDate *fireDate = [RCTConvert NSDate:notificationDict[@"fireDate"]] ?: [NSDate date];
    NSCalendar *calendar = [NSCalendar currentCalendar];
    NSDateComponents *components =
        [calendar components:(NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour |
                              NSCalendarUnitMinute | NSCalendarUnitSecond)
                    fromDate:fireDate];
    trigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:components repeats:NO];
  } else if (notificationDict[@"fireIntervalSeconds"]) {
    trigger = [UNTimeIntervalNotificationTrigger
        triggerWithTimeInterval:[notificationDict[@"fireIntervalSeconds"] doubleValue]
                        repeats:NO];
  }

  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:[[NSUUID UUID] UUIDString]
                                                                        content:content
                                                                        trigger:trigger];

  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center addNotificationRequest:request withCompletionHandler:nil];
}

RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
  [[UNUserNotificationCenter currentNotificationCenter]
      getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
        NSMutableArray<NSString *> *notificationIdentifiersToCancel = [NSMutableArray new];
        for (UNNotificationRequest *request in requests) {
          [notificationIdentifiersToCancel addObject:request.identifier];
        }
        [[UNUserNotificationCenter currentNotificationCenter]
            removePendingNotificationRequestsWithIdentifiers:notificationIdentifiersToCancel];
      }];
}

RCT_EXPORT_METHOD(cancelLocalNotifications : (NSDictionary<NSString *, id> *)userInfo)
{
#if !TARGET_OS_TV
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *_Nonnull requests) {
    NSMutableArray<NSString *> *notificationIdentifiersToCancel = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      NSDictionary<NSString *, id> *notificationInfo = request.content.userInfo;
      // Note: we do this with a loop instead of just `isEqualToDictionary:`
      // because we only require that all specified userInfo values match the
      // notificationInfo values - notificationInfo may contain additional values
      // which we don't care about.
      __block BOOL shouldCancel = YES;
      [userInfo enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
        if (![notificationInfo[key] isEqual:obj]) {
          shouldCancel = NO;
          *stop = YES;
        }
      }];

      if (shouldCancel) {
        [notificationIdentifiersToCancel addObject:request.identifier];
      }
    }

    [center removePendingNotificationRequestsWithIdentifiers:notificationIdentifiersToCancel];
  }];
#endif
}

RCT_EXPORT_METHOD(
    getInitialNotification : (RCTPromiseResolveBlock)resolve reject : (__unused RCTPromiseRejectBlock)reject)
{
  // The user actioned a local or remote notification to launch the app. Notification is represented by UNNotification.
  // Set this property in the implementation of
  // userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler.
  if (kInitialNotification) {
    NSDictionary<NSString *, id> *notificationDict =
        RCTFormatUNNotificationContent(kInitialNotification.request.content);
    if (IsNotificationRemote(kInitialNotification)) {
      // For backwards compatibility, remote notifications only returns a userInfo dict.
      NSMutableDictionary<NSString *, id> *userInfoCopy = [notificationDict[@"userInfo"] mutableCopy];
      userInfoCopy[@"remote"] = @YES;
      resolve(userInfoCopy);
    } else {
      // For backwards compatibility, local notifications return the notification.
      resolve(notificationDict);
    }
    return;
  }

  resolve((id)kCFNull);
}

RCT_EXPORT_METHOD(getScheduledLocalNotifications : (RCTResponseSenderBlock)callback)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *_Nonnull requests) {
    NSMutableArray<NSDictionary *> *formattedScheduledLocalNotifications = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      [formattedScheduledLocalNotifications addObject:RCTFormatUNNotificationRequest(request)];
    }
    callback(@[ formattedScheduledLocalNotifications ]);
  }];
}

RCT_EXPORT_METHOD(removeAllDeliveredNotifications)
{
#if !TARGET_OS_TV
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center removeAllDeliveredNotifications];
#endif
}

RCT_EXPORT_METHOD(removeDeliveredNotifications : (NSArray<NSString *> *)identifiers)
{
#if !TARGET_OS_TV
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center removeDeliveredNotificationsWithIdentifiers:identifiers];
#endif
}

RCT_EXPORT_METHOD(getDeliveredNotifications : (RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_TV
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *_Nonnull notifications) {
    NSMutableArray<NSDictionary *> *formattedNotifications = [NSMutableArray new];

    for (UNNotification *notification in notifications) {
      [formattedNotifications addObject:RCTFormatUNNotification(notification)];
    }
    callback(@[ formattedNotifications ]);
  }];
#else
  callback(@[ @[] ]);
#endif
}

RCT_EXPORT_METHOD(getAuthorizationStatus : (RCTResponseSenderBlock)callback)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *_Nonnull settings) {
    callback(@[ @(settings.authorizationStatus) ]);
  }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePushNotificationManagerIOSSpecJSI>(params);
}

@end

Class RCTPushNotificationManagerCls(void)
{
  return RCTPushNotificationManager.class;
}
