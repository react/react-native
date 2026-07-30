/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNTMyNativeViewComponentView.h"
#import "UIView+ColorOverlays.h"

#import <react/renderer/components/AppSpecs/ComponentDescriptors.h>
#import <react/renderer/components/AppSpecs/EventEmitters.h>
#import <react/renderer/components/AppSpecs/Props.h>
#import <react/renderer/components/AppSpecs/RCTComponentViewHelpers.h>

#if __has_include(<React/RCTFabricComponentsPlugins.h>)
#import <React/RCTFabricComponentsPlugins.h>
#else
#import "RCTFabricComponentsPlugins.h"
#endif

using namespace facebook::react;

@interface RNTMyNativeViewComponentView () <RCTRNTMyNativeViewViewProtocol>
@end

@implementation RNTMyNativeViewComponentView {
  UIView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNTMyNativeViewComponentDescriptor>();
}

// Load is not invoked if it is not defined, therefore, we must ask to update this.
// See the Apple documentation: https://developer.apple.com/documentation/objectivec/nsobject/1418815-load?language=objc
// "[...] but only if the newly loaded class or category implements a method that can respond."
+ (void)load
{
  [super load];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNTMyNativeViewProps>();
    _props = defaultProps;

    _view = [[UIView alloc] init];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<const RNTMyNativeViewProps>(_props);
  const auto &newViewProps = *std::static_pointer_cast<const RNTMyNativeViewProps>(props);

  if (oldViewProps.values != newViewProps.values) {
    if (_eventEmitter) {
      std::vector<int> newVector = {};
      std::vector<bool> newBoolVector = {};
      std::vector<Float> newFloatVector = {};
      std::vector<double> newDoubleVector = {};
      std::vector<RNTMyNativeViewEventEmitter::OnIntArrayChangedYesNos> newYesNoVector = {};
      std::vector<std::string> newStringVector = {};
      std::vector<RNTMyNativeViewEventEmitter::OnIntArrayChangedLatLons> newLatLonVector = {};
      std::vector<std::vector<int>> newIntVectorVector = {};
      for (auto val : newViewProps.values) {
        newVector.push_back(val * 2);
        newBoolVector.push_back(val % 2 ? true : false);
        newFloatVector.push_back(val * 3.14);
        newDoubleVector.push_back(val / 3.14);
        newYesNoVector.push_back(
            val % 2 ? RNTMyNativeViewEventEmitter::OnIntArrayChangedYesNos::Yep
                    : RNTMyNativeViewEventEmitter::OnIntArrayChangedYesNos::Nope);
        newStringVector.push_back(std::to_string(val));
        newLatLonVector.push_back({-1.0 * val, 2.0 * val});
        newIntVectorVector.push_back({val, val, val});
      }
      RNTMyNativeViewEventEmitter::OnIntArrayChanged value = {
          .values = newVector,
          .boolValues = newBoolVector,
          .floats = newFloatVector,
          .doubles = newDoubleVector,
          .yesNos = newYesNoVector,
          .strings = newStringVector,
          .latLons = newLatLonVector,
          .multiArrays = newIntVectorVector};
      std::static_pointer_cast<const RNTMyNativeViewEventEmitter>(_eventEmitter)->onIntArrayChanged(value);
    }
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)onChange:(UIView *)sender
{
  // No-op
  //  std::dynamic_pointer_cast<const ViewEventEmitter>(_eventEmitter)
  //      ->onChange(ViewEventEmitter::OnChange{.value = static_cast<bool>(sender.on)});
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTRNTMyNativeViewHandleCommand(self, commandName, args);
}

- (void)callNativeMethodToChangeBackgroundColor:(NSString *)colorString
{
  [_view setBackgroundColorWithColorString:colorString];
}

- (void)callNativeMethodToAddOverlays:(const NSArray *)overlayColors
{
  [_view addColorOverlays:overlayColors];
}

- (void)callNativeMethodToRemoveOverlays
{
  [_view removeOverlays];
}

- (void)fireLagacyStyleEvent
{
  RNTMyNativeViewEventEmitter::OnLegacyStyleEvent value = {"Legacy Style Event Fired."};

  std::static_pointer_cast<const RNTMyNativeViewEventEmitter>(_eventEmitter)->onLegacyStyleEvent(value);
}

@end

Class<RCTComponentViewProtocol> RNTMyNativeViewCls(void)
{
  return RNTMyNativeViewComponentView.class;
}
