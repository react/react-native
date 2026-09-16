/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUnimplementedNativeComponentView.h"

#import <react/renderer/components/FBReactNativeSpec/ComponentDescriptors.h>
#import <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>

#import <React/RCTLog.h>

using namespace facebook::react;

@implementation RCTUnimplementedNativeComponentView {
  UILabel *_label;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = UnimplementedNativeViewShadowNode::defaultSharedProps();

    CGRect bounds = self.bounds;
    _label = [[UILabel alloc] initWithFrame:bounds];
#if RCT_DEV
    _label.backgroundColor = [UIColor colorWithRed:1.0 green:0.0 blue:0.0 alpha:0.3];
    _label.textColor = [UIColor whiteColor];
#endif
    _label.layoutMargins = UIEdgeInsetsMake(12, 12, 12, 12);
    _label.lineBreakMode = NSLineBreakByWordWrapping;
    _label.numberOfLines = 0;
    _label.textAlignment = NSTextAlignmentCenter;

    self.contentView = _label;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<UnimplementedNativeViewComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldViewProps = static_cast<const UnimplementedNativeViewProps &>(*_props);
  const auto &newViewProps = static_cast<const UnimplementedNativeViewProps &>(*props);

  if (oldViewProps.name != newViewProps.name) {
    const std::string &name = newViewProps.name;
#if RCT_DEV
    _label.text = [NSString stringWithFormat:@"'%s' is not Fabric compatible yet.", name.c_str()];
#endif
    // Skip the empty initial prop-default pass — only log once the real component
    // name has been propagated.
    if (!name.empty()) {
      // Log in all builds so missing components are reported in production.
      RCTLogError(
          @"UnimplementedNativeView: '%s' is not Fabric compatible yet. "
           "Ensure the iOS library has migrated this component to Fabric and registered "
           "a plugin entry for it.",
          name.c_str());
    }
  }

  [super updateProps:props oldProps:oldProps];
}

@end
