/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/style/Style.h>

#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook::react {

class YogaStylableProps : public Props {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(
      const PropsParserContext& context,
      const YogaStylableProps& sourceProps,
      const RawProps& rawProps,
      const std::function<bool(const std::string&)>& filterObjectKeys =
          nullptr);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#pragma mark - Props
  yoga::Style yogaStyle{};

  // Duplicates of existing properties with different names, taking
  // precedence. E.g. "marginBlock" instead of "marginVertical"
  yoga::Style::Length insetInlineStart;
  yoga::Style::Length insetInlineEnd;

  yoga::Style::Length marginInline;
  yoga::Style::Length marginInlineStart;
  yoga::Style::Length marginInlineEnd;
  yoga::Style::Length marginBlock;

  yoga::Style::Length paddingInline;
  yoga::Style::Length paddingInlineStart;
  yoga::Style::Length paddingInlineEnd;
  yoga::Style::Length paddingBlock;

  // BlockEnd/BlockStart map to top/bottom (no writing mode), but we preserve
  // Yoga's precedence and prefer specific edges (e.g. top) to ones which are
  // flow relative (e.g. blockStart).
  yoga::Style::Length insetBlockStart;
  yoga::Style::Length insetBlockEnd;

  yoga::Style::Length marginBlockStart;
  yoga::Style::Length marginBlockEnd;

  yoga::Style::Length paddingBlockStart;
  yoga::Style::Length paddingBlockEnd;

#if RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const override;

#endif

 private:
  void convertRawPropAliases(
      const PropsParserContext& context,
      const YogaStylableProps& sourceProps,
      const RawProps& rawProps);
};

} // namespace facebook::react
