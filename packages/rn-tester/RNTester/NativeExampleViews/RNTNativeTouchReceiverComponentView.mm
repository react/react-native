/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNTNativeTouchReceiverComponentView.h"

#import <react/renderer/components/AppSpecs/ComponentDescriptors.h>
#import <react/renderer/components/AppSpecs/EventEmitters.h>
#import <react/renderer/components/AppSpecs/Props.h>
#import <react/renderer/components/AppSpecs/RCTComponentViewHelpers.h>

#import <React/RCTFabricComponentsPlugins.h>

using namespace facebook::react;

@implementation RNTNativeTouchReceiverComponentView

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNTNativeTouchReceiverComponentDescriptor>();
}

+ (void)load
{
  [super load];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNTNativeTouchReceiverProps>();
    _props = defaultProps;
  }
  return self;
}

/**
 * touchesEnded: fires when UIKit delivers the touch-up event through the
 * native responder chain.  Even when a Pressable child is the JS responder,
 * this still fires because RCTSurfaceTouchHandler sets cancelsTouchesInView=NO.
 * That is the bug this component helps reproduce.
 */
- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (_eventEmitter) {
    auto const &emitter =
        *std::static_pointer_cast<const RNTNativeTouchReceiverEventEmitter>(_eventEmitter);
    emitter.onNativeTouch({});
  }
  [super touchesEnded:touches withEvent:event];
}

@end

Class<RCTComponentViewProtocol> RNTNativeTouchReceiverCls(void)
{
  return RNTNativeTouchReceiverComponentView.class;
}
