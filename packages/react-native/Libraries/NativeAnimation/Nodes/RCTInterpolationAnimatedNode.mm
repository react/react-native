/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInterpolationAnimatedNode.h"

#import <React/RCTAnimationUtils.h>
#import <React/RCTConvert.h>

typedef NS_ENUM(NSInteger, RCTInterpolationOutputType) {
  RCTInterpolationOutputNumber,
  RCTInterpolationOutputColor,
  RCTInterpolationOutputString,
};

static NSRegularExpression *getNumericComponentRegex(void)
{
  static NSRegularExpression *regex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *fpRegex = @"[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?";
    regex = [NSRegularExpression regularExpressionWithPattern:fpRegex
                                                      options:NSRegularExpressionCaseInsensitive
                                                        error:nil];
  });
  return regex;
}

static NSArray<NSArray<NSNumber *> *> *outputFromStringPattern(NSString *input)
{
  NSMutableArray *output = [NSMutableArray array];
  [getNumericComponentRegex()
      enumerateMatchesInString:input
                       options:0
                         range:NSMakeRange(0, input.length)
                    usingBlock:^(NSTextCheckingResult *_Nullable result, NSMatchingFlags flags, BOOL *_Nonnull stop) {
                      [output addObject:@([[input substringWithRange:result.range] doubleValue])];
                    }];
  return output;
}

NSString *RCTInterpolateString(
    NSString *pattern,
    CGFloat inputValue,
    NSArray<NSNumber *> *inputRange,
    NSArray<NSArray<NSNumber *> *> *outputRange,
    NSString *extrapolateLeft,
    NSString *extrapolateRight)
{
  NSUInteger rangeIndex = RCTFindIndexOfNearestValue(inputValue, inputRange);

  NSMutableString *output = [NSMutableString stringWithString:pattern];
  NSArray<NSTextCheckingResult *> *matches =
      [getNumericComponentRegex() matchesInString:pattern options:0 range:NSMakeRange(0, pattern.length)];
  NSInteger matchIndex = matches.count - 1;
  for (NSTextCheckingResult *match in [matches reverseObjectEnumerator]) {
    CGFloat val = RCTInterpolateValue(
        inputValue,
        [inputRange[rangeIndex] doubleValue],
        [inputRange[rangeIndex + 1] doubleValue],
        [outputRange[rangeIndex][matchIndex] doubleValue],
        [outputRange[rangeIndex + 1][matchIndex] doubleValue],
        extrapolateLeft,
        extrapolateRight);
    [output replaceCharactersInRange:match.range withString:[@(val) stringValue]];
    matchIndex--;
  }
  return output;
}

@implementation RCTInterpolationAnimatedNode {
  __weak RCTValueAnimatedNode *_parentNode;
  NSArray<NSNumber *> *_inputRange;
  NSArray *_outputRange;
  NSString *_extrapolateLeft;
  NSString *_extrapolateRight;
  RCTInterpolationOutputType _outputType;
  id _Nullable _outputvalue;
  NSString *_Nullable _outputPattern;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config]) != nullptr) {
    _inputRange = config[@"inputRange"];

    NSArray *outputRangeConfig = config[@"outputRange"];
    if ([config[@"outputType"] isEqual:@"color"]) {
      _outputType = RCTInterpolationOutputColor;
    } else if ([outputRangeConfig[0] isKindOfClass:[NSString class]]) {
      _outputType = RCTInterpolationOutputString;
      _outputPattern = outputRangeConfig[0];
    } else {
      _outputType = RCTInterpolationOutputNumber;
    }

    NSMutableArray *outputRange = [NSMutableArray arrayWithCapacity:outputRangeConfig.count];
    for (id value in outputRangeConfig) {
      switch (_outputType) {
        case RCTInterpolationOutputColor: {
          UIColor *color = [RCTConvert UIColor:value];
          [outputRange addObject:(color != nullptr) ? color : [UIColor whiteColor]];
          break;
        }
        case RCTInterpolationOutputString:
          [outputRange addObject:outputFromStringPattern(value)];
          break;
        case RCTInterpolationOutputNumber:
          [outputRange addObject:value];
          break;
      }
    }
    _outputRange = outputRange;
    _extrapolateLeft = config[@"extrapolateLeft"];
    _extrapolateRight = config[@"extrapolateRight"];
  }
  return self;
}

- (void)onAttachedToNode:(RCTAnimatedNode *)parent
{
  [super onAttachedToNode:parent];
  if ([parent isKindOfClass:[RCTValueAnimatedNode class]]) {
    _parentNode = (RCTValueAnimatedNode *)parent;
  }
}

- (void)onDetachedFromNode:(RCTAnimatedNode *)parent
{
  [super onDetachedFromNode:parent];
  if (_parentNode == parent) {
    _parentNode = nil;
  }
}

- (void)performUpdate
{
  [super performUpdate];
  if (_parentNode == nullptr) {
    return;
  }

  CGFloat inputValue = _parentNode.value;
  switch (_outputType) {
    case RCTInterpolationOutputColor:
      _outputvalue = @(RCTInterpolateColorInRange(inputValue, _inputRange, _outputRange));
      break;
    case RCTInterpolationOutputString:
      _outputvalue = RCTInterpolateString(
          _outputPattern, inputValue, _inputRange, _outputRange, _extrapolateLeft, _extrapolateRight);
      break;
    case RCTInterpolationOutputNumber:
      self.value =
          RCTInterpolateValueInRange(inputValue, _inputRange, _outputRange, _extrapolateLeft, _extrapolateRight);
      break;
  }
}

- (id)animatedObject
{
  return _outputvalue;
}

@end
