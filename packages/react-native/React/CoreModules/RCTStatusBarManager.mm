/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTStatusBarManager.h"
#import "CoreModulesPlugins.h"

#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTInitializing.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>

static NSString *const kStatusBarFrameDidChange = @"statusBarFrameDidChange";
static NSString *const kStatusBarFrameWillChange = @"statusBarFrameWillChange";

@implementation RCTConvert (UIStatusBar)

+ (UIStatusBarStyle)UIStatusBarStyle:(id)json RCT_DYNAMIC
{
  static NSDictionary *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    mapping = @{
      @"default" : @(UIStatusBarStyleDefault),
      @"light-content" : @(UIStatusBarStyleLightContent),
      @"dark-content" : @(UIStatusBarStyleDarkContent)
    };
  });
  return _RCT_CAST(
      UIStatusBarStyle,
      [RCTConvertEnumValue("UIStatusBarStyle", mapping, @(UIStatusBarStyleDefault), json) integerValue]);
}

RCT_ENUM_CONVERTER(
    UIStatusBarAnimation,
    (@{
      @"none" : @(UIStatusBarAnimationNone),
      @"fade" : @(UIStatusBarAnimationFade),
      @"slide" : @(UIStatusBarAnimationSlide),
    }),
    UIStatusBarAnimationNone,
    integerValue);

@end

@interface RCTStatusBarManager () <NativeStatusBarManagerIOSSpec, RCTInitializing>
@end

@implementation RCTStatusBarManager {
  facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants> _constants;
}

static BOOL RCTViewControllerBasedStatusBarAppearance()
{
  static BOOL value;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    value =
        [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"]
                ?: @YES boolValue];
  });

  return value;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (void)initialize
{
  _constants = facebook::react::typedConstants<JS::NativeStatusBarManagerIOS::Constants>({
      .HEIGHT = RCTUIStatusBarManager().statusBarFrame.size.height,
      .DEFAULT_BACKGROUND_COLOR = std::nullopt,
  });
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ kStatusBarFrameDidChange, kStatusBarFrameWillChange ];
}

- (void)startObserving
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [nc addObserver:self
         selector:@selector(applicationDidChangeStatusBarFrame:)
             name:UIApplicationDidChangeStatusBarFrameNotification
           object:nil];
  [nc addObserver:self
         selector:@selector(applicationWillChangeStatusBarFrame:)
             name:UIApplicationWillChangeStatusBarFrameNotification
           object:nil];
#pragma clang diagnostic pop
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)emitEvent:(NSString *)eventName forNotification:(NSNotification *)notification
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  CGRect frame = [notification.userInfo[UIApplicationStatusBarFrameUserInfoKey] CGRectValue];
#pragma clang diagnostic pop
  NSDictionary *event = @{
    @"frame" : @{
      @"x" : @(frame.origin.x),
      @"y" : @(frame.origin.y),
      @"width" : @(frame.size.width),
      @"height" : @(frame.size.height),
    },
  };
  [self sendEventWithName:eventName body:event];
}

- (void)applicationDidChangeStatusBarFrame:(NSNotification *)notification
{
  [self emitEvent:kStatusBarFrameDidChange forNotification:notification];
}

- (void)applicationWillChangeStatusBarFrame:(NSNotification *)notification
{
  [self emitEvent:kStatusBarFrameWillChange forNotification:notification];
}

RCT_EXPORT_METHOD(getHeight : (RCTResponseSenderBlock)callback)
{
  callback(@[ @{
    @"height" : @(RCTUIStatusBarManager().statusBarFrame.size.height),
  } ]);
}

RCT_EXPORT_METHOD(setStyle : (NSString *)style animated : (BOOL)animated)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIStatusBarStyle statusBarStyle = [RCTConvert UIStatusBarStyle:style];
    if (RCTViewControllerBasedStatusBarAppearance()) {
      RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
    } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [RCTSharedApplication() setStatusBarStyle:statusBarStyle animated:animated];
    }
#pragma clang diagnostic pop
  });
}

RCT_EXPORT_METHOD(setHidden : (BOOL)hidden withAnimation : (NSString *)withAnimation)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIStatusBarAnimation animation = [RCTConvert UIStatusBarAnimation:withAnimation];
    if (RCTViewControllerBasedStatusBarAppearance()) {
      RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
    } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [RCTSharedApplication() setStatusBarHidden:hidden withAnimation:animation];
#pragma clang diagnostic pop
    }
  });
}

- (facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)getConstants
{
  return _constants;
}

- (facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)constantsToExport
{
  return [self getConstants];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeStatusBarManagerIOSSpecJSI>(params);
}

@end

Class RCTStatusBarManagerCls(void)
{
  return RCTStatusBarManager.class;
}
