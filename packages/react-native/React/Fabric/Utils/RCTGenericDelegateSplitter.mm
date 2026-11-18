/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTGenericDelegateSplitter.h"

#import <objc/runtime.h>

@implementation RCTGenericDelegateSplitter {
  NSHashTable *_delegates;
}

#pragma mark - Public

- (instancetype)initWithDelegateUpdateBlock:(void (^)(id _Nullable delegate))block
{
  if (self = [super init]) {
    _delegateUpdateBlock = block;
    _delegates = [NSHashTable weakObjectsHashTable];
  }

  return self;
}

- (void)addDelegate:(id)delegate
{
  [_delegates addObject:delegate];
  [self _updateDelegate];
}

- (void)removeDelegate:(id)delegate
{
  [_delegates removeObject:delegate];
  [self _updateDelegate];
}

- (void)removeAllDelegates
{
  [_delegates removeAllObjects];
  [self _updateDelegate];
}

#pragma mark - Private

- (void)_updateDelegate
{
  _delegateUpdateBlock(nil);
  if (_delegates.count == 0) {
    return;
  }

  _delegateUpdateBlock(_delegates.count == 1 ? [_delegates allObjects].firstObject : self);
}

#pragma mark - Fast Forwarding

- (BOOL)respondsToSelector:(SEL)selector
{
  for (id delegate in _delegates) {
    if ([delegate respondsToSelector:selector]) {
      return YES;
    }
  }

  return NO;
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)selector
{
  for (id delegate in _delegates) {
    if ([delegate respondsToSelector:selector]) {
      return [delegate methodSignatureForSelector:selector];
    }
  }
  // Fallback: prevent `unrecognized selector` crash when UIKit invokes a cached
  // delegate selector after all weak delegates have been released (e.g. background
  // suspension with in-flight UIScrollViewScrollAnimation). Resolve the signature
  // from UIScrollViewDelegate's optional methods first; otherwise use a permissive
  // `v@:@` signature so forwardInvocation: can safely no-op.
  struct objc_method_description desc =
      protocol_getMethodDescription(@protocol(UIScrollViewDelegate), selector, NO, YES);
  if (desc.types != NULL) {
    return [NSMethodSignature signatureWithObjCTypes:desc.types];
  }
  return [NSMethodSignature signatureWithObjCTypes:"v@:@"];
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
  NSMutableArray *targets = [[NSMutableArray alloc] initWithCapacity:_delegates.count];

  for (id delegate in _delegates) {
    if ([delegate respondsToSelector:[invocation selector]]) {
      [targets addObject:delegate];
    }
  }

  for (id target in targets) {
    [invocation invokeWithTarget:target];
  }
}

@end
