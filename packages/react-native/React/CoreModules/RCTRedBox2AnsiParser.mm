/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBox2AnsiParser+Internal.h"

#import <React/RCTDefines.h>
#import <react/debug/redbox/AnsiParser.h>

#if RCT_DEV_MENU

using facebook::react::unstable_redbox::AnsiColor;
using facebook::react::unstable_redbox::parseAnsi;

static UIColor *RCTUIColorFromAnsiColor(const AnsiColor &c)
{
  return [UIColor colorWithRed:c.r / 255.0 green:c.g / 255.0 blue:c.b / 255.0 alpha:1.0];
}

@implementation RCTRedBox2AnsiParser

+ (NSAttributedString *)attributedStringFromAnsiText:(NSString *)text baseFont:(UIFont *)font baseColor:(UIColor *)color
{
  if (text == nil) {
    return [[NSAttributedString alloc] init];
  }

  auto spans = parseAnsi(text.UTF8String);
  NSMutableAttributedString *result = [NSMutableAttributedString new];
  NSDictionary *baseAttributes = @{NSFontAttributeName : font, NSForegroundColorAttributeName : color};

  for (const auto &span : spans) {
    NSString *str = [NSString stringWithUTF8String:span.text.c_str()];
    if (str == nil) {
      continue;
    }
    NSMutableDictionary *attrs = [baseAttributes mutableCopy];
    if (span.foregroundColor.has_value()) {
      attrs[NSForegroundColorAttributeName] = RCTUIColorFromAnsiColor(*span.foregroundColor);
    }
    if (span.backgroundColor.has_value()) {
      attrs[NSBackgroundColorAttributeName] = RCTUIColorFromAnsiColor(*span.backgroundColor);
    }
    [result appendAttributedString:[[NSAttributedString alloc] initWithString:str attributes:attrs]];
  }

  return result;
}

@end

#endif
