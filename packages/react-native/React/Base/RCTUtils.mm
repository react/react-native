/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUtils.h"

#import <dlfcn.h>
#import <mach/mach_time.h>
#import <objc/message.h>
#import <objc/runtime.h>
#import <zlib.h>
#import <atomic>
#import <vector>

#import <UIKit/UIKit.h>

#import <CommonCrypto/CommonCrypto.h>

#import <React/RCTUtilsUIOverride.h>
#import <ReactCommon/RuntimeExecutorSyncUIThreadUtils.h>
#import "RCTAssert.h"
#import "RCTLog.h"

using namespace facebook::react;

NSString *const RCTErrorUnspecified = @"EUNSPECIFIED";

// Returns the Path of Home directory
NSString *__nullable RCTHomePath(void);

// Returns the relative path within the Home for an absolute URL
// (or nil, if the URL does not specify a path within the Home directory)
NSString *__nullable RCTHomePathForURL(NSURL *__nullable URL);

// Determines if a given image URL refers to a image in Home directory (~)
BOOL RCTIsHomeAssetURL(NSURL *__nullable imageURL);

// Returns the current device's orientation
#if !TARGET_OS_TV
UIDeviceOrientation RCTDeviceOrientation(void);
#endif

// Whether the New Architecture is enabled or not
BOOL RCTIsNewArchEnabled(void)
{
  return YES;
}

BOOL RCTAreLegacyLogsEnabled(void)
{
#if RCT_DEBUG
  static BOOL legacyLogEnabled =
      ((NSNumber *)[[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTLegacyWarningsEnabled"]).boolValue;
  return legacyLogEnabled;
#else
  return NO;
#endif
}

static NSString *__nullable _RCTJSONStringifyNoRetry(id __nullable jsonObject, NSError **error)
{
  if (!jsonObject) {
    return nil;
  }

  static SEL JSONKitSelector = NULL;
  static NSSet<Class> *collectionTypes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    SEL selector = NSSelectorFromString(@"JSONStringWithOptions:error:");
    if ([NSDictionary instancesRespondToSelector:selector]) {
      JSONKitSelector = selector;
      collectionTypes = [NSSet setWithObjects:[NSArray class],
                                              [NSMutableArray class],
                                              [NSDictionary class],
                                              [NSMutableDictionary class],
                                              nil];
    }
  });

  @try {
    // Use JSONKit if available and object is not a fragment
    if (JSONKitSelector && [collectionTypes containsObject:[jsonObject classForCoder]]) {
      return ((NSString * (*)(id, SEL, int, NSError **)) objc_msgSend)(jsonObject, JSONKitSelector, 0, error);
    }

    // Use Foundation JSON method
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonObject
                                                       options:(NSJSONWritingOptions)NSJSONReadingAllowFragments
                                                         error:error];

    return jsonData ? [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding] : nil;
  } @catch (NSException *exception) {
    // Convert exception to error
    if (error) {
      *error = [NSError errorWithDomain:RCTErrorDomain
                                   code:0
                               userInfo:@{NSLocalizedDescriptionKey : exception.description ?: @""}];
    }
    return nil;
  }
}

NSString *__nullable RCTJSONStringify(id __nullable jsonObject, NSError **error)
{
  if (error) {
    return _RCTJSONStringifyNoRetry(jsonObject, error);
  } else {
    NSError *localError;
    NSString *json = _RCTJSONStringifyNoRetry(jsonObject, &localError);
    if (localError) {
      RCTLogError(@"RCTJSONStringify() encountered the following error: %@", localError.localizedDescription);
      // Sanitize the data, then retry. This is slow, but it prevents uncaught
      // data issues from crashing in production
      return _RCTJSONStringifyNoRetry(RCTJSONClean(jsonObject), NULL);
    }
    return json;
  }
}

static id __nullable _RCTJSONParse(NSString *__nullable jsonString, BOOL isMutable, NSError **error)
{
  static SEL JSONKitSelector = NULL;
  static SEL JSONKitMutableSelector = NULL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    SEL selector = NSSelectorFromString(@"objectFromJSONStringWithParseOptions:error:");
    if ([NSString instancesRespondToSelector:selector]) {
      JSONKitSelector = selector;
      JSONKitMutableSelector = NSSelectorFromString(@"mutableObjectFromJSONStringWithParseOptions:error:");
    }
  });

  if (jsonString) {
    // Use JSONKit if available and string is not a fragment
    if (JSONKitSelector) {
      NSInteger length = jsonString.length;
      for (NSInteger i = 0; i < length; i++) {
        unichar c = [jsonString characterAtIndex:i];
        if (strchr("{[", c)) {
          static const int options = (1 << 2); // loose unicode
          SEL selector = isMutable ? JSONKitMutableSelector : JSONKitSelector;
          return ((id (*)(id, SEL, int, NSError **))objc_msgSend)(jsonString, selector, options, error);
        }
        if (!strchr(" \r\n\t", c)) {
          break;
        }
      }
    }

    // Use Foundation JSON method
    NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    if (!jsonData) {
      jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding allowLossyConversion:YES];
      if (jsonData) {
        RCTLogWarn(
            @"RCTJSONParse received the following string, which could "
             "not be losslessly converted to UTF8 data: '%@'",
            jsonString);
      } else {
        NSString *errorMessage = @"RCTJSONParse received invalid UTF8 data";
        if (error) {
          *error = RCTErrorWithMessage(errorMessage);
        } else {
          RCTLogError(@"%@", errorMessage);
        }
        return nil;
      }
    }
    NSJSONReadingOptions options = NSJSONReadingAllowFragments;
    if (isMutable) {
      options |= NSJSONReadingMutableContainers;
    }
    return [NSJSONSerialization JSONObjectWithData:jsonData options:options error:error];
  }
  return nil;
}

id __nullable RCTJSONParse(NSString *__nullable jsonString, NSError **error)
{
  return _RCTJSONParse(jsonString, NO, error);
}

id __nullable RCTJSONParseMutable(NSString *__nullable jsonString, NSError **error)
{
  return _RCTJSONParse(jsonString, YES, error);
}

id RCTJSONClean(id object)
{
  static dispatch_once_t onceToken;
  static NSSet<Class> *validLeafTypes;
  dispatch_once(&onceToken, ^{
    validLeafTypes = [[NSSet alloc] initWithArray:@[
      [NSString class],
      [NSMutableString class],
      [NSNumber class],
      [NSNull class],
    ]];
  });

  if ([validLeafTypes containsObject:[object classForCoder]]) {
    if ([object isKindOfClass:[NSNumber class]]) {
      return @(RCTZeroIfNaN([object doubleValue]));
    }
    if ([object isKindOfClass:[NSString class]]) {
      if ([object UTF8String] == NULL) {
        return (id)kCFNull;
      }
    }
    return object;
  }

  if ([object isKindOfClass:[NSDictionary class]]) {
    __block BOOL copy = NO;
    NSMutableDictionary<NSString *, id> *values = [[NSMutableDictionary alloc] initWithCapacity:[object count]];
    [object enumerateKeysAndObjectsUsingBlock:^(NSString *key, id item, __unused BOOL *stop) {
      id value = RCTJSONClean(item);
      values[key] = value;
      copy |= value != item;
    }];
    return copy ? values : object;
  }

  if ([object isKindOfClass:[NSArray class]]) {
    __block BOOL copy = NO;
    __block NSArray *values = object;
    [object enumerateObjectsUsingBlock:^(id item, NSUInteger idx, __unused BOOL *stop) {
      id value = RCTJSONClean(item);
      if (copy) {
        [(NSMutableArray *)values addObject:value];
      } else if (value != item) {
        // Converted value is different, so we'll need to copy the array
        values = [[NSMutableArray alloc] initWithCapacity:values.count];
        for (NSUInteger i = 0; i < idx; i++) {
          [(NSMutableArray *)values addObject:object[i]];
        }
        [(NSMutableArray *)values addObject:value];
        copy = YES;
      }
    }];
    return values;
  }

  return (id)kCFNull;
}

NSString *RCTMD5Hash(NSString *string)
{
  const char *str = string.UTF8String;
  unsigned char result[CC_MD5_DIGEST_LENGTH];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  CC_MD5(str, (CC_LONG)strlen(str), result);
#pragma clang diagnostic pop

  return [NSString stringWithFormat:@"%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x",
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
                                    result[15]];
}

BOOL RCTIsMainQueue(void)
{
  static void *mainQueueKey = &mainQueueKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(dispatch_get_main_queue(), mainQueueKey, mainQueueKey, NULL);
  });
  return dispatch_get_specific(mainQueueKey) == mainQueueKey;
}

void RCTExecuteOnMainQueue(dispatch_block_t block)
{
  if (RCTIsMainQueue()) {
    block();
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      block();
    });
  }
}

// Please do not use this method
// unless you know what you are doing.
void RCTUnsafeExecuteOnMainQueueSync(dispatch_block_t block)
{
  if (RCTIsMainQueue()) {
    block();
    return;
  }

#if !TARGET_OS_TV
  unsafeExecuteOnMainThreadSync(block);
#else
  dispatch_sync(dispatch_get_main_queue(), ^{
    block();
  });
#endif
}

static void RCTUnsafeExecuteOnMainQueueOnceSync(dispatch_once_t *onceToken, dispatch_block_t block)
{
  // The solution was borrowed from a post by Sophie Alpert:
  // https://sophiebits.com/2014/04/02/dispatch-once-initialization-on-the-main-thread
  // See also: https://www.mikeash.com/pyblog/friday-qa-2014-06-06-secrets-of-dispatch_once.html
  auto executeOnce = ^{
    dispatch_once(onceToken, block);
  };

  if (RCTIsMainQueue()) {
    executeOnce();
    return;
  }

  if (!DISPATCH_EXPECT(*onceToken == 0L, NO)) {
    return;
  }

#if !TARGET_OS_TV
  unsafeExecuteOnMainThreadSync(block);
#else
  dispatch_sync(dispatch_get_main_queue(), executeOnce);
#endif
}

CGFloat RCTScreenScale(void)
{
  static dispatch_once_t onceTokenScreenScale;
  static CGFloat screenScale;

  RCTUnsafeExecuteOnMainQueueOnceSync(&onceTokenScreenScale, ^{
    screenScale = [UITraitCollection currentTraitCollection].displayScale;
  });

  return screenScale;
}

CGFloat RCTFontSizeMultiplier(void)
{
  static NSDictionary<NSString *, NSNumber *> *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    mapping = @{
      UIContentSizeCategoryExtraSmall : @0.823,
      UIContentSizeCategorySmall : @0.882,
      UIContentSizeCategoryMedium : @0.941,
      UIContentSizeCategoryLarge : @1.0,
      UIContentSizeCategoryExtraLarge : @1.118,
      UIContentSizeCategoryExtraExtraLarge : @1.235,
      UIContentSizeCategoryExtraExtraExtraLarge : @1.353,
      UIContentSizeCategoryAccessibilityMedium : @1.786,
      UIContentSizeCategoryAccessibilityLarge : @2.143,
      UIContentSizeCategoryAccessibilityExtraLarge : @2.643,
      UIContentSizeCategoryAccessibilityExtraExtraLarge : @3.143,
      UIContentSizeCategoryAccessibilityExtraExtraExtraLarge : @3.571
    };
  });

  return mapping[RCTSharedApplication().preferredContentSizeCategory].floatValue;
}

#if !TARGET_OS_TV
UIDeviceOrientation RCTDeviceOrientation(void)
{
  return [[UIDevice currentDevice] orientation];
}
#endif

CGSize RCTScreenSize(void)
{
  static std::atomic<CGSize> cachedSize;
  __block CGSize size = cachedSize.load(std::memory_order_relaxed);

  if (CGSizeEqualToSize(size, CGSizeZero)) {
    RCTUnsafeExecuteOnMainQueueSync(^{
      CGSize screenSize = [UIScreen mainScreen].bounds.size;
      size = CGSizeMake(MIN(screenSize.width, screenSize.height), MAX(screenSize.width, screenSize.height));
      cachedSize.store(size, std::memory_order_relaxed);
    });
  }

#if !TARGET_OS_TV
  if (UIDeviceOrientationIsLandscape(RCTDeviceOrientation())) {
    return CGSizeMake(size.height, size.width);
  } else {
    return CGSizeMake(size.width, size.height);
  }
#else
  // tvOS doesn't have device orientation, always return landscape size
  return CGSizeMake(size.height, size.width);
#endif
}

CGSize RCTViewportSize(void)
{
  UIWindow *window = RCTKeyWindow();
  return window ? window.bounds.size : RCTScreenSize();
}

CGSize RCTSwitchSize(void)
{
#if TARGET_OS_TV
  return CGSizeMake(0, 0);
#else
  static CGSize rctSwitchSize;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTUnsafeExecuteOnMainQueueSync(^{
      rctSwitchSize = [UISwitch new].intrinsicContentSize;
    });
  });
  return rctSwitchSize;
#endif
}

CGFloat RCTRoundPixelValue(CGFloat value)
{
  CGFloat scale = RCTScreenScale();
  return round(value * scale) / scale;
}

CGFloat RCTCeilPixelValue(CGFloat value)
{
  CGFloat scale = RCTScreenScale();
  return ceil(value * scale) / scale;
}

CGSize RCTSizeInPixels(CGSize pointSize, CGFloat scale)
{
  return (CGSize){
      ceil(pointSize.width * scale),
      ceil(pointSize.height * scale),
  };
}

void RCTSwapClassMethods(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getClassMethod(cls, original);
  IMP originalImplementation = method_getImplementation(originalMethod);
  const char *originalArgTypes = method_getTypeEncoding(originalMethod);

  Method replacementMethod = class_getClassMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);

  if (class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    class_replaceMethod(cls, replacement, originalImplementation, originalArgTypes);
  } else {
    method_exchangeImplementations(originalMethod, replacementMethod);
  }
}

void RCTSwapInstanceMethods(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  IMP originalImplementation = method_getImplementation(originalMethod);
  const char *originalArgTypes = method_getTypeEncoding(originalMethod);

  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);

  if (class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    class_replaceMethod(cls, replacement, originalImplementation, originalArgTypes);
  } else {
    method_exchangeImplementations(originalMethod, replacementMethod);
  }
}

void RCTSwapInstanceMethodWithBlock(Class cls, SEL original, id replacementBlock, SEL replacementSelector)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  if (!originalMethod) {
    return;
  }

  IMP implementation = imp_implementationWithBlock(replacementBlock);
  class_addMethod(cls, replacementSelector, implementation, method_getTypeEncoding(originalMethod));
  Method newMethod = class_getInstanceMethod(cls, replacementSelector);
  method_exchangeImplementations(originalMethod, newMethod);
}

BOOL RCTClassOverridesClassMethod(Class cls, SEL selector)
{
  return RCTClassOverridesInstanceMethod(object_getClass(cls), selector);
}

BOOL RCTClassOverridesInstanceMethod(Class cls, SEL selector)
{
  unsigned int numberOfMethods;
  Method *methods = class_copyMethodList(cls, &numberOfMethods);
  for (unsigned int i = 0; i < numberOfMethods; i++) {
    if (method_getName(methods[i]) == selector) {
      free(methods);
      return YES;
    }
  }
  free(methods);
  return NO;
}

NSDictionary<NSString *, id> *
RCTMakeError(NSString *message, id __nullable toStringify, NSDictionary<NSString *, id> *__nullable extraData)
{
  if (toStringify) {
    message = [message stringByAppendingString:[toStringify description]];
  }

  NSMutableDictionary<NSString *, id> *error = [extraData mutableCopy] ?: [NSMutableDictionary new];
  error[@"message"] = message;
  return error;
}

NSDictionary<NSString *, id> *
RCTMakeAndLogError(NSString *message, id __nullable toStringify, NSDictionary<NSString *, id> *__nullable extraData)
{
  NSDictionary<NSString *, id> *error = RCTMakeError(message, toStringify, extraData);
  RCTLogError(@"\nError: %@", error);
  return error;
}

NSDictionary<NSString *, id> *RCTJSErrorFromNSError(NSError *error)
{
  NSString *codeWithDomain =
      [NSString stringWithFormat:@"E%@%lld", error.domain.uppercaseString, (long long)error.code];
  return RCTJSErrorFromCodeMessageAndNSError(codeWithDomain, error.localizedDescription, error);
}

// TODO: Can we just replace RCTMakeError with this function instead?
NSDictionary<NSString *, id> *
RCTJSErrorFromCodeMessageAndNSError(NSString *code, NSString *message, NSError *__nullable error)
{
  NSString *errorMessage;
  NSArray<NSString *> *stackTrace = [NSThread callStackSymbols];
  NSMutableDictionary *userInfo;
  NSMutableDictionary<NSString *, id> *errorInfo = [NSMutableDictionary dictionaryWithObject:stackTrace
                                                                                      forKey:@"nativeStackIOS"];

  if (error) {
    errorMessage = error.localizedDescription ?: @"Unknown error from a native module";
    errorInfo[@"domain"] = error.domain ?: RCTErrorDomain;
    if (error.userInfo) {
      userInfo = [error.userInfo mutableCopy];
      if (userInfo != nil && userInfo[NSUnderlyingErrorKey] != nil) {
        NSError *underlyingError = error.userInfo[NSUnderlyingErrorKey];
        NSString *underlyingCode = [NSString stringWithFormat:@"%d", (int)underlyingError.code];
        userInfo[NSUnderlyingErrorKey] =
            RCTJSErrorFromCodeMessageAndNSError(underlyingCode, @"underlying error", underlyingError);
      }
    }
  } else {
    errorMessage = @"Unknown error from a native module";
    errorInfo[@"domain"] = RCTErrorDomain;
    userInfo = nil;
  }
  errorInfo[@"code"] = code ?: RCTErrorUnspecified;
  errorInfo[@"userInfo"] = RCTNullIfNil(userInfo);

  // Allow for explicit overriding of the error message
  errorMessage = message ?: errorMessage;

  return RCTMakeError(errorMessage, nil, errorInfo);
}

BOOL RCTRunningInTestEnvironment(void)
{
  static BOOL isTestEnvironment = NO;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSDictionary *environment = [[NSProcessInfo processInfo] environment];
    isTestEnvironment = objc_lookUpClass("SenTestCase") || objc_lookUpClass("XCTest") ||
        objc_lookUpClass("SnapshotTestAppDelegate") || [environment[@"IS_TESTING"] boolValue];
  });
  return isTestEnvironment;
}

BOOL RCTRunningInAppExtension(void)
{
  return [[[[NSBundle mainBundle] bundlePath] pathExtension] isEqualToString:@"appex"];
}

UIApplication *__nullable RCTSharedApplication(void)
{
  if (RCTRunningInAppExtension()) {
    return nil;
  }
  return [[UIApplication class] performSelector:@selector(sharedApplication)];
}

UIWindow *__nullable RCTKeyWindow(void)
{
  if (RCTRunningInAppExtension()) {
    return nil;
  }

  NSSet<UIScene *> *connectedScenes = RCTSharedApplication().connectedScenes;

  UIScene *foregroundActiveScene;
  UIScene *foregroundInactiveScene;

  for (UIScene *scene in connectedScenes) {
    if (![scene isKindOfClass:[UIWindowScene class]]) {
      continue;
    }

    if (scene.activationState == UISceneActivationStateForegroundActive) {
      foregroundActiveScene = scene;
      break;
    }

    if (!foregroundInactiveScene && scene.activationState == UISceneActivationStateForegroundInactive) {
      foregroundInactiveScene = scene;
      // no break, we can have the active scene later in the set.
    }
  }

  UIScene *sceneToUse = foregroundActiveScene ? foregroundActiveScene : foregroundInactiveScene;

  if ([sceneToUse respondsToSelector:@selector(keyWindow)]) {
    // We have apps internally that might use UIScenes which are not window scenes.
    // Calling keyWindow on a UIScene which is not a UIWindowScene can cause a crash
    UIWindowScene *windowScene = (UIWindowScene *)sceneToUse;
    if (@available(iOS 15.0, tvOS 15.0, *)) {
      return windowScene.keyWindow;
    }
  }

  return nil;
}

#if !TARGET_OS_TV
UIStatusBarManager *__nullable RCTUIStatusBarManager(void)
{
  return RCTKeyWindow().windowScene.statusBarManager;
}
#endif

UIViewController *__nullable RCTPresentedViewController(void)
{
  if ([RCTUtilsUIOverride hasPresentedViewController]) {
    return [RCTUtilsUIOverride presentedViewController];
  }

  UIViewController *controller = RCTKeyWindow().rootViewController;
  UIViewController *presentedController = controller.presentedViewController;
  while (presentedController && ![presentedController isBeingDismissed]) {
    controller = presentedController;
    presentedController = controller.presentedViewController;
  }

  return controller;
}

BOOL RCTForceTouchAvailable(void)
{
  static BOOL forceSupported;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    forceSupported = [UITraitCollection currentTraitCollection].forceTouchCapability == UIForceTouchCapabilityAvailable;
  });

  return forceSupported;
}

NSError *RCTErrorWithMessage(NSString *message)
{
  NSDictionary<NSString *, id> *errorInfo = @{NSLocalizedDescriptionKey : message};
  return [[NSError alloc] initWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];
}

NSError *RCTErrorWithNSException(NSException *exception)
{
  NSString *message = [NSString stringWithFormat:@"NSException: %@; trace: %@.",
                                                 exception,
                                                 [[exception callStackSymbols] componentsJoinedByString:@";"]];
  NSDictionary<NSString *, id> *errorInfo =
      @{NSLocalizedDescriptionKey : message, RCTObjCStackTraceKey : [exception callStackSymbols]};
  return [[NSError alloc] initWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];
}

double RCTZeroIfNaN(double value)
{
  return isnan(value) || isinf(value) ? 0 : value;
}

double RCTSanitizeNaNValue(double value, NSString *property)
{
  if (!isnan(value) && !isinf(value)) {
    return value;
  }

  RCTLogWarn(@"The value `%@` equals NaN or INF and will be replaced by `0`.", property);
  return 0;
}

NSURL *RCTDataURL(NSString *mimeType, NSData *data)
{
  return [NSURL
      URLWithString:[NSString stringWithFormat:@"data:%@;base64,%@",
                                               mimeType,
                                               [data base64EncodedStringWithOptions:(NSDataBase64EncodingOptions)0]]];
}

extern "C" BOOL RCTIsGzippedData(NSData *__nullable /*data*/); // exposed for unit testing purposes
BOOL RCTIsGzippedData(NSData *__nullable data)
{
  UInt8 *bytes = (UInt8 *)data.bytes;
  return (data.length >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b);
}

static const NSUInteger RCTGZipChunkSize = 16384;

NSData *__nullable RCTGzipData(NSData *__nullable input, float level)
{
  if (input.length == 0 || RCTIsGzippedData(input)) {
    return input;
  }

  void *libz = dlopen("/usr/lib/libz.dylib", RTLD_LAZY);

  using DeflateInit2_ = int (*)(z_streamp, int, int, int, int, int, const char *, int);
  DeflateInit2_ deflateInit2_ = (DeflateInit2_)dlsym(libz, "deflateInit2_");

  using Deflate = int (*)(z_streamp, int);
  Deflate deflate = (Deflate)dlsym(libz, "deflate");

  using DeflateEnd = int (*)(z_streamp);
  DeflateEnd deflateEnd = (DeflateEnd)dlsym(libz, "deflateEnd");

  z_stream stream;
  stream.zalloc = Z_NULL;
  stream.zfree = Z_NULL;
  stream.opaque = Z_NULL;
  stream.avail_in = (uint)input.length;
  stream.next_in = (Bytef *)input.bytes;
  stream.total_out = 0;
  stream.avail_out = 0;

  NSMutableData *output = nil;
  int compression = (level < 0.0f) ? Z_DEFAULT_COMPRESSION : (int)(roundf(level * 9));
  if (deflateInit2(&stream, compression, Z_DEFLATED, 31, 8, Z_DEFAULT_STRATEGY) == Z_OK) {
    output = [NSMutableData dataWithLength:RCTGZipChunkSize];
    while (stream.avail_out == 0) {
      if (stream.total_out >= output.length) {
        output.length += RCTGZipChunkSize;
      }
      stream.next_out = (uint8_t *)output.mutableBytes + stream.total_out;
      stream.avail_out = (uInt)(output.length - stream.total_out);
      deflate(&stream, Z_FINISH);
    }
    deflateEnd(&stream);
    output.length = stream.total_out;
  }

  dlclose(libz);

  return output;
}

NSData *__nullable RCTDecompressGzipData(NSData *__nullable data, NSUInteger maxDecompressedSize)
{
  if (data.length == 0 || !RCTIsGzippedData(data)) {
    return data;
  }

  void *libz = dlopen("/usr/lib/libz.dylib", RTLD_LAZY);

  using InflateInit2_ = int (*)(z_streamp, int, const char *, int);
  InflateInit2_ inflateInit2_ = (InflateInit2_)dlsym(libz, "inflateInit2_");

  using Inflate = int (*)(z_streamp, int);
  Inflate inflate = (Inflate)dlsym(libz, "inflate");

  using InflateEnd = int (*)(z_streamp);
  InflateEnd inflateEnd = (InflateEnd)dlsym(libz, "inflateEnd");

  z_stream stream;
  stream.zalloc = Z_NULL;
  stream.zfree = Z_NULL;
  stream.opaque = Z_NULL;
  stream.avail_in = (uint)data.length;
  stream.next_in = (Bytef *)data.bytes;
  stream.total_out = 0;
  stream.avail_out = 0;

  NSMutableData *output = nil;
  // Use 31 for windowBits to enable gzip decoding (15 + 16)
  if (inflateInit2(&stream, 31) == Z_OK) {
    output = [NSMutableData dataWithLength:RCTGZipChunkSize];
    int status = Z_OK;
    while (status == Z_OK) {
      if (stream.total_out >= output.length) {
        output.length += RCTGZipChunkSize;
      }
      if (maxDecompressedSize > 0 && stream.total_out >= maxDecompressedSize) {
        inflateEnd(&stream);
        dlclose(libz);
        return nil;
      }
      stream.next_out = (uint8_t *)output.mutableBytes + stream.total_out;
      stream.avail_out = (uInt)(output.length - stream.total_out);
      status = inflate(&stream, Z_SYNC_FLUSH);
    }
    inflateEnd(&stream);
    if (status != Z_STREAM_END) {
      dlclose(libz);
      return nil;
    }
    output.length = stream.total_out;
  }

  dlclose(libz);

  return output;
}

static NSString *RCTRelativePathForURL(NSString *basePath, NSURL *__nullable URL)
{
  if (!URL.fileURL) {
    // Not a file path
    return nil;
  }
  NSString *path = [NSString stringWithUTF8String:[URL fileSystemRepresentation]];
  if (![path hasPrefix:basePath]) {
    // Not a bundle-relative file
    return nil;
  }
  path = [path substringFromIndex:basePath.length];
  if ([path hasPrefix:@"/"]) {
    path = [path substringFromIndex:1];
  }
  return path;
}

NSString *__nullable RCTLibraryPath(void)
{
  static NSString *libraryPath = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    libraryPath = [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) lastObject];
  });
  return libraryPath;
}

NSString *__nullable RCTHomePath(void)
{
  static NSString *homePath = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    homePath = NSHomeDirectory();
  });
  return homePath;
}

NSString *__nullable RCTBundlePathForURL(NSURL *__nullable URL)
{
  return RCTRelativePathForURL([[NSBundle mainBundle] resourcePath], URL);
}

NSString *__nullable RCTLibraryPathForURL(NSURL *__nullable URL)
{
  return RCTRelativePathForURL(RCTLibraryPath(), URL);
}

NSString *__nullable RCTHomePathForURL(NSURL *__nullable URL)
{
  return RCTRelativePathForURL(RCTHomePath(), URL);
}

static BOOL RCTIsImageAssetsPath(NSString *path)
{
  NSString *extension = [path pathExtension];
  return
      [extension isEqualToString:@"png"] || [extension isEqualToString:@"jpg"] || [extension isEqualToString:@"jpeg"];
}

BOOL RCTIsBundleAssetURL(NSURL *__nullable imageURL)
{
  return RCTIsImageAssetsPath(RCTBundlePathForURL(imageURL));
}

BOOL RCTIsLibraryAssetURL(NSURL *__nullable imageURL)
{
  return RCTIsImageAssetsPath(RCTLibraryPathForURL(imageURL));
}

BOOL RCTIsHomeAssetURL(NSURL *__nullable imageURL)
{
  return RCTIsImageAssetsPath(RCTHomePathForURL(imageURL));
}

BOOL RCTIsLocalAssetURL(NSURL *__nullable imageURL)
{
  return RCTIsBundleAssetURL(imageURL) || RCTIsHomeAssetURL(imageURL);
}

static NSString *bundleName(NSBundle *bundle)
{
  NSString *name = bundle.infoDictionary[@"CFBundleName"];
  if (!name) {
    name = [[bundle.bundlePath lastPathComponent] stringByDeletingPathExtension];
  }
  return name;
}

static NSBundle *bundleForPath(NSString *key)
{
  static NSMutableDictionary *bundleCache;
  if (!bundleCache) {
    bundleCache = [NSMutableDictionary new];
    bundleCache[@"main"] = [NSBundle mainBundle];

    // Initialize every bundle in the array
    for (NSString *path in [[NSBundle mainBundle] pathsForResourcesOfType:@"bundle" inDirectory:nil]) {
      [NSBundle bundleWithPath:path];
    }

    // The bundles initialized above will now also be in `allBundles`
    for (NSBundle *bundle in [NSBundle allBundles]) {
      bundleCache[bundleName(bundle)] = bundle;
    }
  }

  return bundleCache[key];
}

static BOOL RCTUseAssetCatalog(void)
{
  static BOOL useAssetCatalog = NO;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    useAssetCatalog = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTUseAssetCatalog"] boolValue];
  });
  return useAssetCatalog;
}

// The bundle react-native-xcode.sh compiles packager image assets into
// (RNAssets.bundle, an actool-compiled asset catalog inside the app).
static NSBundle *__nullable RCTAssetCatalogBundle(void)
{
  static NSBundle *bundle;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSURL *bundleURL = [[NSBundle mainBundle] URLForResource:@"RNAssets" withExtension:@"bundle"];
    if (bundleURL != nil) {
      bundle = [NSBundle bundleWithURL:bundleURL];
    }
  });
  return bundle;
}

NSString *__nullable RCTAssetCatalogNameForURL(NSURL *__nullable URL)
{
  // The "assets/" prefix the packager uses for all image assets. The CLI strips
  // it from the identifiers it names the imagesets with.
  constexpr NSUInteger assetsPrefixLength = sizeof("assets/") - 1;

  NSString *path = RCTBundlePathForURL(URL);
  // Packager assets always live under "assets/". Anything else (sub-bundles,
  // CodePush/OTA assets outside the main bundle) is not in the catalog.
  if (path == nil || ![path hasPrefix:@"assets/"]) {
    return nil;
  }

  // Other packager assets (gif, webp, ...) are copied as plain files and must
  // use the regular loader.
  if (!RCTIsImageAssetsPath(path)) {
    return nil;
  }

  // File system paths come back decomposed (NFD); restore the precomposed form
  // the packager saw on disk so non-ASCII characters filter out the same way
  // they do in the CLI's identifier.
  path = path.precomposedStringWithCanonicalMapping;

  const NSUInteger length = path.length;
  unichar stackBuffer[256];
  std::vector<unichar> heapBuffer;
  unichar *chars = stackBuffer;
  if (length > 256) {
    heapBuffer.resize(length);
    chars = heapBuffer.data();
  }
  [path getCharacters:chars range:NSMakeRange(0, length)];

  // Strip the file extension (guaranteed present by RCTIsImageAssetsPath) and
  // an optional "@<scale>x" suffix (integer or fractional, e.g. "@2x",
  // "@1.5x"). The catalog stores a single imageset per image and resolves the
  // scale by name at runtime, see
  // https://developer.apple.com/documentation/xcode/managing-assets-with-asset-catalogs
  NSUInteger end = length - 1;
  while (end > assetsPrefixLength && chars[end] != '.') {
    end--;
  }
  if (end > assetsPrefixLength && chars[end - 1] == 'x') {
    // Walk back over "@<digits>(.<digits>)?" ending at the "x".
    NSUInteger cursor = end - 1;
    while (cursor > assetsPrefixLength && chars[cursor - 1] >= '0' && chars[cursor - 1] <= '9') {
      cursor--;
    }
    if (cursor < end - 1) {
      if (chars[cursor - 1] == '@') {
        end = cursor - 1;
      } else if (chars[cursor - 1] == '.') {
        NSUInteger integerPart = cursor - 1;
        while (integerPart > assetsPrefixLength && chars[integerPart - 1] >= '0' && chars[integerPart - 1] <= '9') {
          integerPart--;
        }
        if (integerPart < cursor - 1 && chars[integerPart - 1] == '@') {
          end = integerPart - 1;
        }
      }
    }
  }

  // Build the identifier in place in a single pass: skip the "assets/" prefix,
  // lowercase, encode the folder structure with "_" and drop anything that is
  // not a valid identifier character, producing the same identifier as
  // getResourceIdentifier in the CLI, which names the imagesets.
  NSUInteger resultLength = 0;
  for (NSUInteger i = assetsPrefixLength; i < end; i++) {
    unichar c = chars[i];
    if (c == '/') {
      chars[resultLength++] = '_';
    } else if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_') {
      chars[resultLength++] = c;
    } else if (c >= 'A' && c <= 'Z') {
      chars[resultLength++] = c + ('a' - 'A');
    }
  }

  NSString *name = [NSString stringWithCharacters:chars length:resultLength];
  return name;
}

UIImage *__nullable RCTImageFromLocalBundleAssetURL(NSURL *imageURL)
{
  if (![imageURL.scheme isEqualToString:@"file"]) {
    // We only want to check for local file assets
    return nil;
  }
  // Get the bundle URL, and add the image URL
  // Note that we have to add both host and path, since host is the first "assets" part
  // while path is the rest of the URL
  NSURL *bundleImageUrl = [[[NSBundle mainBundle] bundleURL]
      URLByAppendingPathComponent:[imageURL.host stringByAppendingString:imageURL.path]];
  return RCTImageFromLocalAssetURL(bundleImageUrl);
}

UIImage *__nullable RCTImageFromLocalAssetURL(NSURL *imageURL)
{
  if (RCTUseAssetCatalog()) {
    NSString *catalogName = RCTAssetCatalogNameForURL(imageURL);
    if (catalogName != nil) {
      // The app opted into the asset catalog and this is a packager asset, so it
      // was compiled into RNAssets.bundle at build time. Trust the catalog and
      // return directly, keeping the common path a single lookup with no
      // filesystem fallback. Non-catalog assets (nil name) fall through below.
      NSBundle *assetCatalogBundle = RCTAssetCatalogBundle();
      if (assetCatalogBundle == nil) {
        // Passing a nil bundle to imageNamed:inBundle: would silently search the
        // main bundle instead, potentially resolving an unrelated app image.
        RCTLogError(
            @"RCTUseAssetCatalog is enabled but RNAssets.bundle was not found in the app. Image assets must be "
             "bundled by react-native-xcode.sh, which compiles them into the app at build time. (loading %@)",
            imageURL);
        return nil;
      }
      UIImage *image = [UIImage imageNamed:catalogName inBundle:assetCatalogBundle compatibleWithTraitCollection:nil];
      if (image == nil) {
        RCTLogError(
            @"Image \"%@\" (%@) was not found in the asset catalog. RCTUseAssetCatalog is enabled, "
             "so image assets must be compiled into the app's RNAssets.bundle at build time.",
            catalogName,
            imageURL);
      }
      return image;
    }
  }

  NSString *imageName = RCTBundlePathForURL(imageURL);

  NSBundle *bundle = nil;
  NSArray *imagePathComponents = [imageName pathComponents];
  if ([imagePathComponents count] > 1 &&
      [[[imagePathComponents firstObject] pathExtension] isEqualToString:@"bundle"]) {
    NSString *bundlePath = [imagePathComponents firstObject];
    bundle = bundleForPath([bundlePath stringByDeletingPathExtension]);
    imageName = [imageName substringFromIndex:(bundlePath.length + 1)];
  }

  UIImage *image = nil;
  if (imageName) {
    if (bundle) {
      image = [UIImage imageNamed:imageName inBundle:bundle compatibleWithTraitCollection:nil];
    } else {
      image = [UIImage imageNamed:imageName];
    }
  }

  if (!image) {
    // Attempt to load from the file system
    const char *fileSystemCString = [imageURL fileSystemRepresentation];
    if (fileSystemCString != NULL) {
      NSString *filePath = [NSString stringWithUTF8String:fileSystemCString];
      if (filePath.pathExtension.length == 0) {
        filePath = [filePath stringByAppendingPathExtension:@"png"];
      }
      image = [UIImage imageWithContentsOfFile:filePath];
    }
  }

  if (!image && !bundle) {
    // We did not find the image in the mainBundle, check in other shipped frameworks.
    NSArray<NSURL *> *possibleFrameworks =
        [[NSFileManager defaultManager] contentsOfDirectoryAtURL:[[NSBundle mainBundle] privateFrameworksURL]
                                      includingPropertiesForKeys:@[]
                                                         options:0
                                                           error:nil];
    for (NSURL *frameworkURL in possibleFrameworks) {
      bundle = [NSBundle bundleWithURL:frameworkURL];
      image = [UIImage imageNamed:imageName inBundle:bundle compatibleWithTraitCollection:nil];
      if (image) {
        RCTLogWarn(@"Image %@ not found in mainBundle, but found in %@", imageName, bundle);
        break;
      }
    }
  }
  return image;
}

RCT_EXTERN NSString *__nullable RCTTempFilePath(NSString *extension, NSError **error)
{
  static NSError *setupError = nil;
  static NSString *directory;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    directory = [NSTemporaryDirectory() stringByAppendingPathComponent:@"ReactNative"];
    // If the temporary directory already exists, we'll delete it to ensure
    // that temp files from the previous run have all been deleted. This is not
    // a security measure, it simply prevents the temp directory from using too
    // much space, as the circumstances under which iOS clears it automatically
    // are not well-defined.
    NSFileManager *fileManager = [NSFileManager new];
    if ([fileManager fileExistsAtPath:directory]) {
      [fileManager removeItemAtPath:directory error:NULL];
    }
    if (![fileManager fileExistsAtPath:directory]) {
      NSError *localError = nil;
      if (![fileManager createDirectoryAtPath:directory
                  withIntermediateDirectories:YES
                                   attributes:nil
                                        error:&localError]) {
        // This is bad
        RCTLogError(@"Failed to create temporary directory: %@", localError);
        setupError = localError;
        directory = nil;
      }
    }
  });

  if (!directory || setupError) {
    if (error) {
      *error = setupError;
    }
    return nil;
  }

  // Append a unique filename
  NSString *filename = [NSUUID new].UUIDString;
  if (extension) {
    filename = [filename stringByAppendingPathExtension:extension];
  }
  return [directory stringByAppendingPathComponent:filename];
}

RCT_EXTERN void RCTGetRGBAColorComponents(CGColorRef color, CGFloat rgba[4])
{
  CGColorSpaceModel model = CGColorSpaceGetModel(CGColorGetColorSpace(color));
  const CGFloat *components = CGColorGetComponents(color);
  switch (model) {
    case kCGColorSpaceModelMonochrome: {
      rgba[0] = components[0];
      rgba[1] = components[0];
      rgba[2] = components[0];
      rgba[3] = components[1];
      break;
    }
    case kCGColorSpaceModelRGB: {
      rgba[0] = components[0];
      rgba[1] = components[1];
      rgba[2] = components[2];
      rgba[3] = components[3];
      break;
    }
    case kCGColorSpaceModelCMYK:
    case kCGColorSpaceModelDeviceN:
    case kCGColorSpaceModelIndexed:
    case kCGColorSpaceModelLab:
    case kCGColorSpaceModelPattern:
    case kCGColorSpaceModelUnknown:
    // TODO: kCGColorSpaceModelXYZ should be added sometime after Xcode 10 release.
    default: {
#if RCT_DEBUG
      // unsupported format
      RCTLogError(@"Unsupported color model: %i", model);
#endif

      rgba[0] = 0.0;
      rgba[1] = 0.0;
      rgba[2] = 0.0;
      rgba[3] = 1.0;
      break;
    }
  }
}

NSString *RCTColorToHexString(CGColorRef color)
{
  CGFloat rgba[4];
  RCTGetRGBAColorComponents(color, rgba);
  uint8_t r = rgba[0] * 255;
  uint8_t g = rgba[1] * 255;
  uint8_t b = rgba[2] * 255;
  uint8_t a = rgba[3] * 255;
  if (a < 255) {
    return [NSString stringWithFormat:@"#%02x%02x%02x%02x", r, g, b, a];
  } else {
    return [NSString stringWithFormat:@"#%02x%02x%02x", r, g, b];
  }
}

// (https://github.com/0xced/XCDFormInputAccessoryView/blob/master/XCDFormInputAccessoryView/XCDFormInputAccessoryView.m#L10-L14)
NSString *RCTUIKitLocalizedString(NSString *string)
{
  NSBundle *UIKitBundle = [NSBundle bundleForClass:[UIApplication class]];
  return UIKitBundle ? [UIKitBundle localizedStringForKey:string value:string table:nil] : string;
}

NSString *RCTHumanReadableType(NSObject *obj)
{
  if ([obj isKindOfClass:[NSString class]]) {
    return @"string";
  } else if ([obj isKindOfClass:[NSNumber class]]) {
    int intVal = [(NSNumber *)obj intValue];
    if (intVal == 0 || intVal == 1) {
      return @"boolean or number";
    }

    return @"number";
  } else {
    return NSStringFromClass([obj class]);
  }
}

NSString *__nullable RCTGetURLQueryParam(NSURL *__nullable URL, NSString *param)
{
  RCTAssertParam(param);
  if (!URL) {
    return nil;
  }

  NSURLComponents *components = [NSURLComponents componentsWithURL:URL resolvingAgainstBaseURL:YES];
  for (NSURLQueryItem *queryItem in [components.queryItems reverseObjectEnumerator]) {
    if ([queryItem.name isEqualToString:param]) {
      return queryItem.value;
    }
  }

  return nil;
}

NSURL *__nullable RCTURLByReplacingQueryParam(NSURL *__nullable URL, NSString *param, NSString *__nullable value)
{
  RCTAssertParam(param);
  if (!URL) {
    return nil;
  }

  NSURLComponents *components = [NSURLComponents componentsWithURL:URL resolvingAgainstBaseURL:YES];

  __block NSInteger paramIndex = NSNotFound;
  NSMutableArray<NSURLQueryItem *> *queryItems = [components.queryItems mutableCopy];
  [queryItems enumerateObjectsWithOptions:NSEnumerationReverse
                               usingBlock:^(NSURLQueryItem *item, NSUInteger i, BOOL *stop) {
                                 if ([item.name isEqualToString:param]) {
                                   paramIndex = i;
                                   *stop = YES;
                                 }
                               }];

  if (!value) {
    if (paramIndex != NSNotFound) {
      [queryItems removeObjectAtIndex:paramIndex];
    }
  } else {
    NSURLQueryItem *newItem = [NSURLQueryItem queryItemWithName:param value:value];
    if (paramIndex == NSNotFound) {
      [queryItems addObject:newItem];
    } else {
      [queryItems replaceObjectAtIndex:paramIndex withObject:newItem];
    }
  }
  components.queryItems = queryItems;
  return components.URL;
}

RCT_EXTERN NSString *RCTDropReactPrefixes(NSString *s)
{
  if ([s hasPrefix:@"RK"]) {
    return [s substringFromIndex:2];
  } else if ([s hasPrefix:@"RCT"]) {
    return [s substringFromIndex:3];
  }

  return s;
}

RCT_EXTERN BOOL RCTUIManagerTypeForTagIsFabric(NSNumber *reactTag)
{
  // See https://github.com/facebook/react/pull/12587
  return [reactTag integerValue] % 2 == 0;
}

RCT_EXTERN BOOL RCTValidateTypeOfViewCommandArgument(
    NSObject *obj,
    id expectedClass,
    const NSString *expectedType,
    const NSString *componentName,
    const NSString *commandName,
    const NSString *argPos)
{
  if (![obj isKindOfClass:expectedClass]) {
    __unused NSString *kindOfClass = RCTHumanReadableType(obj);

    RCTLogError(
        @"%@ command %@ received %@ argument of type %@, expected %@.",
        componentName,
        commandName,
        argPos,
        kindOfClass,
        expectedType);
    return false;
  }

  return true;
}

BOOL RCTIsAppActive(void)
{
  return [RCTSharedApplication() applicationState] == UIApplicationStateActive;
}
