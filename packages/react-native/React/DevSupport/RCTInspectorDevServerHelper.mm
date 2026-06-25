/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInspectorDevServerHelper.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

#import <React/RCTLog.h>
#import <UIKit/UIKit.h>

#import <React/RCTCxxInspectorPackagerConnection.h>
#import <React/RCTDefines.h>
#import <React/RCTDevSupportHttpHeaders.h>

#import <CommonCrypto/CommonCrypto.h>
#import <jsinspector-modern/InspectorFlags.h>

static NSString *const kDebuggerMsgDisable = @"{ \"id\":1,\"method\":\"Debugger.disable\" }";
static const int kDefaultMetroPort = 8081;

static NSString *getServerHost(NSURL *bundleURL)
{
  NSString *host = [bundleURL host];
  if (host == nullptr) {
    host = @"localhost";
  }
  // NSURL.host strips IPv6 brackets, but URL authority requires them.
  if ([host containsString:@":"] && ![host hasPrefix:@"["] && ![host hasSuffix:@"]"]) {
    host = [NSString stringWithFormat:@"[%@]", host];
  }

  // Use explicit port from URL if available
  if ([bundleURL port] != nullptr) {
    return [NSString stringWithFormat:@"%@:%@", host, [bundleURL port]];
  }

  // Check environment variable
  NSString *portStr = [[[NSProcessInfo processInfo] environment] objectForKey:@"RCT_METRO_PORT"];
  if ((portStr != nullptr) && [portStr length] > 0) {
    return [NSString stringWithFormat:@"%@:%@", host, portStr];
  }

  // For https, omit port — the scheme implies 443
  if ([[bundleURL scheme] isEqualToString:@"https"]) {
    return host;
  }

  // Default to 8081 for local development (Metro's default port)
  return [NSString stringWithFormat:@"%@:%d", host, kDefaultMetroPort];
}

static NSString *getSHA256(NSString *string)
{
  const char *str = string.UTF8String;
  unsigned char result[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(str, (CC_LONG)strlen(str), result);

  return [NSString stringWithFormat:@"%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x",
                                    result[0],
                                    result[1],
                                    result[2],
                                    result[3],
                                    result[4],
                                    result[5],
                                    result[6],
                                    result[7],
                                    result[8],
                                    result[9],
                                    result[10],
                                    result[11],
                                    result[12],
                                    result[13],
                                    result[14],
                                    result[15],
                                    result[16],
                                    result[17],
                                    result[18],
                                    result[19]];
}

// Returns an opaque ID which is stable for the current combination of device and app, stable across installs,
// and unique across devices.
static NSString *getInspectorDeviceId()
{
  // A bundle ID uniquely identifies a single app throughout the system. [Source: Apple docs]
  NSString *bundleId = [[NSBundle mainBundle] bundleIdentifier];

#if TARGET_OS_IPHONE
  // An alphanumeric string that uniquely identifies a device to the app's vendor. [Source: Apple docs]
  NSString *identifierForVendor = [[UIDevice currentDevice] identifierForVendor].UUIDString;
#else
  // macOS does not support UIDevice. Use an empty string, with the assumption
  // that we are only building to the current system.
  NSString *identifierForVendor = @"";
#endif

  auto &inspectorFlags = facebook::react::jsinspector_modern::InspectorFlags::getInstance();

  NSString *rawDeviceId = [NSString stringWithFormat:@"apple-%@-%@-%s",
                                                     identifierForVendor,
                                                     bundleId,
                                                     inspectorFlags.getFuseboxEnabled() ? "fusebox" : "legacy"];

  return getSHA256(rawDeviceId);
}

static NSURL *getInspectorDeviceUrl(NSURL *bundleURL)
{
  auto &inspectorFlags = facebook::react::jsinspector_modern::InspectorFlags::getInstance();
  BOOL isProfilingBuild = inspectorFlags.getIsProfilingBuild();

  NSString *escapedDeviceName = [[[UIDevice currentDevice] name]
      stringByAddingPercentEncodingWithAllowedCharacters:NSCharacterSet.URLQueryAllowedCharacterSet];
  NSString *escapedAppName = [[[NSBundle mainBundle] bundleIdentifier]
      stringByAddingPercentEncodingWithAllowedCharacters:NSCharacterSet.URLQueryAllowedCharacterSet];

  NSString *escapedInspectorDeviceId = [getInspectorDeviceId()
      stringByAddingPercentEncodingWithAllowedCharacters:NSCharacterSet.URLQueryAllowedCharacterSet];

  NSString *scheme = [bundleURL scheme] != nullptr ? [bundleURL scheme] : @"http";
  return
      [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@/inspector/device?name=%@&app=%@&device=%@&profiling=%@",
                                                      scheme,
                                                      getServerHost(bundleURL),
                                                      escapedDeviceName,
                                                      escapedAppName,
                                                      escapedInspectorDeviceId,
                                                      isProfilingBuild ? @"true" : @"false"]];
}

@implementation RCTInspectorDevServerHelper

RCT_NOT_IMPLEMENTED(-(instancetype)init)

static NSMutableDictionary<NSString *, id<RCTInspectorPackagerConnectionProtocol>> *socketConnections = nil;

static void sendEventToAllConnections(NSString *event)
{
  for (NSString *socketId in socketConnections) {
    [socketConnections[socketId] sendEventToAllConnections:event];
  }
}

+ (BOOL)isPackagerDisconnected
{
  for (NSString *socketId in socketConnections) {
    if ([socketConnections[socketId] isConnected]) {
      return false;
    }
  }

  return true;
}

+ (void)openDebugger:(NSURL *)bundleURL withErrorMessage:(NSString *)errorMessage
{
  NSString *escapedInspectorDeviceId = [getInspectorDeviceId()
      stringByAddingPercentEncodingWithAllowedCharacters:NSCharacterSet.URLQueryAllowedCharacterSet];

  NSString *scheme = [bundleURL scheme] != nullptr ? [bundleURL scheme] : @"http";
  NSURL *url = [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@/open-debugger?device=%@",
                                                               scheme,
                                                               getServerHost(bundleURL),
                                                               escapedInspectorDeviceId]];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  [request setHTTPMethod:@"POST"];
  [[RCTDevSupportHttpHeaders sharedInstance] applyHeadersToRequest:request];

  [[[NSURLSession sharedSession]
      dataTaskWithRequest:request
        completionHandler:^(
            __unused NSData *_Nullable data, __unused NSURLResponse *_Nullable response, NSError *_Nullable error) {
          if (error != nullptr) {
            RCTLogWarn(@"%@", errorMessage);
          }
        }] resume];
}

+ (void)disableDebugger
{
  auto &inspectorFlags = facebook::react::jsinspector_modern::InspectorFlags::getInstance();
  if (!inspectorFlags.getFuseboxEnabled()) {
    sendEventToAllConnections(kDebuggerMsgDisable);
  }
}

+ (id<RCTInspectorPackagerConnectionProtocol>)connectWithBundleURL:(NSURL *)bundleURL
{
  NSURL *inspectorURL = getInspectorDeviceUrl(bundleURL);

  // Note, using a static dictionary isn't really the greatest design, but
  // the packager connection does the same thing, so it's at least consistent.
  // This is a static map that holds different inspector clients per the inspectorURL
  if (socketConnections == nil) {
    socketConnections = [NSMutableDictionary new];
  }

  NSString *key = [inspectorURL absoluteString];
  id<RCTInspectorPackagerConnectionProtocol> connection = socketConnections[key];
  if ((connection == nullptr) || !connection.isConnected) {
    connection = [[RCTCxxInspectorPackagerConnection alloc] initWithURL:inspectorURL];

    socketConnections[key] = connection;
    [connection connect];
  }

  return connection;
}

@end

#endif
