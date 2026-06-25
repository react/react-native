/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLegacyViewManagerInteropCoordinatorAdapter.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#import <React/UIView+React.h>
#import <react/utils/FollyConvert.h>

@implementation RCTLegacyViewManagerInteropCoordinatorAdapter {
  RCTLegacyViewManagerInteropCoordinator *_coordinator;
  NSInteger _tag;
  NSDictionary<NSString *, id> *_oldProps;
}

- (instancetype)initWithCoordinator:(RCTLegacyViewManagerInteropCoordinator *)coordinator reactTag:(NSInteger)tag
{
  if (self = [super init]) {
    _coordinator = coordinator;
    _tag = tag;
  }
  return self;
}

- (void)dealloc
{
  [_paperView removeFromSuperview];
  [_coordinator removeObserveForTag:_tag];
}

- (UIView *)paperView
{
  if (!_paperView) {
    _paperView = [_coordinator createPaperViewWithTag:_tag];
    __weak __typeof(self) weakSelf = self;
    [_coordinator addObserveForTag:_tag
                        usingBlock:^(std::string eventName, folly::dynamic &&event) {
                          if (weakSelf.eventInterceptor) {
                            weakSelf.eventInterceptor(eventName, std::move(event));
                          }
                        }];
  }
  return _paperView;
}

- (void)setProps:(const folly::dynamic &)props
{
  if (props.isObject()) {
    NSDictionary<NSString *, id> *convertedProps = facebook::react::convertFollyDynamicToId(props);
    NSDictionary<NSString *, id> *diffedProps = [self _diffProps:convertedProps];

    [_coordinator setProps:diffedProps forView:self.paperView];

    _oldProps = convertedProps;
  }
}

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args
{
  [_coordinator handleCommand:commandName args:args reactTag:_tag paperView:self.paperView];
}

- (NSDictionary<NSString *, id> *)_diffProps:(NSDictionary<NSString *, id> *)newProps
{
  NSMutableDictionary<NSString *, id> *diffedProps = [NSMutableDictionary new];

  [newProps enumerateKeysAndObjectsUsingBlock:^(NSString *key, id newProp, __unused BOOL *stop) {
    id oldProp = _oldProps[key];
    if ([self _prop:newProp isDifferentFrom:oldProp]) {
      diffedProps[key] = newProp;
    }
  }];

  return diffedProps;
}

#pragma mark - Private

- (BOOL)_prop:(id)oldProp isDifferentFrom:(id)newProp
{
  // Check for JSON types.
  // JSON types can be of:
  // * number
  // * bool
  // * String
  // * Array
  // * Objects => Dictionaries in ObjectiveC
  // * Null

  // Check for NULL
  BOOL bothNil = !oldProp && !newProp;
  if (bothNil) {
    return NO;
  }

  BOOL onlyOneNil = (oldProp && !newProp) || (!oldProp && newProp);
  if (onlyOneNil) {
    return YES;
  }

  if ([self _propIsSameNumber:oldProp second:newProp]) {
    // Boolean should be captured by NSNumber
    return NO;
  }

  if ([self _propIsSameString:oldProp second:newProp]) {
    return NO;
  }

  if ([self _propIsSameArray:oldProp second:newProp]) {
    return NO;
  }

  if ([self _propIsSameObject:oldProp second:newProp]) {
    return NO;
  }

  // Previous behavior, fallback to YES
  return YES;
}

- (BOOL)_propIsSameNumber:(id)first second:(id)second
{
  return [first isKindOfClass:[NSNumber class]] && [second isKindOfClass:[NSNumber class]] &&
      [(NSNumber *)first isEqualToNumber:(NSNumber *)second];
}

- (BOOL)_propIsSameString:(id)first second:(id)second
{
  return [first isKindOfClass:[NSString class]] && [second isKindOfClass:[NSString class]] &&
      [(NSString *)first isEqualToString:(NSString *)second];
}

- (BOOL)_propIsSameArray:(id)first second:(id)second
{
  return [first isKindOfClass:[NSArray class]] && [second isKindOfClass:[NSArray class]] &&
      [(NSArray *)first isEqualToArray:(NSArray *)second];
}

- (BOOL)_propIsSameObject:(id)first second:(id)second
{
  return [first isKindOfClass:[NSDictionary class]] && [second isKindOfClass:[NSDictionary class]] &&
      [(NSDictionary *)first isEqualToDictionary:(NSDictionary *)second];
}

@end

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
