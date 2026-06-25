/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitchComponentView.h"

#import <React/RCTConversions.h>

#import <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>
#import <react/renderer/components/FBReactNativeSpec/RCTComponentViewHelpers.h>
#import <react/renderer/components/switch/AppleSwitchComponentDescriptor.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface RCTSwitchComponentView () <RCTSwitchViewProtocol>
@end

#if TARGET_OS_TV

@implementation RCTSwitchComponentView {
}

- (void)setValue:(BOOL)value
{
}

@end

#else

@implementation RCTSwitchComponentView {
  UISwitch *_switchView;
  BOOL _isInitialValueSet;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = SwitchShadowNode::defaultSharedProps();

    _switchView = [[UISwitch alloc] initWithFrame:self.bounds];

    [_switchView addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];

    self.contentView = _switchView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _isInitialValueSet = NO;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SwitchComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldSwitchProps = static_cast<const SwitchProps &>(*_props);
  const auto &newSwitchProps = static_cast<const SwitchProps &>(*props);

  // `value`
  if (!_isInitialValueSet || oldSwitchProps.value != newSwitchProps.value) {
    BOOL shouldAnimate = _isInitialValueSet == YES;
    [_switchView setOn:newSwitchProps.value animated:shouldAnimate];
  }

  // `disabled`
  if (oldSwitchProps.disabled != newSwitchProps.disabled) {
    _switchView.enabled = !newSwitchProps.disabled;
  }

  // `tintColor`
  if (oldSwitchProps.tintColor != newSwitchProps.tintColor) {
    _switchView.tintColor = RCTUIColorFromSharedColor(newSwitchProps.tintColor);
  }

  // `onTintColor
  if (oldSwitchProps.onTintColor != newSwitchProps.onTintColor) {
    _switchView.onTintColor = RCTUIColorFromSharedColor(newSwitchProps.onTintColor);
  }

  // `thumbTintColor`
  if (oldSwitchProps.thumbTintColor != newSwitchProps.thumbTintColor) {
    _switchView.thumbTintColor = RCTUIColorFromSharedColor(newSwitchProps.thumbTintColor);
  }

  _isInitialValueSet = YES;

  [super updateProps:props oldProps:oldProps];
}

- (void)onChange:(UISwitch *)sender
{
  const auto &props = static_cast<const SwitchProps &>(*_props);
  if (props.value == sender.on) {
    return;
  }

  static_cast<const SwitchEventEmitter &>(*_eventEmitter)
      .onChange(SwitchEventEmitter::OnChange{.value = static_cast<bool>(sender.on)});
}

// UISwitch is the accessibility element not this view. If this is YES we block
// accessibility on the switch itself
- (BOOL)isAccessibilityElement
{
  return NO;
}

- (NSObject *)accessibilityElement
{
  return _switchView;
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTSwitchHandleCommand(self, commandName, args);
}

- (void)setValue:(BOOL)value
{
  [_switchView setOn:value animated:YES];
}

@end

#endif

Class<RCTComponentViewProtocol> RCTSwitchCls(void)
{
  return RCTSwitchComponentView.class;
}
