/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTExceptionsManager.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTRedBox.h>
#import <React/RCTRedBoxSetEnabled.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTRootView.h>

#import "CoreModulesPlugins.h"

@interface RCTExceptionsManager () <NativeExceptionsManagerSpec>

@end

@implementation RCTExceptionsManager

@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate
{
  if ((self = [self init]) != nullptr) {
    _delegate = delegate;
  }
  return self;
}

- (void)reportSoft:(NSString *)message
              stack:(NSArray<NSDictionary *> *)stack
        exceptionId:(double)exceptionId
    extraDataAsJSON:(nullable NSString *)extraDataAsJSON
{
  if (RCTRedBoxGetEnabled()) {
    RCTRedBox *redbox = [_moduleRegistry moduleForName:"RedBox"];
    [redbox showErrorMessage:message withStack:stack errorCookie:(int)exceptionId];
  }

  if (_delegate != nullptr) {
    [_delegate handleSoftJSExceptionWithMessage:message
                                          stack:stack
                                    exceptionId:[NSNumber numberWithDouble:exceptionId]
                                extraDataAsJSON:extraDataAsJSON];
  }
}

- (void)reportFatal:(NSString *)message
              stack:(NSArray<NSDictionary *> *)stack
        exceptionId:(double)exceptionId
    extraDataAsJSON:(nullable NSString *)extraDataAsJSON
{
  if (RCTRedBoxGetEnabled()) {
    RCTRedBox *redbox = [_moduleRegistry moduleForName:"RedBox"];
    [redbox showErrorMessage:message withStack:stack errorCookie:(int)exceptionId];
  }

  if (_delegate != nullptr) {
    [_delegate handleFatalJSExceptionWithMessage:message
                                           stack:stack
                                     exceptionId:[NSNumber numberWithDouble:exceptionId]
                                 extraDataAsJSON:extraDataAsJSON];
  }

  static NSUInteger reloadRetries = 0;
  if (!RCT_DEBUG && reloadRetries < _maxReloadAttempts) {
    reloadRetries++;
    RCTTriggerReloadCommandListeners(@"JS Crash Reload");
  } else if (!RCT_DEV) {
    NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
    NSDictionary *errorInfo = @{
      NSLocalizedDescriptionKey : description,
      RCTJSStackTraceKey : stack == nil ? (id)kCFNull : stack,
      RCTJSExtraDataKey : extraDataAsJSON == nil ? (id)kCFNull : extraDataAsJSON
    };
    RCTFatal([NSError errorWithDomain:RCTErrorDomain code:0 userInfo:errorInfo]);
  }
}

// TODO(T205456329): This method is deprecated in favour of reportException. Delete in v0.77
- (void)reportSoftException:(NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(double)exceptionId
{
  [self reportSoft:message stack:stack exceptionId:exceptionId extraDataAsJSON:nil];
}

// TODO(T205456329): This method is deprecated in favour of reportException. Delete in v0.77
- (void)reportFatalException:(NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(double)exceptionId
{
  [self reportFatal:message stack:stack exceptionId:exceptionId extraDataAsJSON:nil];
}

- (void)dismissRedbox
{
}

- (void)reportException:(JS::NativeExceptionsManager::ExceptionData &)data
{
  NSMutableDictionary<NSString *, id> *mutableErrorData = [NSMutableDictionary new];
  mutableErrorData[@"message"] = data.message();
  if (data.originalMessage() != nullptr) {
    mutableErrorData[@"originalMessage"] = data.originalMessage();
  }
  if (data.name() != nullptr) {
    mutableErrorData[@"name"] = data.name();
  }
  if (data.componentStack() != nullptr) {
    mutableErrorData[@"componentStack"] = data.componentStack();
  }

  // Reserialize data.stack() into an array of untyped dictionaries.
  // TODO: (moti) T53588496 Replace `(NSArray<NSDictionary *> *)stack` in
  // reportFatalException etc with a typed interface.
  NSMutableArray<NSDictionary<NSString *, id> *> *stackArray = [NSMutableArray<NSDictionary<NSString *, id> *> new];
  for (auto frame : data.stack()) {
    NSMutableDictionary<NSString *, id> *frameDict = [NSMutableDictionary new];
    if (frame.column().has_value()) {
      frameDict[@"column"] = @(frame.column().value());
    }
    frameDict[@"file"] = frame.file();
    if (frame.lineNumber().has_value()) {
      frameDict[@"lineNumber"] = @(frame.lineNumber().value());
    }
    frameDict[@"methodName"] = frame.methodName();
    if (frame.collapse().has_value()) {
      frameDict[@"collapse"] = @(frame.collapse().value());
    }
    [stackArray addObject:frameDict];
  }

  mutableErrorData[@"stack"] = stackArray;
  mutableErrorData[@"id"] = @(data.id_());
  mutableErrorData[@"isFatal"] = @(data.isFatal());

  if (data.extraData() != nullptr) {
    mutableErrorData[@"extraData"] = data.extraData();
  }

  NSDictionary<NSString *, id> *errorData = mutableErrorData;
  if ([_delegate respondsToSelector:@selector(decorateJSExceptionData:)]) {
    errorData = [_delegate decorateJSExceptionData:errorData];
  }

  NSString *extraDataAsJSON = RCTJSONStringify(errorData[@"extraData"], NULL);
  NSString *message = errorData[@"message"];
  NSArray<NSDictionary<NSString *, id> *> *stack = errorData[@"stack"];
  double exceptionId = [errorData[@"id"] doubleValue];

  if ([errorData[@"isFatal"] boolValue]) {
    [self reportFatal:message stack:stack exceptionId:exceptionId extraDataAsJSON:extraDataAsJSON];
  } else {
    [self reportSoft:message stack:stack exceptionId:exceptionId extraDataAsJSON:extraDataAsJSON];
  }
}

- (void)reportJsException:(nullable NSString *)message
                    stack:(nullable NSArray<NSDictionary *> *)stack
              exceptionId:(double)exceptionId
                  isFatal:(bool)isFatal
{
  if (isFatal) {
    [self reportFatalException:message stack:stack exceptionId:exceptionId];
  } else {
    [self reportSoftException:message stack:stack exceptionId:exceptionId];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeExceptionsManagerSpecJSI>(params);
}

@end

Class RCTExceptionsManagerCls(void)
{
  return RCTExceptionsManager.class;
}
