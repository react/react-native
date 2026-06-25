/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLayoutAnimation.h"

#import "RCTConvert.h"

@implementation RCTLayoutAnimation

static UIViewAnimationCurve _currentKeyboardAnimationCurve;

static UIViewAnimationOptions UIViewAnimationOptionsFromRCTAnimationType(RCTAnimationType type)
{
  switch (type) {
    case RCTAnimationTypeLinear:
      return UIViewAnimationOptionCurveLinear;
    case RCTAnimationTypeEaseIn:
      return UIViewAnimationOptionCurveEaseIn;
    case RCTAnimationTypeEaseOut:
      return UIViewAnimationOptionCurveEaseOut;
    case RCTAnimationTypeEaseInEaseOut:
      return UIViewAnimationOptionCurveEaseInOut;
    case RCTAnimationTypeKeyboard:
      // http://stackoverflow.com/questions/18870447/how-to-use-the-default-ios7-uianimation-curve
      return (UIViewAnimationOptions)(_currentKeyboardAnimationCurve << 16);
    default:
      RCTLogError(@"Unsupported animation type %lld", (long long)type);
      return UIViewAnimationOptionCurveEaseInOut;
  }
}

#if TARGET_OS_TV

// No-op on tvOS
+ (void)initializeStatics
{
}

#else
// Use a custom initialization function rather than implementing `+initialize` so that we can control
// when the initialization code runs. `+initialize` runs immediately before the first message is sent
// to the class which may be too late for us. By this time, we may have missed some
// `UIKeyboardWillChangeFrameNotification`s.
+ (void)initializeStatics
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(keyboardWillChangeFrame:)
                                                 name:UIKeyboardWillChangeFrameNotification
                                               object:nil];
  });
}

+ (void)keyboardWillChangeFrame:(NSNotification *)notification
{
  NSDictionary *userInfo = notification.userInfo;
  _currentKeyboardAnimationCurve = [userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue];
}

#endif

- (instancetype)initWithDuration:(NSTimeInterval)duration
                           delay:(NSTimeInterval)delay
                        property:(NSString *)property
                   springDamping:(CGFloat)springDamping
                 initialVelocity:(CGFloat)initialVelocity
                   animationType:(RCTAnimationType)animationType
{
  if (self = [super init]) {
    _duration = duration;
    _delay = delay;
    _property = property;
    _springDamping = springDamping;
    _initialVelocity = initialVelocity;
    _animationType = animationType;
  }

  return self;
}

- (instancetype)initWithDuration:(NSTimeInterval)duration config:(NSDictionary *)config
{
  if (!config) {
    return nil;
  }

  if (self = [super init]) {
    _property = [RCTConvert NSString:config[@"property"]];

    _duration = [RCTConvert NSTimeInterval:config[@"duration"]] ?: duration;
    if (_duration > 0.0 && _duration < 0.01) {
      RCTLogError(@"RCTLayoutAnimationGroup expects timings to be in ms, not seconds.");
      _duration = _duration * 1000.0;
    }

    _delay = [RCTConvert NSTimeInterval:config[@"delay"]];
    if (_delay > 0.0 && _delay < 0.01) {
      RCTLogError(@"RCTLayoutAnimationGroup expects timings to be in ms, not seconds.");
      _delay = _delay * 1000.0;
    }

    _animationType = [RCTConvert RCTAnimationType:config[@"type"]];
    if (_animationType == RCTAnimationTypeSpring) {
      _springDamping = [RCTConvert CGFloat:config[@"springDamping"]];
      _initialVelocity = [RCTConvert CGFloat:config[@"initialVelocity"]];
    }
  }

  return self;
}

- (void)performAnimations:(void (^)(void))animations withCompletionBlock:(void (^)(BOOL completed))completionBlock
{
  if (_animationType == RCTAnimationTypeSpring) {
    [UIView animateWithDuration:_duration
                          delay:_delay
         usingSpringWithDamping:_springDamping
          initialSpringVelocity:_initialVelocity
                        options:UIViewAnimationOptionBeginFromCurrentState
                     animations:animations
                     completion:completionBlock];
  } else {
    UIViewAnimationOptions options =
        UIViewAnimationOptionBeginFromCurrentState | UIViewAnimationOptionsFromRCTAnimationType(_animationType);

    [UIView animateWithDuration:_duration
                          delay:_delay
                        options:options
                     animations:animations
                     completion:completionBlock];
  }
}

- (BOOL)isEqual:(RCTLayoutAnimation *)animation
{
  return _duration == animation.duration && _delay == animation.delay &&
      (_property == animation.property || [_property isEqualToString:animation.property]) &&
      _springDamping == animation.springDamping && _initialVelocity == animation.initialVelocity &&
      _animationType == animation.animationType;
}

- (NSString *)description
{
  return [NSString
      stringWithFormat:
          @"<%@: %p; duration: %f; delay: %f; property: %@; springDamping: %f; initialVelocity: %f; animationType: %li;>",
          NSStringFromClass([self class]),
          self,
          _duration,
          _delay,
          _property,
          _springDamping,
          _initialVelocity,
          (long)_animationType];
}

@end
