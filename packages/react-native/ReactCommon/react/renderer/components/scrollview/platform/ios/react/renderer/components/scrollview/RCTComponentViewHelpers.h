/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTScrollViewProtocol <NSObject>
- (void)flashScrollIndicators;
- (void)scrollTo:(double)x y:(double)y animated:(BOOL)animated;
- (void)scrollToEnd:(BOOL)animated;
- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated;
@end

RCT_EXTERN inline void
RCTScrollViewHandleCommand(id<RCTScrollViewProtocol> componentView, const NSString *commandName, const NSArray *args)
{
  if ([commandName isEqualToString:@"flashScrollIndicators"]) {
#if RCT_DEBUG
    if ([args count] != 0) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"ScrollView", commandName, (int)[args count], 1);
      return;
    }
#endif

    [componentView flashScrollIndicators];
    return;
  }

  if ([commandName isEqualToString:@"scrollTo"]) {
#if RCT_DEBUG
    if ([args count] != 3) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"ScrollView", commandName, (int)[args count], 3);
      return;
    }
#endif

    NSObject *arg0 = args[0];
#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(arg0, [NSNumber class], @"float", @"ScrollView", commandName, @"1st")) {
      return;
    }
#endif
    NSObject *arg1 = args[1];
#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(arg1, [NSNumber class], @"float", @"ScrollView", commandName, @"2nd")) {
      return;
    }
#endif
    NSObject *arg2 = args[2];
#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(arg2, [NSNumber class], @"boolean", @"ScrollView", commandName, @"3rd")) {
      return;
    }
#endif

    double x = [(NSNumber *)arg0 doubleValue];
    double y = [(NSNumber *)arg1 doubleValue];
    BOOL animated = [(NSNumber *)arg2 boolValue];

    [componentView scrollTo:x y:y animated:animated];
    return;
  }

  if ([commandName isEqualToString:@"scrollToEnd"]) {
#if RCT_DEBUG
    if ([args count] != 1) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"ScrollView", commandName, (int)[args count], 1);
      return;
    }
#endif

    NSObject *arg0 = args[0];
#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(arg0, [NSNumber class], @"boolean", @"ScrollView", commandName, @"1st")) {
      return;
    }
#endif

    BOOL animated = [(NSNumber *)arg0 boolValue];

    [componentView scrollToEnd:animated];
    return;
  }

  if ([commandName isEqualToString:@"zoomToRect"]) {
#if RCT_DEBUG
    if ([args count] != 2) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"ScrollView", commandName, (int)[args count], 2);
      return;
    }
#endif

    NSObject *arg0 = args[0];

#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(
            arg0, [NSDictionary class], @"dictionary", @"ScrollView", commandName, @"1st")) {
      return;
    }
#endif

    NSDictionary *rectDict = (NSDictionary *)arg0;
    NSNumber *x = rectDict[@"x"];
    NSNumber *y = rectDict[@"y"];
    NSNumber *width = rectDict[@"width"];
    NSNumber *height = rectDict[@"height"];
    CGRect rect = CGRectMake(x.doubleValue, y.doubleValue, width.doubleValue, height.doubleValue);

    NSObject *arg1 = args[1];
#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(arg1, [NSNumber class], @"boolean", @"ScrollView", commandName, @"2nd")) {
      return;
    }
#endif

    BOOL animated = [(NSNumber *)arg1 boolValue];
    [componentView zoomToRect:rect animated:animated];
    return;
  }
}

NS_ASSUME_NONNULL_END
