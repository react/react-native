/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIView+ColorOverlays.h"

@implementation UIView (ColorOverlays)

- (void)setBackgroundColorWithColorString:(NSString *)colorString
{
  const char *colorUTF8 = [colorString UTF8String];
  UIColor *color = [UIView UIColorFromHexString:std::string(colorUTF8 != nullptr ? colorUTF8 : "")];
  self.backgroundColor = color;
}

- (void)addColorOverlays:(const NSArray *)overlayColors
{
  CGRect viewBounds = self.bounds;
  CGFloat width = viewBounds.size.width / [overlayColors count];
  for (int i = 0; i < [overlayColors count]; i++) {
    id colorString = [overlayColors objectAtIndex:i];
    CGRect rect = CGRectMake(viewBounds.origin.x + width * i, viewBounds.origin.y, width, viewBounds.size.height);
    UIView *overlayView = [[UIView alloc] initWithFrame:rect];
    const char *colorUTF8 = [colorString UTF8String];
    UIColor *color = [UIView UIColorFromHexString:std::string(colorUTF8 != nullptr ? colorUTF8 : "")];
    overlayView.backgroundColor = color;
    [self addSubview:overlayView];
  }
}

- (void)removeOverlays
{
  NSArray *viewsToRemove = [self subviews];
  for (UIView *subview in viewsToRemove) {
    [subview removeFromSuperview];
  }
}

+ (UIColor *)UIColorFromHexString:(const std::string)hexString
{
  unsigned rgbValue = 0;
  NSString *colorString = [NSString stringWithCString:hexString.c_str() encoding:[NSString defaultCStringEncoding]];
  NSScanner *scanner = [NSScanner scannerWithString:colorString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0
                         green:((rgbValue & 0xFF00) >> 8) / 255.0
                          blue:(rgbValue & 0xFF) / 255.0
                         alpha:1.0];
}

@end
