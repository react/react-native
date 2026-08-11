/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>
#include <memory>
#include <optional>

#include <react/renderer/components/text/BaseParagraphProps.h>
#include <react/renderer/components/text/primitives.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Color.h>

namespace facebook::react {

/*
 * Props of <Paragraph> component.
 * Most of the props are directly stored in composed `ParagraphAttributes`
 * object.
 */
class HostPlatformParagraphProps : public BaseParagraphProps {
 public:
  HostPlatformParagraphProps() = default;
  HostPlatformParagraphProps(
      const PropsParserContext& context,
      const HostPlatformParagraphProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#pragma mark - Props

  bool disabled{false};
  std::optional<SharedColor> selectionColor{};
  std::optional<DataDetectorType> dataDetectorType{};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif

#ifdef RN_SERIALIZABLE_STATE
  ComponentName getDiffPropsImplementationTarget() const override;
  folly::dynamic getDiffProps(const Props* prevProps) const override;
#endif
};

} // namespace facebook::react
