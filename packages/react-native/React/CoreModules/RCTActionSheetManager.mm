/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTActionSheetManager.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import "CoreModulesPlugins.h"

#if !TARGET_OS_TV

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

#import <RCTTypeSafety/RCTConvertHelpers.h>

using namespace facebook::react;

@interface RCTActionSheetManager () <NativeActionSheetManagerSpec>

@property (nonatomic, strong) NSMutableArray<UIAlertController *> *alertControllers;
@property (nonatomic, strong) UIControl *outsideTouchShield;
@property (nonatomic, copy) dispatch_block_t outsideTouchHandler;

@end

@implementation RCTActionSheetManager

- (instancetype)init
{
  if (self = [super init]) {
    _alertControllers = [NSMutableArray new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_MODULE()

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;

// The anchor view, if it is still on screen. The press that opened the sheet may have removed it.
- (UIView *)anchorViewForTag:(NSNumber *)anchorViewTag
{
  UIView *anchorView = anchorViewTag != nullptr ? [self.viewRegistry_DEPRECATED viewForReactTag:anchorViewTag] : nil;
  return anchorView.window != nil ? anchorView : nil;
}

// On iOS 26 a popover lets the touch that dismisses it reach the views below, so a tap outside
// the sheet would also press whatever React Native view is under the finger.
// A transparent control under the popover takes that touch and dismisses the sheet instead.
- (void)showOutsideTouchShieldInWindow:(UIWindow *)window handler:(dispatch_block_t)handler
{
  [self hideOutsideTouchShield];
  UIControl *shield = [[UIControl alloc] initWithFrame:window.bounds];
  shield.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [shield addTarget:self action:@selector(outsideTouchShieldTouched) forControlEvents:UIControlEventTouchDown];
  [window addSubview:shield];
  self.outsideTouchShield = shield;
  self.outsideTouchHandler = handler;
}

- (void)outsideTouchShieldTouched
{
  dispatch_block_t handler = self.outsideTouchHandler;
  if (handler != nil) {
    handler();
  }
}

- (void)hideOutsideTouchShield
{
  [self.outsideTouchShield removeFromSuperview];
  self.outsideTouchShield = nil;
  self.outsideTouchHandler = nil;
}

- (void)presentViewController:(UIViewController *)alertController
       onParentViewController:(UIViewController *)parentViewController
                anchorViewTag:(NSNumber *)anchorViewTag
{
  alertController.modalPresentationStyle = UIModalPresentationPopover;
  UIView *sourceView = parentViewController.view;
  UIView *anchorView = [self anchorViewForTag:anchorViewTag];

  if (anchorView != nil) {
    sourceView = anchorView;
  } else {
    alertController.popoverPresentationController.permittedArrowDirections = 0;
  }

  // On iOS 26 an iPhone action sheet without a source is shown centred, like an alert.
  // When the caller passes an anchor, present the sheet from it as UIKit does in native apps.
  BOOL presentsFromAnchor = NO;
  if (@available(iOS 26.0, *)) {
    presentsFromAnchor = anchorView != nil;
  }

  if (presentsFromAnchor || [UIDevice.currentDevice userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
    // Before iOS 26, iPhones ignored the source view and rect. On iOS 26 they are used and the popover
    // lets the background receive touches, so they are set on iPhone only when an anchor is passed,
    // and the outside touch shield blocks the background while the sheet is shown.
    alertController.popoverPresentationController.sourceView = sourceView;
    alertController.popoverPresentationController.sourceRect = sourceView.bounds;
  }
  [parentViewController presentViewController:alertController animated:YES completion:nil];
}

- (void)showActionSheetWithOptions:(JS::NativeActionSheetManager::SpecShowActionSheetWithOptionsOptions &)options
                          callback:(RCTResponseSenderBlock)callback
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSString *title = options.title();
  NSString *message = options.message();
  NSArray<NSString *> *buttons = RCTConvertOptionalVecToArray(options.options(), ^id(NSString *element) {
    return element;
  });
  NSArray<NSNumber *> *disabledButtonIndices;
  NSInteger cancelButtonIndex =
      options.cancelButtonIndex() ? [RCTConvert NSInteger:@(*options.cancelButtonIndex())] : -1;
  NSArray<NSNumber *> *destructiveButtonIndices;
  if (options.disabledButtonIndices()) {
    disabledButtonIndices = RCTConvertVecToArray(*options.disabledButtonIndices(), ^id(double element) {
      return @(element);
    });
  }
  if (options.destructiveButtonIndices()) {
    destructiveButtonIndices = RCTConvertVecToArray(*options.destructiveButtonIndices(), ^id(double element) {
      return @(element);
    });
  } else {
    NSNumber *destructiveButtonIndex = @-1;
    destructiveButtonIndices = @[ destructiveButtonIndex ];
  }
  NSNumber *anchor = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  UIColor *tintColor = [RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];
  UIColor *cancelButtonTintColor =
      [RCTConvert UIColor:options.cancelButtonTintColor() ? @(*options.cancelButtonTintColor()) : nil];
  UIColor *disabledButtonTintColor =
      [RCTConvert UIColor:options.disabledButtonTintColor() ? @(*options.disabledButtonTintColor()) : nil];
  NSString *userInterfaceStyle = [RCTConvert NSString:options.userInterfaceStyle()];

  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *controller = RCTPresentedViewController();

    if (controller == nil) {
      RCTLogError(
          @"Tried to display action sheet but there is no application window. options: %@", @{
            @"title" : title ?: @"(null)",
            @"message" : message ?: @"(null)",
            @"options" : buttons,
            @"cancelButtonIndex" : @(cancelButtonIndex),
            @"destructiveButtonIndices" : destructiveButtonIndices,
            @"anchor" : anchor ?: @"(null)",
            @"tintColor" : tintColor ?: @"(null)",
            @"cancelButtonTintColor" : cancelButtonTintColor ?: @"(null)",
            @"disabledButtonTintColor" : disabledButtonTintColor ?: @"(null)",
            @"disabledButtonIndices" : disabledButtonIndices ?: @"(null)",
          });
      return;
    }

    /*
     * The `anchor` option takes a view to set as the anchor for the share
     * popup to point to, on iPads running iOS 8. If it is not passed, it
     * defaults to centering the share popup on screen without any arrows.
     */
    NSNumber *anchorViewTag = anchor;

    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:title
                                                                             message:message
                                                                      preferredStyle:UIAlertControllerStyleActionSheet];

    NSInteger index = 0;
    bool isCancelButtonIndex = false;
    // The handler for a button might get called more than once when tapping outside
    // the action sheet on iPad. RCTResponseSenderBlock can only be called once so
    // keep track of callback invocation here.
    __block bool callbackInvoked = false;
    for (NSString *option in buttons) {
      UIAlertActionStyle style = UIAlertActionStyleDefault;
      if ([destructiveButtonIndices containsObject:@(index)]) {
        style = UIAlertActionStyleDestructive;
      } else if (index == cancelButtonIndex) {
        style = UIAlertActionStyleCancel;
        isCancelButtonIndex = true;
      }

      NSInteger localIndex = index;
      UIAlertAction *actionButton = [UIAlertAction actionWithTitle:option
                                                             style:style
                                                           handler:^(__unused UIAlertAction *action) {
                                                             if (!callbackInvoked) {
                                                               callbackInvoked = true;
                                                               [self->_alertControllers removeObject:alertController];
                                                               [self hideOutsideTouchShield];
                                                               callback(@[ @(localIndex) ]);
                                                             }
                                                           }];
      if (isCancelButtonIndex && cancelButtonTintColor != NULL) {
        [actionButton setValue:cancelButtonTintColor forKey:@"titleTextColor"];
      } else if (style != UIAlertActionStyleDestructive) {
        // iOS 26 does not apply the tint color automatically to all the buttons.
        // So we ca forcibly apply the tint color to all the buttons that are not
        // destructive (which usually have a different tint color) nor they are
        // cancel buttons (which might have a different tint color).
        // This makes the Action Sheet behave as in iOS < 26.
        [actionButton setValue:tintColor forKey:@"titleTextColor"];
      }
      [alertController addAction:actionButton];

      index++;
    }

    if (disabledButtonIndices != nullptr) {
      for (NSNumber *disabledButtonIndex in disabledButtonIndices) {
        if ([disabledButtonIndex integerValue] < buttons.count) {
          UIAlertAction *action = alertController.actions[[disabledButtonIndex integerValue]];
          [action setEnabled:false];
          if (disabledButtonTintColor != nullptr) {
            [action setValue:disabledButtonTintColor forKey:@"titleTextColor"];
          }
        } else {
          RCTLogError(
              @"Index %@ from `disabledButtonIndices` is out of bounds. Maximum index value is %@.",
              @([disabledButtonIndex integerValue]),
              @(buttons.count - 1));
          return;
        }
      }
    }

    alertController.view.tintColor = tintColor;

    if (userInterfaceStyle == nil || [userInterfaceStyle isEqualToString:@""]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
    } else if ([userInterfaceStyle isEqualToString:@"dark"]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
    } else if ([userInterfaceStyle isEqualToString:@"light"]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
    }

    [self->_alertControllers addObject:alertController];

    UIView *anchorView = nil;
    if (@available(iOS 26.0, *)) {
      anchorView = [self anchorViewForTag:anchorViewTag];
    }
    if (anchorView != nil) {
      [self showOutsideTouchShieldInWindow:anchorView.window
                                   handler:^{
                                     [alertController dismissViewControllerAnimated:YES completion:nil];
                                     [self->_alertControllers removeObject:alertController];
                                     [self hideOutsideTouchShield];
                                     // As in UIKit, a tap outside the popover selects the cancel button, if any.
                                     if (!callbackInvoked && cancelButtonIndex >= 0) {
                                       callbackInvoked = true;
                                       callback(@[ @(cancelButtonIndex) ]);
                                     }
                                   }];
    }
    [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];
  });
}

- (void)dismissActionSheet
{
  if (_alertControllers.count == 0) {
    RCTLogWarn(@"Unable to dismiss action sheet");
  }

  UIAlertController *alertController = [_alertControllers lastObject];
  dispatch_async(dispatch_get_main_queue(), ^{
    [alertController dismissViewControllerAnimated:YES completion:nil];
    [self->_alertControllers removeLastObject];
    [self hideOutsideTouchShield];
  });
}

- (void)showShareActionSheetWithOptions:
            (JS::NativeActionSheetManager::SpecShowShareActionSheetWithOptionsOptions &)options
                        failureCallback:(RCTResponseSenderBlock)failureCallback
                        successCallback:(RCTResponseSenderBlock)successCallback
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSMutableArray<id> *items = [NSMutableArray array];
  NSString *message = options.message();
  NSURL *URL = [RCTConvert NSURL:options.url()];
  NSString *subject = options.subject();
  NSArray *excludedActivityTypes =
      RCTConvertOptionalVecToArray(options.excludedActivityTypes(), ^id(NSString *element) {
        return element;
      });
  NSString *userInterfaceStyle = [RCTConvert NSString:options.userInterfaceStyle()];
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  UIColor *tintColor = [RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];

  dispatch_async(dispatch_get_main_queue(), ^{
    if (message != nullptr) {
      [items addObject:message];
    }
    if (URL != nullptr) {
      if ([URL.scheme.lowercaseString isEqualToString:@"data"]) {
        NSError *error;
        NSData *data = [NSData dataWithContentsOfURL:URL options:(NSDataReadingOptions)0 error:&error];
        if (data == nullptr) {
          failureCallback(@[ RCTJSErrorFromNSError(error) ]);
          return;
        }
        [items addObject:data];
      } else {
        [items addObject:URL];
      }
    }
    if (items.count == 0) {
      RCTLogError(@"No `url` or `message` to share");
      return;
    }

    UIActivityViewController *shareController = [[UIActivityViewController alloc] initWithActivityItems:items
                                                                                  applicationActivities:nil];
    if (subject != nullptr) {
      [shareController setValue:subject forKey:@"subject"];
    }
    if (excludedActivityTypes != nullptr) {
      shareController.excludedActivityTypes = excludedActivityTypes;
    }

    UIViewController *controller = RCTPresentedViewController();
    shareController.completionWithItemsHandler =
        ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
          if (activityError != nullptr) {
            failureCallback(@[ RCTJSErrorFromNSError(activityError) ]);
          } else if (completed || activityType == nil) {
            successCallback(@[ @(completed), RCTNullIfNil(activityType) ]);
          }
        };

    shareController.view.tintColor = tintColor;

    if (userInterfaceStyle == nil || [userInterfaceStyle isEqualToString:@""]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
    } else if ([userInterfaceStyle isEqualToString:@"dark"]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
    } else if ([userInterfaceStyle isEqualToString:@"light"]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
    }

    [self presentViewController:shareController onParentViewController:controller anchorViewTag:anchorViewTag];
  });
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeActionSheetManagerSpecJSI>(params);
}

@end

#else

using namespace facebook::react;

@implementation RCTActionSheetManager

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeActionSheetManagerSpecJSI>(params);
}

@end

#endif

Class RCTActionSheetManagerCls(void)
{
  return RCTActionSheetManager.class;
}
