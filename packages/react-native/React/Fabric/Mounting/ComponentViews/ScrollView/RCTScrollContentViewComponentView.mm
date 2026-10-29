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
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ScrollContentViewShadowNode::defaultSharedProps();
  }

  return self;
}

- (void)setSafeAreaPadding:(UIEdgeInsets)safeAreaPadding
{
  _safeAreaPadding = safeAreaPadding;
  [self _updateStateIfNecessary];
}

- (void)_updateStateIfNecessary
{
  if (!_state) {
    return;
  }

  UIEdgeInsets insets = _safeAreaPadding;
  insets.left = RCTRoundPixelValue(insets.left);
  insets.top = RCTRoundPixelValue(insets.top);
  insets.right = RCTRoundPixelValue(insets.right);
  insets.bottom = RCTRoundPixelValue(insets.bottom);

  auto newPadding = RCTEdgeInsetsFromUIEdgeInsets(insets);
  RCTI18nUtil *i18nUtil = [RCTI18nUtil sharedInstance];
  auto layoutDirection = i18nUtil.isRTL ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;
  bool swapLeftAndRightInRTL = i18nUtil.isRTL && i18nUtil.doLeftAndRightSwapInRTL;
  auto threshold = 1.0 / RCTScreenScale() + 0.01; // Size of a pixel plus some small threshold.

  _state->updateState(
      [=](const ScrollContentViewShadowNode::ConcreteState::Data &oldData)
          -> ScrollContentViewShadowNode::ConcreteState::SharedData {
        auto deltaPadding = newPadding - oldData.safeAreaPadding;

        if (std::abs(deltaPadding.left) < threshold && std::abs(deltaPadding.top) < threshold &&
            std::abs(deltaPadding.right) < threshold && std::abs(deltaPadding.bottom) < threshold &&
            oldData.layoutDirection == layoutDirection && oldData.swapLeftAndRightInRTL == swapLeftAndRightInRTL) {
          return nullptr;
        }

        auto newData = oldData;
        newData.safeAreaPadding = newPadding;
        newData.layoutDirection = layoutDirection;
        newData.swapLeftAndRightInRTL = swapLeftAndRightInRTL;
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
  _safeAreaPadding = UIEdgeInsetsZero;
}

@end

Class<RCTComponentViewProtocol> RCTScrollContentViewCls(void)
{
  return RCTScrollContentViewComponentView.class;
}
