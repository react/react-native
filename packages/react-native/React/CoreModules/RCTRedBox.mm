/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBox.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTErrorInfo.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTJSStackFrame.h>
#import <React/RCTRedBoxExtraDataViewController.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import "CoreModulesPlugins.h"
#import "RCTRedBox+Internal.h"
#import "RCTRedBox2Controller+Internal.h"
#import "RCTRedBoxController+Internal.h"

#if RCT_DEV_MENU

@interface RCTRedBox () <
    RCTInvalidating,
    RCTRedBoxControllerActionDelegate,
    RCTRedBoxExtraDataActionDelegate,
    NativeRedBoxSpec>
@end

@implementation RCTRedBox {
  id<RCTRedBoxControlling> _controller;
  NSMutableArray<id<RCTErrorCustomizer>> *_errorCustomizers;
  RCTRedBoxExtraDataViewController *_extraDataViewController;
  NSMutableArray<NSString *> *_customButtonTitles;
  NSMutableArray<RCTRedBoxButtonPressHandler> *_customButtonHandlers;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;
@synthesize bundleManager = _bundleManager;

RCT_EXPORT_MODULE()

- (void)registerErrorCustomizer:(id<RCTErrorCustomizer>)errorCustomizer
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!self->_errorCustomizers) {
      self->_errorCustomizers = [NSMutableArray array];
    }
    if (![self->_errorCustomizers containsObject:errorCustomizer]) {
      [self->_errorCustomizers addObject:errorCustomizer];
    }
  });
}

// WARNING: Should only be called from the main thread/dispatch queue.
- (RCTErrorInfo *)_customizeError:(RCTErrorInfo *)error
{
  RCTAssertMainQueue();
  if (!self->_errorCustomizers) {
    return error;
  }
  for (id<RCTErrorCustomizer> customizer in self->_errorCustomizers) {
    RCTErrorInfo *newInfo = [customizer customizeErrorInfo:error];
    if (newInfo) {
      error = newInfo;
    }
  }
  return error;
}

- (void)showError:(NSError *)error
{
  [self showErrorMessage:error.localizedDescription
             withDetails:error.localizedFailureReason
                   stack:error.userInfo[RCTJSStackTraceKey]
             errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
{
  [self showErrorMessage:message withParsedStack:nil isUpdate:NO errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details
{
  [self showErrorMessage:message withDetails:details stack:nil errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
             withDetails:(NSString *)details
                   stack:(NSArray<RCTJSStackFrame *> *)stack
             errorCookie:(int)errorCookie
{
  NSString *combinedMessage = message;
  if (details) {
    combinedMessage = [NSString stringWithFormat:@"%@\n\n%@", message, details];
  }
  [self showErrorMessage:combinedMessage withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack
{
  [self showErrorMessage:message withRawStack:rawStack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack errorCookie:(int)errorCookie
{
  NSArray<RCTJSStackFrame *> *stack = [RCTJSStackFrame stackFramesWithLines:rawStack];
  [self showErrorMessage:message withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
  [self showErrorMessage:message withStack:stack errorCookie:-1];
}

- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
  [self updateErrorMessage:message withStack:stack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
  [self showErrorMessage:message
         withParsedStack:[RCTJSStackFrame stackFramesWithDictionaries:stack]
                isUpdate:NO
             errorCookie:errorCookie];
}

- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
  [self showErrorMessage:message
         withParsedStack:[RCTJSStackFrame stackFramesWithDictionaries:stack]
                isUpdate:YES
             errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
  [self showErrorMessage:message withParsedStack:stack errorCookie:-1];
}

- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
  [self updateErrorMessage:message withParsedStack:stack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
         withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
             errorCookie:(int)errorCookie
{
  [self showErrorMessage:message withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)updateErrorMessage:(NSString *)message
           withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
               errorCookie:(int)errorCookie
{
  [self showErrorMessage:message withParsedStack:stack isUpdate:YES errorCookie:errorCookie];
}

- (id<RCTRedBox2Controlling>)_redBox2Controller
{
  if ([_controller conformsToProtocol:@protocol(RCTRedBox2Controlling)]) {
    return (id<RCTRedBox2Controlling>)_controller;
  }
  return nil;
}

- (void)showErrorMessage:(NSString *)message
         withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
                isUpdate:(BOOL)isUpdate
             errorCookie:(int)errorCookie
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_extraDataViewController == nil) {
      self->_extraDataViewController = [RCTRedBoxExtraDataViewController new];
      self->_extraDataViewController.actionDelegate = self;
    }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[self->_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"collectRedBoxExtraData"
                                                                                body:nil];
#pragma clang diagnostic pop

    RCTErrorInfo *errorInfo = [[RCTErrorInfo alloc] initWithErrorMessage:message stack:stack];
    errorInfo = [self _customizeError:errorInfo];

    if (self->_controller == nullptr) {
      if (facebook::react::ReactNativeFeatureFlags::redBoxV2IOS()) {
        self->_controller = [[RCTRedBox2Controller alloc] initWithCustomButtonTitles:self->_customButtonTitles
                                                                customButtonHandlers:self->_customButtonHandlers];
      } else {
        self->_controller = [[RCTRedBoxController alloc] initWithCustomButtonTitles:self->_customButtonTitles
                                                               customButtonHandlers:self->_customButtonHandlers];
      }
      self->_controller.actionDelegate = self;
    }
    [self _redBox2Controller].bundleURL = self->_overrideBundleURL ?: self->_bundleManager.bundleURL;
    [self->_controller showErrorMessage:errorInfo.errorMessage
                              withStack:errorInfo.stack
                               isUpdate:isUpdate
                            errorCookie:errorCookie];
  });
}

- (void)loadExtraDataViewController
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *controller = static_cast<UIViewController *>(self->_controller);
    // Make sure the CMD+E shortcut doesn't call this twice
    if (self->_extraDataViewController != nil && ([controller presentedViewController] == nullptr)) {
      [controller presentViewController:self->_extraDataViewController animated:YES completion:nil];
    }
  });
}

RCT_EXPORT_METHOD(setExtraData : (NSDictionary *)extraData forIdentifier : (NSString *)identifier)
{
  [_extraDataViewController addExtraData:extraData forIdentifier:identifier];
}

RCT_EXPORT_METHOD(dismiss)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_controller dismiss];
  });
}

- (void)invalidate
{
  [self dismiss];
}

- (void)redBoxController:(__unused UIViewController *)redBoxController
    openStackFrameInEditor:(RCTJSStackFrame *)stackFrame
{
  NSURL *const bundleURL = _overrideBundleURL ?: _bundleManager.bundleURL;
  if (![bundleURL.scheme hasPrefix:@"http"]) {
    RCTLogWarn(@"Cannot open stack frame in editor because you're not connected to the packager.");
    return;
  }

  NSData *stackFrameJSON = [RCTJSONStringify([stackFrame toDictionary], NULL) dataUsingEncoding:NSUTF8StringEncoding];
  NSString *postLength = [NSString stringWithFormat:@"%tu", stackFrameJSON.length];
  NSMutableURLRequest *request = [NSMutableURLRequest new];
  request.URL = [NSURL URLWithString:@"/open-stack-frame" relativeToURL:bundleURL];
  request.HTTPMethod = @"POST";
  request.HTTPBody = stackFrameJSON;
  [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];

  [[[NSURLSession sharedSession] dataTaskWithRequest:request] resume];
}

- (void)reload
{
  // Window is not used and can be nil
  [self reloadFromRedBoxController:nil];
}

- (void)reloadFromRedBoxController:(__unused UIViewController *)redBoxController
{
  if (_overrideReloadAction) {
    _overrideReloadAction();
  } else {
    RCTTriggerReloadCommandListeners(@"Redbox");
  }
  [self dismiss];
}

- (void)addCustomButton:(NSString *)title onPressHandler:(RCTRedBoxButtonPressHandler)handler
{
  if (!_customButtonTitles) {
    _customButtonTitles = [NSMutableArray new];
    _customButtonHandlers = [NSMutableArray new];
  }

  [_customButtonTitles addObject:title];
  [_customButtonHandlers addObject:handler];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRedBoxSpecJSI>(params);
}

@end

#else // Disabled

@interface RCTRedBox () <NativeRedBoxSpec>
@end

@implementation RCTRedBox

+ (NSString *)moduleName
{
  return nil;
}
- (void)registerErrorCustomizer:(id<RCTErrorCustomizer>)errorCustomizer
{
}
- (void)showError:(NSError *)error
{
}
- (void)showErrorMessage:(NSString *)message
{
}
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details
{
}
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack
{
}
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack errorCookie:(int)errorCookie
{
}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
}
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
}
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
}
- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
}
- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
}
- (void)showErrorMessage:(NSString *)message
         withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
             errorCookie:(int)errorCookie
{
}
- (void)updateErrorMessage:(NSString *)message
           withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
               errorCookie:(int)errorCookie
{
}
- (void)setExtraData:(NSDictionary *)extraData forIdentifier:(NSString *)identifier
{
}

- (void)dismiss
{
}

- (void)addCustomButton:(NSString *)title onPressHandler:(RCTRedBoxButtonPressHandler)handler
{
}
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRedBoxSpecJSI>(params);
}

@end

#endif

Class RCTRedBoxCls(void)
{
  return RCTRedBox.class;
}
