/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTI18nUtil.h"

#import <UIKit/UIKit.h>

@implementation RCTI18nUtil {
  BOOL _isRTLSupported;
  BOOL _isRTLForced;
}

+ (instancetype)sharedInstance
{
  static RCTI18nUtil *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
  });

  return sharedInstance;
}

- (instancetype)init
{
  if (self = [super init]) {
    _isRTLSupported = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTSupportsRTL"] boolValue];
    _isRTLForced = NO;
  }
  return self;
}

/**
 * Check if the app is currently running on an RTL locale.
 * Always false unless `RCTSupportsRTL` is true in Info.plist.
 * Otherwise, this only happens when the app:
 * - is forcing RTL layout, regardless of the active language (for development purpose)
 * - or is using an RTL locale
 */
- (BOOL)isRTL
{
  if (!_isRTLSupported) {
    return NO;
  }
  if ([self isRTLForced]) {
    return YES;
  }
  if ([self isApplicationPreferredLanguageRTL]) {
    return YES;
  }
  return NO;
}

/**
 * Could be used to test RTL layout with English
 * Used for development and testing purpose
 */
- (BOOL)isRTLForced
{
  return _isRTLForced;
}

- (void)forceRTL:(BOOL)rtlStatus
{
  _isRTLForced = rtlStatus;
}

// Check if the current device language is RTL
- (BOOL)isDevicePreferredLanguageRTL
{
  NSLocaleLanguageDirection direction =
      [NSLocale characterDirectionForLanguage:[[NSLocale preferredLanguages] objectAtIndex:0]];
  return direction == NSLocaleLanguageDirectionRightToLeft;
}

// Intersect Xcode "Localization" languages with the system languages and checks if the result is using RTL
// For RTL support, app must add an RTL lang to .pbxproj's knownRegions = ( ... )
// and user must have chosen an RTL language
- (BOOL)isApplicationPreferredLanguageRTL
{
  NSWritingDirection direction = [NSParagraphStyle defaultWritingDirectionForLanguage:nil];
  return direction == NSWritingDirectionRightToLeft;
}

@end
