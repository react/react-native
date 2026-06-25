/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLogBox.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <React/RCTRedBoxSetEnabled.h>
#import <React/RCTSurface.h>
#import "CoreModulesPlugins.h"

#if RCT_DEV_MENU

@interface RCTLogBox () <NativeLogBoxSpec, RCTBridgeModule>
@end

@implementation RCTLogBox {
  RCTLogBoxView *_view;
  __weak id<RCTSurfacePresenterStub> _bridgelessSurfacePresenter;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  _bridgelessSurfacePresenter = surfacePresenter;
}

RCT_EXPORT_METHOD(show)
{
  if (RCTRedBoxGetEnabled()) {
    __weak RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong RCTLogBox *strongSelf = weakSelf;
      if (strongSelf == nullptr) {
        return;
      }

      if (strongSelf->_view != nullptr) {
        [strongSelf->_view show];
        return;
      }

      if (strongSelf->_bridgelessSurfacePresenter != nullptr) {
        strongSelf->_view = [[RCTLogBoxView alloc] initWithWindow:RCTKeyWindow()
                                                 surfacePresenter:strongSelf->_bridgelessSurfacePresenter];
        [strongSelf->_view show];
      }
    });
  }
}

RCT_EXPORT_METHOD(hide)
{
  if (RCTRedBoxGetEnabled()) {
    __weak RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong RCTLogBox *strongSelf = weakSelf;
      if (strongSelf == nullptr) {
        return;
      }
      [strongSelf->_view setHidden:YES];
      strongSelf->_view = nil;
    });
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeLogBoxSpecJSI>(params);
}

- (void)setRCTLogBoxView:(RCTLogBoxView *)view
{
  self->_view = view;
}

@end

#else // Disabled

@interface RCTLogBox () <NativeLogBoxSpec>
@end

@implementation RCTLogBox

+ (NSString *)moduleName
{
  return nil;
}

- (void)show
{
  // noop
}

- (void)hide
{
  // noop
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeLogBoxSpecJSI>(params);
}
@end

#endif

Class RCTLogBoxCls(void)
{
  return RCTLogBox.class;
}
