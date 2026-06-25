/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBundleURLProvider.h"

#import "RCTConstants.h"
#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTDevSupportHttpHeaders.h"
#import "RCTLog.h"

#import <jsinspector-modern/InspectorFlags.h>

NSString *const RCTBundleURLProviderUpdatedNotification = @"RCTBundleURLProviderUpdatedNotification";

const NSUInteger kRCTBundleURLProviderDefaultPort = RCT_METRO_PORT;

#if RCT_DEV_MENU | RCT_PACKAGER_LOADING_FUNCTIONALITY
static BOOL kRCTAllowPackagerAccess = YES;
void RCTBundleURLProviderAllowPackagerServerAccess(BOOL allowed)
{
  kRCTAllowPackagerAccess = allowed;
}
#endif
static NSString *const kRCTPackagerSchemeKey = @"RCT_packager_scheme";
static NSString *const kRCTJsLocationKey = @"RCT_jsLocation";
static NSString *const kRCTEnableDevKey = @"RCT_enableDev";
static NSString *const kRCTEnableMinificationKey = @"RCT_enableMinification";
static NSString *const kRCTInlineSourceMapKey = @"RCT_inlineSourceMap";
static const NSTimeInterval kRCTPackagerStatusRequestTimeout = 6;
static const NSTimeInterval kRCTPackagerStatusRequestTimeoutGraceTime = 2;

@implementation RCTBundleURLProvider

- (instancetype)init
{
  self = [super init];
  if (self) {
    [self _setDefaults];
  }
  return self;
}

- (NSDictionary *)defaults
{
  return @{
    kRCTEnableDevKey : @YES,
    kRCTEnableMinificationKey : @NO,
  };
}

- (void)settingsUpdated
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTBundleURLProviderUpdatedNotification object:self];
}

- (void)resetToDefaults
{
  for (NSString *key in [[self defaults] allKeys]) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
  }
  [self _setDefaults];
  [self settingsUpdated];
}

static NSURL *serverRootWithHostPort(NSString *hostPort, NSString *scheme)
{
  if (![scheme length]) {
    scheme = @"http";
  }
  if ([hostPort rangeOfString:@":"].location != NSNotFound) {
    return [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@/", scheme, hostPort]];
  }
  return [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@:%lu/",
                                                         scheme,
                                                         hostPort,
                                                         (unsigned long)kRCTBundleURLProviderDefaultPort]];
}

#if RCT_DEV_MENU | RCT_PACKAGER_LOADING_FUNCTIONALITY
+ (BOOL)isPackagerRunning:(NSString *)hostPort
{
  return [RCTBundleURLProvider isPackagerRunning:hostPort scheme:nil];
}

+ (BOOL)isPackagerRunning:(NSString *)hostPort scheme:(NSString *)scheme
{
  if (!kRCTAllowPackagerAccess) {
    return NO;
  }

  NSURL *url = [serverRootWithHostPort(hostPort, scheme) URLByAppendingPathComponent:@"status"];
  if (url == nil) {
    return NO;
  }

  NSURLSession *session = [NSURLSession sharedSession];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url
                                                         cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                     timeoutInterval:kRCTPackagerStatusRequestTimeout];
  [[RCTDevSupportHttpHeaders sharedInstance] applyHeadersToRequest:request];
  __block NSURLResponse *response;
  __block NSData *data;

  __block BOOL isRunning = NO;
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [[session dataTaskWithRequest:request
              completionHandler:^(NSData *d, NSURLResponse *res, NSError *err) {
                data = d;
                response = res;
                NSString *status = [[NSString alloc] initWithData:d encoding:NSUTF8StringEncoding];
                isRunning = [status isEqualToString:@"packager-status:running"];
                if (!isRunning) {
                  RCTLogWarn(
                      @"Packager status check returned unexpected result for %@: %@, error: %@", url, status, err);
                }
                dispatch_semaphore_signal(semaphore);
              }] resume];
  long result = dispatch_semaphore_wait(
      semaphore,
      dispatch_time(
          DISPATCH_TIME_NOW,
          (int64_t)((kRCTPackagerStatusRequestTimeout +
                     // The request timeout does not cover all phases of the request (e.g. DNS resolution),
                     // so the actual request might take slightly longer than the configured timeout.
                     kRCTPackagerStatusRequestTimeoutGraceTime) *
                    NSEC_PER_SEC)));
  if (result != 0) {
    RCTLogWarn(@"Packager status check timed out for %@", url);
    return NO;
  }
  return isRunning;
}

+ (void)isPackagerRunningAsync:(NSString *)hostPort completion:(void (^)(BOOL isRunning))completion
{
  [RCTBundleURLProvider isPackagerRunningAsync:hostPort scheme:nil completion:completion];
}

+ (void)isPackagerRunningAsync:(NSString *)hostPort
                        scheme:(NSString *)scheme
                    completion:(void (^)(BOOL isRunning))completion
{
  if (!kRCTAllowPackagerAccess) {
    completion(NO);
    return;
  }

  NSURL *url = [serverRootWithHostPort(hostPort, scheme) URLByAppendingPathComponent:@"status"];
  if (url == nil) {
    completion(NO);
    return;
  }

  NSURLSession *session = [NSURLSession sharedSession];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url
                                                         cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                     timeoutInterval:kRCTPackagerStatusRequestTimeout];
  [[RCTDevSupportHttpHeaders sharedInstance] applyHeadersToRequest:request];

  __block BOOL hasCompleted = NO;
  NSObject *lock = [[NSObject alloc] init];

  void (^safeCompletion)(BOOL) = ^(BOOL isRunning) {
    @synchronized(lock) {
      if (!hasCompleted) {
        hasCompleted = YES;
        completion(isRunning);
      }
    }
  };

  NSURLSessionDataTask *task = [session dataTaskWithRequest:request
                                          completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
                                            if (error != nil || data == nil) {
                                              safeCompletion(NO);
                                              return;
                                            }
                                            NSString *status = [[NSString alloc] initWithData:data
                                                                                     encoding:NSUTF8StringEncoding];
                                            BOOL isRunning = [status isEqualToString:@"packager-status:running"];
                                            safeCompletion(isRunning);
                                          }];
  [task resume];

  dispatch_after(
      dispatch_time(
          DISPATCH_TIME_NOW,
          (int64_t)((kRCTPackagerStatusRequestTimeout + kRCTPackagerStatusRequestTimeoutGraceTime) * NSEC_PER_SEC)),
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0),
      ^{
        @synchronized(lock) {
          if (!hasCompleted) {
            hasCompleted = YES;
            [task cancel];
            completion(NO);
          }
        }
      });
}

- (NSString *)guessPackagerHost
{
  static NSString *ipGuess;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *ipPath = [[NSBundle mainBundle] pathForResource:@"ip" ofType:@"txt"];
    ipGuess =
        [[NSString stringWithContentsOfFile:ipPath encoding:NSUTF8StringEncoding
                                      error:nil] stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]];
  });

  NSString *host = ipGuess ?: @"localhost";
  if ([RCTBundleURLProvider isPackagerRunning:host]) {
    return host;
  }
  return nil;
}
#else
+ (BOOL)isPackagerRunning:(NSString *)hostPort
{
  return false;
}

+ (BOOL)isPackagerRunning:(NSString *)hostPort scheme:(NSString *)scheme
{
  return false;
}

+ (void)isPackagerRunningAsync:(NSString *)hostPort completion:(void (^)(BOOL isRunning))completion
{
  completion(NO);
}

+ (void)isPackagerRunningAsync:(NSString *)hostPort
                        scheme:(NSString *)scheme
                    completion:(void (^)(BOOL isRunning))completion
{
  completion(NO);
}
#endif

- (NSString *)packagerServerHost
{
  NSString *location = [self packagerServerHostPort];
  if (location) {
    NSInteger index = [location rangeOfString:@":"].location;
    if (index != NSNotFound) {
      location = [location substringToIndex:index];
    }
  }
  return location;
}

- (NSString *)packagerServerHostPort
{
#if RCT_DEV_MENU | RCT_PACKAGER_LOADING_FUNCTIONALITY
  if (!kRCTAllowPackagerAccess) {
    RCTLogInfo(@"Packager server access is disabled in this environment");
    return nil;
  }
#endif
  NSString *location = [self jsLocation];
#if RCT_DEV_MENU
  NSString *scheme = [self packagerScheme];
  if ([location length] && ![RCTBundleURLProvider isPackagerRunning:location scheme:scheme]) {
    location = nil;
  }
#endif
  if (location != nil) {
    return location;
  }
#if RCT_DEV
  NSString *host = [self guessPackagerHost];
  if (host) {
    return host;
  }
#endif
  return nil;
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackURLProvider:(NSURL * (^)(void))fallbackURLProvider
{
  NSString *packagerServerHostPort = [self packagerServerHostPort];
  if (!packagerServerHostPort) {
    return fallbackURLProvider();
  } else {
    return [RCTBundleURLProvider jsBundleURLForBundleRoot:bundleRoot
                                             packagerHost:packagerServerHostPort
                                           packagerScheme:[self packagerScheme]
                                                enableDev:[self enableDev]
                                       enableMinification:[self enableMinification]
                                          inlineSourceMap:[self inlineSourceMap]
                                              modulesOnly:NO
                                                runModule:YES];
  }
}

- (NSURL *)jsBundleURLForSplitBundleRoot:(NSString *)bundleRoot
{
  return [RCTBundleURLProvider jsBundleURLForBundleRoot:bundleRoot
                                           packagerHost:[self packagerServerHostPort]
                                         packagerScheme:[self packagerScheme]
                                              enableDev:[self enableDev]
                                     enableMinification:[self enableMinification]
                                        inlineSourceMap:[self inlineSourceMap]
                                            modulesOnly:YES
                                              runModule:NO];
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackExtension:(NSString *)extension
{
  return [self jsBundleURLForBundleRoot:bundleRoot
                    fallbackURLProvider:^NSURL * {
                      return [self jsBundleURLForFallbackExtension:extension];
                    }];
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
{
  return [self jsBundleURLForBundleRoot:bundleRoot fallbackExtension:nil];
}

- (NSURL *)jsBundleURLForFallbackExtension:(NSString *)extension
{
  extension = extension ?: @"jsbundle";
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:extension];
}

- (NSURL *)resourceURLForResourceRoot:(NSString *)root
                         resourceName:(NSString *)name
                    resourceExtension:(NSString *)extension
                        offlineBundle:(NSBundle *)offlineBundle
{
  NSString *packagerServerHostPort = [self packagerServerHostPort];
  NSString *packagerServerScheme = [self packagerScheme];
  if (!packagerServerHostPort) {
    // Serve offline bundle (local file)
    NSBundle *bundle = offlineBundle ?: [NSBundle mainBundle];
    return [bundle URLForResource:name withExtension:extension];
  }
  NSString *path = [NSString stringWithFormat:@"/%@/%@.%@", root, name, extension];
  return [[self class] resourceURLForResourcePath:path
                                     packagerHost:packagerServerHostPort
                                           scheme:packagerServerScheme
                                       queryItems:nil];
}

+ (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                       packagerHost:(NSString *)packagerHost
                          enableDev:(BOOL)enableDev
                 enableMinification:(BOOL)enableMinification
                    inlineSourceMap:(BOOL)inlineSourceMap
{
  return [self jsBundleURLForBundleRoot:bundleRoot
                           packagerHost:packagerHost
                         packagerScheme:nil
                              enableDev:enableDev
                     enableMinification:enableMinification
                        inlineSourceMap:inlineSourceMap
                            modulesOnly:NO
                              runModule:YES
                      additionalOptions:nil];
}

+ (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                                 packagerHost:(NSString *)packagerHost
                                    enableDev:(BOOL)enableDev
                           enableMinification:(BOOL)enableMinification
                              inlineSourceMap:(BOOL)inlineSourceMap
                            additionalOptions:(NSDictionary<NSString *, NSString *> *__nullable)additionalOptions
{
  return [self jsBundleURLForBundleRoot:bundleRoot
                           packagerHost:packagerHost
                         packagerScheme:nil
                              enableDev:enableDev
                     enableMinification:enableMinification
                        inlineSourceMap:inlineSourceMap
                            modulesOnly:NO
                              runModule:YES
                      additionalOptions:additionalOptions];
}

+ (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                       packagerHost:(NSString *)packagerHost
                     packagerScheme:(NSString *)scheme
                          enableDev:(BOOL)enableDev
                 enableMinification:(BOOL)enableMinification
                    inlineSourceMap:(BOOL)inlineSourceMap
                        modulesOnly:(BOOL)modulesOnly
                          runModule:(BOOL)runModule
{
  return [self jsBundleURLForBundleRoot:bundleRoot
                           packagerHost:packagerHost
                         packagerScheme:nil
                              enableDev:enableDev
                     enableMinification:enableMinification
                        inlineSourceMap:inlineSourceMap
                            modulesOnly:modulesOnly
                              runModule:runModule
                      additionalOptions:nil];
}

+ (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                                 packagerHost:(NSString *)packagerHost
                               packagerScheme:(NSString *__nullable)scheme
                                    enableDev:(BOOL)enableDev
                           enableMinification:(BOOL)enableMinification
                              inlineSourceMap:(BOOL)inlineSourceMap
                                  modulesOnly:(BOOL)modulesOnly
                                    runModule:(BOOL)runModule
                            additionalOptions:(NSDictionary<NSString *, NSString *> *__nullable)additionalOptions
{
  NSString *path = [NSString stringWithFormat:@"/%@.bundle", bundleRoot];
  NSArray<NSURLQueryItem *> *queryItems = [self createJSBundleURLQuery:packagerHost
                                                        packagerScheme:scheme
                                                             enableDev:enableDev
                                                    enableMinification:enableMinification
                                                       inlineSourceMap:inlineSourceMap
                                                           modulesOnly:modulesOnly
                                                             runModule:runModule
                                                     additionalOptions:additionalOptions];

  return [RCTBundleURLProvider resourceURLForResourcePath:path
                                             packagerHost:packagerHost
                                                   scheme:scheme
                                               queryItems:[queryItems copy]];
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
               packagerServerScheme:(NSString *)packagerServerScheme
                 packagerServerHost:(NSString *)packagerServerHost
             packagerOptionsUpdater:(RCTPackagerOptionsUpdater)packagerOptionsUpdater
{
  NSArray<NSURLQueryItem *> *queryItems = [RCTBundleURLProvider createJSBundleURLQuery:packagerServerHost
                                                                        packagerScheme:packagerServerScheme
                                                                             enableDev:[self enableDev]
                                                                    enableMinification:[self enableMinification]
                                                                       inlineSourceMap:[self inlineSourceMap]
                                                                           modulesOnly:NO
                                                                             runModule:YES
                                                                     additionalOptions:nil];

  NSArray<NSURLQueryItem *> *updatedQueryItems = packagerOptionsUpdater((NSMutableArray *)queryItems);
  NSString *path = [NSString stringWithFormat:@"/%@.bundle", bundleRoot];

  return [RCTBundleURLProvider resourceURLForResourcePath:path
                                             packagerHost:packagerServerHost
                                                   scheme:packagerServerScheme
                                               queryItems:updatedQueryItems];
}

+ (NSArray<NSURLQueryItem *> *)createJSBundleURLQuery:(NSString *)packagerHost
                                       packagerScheme:(NSString *__nullable)scheme
                                            enableDev:(BOOL)enableDev
                                   enableMinification:(BOOL)enableMinification
                                      inlineSourceMap:(BOOL)inlineSourceMap
                                          modulesOnly:(BOOL)modulesOnly
                                            runModule:(BOOL)runModule
                                    additionalOptions:
                                        (NSDictionary<NSString *, NSString *> *__nullable)additionalOptions
{
  BOOL lazy = enableDev;
  NSMutableArray<NSURLQueryItem *> *queryItems = [[NSMutableArray alloc] initWithArray:@[
    [[NSURLQueryItem alloc] initWithName:@"platform" value:RCTPlatformName],
    [[NSURLQueryItem alloc] initWithName:@"dev" value:enableDev ? @"true" : @"false"],
    [[NSURLQueryItem alloc] initWithName:@"lazy" value:lazy ? @"true" : @"false"],
    [[NSURLQueryItem alloc] initWithName:@"minify" value:enableMinification ? @"true" : @"false"],
    [[NSURLQueryItem alloc] initWithName:@"inlineSourceMap" value:inlineSourceMap ? @"true" : @"false"],
    [[NSURLQueryItem alloc] initWithName:@"modulesOnly" value:modulesOnly ? @"true" : @"false"],
    [[NSURLQueryItem alloc] initWithName:@"runModule" value:runModule ? @"true" : @"false"],
  ]];
  auto &inspectorFlags = facebook::react::jsinspector_modern::InspectorFlags::getInstance();
  if (inspectorFlags.getFuseboxEnabled()) {
    [queryItems addObject:[[NSURLQueryItem alloc] initWithName:@"excludeSource" value:@"true"]];
    [queryItems addObject:[[NSURLQueryItem alloc] initWithName:@"sourcePaths" value:@"url-server"]];
  }

  NSString *bundleID = [[NSBundle mainBundle] objectForInfoDictionaryKey:(NSString *)kCFBundleIdentifierKey];
  if (bundleID) {
    [queryItems addObject:[[NSURLQueryItem alloc] initWithName:@"app" value:bundleID]];
  }

  if (additionalOptions) {
    for (NSString *key in additionalOptions) {
      NSString *value = [additionalOptions objectForKey:key];
      if (!value) {
        NSLog(@"RCTBundleURLProvider: Ignoring the additional option: '%@' due to nil value.", key);
        continue;
      }
      [queryItems addObject:[[NSURLQueryItem alloc] initWithName:key value:value]];
    }
  }

  return queryItems;
}

+ (NSURL *)resourceURLForResourcePath:(NSString *)path
                         packagerHost:(NSString *)packagerHost
                               scheme:(NSString *)scheme
                                query:(NSString *)query
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:serverRootWithHostPort(packagerHost, scheme)
                                           resolvingAgainstBaseURL:NO];
  components.path = path;
  if (query != nil) {
    components.query = query;
  }
  return components.URL;
}

+ (NSURL *)resourceURLForResourcePath:(NSString *)path
                         packagerHost:(NSString *)packagerHost
                               scheme:(NSString *)scheme
                           queryItems:(NSArray<NSURLQueryItem *> *)queryItems
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:serverRootWithHostPort(packagerHost, scheme)
                                           resolvingAgainstBaseURL:NO];
  components.path = path;
  if (queryItems != nil) {
    components.queryItems = queryItems;
  }
  return components.URL;
}

- (void)updateValue:(id)object forKey:(NSString *)key
{
  [[NSUserDefaults standardUserDefaults] setObject:object forKey:key];
  [[NSUserDefaults standardUserDefaults] synchronize];
  [self settingsUpdated];
}

- (BOOL)enableDev
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTEnableDevKey];
}

- (BOOL)enableMinification
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTEnableMinificationKey];
}

- (BOOL)inlineSourceMap
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTInlineSourceMapKey];
}

- (NSString *)jsLocation
{
  return [[NSUserDefaults standardUserDefaults] stringForKey:kRCTJsLocationKey];
}

- (NSString *)packagerScheme
{
  NSString *packagerScheme = [[NSUserDefaults standardUserDefaults] stringForKey:kRCTPackagerSchemeKey];
  if (![packagerScheme length]) {
    return @"http";
  }
  return packagerScheme;
}

- (void)setEnableDev:(BOOL)enableDev
{
  [self updateValue:@(enableDev) forKey:kRCTEnableDevKey];
}

- (void)setJsLocation:(NSString *)jsLocation
{
  [self updateValue:jsLocation forKey:kRCTJsLocationKey];
}

- (void)setEnableMinification:(BOOL)enableMinification
{
  [self updateValue:@(enableMinification) forKey:kRCTEnableMinificationKey];
}

- (void)setInlineSourceMap:(BOOL)inlineSourceMap
{
  [self updateValue:@(inlineSourceMap) forKey:kRCTInlineSourceMapKey];
}

- (void)setPackagerScheme:(NSString *)packagerScheme
{
  [self updateValue:packagerScheme forKey:kRCTPackagerSchemeKey];
}

+ (instancetype)sharedSettings
{
  static RCTBundleURLProvider *sharedInstance;
  static dispatch_once_t once_token;
  dispatch_once(&once_token, ^{
    sharedInstance = [RCTBundleURLProvider new];
  });
  return sharedInstance;
}

#pragma mark - Private helpers

- (void)_setDefaults
{
  [[NSUserDefaults standardUserDefaults] registerDefaults:[self defaults]];
}

@end
