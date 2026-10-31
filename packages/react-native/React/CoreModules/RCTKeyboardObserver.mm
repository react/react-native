/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTKeyboardObserver.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"

static NSDictionary *RCTParseKeyboardNotification(NSNotification *notification);

@interface RCTKeyboardObserver () <NativeKeyboardObserverSpec>
@end

#if !TARGET_OS_TV
@interface UIResponder (RCTKeyboardObserver)
- (void)reactCollectFirstResponder:(NSMutableArray<UIResponder *> *)firstResponders;
@end

@implementation UIResponder (RCTKeyboardObserver)

- (void)reactCollectFirstResponder:(NSMutableArray<UIResponder *> *)firstResponders
{
  if (self.isFirstResponder) {
    [firstResponders addObject:self];
  }
}

@end

// UIKit sends a nil-targeted action to the first responder, if there is one, and then up its responder chain.
static BOOL RCTHasFirstResponder()
{
  NSMutableArray<UIResponder *> *firstResponders = [NSMutableArray new];
  [RCTSharedApplication() sendAction:@selector(reactCollectFirstResponder:) to:nil from:firstResponders forEvent:nil];
  return firstResponders.count > 0;
}
#endif

@implementation RCTKeyboardObserver

RCT_EXPORT_MODULE()

- (void)startObserving
{
#if !TARGET_OS_TV
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

#define ADD_KEYBOARD_HANDLER(NAME, SELECTOR) [nc addObserver:self selector:@selector(SELECTOR:) name:NAME object:nil]

  ADD_KEYBOARD_HANDLER(UIKeyboardWillShowNotification, keyboardWillShow);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidShowNotification, keyboardDidShow);
  ADD_KEYBOARD_HANDLER(UIKeyboardWillHideNotification, keyboardWillHide);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidHideNotification, keyboardDidHide);
  ADD_KEYBOARD_HANDLER(UIKeyboardWillChangeFrameNotification, keyboardWillChangeFrame);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidChangeFrameNotification, keyboardDidChangeFrame);

#undef ADD_KEYBOARD_HANDLER
#endif
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"keyboardWillShow",
    @"keyboardDidShow",
    @"keyboardWillHide",
    @"keyboardDidHide",
    @"keyboardWillChangeFrame",
    @"keyboardDidChangeFrame"
  ];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

// Bridge might be already invalidated by the time the keyboard is about to be dismissed.
// This might happen, for example, when reload from the packager is performed.
// Thus we need to check against nil here.
#define IMPLEMENT_KEYBOARD_HANDLER(EVENT)                                              \
  -(void)EVENT : (NSNotification *)notification                                        \
  {                                                                                    \
    if (!self.callableJSModules) {                                                     \
      return;                                                                          \
    }                                                                                  \
    [self sendEventWithName:@ #EVENT body:RCTParseKeyboardNotification(notification)]; \
  }

#if !TARGET_OS_TV
// UIKit can post a show notification with an empty end frame while no view is first responder, for example when the
// window is resized. No keyboard can be shown then, so it is sent as the matching hide.
- (void)keyboardWillShow:(NSNotification *)notification
{
  if (self.callableJSModules == nil) {
    return;
  }
  BOOL isShown =
      !CGRectIsEmpty([notification.userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue]) || RCTHasFirstResponder();
  [self sendEventWithName:isShown ? @"keyboardWillShow" : @"keyboardWillHide"
                     body:RCTParseKeyboardNotification(notification)];
}

- (void)keyboardDidShow:(NSNotification *)notification
{
  if (self.callableJSModules == nil) {
    return;
  }
  BOOL isShown =
      !CGRectIsEmpty([notification.userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue]) || RCTHasFirstResponder();
  [self sendEventWithName:isShown ? @"keyboardDidShow" : @"keyboardDidHide"
                     body:RCTParseKeyboardNotification(notification)];
}
#else
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillShow)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidShow)
#endif
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillHide)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidHide)
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillChangeFrame)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidChangeFrame)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeKeyboardObserverSpecJSI>(params);
}

@end

#if !TARGET_OS_TV
NS_INLINE NSDictionary *RCTRectDictionaryValue(CGRect rect)
{
  return @{
    @"screenX" : @(rect.origin.x),
    @"screenY" : @(rect.origin.y),
    @"width" : @(rect.size.width),
    @"height" : @(rect.size.height),
  };
}

static NSString *RCTAnimationNameForCurve(UIViewAnimationCurve curve)
{
  switch (curve) {
    case UIViewAnimationCurveEaseIn:
      return @"easeIn";
    case UIViewAnimationCurveEaseInOut:
      return @"easeInEaseOut";
    case UIViewAnimationCurveEaseOut:
      return @"easeOut";
    case UIViewAnimationCurveLinear:
      return @"linear";
    default:
      return @"keyboard";
  }
}

static NSDictionary *RCTParseKeyboardNotification(NSNotification *notification)
{
  NSDictionary *userInfo = notification.userInfo;
  CGRect beginFrame = [userInfo[UIKeyboardFrameBeginUserInfoKey] CGRectValue];
  CGRect endFrame = [userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  NSTimeInterval duration = [userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationCurve curve =
      static_cast<UIViewAnimationCurve>([userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue]);
  NSInteger isLocalUserInfoKey = [userInfo[UIKeyboardIsLocalUserInfoKey] integerValue];

  UIWindow *window = RCTKeyWindow();
  beginFrame = [window convertRect:beginFrame fromCoordinateSpace:window.screen.coordinateSpace];
  endFrame = [window convertRect:endFrame fromCoordinateSpace:window.screen.coordinateSpace];

  return @{
    @"startCoordinates" : RCTRectDictionaryValue(beginFrame),
    @"endCoordinates" : RCTRectDictionaryValue(endFrame),
    @"duration" : @(duration * 1000.0), // ms
    @"easing" : RCTAnimationNameForCurve(curve),
    @"isEventFromThisApp" : isLocalUserInfoKey == 1 ? @YES : @NO,
  };
}

#else
static NSDictionary *RCTParseKeyboardNotification(NSNotification *notification)
{
  return @{};
}

#endif

Class RCTKeyboardObserverCls(void)
{
  return RCTKeyboardObserver.class;
}
