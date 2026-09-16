/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLocalizedString.h"

#import <React/RCTLog.h>

#if !defined(WITH_FBI18N) || !(WITH_FBI18N)

// Anchors resource lookups to the bundle that contains this code: React.framework
// when React Native is consumed prebuilt / via SwiftPM, or the app's main bundle
// for static source builds.
@interface RCTI18nStringsAnchor : NSObject
@end
@implementation RCTI18nStringsAnchor
@end

// Resolves RCTI18nStrings.bundle wherever it ships: the code's own bundle first
// (prebuilt/SwiftPM embed it inside React.framework), then the app's main bundle
// (source builds copy it there via the podspec resource_bundles). Returns nil
// when absent, so the caller falls back to the untranslated default value.
static NSBundle *RCTI18nStringsBundle(void)
{
  NSBundle *codeBundle = [NSBundle bundleForClass:[RCTI18nStringsAnchor class]];
  NSURL *url = [codeBundle URLForResource:@"RCTI18nStrings" withExtension:@"bundle"];
  if (url != nil) {
    return [NSBundle bundleWithURL:url];
  }
  NSString *mainPath = [[NSBundle mainBundle] pathForResource:@"RCTI18nStrings" ofType:@"bundle"];
  if (mainPath != nil) {
    return [NSBundle bundleWithPath:mainPath];
  }
#if RCT_DEV
  // Missing resources are otherwise silent (every lookup falls back to the
  // untranslated default and the privacy manifest quietly drops out of the
  // app's aggregated privacy report). Called once — the caller caches.
  RCTLogWarn(
      @"RCTI18nStrings.bundle not found in React.framework or the app bundle. Localized strings will use their "
      @"untranslated defaults, and React's PrivacyInfo.xcprivacy may be missing from the app's privacy report. "
      @"When consuming the prebuilt React.framework, verify it is embedded into the app with its resources intact.");
#endif
  return nil;
}

extern "C" {

static NSString *FBTStringByConvertingIntegerToBase64(uint64_t number)
{
  const NSUInteger base = 64;
  const char *symbols = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
  char converted[9]; // output will take at most 8 symbols
  char *p = converted + sizeof(converted) - 1;
  *p = 0;
  do {
    *--p = symbols[number % base];
    number = number / base;
  } while (number > 0);
  return [[NSString alloc] initWithCString:p encoding:NSASCIIStringEncoding];
}

__attribute__((noinline)) uint64_t FBcoreLocalexxHash48(const char *input, uint64_t length, uint64_t seed)
{
  const uint64_t k48BitsMask = 0xffffffffffffL;
  return FBxxHash64(input, length, seed) & k48BitsMask;
}

NSString *RCTLocalizedStringFromKey(uint64_t key, NSString *defaultValue)
{
  static NSBundle *bundle = RCTI18nStringsBundle();
  if (bundle == nil) {
    return defaultValue;
  } else {
    return [bundle localizedStringForKey:FBTStringByConvertingIntegerToBase64(key) value:defaultValue table:nil];
  }
}
}

#endif
