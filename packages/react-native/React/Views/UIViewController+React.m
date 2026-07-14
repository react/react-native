/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIViewController+React.h"

#import <objc/runtime.h>

@interface RCTViewControllerAppearanceState : NSObject

@property (nonatomic, strong, readonly) NSHashTable<id<RCTViewControllerAppearanceListener>> *listeners;
@property (nonatomic, assign) BOOL visible;

@end

@implementation RCTViewControllerAppearanceState

- (instancetype)init
{
  if (self = [super init]) {
    _listeners = [NSHashTable weakObjectsHashTable];
  }
  return self;
}

@end

@implementation UIViewController (React)

- (RCTViewControllerAppearanceState *)reactViewControllerAppearanceState
{
  RCTViewControllerAppearanceState *state =
      objc_getAssociatedObject(self, @selector(reactViewControllerAppearanceState));
  if (!state) {
    state = [RCTViewControllerAppearanceState new];
    objc_setAssociatedObject(
        self, @selector(reactViewControllerAppearanceState), state, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  return state;
}

- (BOOL)reactViewControllerIsVisible
{
  return [self reactViewControllerAppearanceState].visible;
}

- (void)reactAddViewControllerAppearanceListener:(id<RCTViewControllerAppearanceListener>)listener
{
  RCTViewControllerAppearanceState *state = [self reactViewControllerAppearanceState];
  [state.listeners addObject:listener];

  if (state.visible && [listener respondsToSelector:@selector(reactViewControllerDidAppear:animated:)]) {
    [listener reactViewControllerDidAppear:self animated:NO];
  }
}

- (void)reactRemoveViewControllerAppearanceListener:(id<RCTViewControllerAppearanceListener>)listener
{
  [[self reactViewControllerAppearanceState].listeners removeObject:listener];
}

- (void)reactNotifyViewControllerDidAppear:(BOOL)animated
{
  RCTViewControllerAppearanceState *state = [self reactViewControllerAppearanceState];
  state.visible = YES;

  for (id<RCTViewControllerAppearanceListener> listener in state.listeners.allObjects) {
    if ([listener respondsToSelector:@selector(reactViewControllerDidAppear:animated:)]) {
      [listener reactViewControllerDidAppear:self animated:animated];
    }
  }
}

- (void)reactNotifyViewControllerDidDisappear:(BOOL)animated
{
  RCTViewControllerAppearanceState *state = [self reactViewControllerAppearanceState];
  state.visible = NO;

  for (id<RCTViewControllerAppearanceListener> listener in state.listeners.allObjects) {
    if ([listener respondsToSelector:@selector(reactViewControllerDidDisappear:animated:)]) {
      [listener reactViewControllerDidDisappear:self animated:animated];
    }
  }
}

@end
