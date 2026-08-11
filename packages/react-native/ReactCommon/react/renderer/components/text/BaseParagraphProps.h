/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>
#include <memory>

#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/components/text/BaseTextProps.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>

namespace facebook::react {

/*
 * Props of <Paragraph> component.
 * Most of the props are directly stored in composed `ParagraphAttributes`
 * object.
 */
class BaseParagraphProps : public ViewProps, public BaseTextProps {
 public:
  BaseParagraphProps() = default;
  BaseParagraphProps(
      const PropsParserContext& context,
      const BaseParagraphProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#pragma mark - Props

  /*
   * Contains all prop values that affect visual representation of the
   * paragraph.
   */
  ParagraphAttributes paragraphAttributes{};

  /*
   * Defines can the text be selected (and copied) or not.
   */
  bool isSelectable{};

  bool onTextLayout{};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace facebook::react
