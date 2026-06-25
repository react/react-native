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

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

#import <RCTTypeSafety/RCTConvertHelpers.h>

using namespace facebook::react;

@interface RCTActionSheetManager () <NativeActionSheetManagerSpec>

@property (nonatomic, strong) NSMutableArray<UIAlertController *> *alertControllers;

@end

@implementation RCTActionSheetManager

- (instancetype)init
{
  self = [super init];
  if (self != nullptr) {
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

- (void)presentViewController:(UIViewController *)alertController
       onParentViewController:(UIViewController *)parentViewController
                anchorViewTag:(NSNumber *)anchorViewTag
{
  alertController.modalPresentationStyle = UIModalPresentationPopover;
  UIView *sourceView = parentViewController.view;

  if (anchorViewTag != nullptr) {
    sourceView = [self.viewRegistry_DEPRECATED viewForReactTag:anchorViewTag];
  } else {
    alertController.popoverPresentationController.permittedArrowDirections = 0;
  }

  if ([UIDevice.currentDevice userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
    // These information only make sense for iPad, where the action sheet needs
    // to be presented from a specific anchor point.
    // Before iOS 26, if these information were passed on an iOS app, the action sheet
    // was ignoring them. after iOS 26, they are took into consideration and the
    // sheet behavior changes, for example the user can interact with the background
    // By applying these informations only to the iPad use case, we revert to the previous
    // behavior.
    alertController.popoverPresentationController.sourceView = sourceView;
    alertController.popoverPresentationController.sourceRect = sourceView.bounds;
  }
  [parentViewController presentViewController:alertController animated:YES completion:nil];
}

RCT_EXPORT_METHOD(
    showActionSheetWithOptions : (JS::NativeActionSheetManager::SpecShowActionSheetWithOptionsOptions &)
        options callback : (RCTResponseSenderBlock)callback)
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
    [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];
  });
}

RCT_EXPORT_METHOD(dismissActionSheet)
{
  if (_alertControllers.count == 0) {
    RCTLogWarn(@"Unable to dismiss action sheet");
  }

  UIAlertController *alertController = [_alertControllers lastObject];
  dispatch_async(dispatch_get_main_queue(), ^{
    [alertController dismissViewControllerAnimated:YES completion:nil];
    [self->_alertControllers removeLastObject];
  });
}

RCT_EXPORT_METHOD(
    showShareActionSheetWithOptions : (JS::NativeActionSheetManager::SpecShowShareActionSheetWithOptionsOptions &)
        options failureCallback : (RCTResponseSenderBlock)failureCallback successCallback : (RCTResponseSenderBlock)
            successCallback)
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
