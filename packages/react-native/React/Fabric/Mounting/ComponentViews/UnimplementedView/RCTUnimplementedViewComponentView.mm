/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUnimplementedViewComponentView.h"

#import <react/renderer/components/FBReactNativeSpec/ComponentDescriptors.h>
#import <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>

#import <react/renderer/components/unimplementedview/UnimplementedViewComponentDescriptor.h>
#import <react/renderer/components/unimplementedview/UnimplementedViewShadowNode.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTUnimplementedViewComponentView {
  UILabel *_label;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = UnimplementedViewShadowNode::defaultSharedProps();

    _label = [[UILabel alloc] initWithFrame:self.bounds];
#if RCT_DEV
    _label.backgroundColor = [UIColor colorWithRed:1.0 green:0.0 blue:0.0 alpha:0.3];
    _label.textColor = [UIColor whiteColor];
#endif
    _label.lineBreakMode = NSLineBreakByCharWrapping;
    _label.numberOfLines = 0;
    _label.textAlignment = NSTextAlignmentCenter;
    _label.allowsDefaultTighteningForTruncation = YES;
    _label.adjustsFontSizeToFitWidth = YES;

    self.contentView = _label;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<UnimplementedViewComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldUnimplementedViewProps = static_cast<const UnimplementedViewProps &>(*_props);
  const auto &newUnimplementedViewProps = static_cast<const UnimplementedViewProps &>(*props);

  if (oldUnimplementedViewProps.getComponentName() != newUnimplementedViewProps.getComponentName()) {
    const char *componentName = newUnimplementedViewProps.getComponentName();
#if RCT_DEV
    _label.text = [NSString stringWithFormat:@"Unimplemented component: <%s>", componentName];
#endif
    // Skip the empty initial prop-default pass — only log once the real component
    // name has been propagated.
    if (componentName != nullptr && *componentName != '\0') {
      // Log in all builds so missing components are reported in production.
      RCTLogError(
          @"UnimplementedView: native component '%s' is not registered. "
           "Ensure the iOS library defines a plugin entry for this component.",
          componentName);
    }
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> RCTUnimplementedNativeViewCls(void)
{
  return RCTUnimplementedViewComponentView.class;
}
