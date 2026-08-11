/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/scrollview/BaseScrollViewProps.h>
#include <react/renderer/components/scrollview/primitives.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>

namespace facebook::react {

class HostPlatformScrollViewProps : public BaseScrollViewProps {
 public:
  HostPlatformScrollViewProps() = default;
  HostPlatformScrollViewProps(
      const PropsParserContext& context,
      const HostPlatformScrollViewProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#pragma mark - Props

  bool sendMomentumEvents{};
  bool nestedScrollEnabled{};
  folly::dynamic fadingEdgeLength{};
  std::string overScrollMode{"auto"};
  SharedColor endFillColor{clearColor()};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif

  ComponentName getDiffPropsImplementationTarget() const override;
  folly::dynamic getDiffProps(const Props* prevProps) const override;
};

} // namespace facebook::react
