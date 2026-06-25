/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAnimatedModuleProvider.h"

#import <functional>

#if TARGET_OS_OSX
#import <React/RCTPlatformDisplayLink.h>
#else
#import <QuartzCore/CADisplayLink.h>
#endif

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/animated/AnimatedModule.h>
#import <react/renderer/animated/NativeAnimatedNodesManagerProvider.h>

@implementation RCTAnimatedModuleProvider {
#if TARGET_OS_OSX
  RCTPlatformDisplayLink *_displayLink;
#else
  CADisplayLink *_displayLink;
#endif
  std::function<void()> _onRender;

  std::weak_ptr<facebook::react::NativeAnimatedNodesManagerProvider> _nativeAnimatedNodesManagerProvider;
}

- (void)dealloc
{
  [self invalidate];
}

- (void)invalidate
{
  if (_displayLink != nil) {
#if TARGET_OS_OSX
    RCTPlatformDisplayLink *displayLink = _displayLink;
#else
    CADisplayLink *displayLink = _displayLink;
#endif
    _displayLink = nil;
    if ([NSThread isMainThread]) {
      [displayLink invalidate];
    } else {
      dispatch_sync(dispatch_get_main_queue(), ^{
        [displayLink invalidate];
      });
    }
    _onRender = nullptr;
  }
}

- (void)_onDisplayLinkTick
{
  // Hold a strong reference to the provider during callback execution to prevent
  // use-after-free during hot reload. The provider must remain alive for the
  // entire duration of _onRender() since it holds references to the animation
  // nodes manager and related data structures.
  auto strongProvider = _nativeAnimatedNodesManagerProvider.lock();
  if (strongProvider != nullptr && _displayLink != nullptr && _onRender != nullptr) {
    _onRender();
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (facebook::react::ReactNativeFeatureFlags::cxxNativeAnimatedEnabled()) {
    if (name == facebook::react::AnimatedModule::kModuleName) {
      __weak RCTAnimatedModuleProvider *weakSelf = self;
      auto provider = std::make_shared<facebook::react::NativeAnimatedNodesManagerProvider>(
          [weakSelf](std::function<void()> &&onRender, bool isAsync) {
            const auto start_render = [weakSelf, onRender]() {
              RCTAnimatedModuleProvider *strongSelf = weakSelf;
              if (strongSelf) {
                strongSelf->_onRender = onRender;
                if (strongSelf->_displayLink == nil) {
#if TARGET_OS_OSX
                  strongSelf->_displayLink =
                      [RCTPlatformDisplayLink displayLinkWithTarget:strongSelf selector:@selector(_onDisplayLinkTick)];
#else
                  strongSelf->_displayLink = [CADisplayLink displayLinkWithTarget:strongSelf
                                                                         selector:@selector(_onDisplayLinkTick)];
#endif
                  [strongSelf->_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
                }
              }
            };
            if (isAsync) {
              dispatch_async(dispatch_get_main_queue(), ^{
                start_render();
              });
            } else {
              start_render();
            }
          },
          [weakSelf](bool isAsync) {
            const auto stop_render = [weakSelf]() {
              RCTAnimatedModuleProvider *strongSelf = weakSelf;
              if (strongSelf) {
#if TARGET_OS_OSX
                RCTPlatformDisplayLink *displayLink = strongSelf->_displayLink;
#else
                CADisplayLink *displayLink = strongSelf->_displayLink;
#endif
                strongSelf->_displayLink = nil;
                if (displayLink != nil) {
                  [displayLink invalidate];
                }
                strongSelf->_onRender = nullptr;
              }
            };

            if (isAsync) {
              dispatch_async(dispatch_get_main_queue(), ^{
                stop_render();
              });
            } else {
              stop_render();
            }
          });
      _nativeAnimatedNodesManagerProvider = provider;
      return std::make_shared<facebook::react::AnimatedModule>(std::move(jsInvoker), std::move(provider));
    }
  }
  return nullptr;
}

@end
