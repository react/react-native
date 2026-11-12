/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentViewComponentView.h"

#import <React/RCTI18nUtil.h>
#import <React/RCTUtils.h>
#import <react/renderer/components/scrollview/ScrollContentViewComponentDescriptor.h>
#import <react/renderer/components/scrollview/ScrollContentViewState.h>
#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTScrollContentViewComponentView {
  ScrollContentViewShadowNode::ConcreteState::Shared _state;
  ScrollContentViewState _lastStateData;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ScrollContentViewShadowNode::defaultSharedProps();
  }

  return self;
}

- (void)setSafeAreaPadding:(UIEdgeInsets)safeAreaPadding contentInsetAdjustment:(UIEdgeInsets)contentInsetAdjustment
{
  _safeAreaPadding = safeAreaPadding;
  _contentInsetAdjustment = contentInsetAdjustment;
  [self _updateStateIfNecessary];
}

static EdgeInsets RCTRoundedEdgeInsets(UIEdgeInsets insets)
{
  return {
      .left = RCTRoundPixelValue(insets.left),
      .top = RCTRoundPixelValue(insets.top),
      .right = RCTRoundPixelValue(insets.right),
      .bottom = RCTRoundPixelValue(insets.bottom)};
}

- (void)_updateStateIfNecessary
{
  if (!_state) {
    return;
  }

  RCTI18nUtil *i18nUtil = [RCTI18nUtil sharedInstance];
  ScrollContentViewState newData;
  newData.safeAreaPadding = RCTRoundedEdgeInsets(_safeAreaPadding);
  newData.contentInsetAdjustment = RCTRoundedEdgeInsets(_contentInsetAdjustment);
  newData.swapLeftAndRightInRTL = i18nUtil.isRTL && i18nUtil.doLeftAndRightSwapInRTL;
  if (newData == _lastStateData) {
    return;
  }

  _lastStateData = newData;
  _state->updateState(
      [newData](const ScrollContentViewShadowNode::ConcreteState::Data &)
          -> ScrollContentViewShadowNode::ConcreteState::SharedData {
        return std::make_shared<const ScrollContentViewShadowNode::ConcreteState::Data>(newData);
      });
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ScrollContentViewComponentDescriptor>();
}

- (void)updateState:(const facebook::react::State::Shared &)state
           oldState:(const facebook::react::State::Shared &)oldState
{
  _state = std::static_pointer_cast<const ScrollContentViewShadowNode::ConcreteState>(state);
  _lastStateData = _state->getData();
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  [self _updateStateIfNecessary];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _lastStateData = {};
  _safeAreaPadding = UIEdgeInsetsZero;
  _contentInsetAdjustment = UIEdgeInsetsZero;
}

@end

Class<RCTComponentViewProtocol> RCTScrollContentViewCls(void)
{
  return RCTScrollContentViewComponentView.class;
}
