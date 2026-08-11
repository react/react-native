/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/components/view/NativeDrawable.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Transform.h>

#include <optional>

namespace facebook::react {

class HostPlatformViewProps : public BaseViewProps {
 public:
  HostPlatformViewProps() = default;
  HostPlatformViewProps(
      const PropsParserContext& context,
      const HostPlatformViewProps& sourceProps,
      const RawProps& rawProps,
      const std::function<bool(const std::string&)>& filterObjectKeys =
          nullptr);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#pragma mark - Props

  Float elevation{};

  std::optional<NativeDrawable> nativeBackground{};
  std::optional<NativeDrawable> nativeForeground{};

  bool focusable{false};
  bool hasTVPreferredFocus{false};
  bool needsOffscreenAlphaCompositing{false};
  bool renderToHardwareTextureAndroid{false};
  bool screenReaderFocusable{false};

  std::optional<int> nextFocusDown{};
  std::optional<int> nextFocusForward{};
  std::optional<int> nextFocusLeft{};
  std::optional<int> nextFocusRight{};
  std::optional<int> nextFocusUp{};

#pragma mark - Convenience Methods

  bool getProbablyMoreHorizontalThanVertical_DEPRECATED() const;

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif

#ifdef RN_SERIALIZABLE_STATE
  ComponentName getDiffPropsImplementationTarget() const override;
  folly::dynamic getDiffProps(const Props* prevProps) const override;
#endif
};

} // namespace facebook::react
