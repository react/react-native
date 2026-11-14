/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTActivityIndicatorViewComponentView.h"

#import <React/RCTConversions.h>

#import <react/renderer/components/FBReactNativeSpec/ComponentDescriptors.h>
#import <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

static UIActivityIndicatorViewStyle convertActivityIndicatorViewStyle(const ActivityIndicatorViewSize &size)
{
  switch (size) {
    case ActivityIndicatorViewSize::Small:
      return UIActivityIndicatorViewStyleMedium;
    case ActivityIndicatorViewSize::Large:
      return UIActivityIndicatorViewStyleLarge;
  }
}

@implementation RCTActivityIndicatorViewComponentView {
  UIActivityIndicatorView *_activityIndicatorView;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ActivityIndicatorViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    const auto &defaultProps = ActivityIndicatorViewShadowNode::defaultSharedProps();
    _props = defaultProps;

    _activityIndicatorView = [[UIActivityIndicatorView alloc] initWithFrame:self.bounds];
    _activityIndicatorView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    if (defaultProps->animating) {
      [_activityIndicatorView startAnimating];
    } else {
      [_activityIndicatorView stopAnimating];
    }
    _activityIndicatorView.color = RCTUIColorFromSharedColor(defaultProps->color);
    _activityIndicatorView.hidesWhenStopped = defaultProps->hidesWhenStopped;
    _activityIndicatorView.activityIndicatorViewStyle = convertActivityIndicatorViewStyle(defaultProps->size);

    [self addSubview:_activityIndicatorView];
  }

  return self;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldViewProps = static_cast<const ActivityIndicatorViewProps &>(*_props);
  const auto &newViewProps = static_cast<const ActivityIndicatorViewProps &>(*props);

  if (oldViewProps.animating != newViewProps.animating) {
    if (newViewProps.animating) {
      [_activityIndicatorView startAnimating];
    } else {
      [_activityIndicatorView stopAnimating];
    }
  }

  if (oldViewProps.color != newViewProps.color) {
    _activityIndicatorView.color = RCTUIColorFromSharedColor(newViewProps.color);
  }

  // TODO: This prop should be deprecated.
  if (oldViewProps.hidesWhenStopped != newViewProps.hidesWhenStopped) {
    _activityIndicatorView.hidesWhenStopped = newViewProps.hidesWhenStopped;
  }

  if (oldViewProps.size != newViewProps.size) {
    _activityIndicatorView.activityIndicatorViewStyle = convertActivityIndicatorViewStyle(newViewProps.size);
  }

  [super updateProps:props oldProps:oldProps];
}

// UIActivityIndicatorView is the accessibility element, not this view, so the
// accessibility props go to it.
- (BOOL)isAccessibilityElement
{
  return NO;
}

- (NSObject *)accessibilityElement
{
  return _activityIndicatorView;
}

@end

Class<RCTComponentViewProtocol> RCTActivityIndicatorViewCls(void)
{
  return RCTActivityIndicatorViewComponentView.class;
}
