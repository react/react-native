/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPlatformColorUtils.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <react/renderer/graphics/HostPlatformColor.h>
#import <react/utils/ManagedObjectWrapper.h>

#include <string>

NS_ASSUME_NONNULL_BEGIN

static NSString *const kColorSuffix = @"Color";
static NSString *const kFallbackARGBKey = @"fallback-argb";

static NSDictionary<NSString *, NSDictionary *> *_PlatformColorSelectorsDict()
{
  static NSDictionary<NSString *, NSDictionary *> *dict;
  static dispatch_once_t once_token;
  dispatch_once(&once_token, ^(void) {
    dict = @{
      // https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
      // Label Colors
      @"label" : @{
        kFallbackARGBKey : @(0xFF000000) // iOS 13.0
      },
      @"secondaryLabel" : @{
        kFallbackARGBKey : @(0x993c3c43) // iOS 13.0
      },
      @"tertiaryLabel" : @{
        kFallbackARGBKey : @(0x4c3c3c43) // iOS 13.0
      },
      @"quaternaryLabel" : @{
        kFallbackARGBKey : @(0x2d3c3c43) // iOS 13.0
      },
      // Fill Colors
      @"systemFill" : @{
        kFallbackARGBKey : @(0x33787880) // iOS 13.0
      },
      @"secondarySystemFill" : @{
        kFallbackARGBKey : @(0x28787880) // iOS 13.0
      },
      @"tertiarySystemFill" : @{
        kFallbackARGBKey : @(0x1e767680) // iOS 13.0
      },
      @"quaternarySystemFill" : @{
        kFallbackARGBKey : @(0x14747480) // iOS 13.0
      },
      // Text Colors
      @"placeholderText" : @{
        kFallbackARGBKey : @(0x4c3c3c43) // iOS 13.0
      },
      // Standard Content Background Colors
      @"systemBackground" : @{
        kFallbackARGBKey : @(0xFFffffff) // iOS 13.0
      },
      @"secondarySystemBackground" : @{
        kFallbackARGBKey : @(0xFFf2f2f7) // iOS 13.0
      },
      @"tertiarySystemBackground" : @{
        kFallbackARGBKey : @(0xFFffffff) // iOS 13.0
      },
      // Grouped Content Background Colors
      @"systemGroupedBackground" : @{
        kFallbackARGBKey : @(0xFFf2f2f7) // iOS 13.0
      },
      @"secondarySystemGroupedBackground" : @{
        kFallbackARGBKey : @(0xFFffffff) // iOS 13.0
      },
      @"tertiarySystemGroupedBackground" : @{
        kFallbackARGBKey : @(0xFFf2f2f7) // iOS 13.0
      },
      // Separator Colors
      @"separator" : @{
        kFallbackARGBKey : @(0x493c3c43) // iOS 13.0
      },
      @"opaqueSeparator" : @{
        kFallbackARGBKey : @(0xFFc6c6c8) // iOS 13.0
      },
      // Link Color
      @"link" : @{
        kFallbackARGBKey : @(0xFF007aff) // iOS 13.0
      },
      // Nonadaptable Colors
      @"darkText" : @{},
      @"lightText" : @{},
      // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
      // Adaptable Colors
      @"systemBlue" : @{},
      @"systemBrown" : @{
        kFallbackARGBKey : @(0xFFa2845e) // iOS 13.0
      },
      @"systemCyan" : @{},
      @"systemGreen" : @{},
      @"systemIndigo" : @{
        kFallbackARGBKey : @(0xFF5856d6) // iOS 13.0
      },
      @"systemMint" : @{},
      @"systemOrange" : @{},
      @"systemPink" : @{},
      @"systemPurple" : @{},
      @"systemRed" : @{},
      @"systemTeal" : @{},
      @"systemYellow" : @{},
      // Adaptable Gray Colors
      @"systemGray" : @{},
      @"systemGray2" : @{
        kFallbackARGBKey : @(0xFFaeaeb2) // iOS 13.0
      },
      @"systemGray3" : @{
        kFallbackARGBKey : @(0xFFc7c7cc) // iOS 13.0
      },
      @"systemGray4" : @{
        kFallbackARGBKey : @(0xFFd1d1d6) // iOS 13.0
      },
      @"systemGray5" : @{
        kFallbackARGBKey : @(0xFFe5e5ea) // iOS 13.0
      },
      @"systemGray6" : @{
        kFallbackARGBKey : @(0xFFf2f2f7) // iOS 13.0
      },
      // Transparent Color
      @"clear" : @{
        kFallbackARGBKey : @(0x00000000) // iOS 13.0
      },
    };
  });
  return dict;
}

static UIColor *_UIColorFromHexValue(NSNumber *hexValue)
{
  NSUInteger hexIntValue = [hexValue unsignedIntegerValue];

  CGFloat red = ((CGFloat)((hexIntValue & 0xFF000000) >> 24)) / 255.0;
  CGFloat green = ((CGFloat)((hexIntValue & 0xFF0000) >> 16)) / 255.0;
  CGFloat blue = ((CGFloat)((hexIntValue & 0xFF00) >> 8)) / 255.0;
  CGFloat alpha = ((CGFloat)(hexIntValue & 0xFF)) / 255.0;

  return [UIColor colorWithRed:red green:green blue:blue alpha:alpha];
}

static UIColor *_Nullable _UIColorFromSemanticString(NSString *semanticString)
{
  NSString *platformColorString = [semanticString hasSuffix:kColorSuffix]
      ? [semanticString substringToIndex:[semanticString length] - [kColorSuffix length]]
      : semanticString;
  NSDictionary<NSString *, NSDictionary *> *platformColorSelectorsDict = _PlatformColorSelectorsDict();
  NSDictionary<NSString *, id> *colorInfo = platformColorSelectorsDict[platformColorString];
  if (colorInfo != nullptr) {
    SEL objcColorSelector = NSSelectorFromString([platformColorString stringByAppendingString:kColorSuffix]);
    if (![UIColor respondsToSelector:objcColorSelector]) {
      NSNumber *fallbackRGB = colorInfo[kFallbackARGBKey];
      if (fallbackRGB != nullptr) {
        return _UIColorFromHexValue(fallbackRGB);
      }
    } else {
      Class uiColorClass = [UIColor class];
      IMP imp = [uiColorClass methodForSelector:objcColorSelector];
      id (*getUIColor)(id, SEL) = ((id (*)(id, SEL))imp);
      id colorObject = getUIColor(uiColorClass, objcColorSelector);
      if ([colorObject isKindOfClass:[UIColor class]]) {
        return colorObject;
      }
    }
  }
  return nil;
}

static inline NSString *_NSStringFromCString(
    const std::string &string,
    const NSStringEncoding &encoding = NSUTF8StringEncoding)
{
  return [NSString stringWithCString:string.c_str() encoding:encoding];
}

static inline facebook::react::ColorComponents _ColorComponentsFromUIColor(UIColor *color)
{
  CGFloat rgba[4];
  [color getRed:&rgba[0] green:&rgba[1] blue:&rgba[2] alpha:&rgba[3]];
  return {.red = (float)rgba[0], .green = (float)rgba[1], .blue = (float)rgba[2], .alpha = (float)rgba[3]};
}

facebook::react::ColorComponents RCTPlatformColorComponentsFromSemanticItems(std::vector<std::string> &semanticItems)
{
  return _ColorComponentsFromUIColor(RCTPlatformColorFromSemanticItems(semanticItems));
}

UIColor *_Nullable RCTPlatformColorFromSemanticItemsOrNil(std::vector<std::string> &semanticItems)
{
  for (const auto &semanticCString : semanticItems) {
    NSString *semanticNSString = _NSStringFromCString(semanticCString);
    UIColor *uiColor = [UIColor colorNamed:semanticNSString];
    if (uiColor != nil) {
      return uiColor;
    }
    uiColor = _UIColorFromSemanticString(semanticNSString);
    if (uiColor != nil) {
      return uiColor;
    }
  }

  return nil;
}

UIColor *RCTPlatformColorFromSemanticItems(std::vector<std::string> &semanticItems)
{
  // Non-null contract (e.g. for RCTPlatformColorComponentsFromSemanticItems);
  // callers needing to detect a miss use the OrNil variant.
  UIColor *uiColor = RCTPlatformColorFromSemanticItemsOrNil(semanticItems);
  return uiColor != nil ? uiColor : UIColor.clearColor;
}

UIColor *RCTPlatformColorFromColor(const facebook::react::Color &color)
{
  return (UIColor *)facebook::react::unwrapManagedObject(color.getUIColor());
}

NS_ASSUME_NONNULL_END
