/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>

#if RCT_DEV_MENU

@class RCTJSStackFrame;

@protocol RCTRedBoxControllerActionDelegate <NSObject>

- (void)redBoxController:(UIViewController *)redBoxController openStackFrameInEditor:(RCTJSStackFrame *)stackFrame;
- (void)reloadFromRedBoxController:(UIViewController *)redBoxController;
- (void)loadExtraDataViewController;

@end

@protocol RCTRedBoxControlling <NSObject>

@property (nonatomic, weak) id<RCTRedBoxControllerActionDelegate> actionDelegate;

- (void)showErrorMessage:(NSString *)message
               withStack:(NSArray<RCTJSStackFrame *> *)stack
                isUpdate:(BOOL)isUpdate
             errorCookie:(int)errorCookie;

- (void)dismiss;

@end

@protocol RCTRedBox2Controlling <RCTRedBoxControlling>

@property (nonatomic, strong, nullable) NSURL *bundleURL;

@end

#endif
