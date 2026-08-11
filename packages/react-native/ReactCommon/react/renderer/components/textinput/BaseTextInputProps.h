/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/components/text/BaseTextProps.h>
#include <react/renderer/components/textinput/basePrimitives.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Color.h>
#include <limits>
#include <string>

namespace facebook::react {

class BaseTextInputProps : public ViewProps, public BaseTextProps {
 public:
  BaseTextInputProps() = default;
  BaseTextInputProps(
      const PropsParserContext& context,
      const BaseTextInputProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

  SubmitBehavior getNonDefaultSubmitBehavior() const;

  /*
   * Accessors
   */
  TextAttributes getEffectiveTextAttributes(Float fontSizeMultiplier) const;

#pragma mark - Props

  /*
   * Contains all prop values that affect visual representation of the
   * paragraph.
   */
  ParagraphAttributes paragraphAttributes{};

  std::string defaultValue{};

  std::string placeholder{};
  SharedColor placeholderTextColor{};

  /*
   * Tint colors
   */
  SharedColor cursorColor{};
  SharedColor selectionColor{};
  SharedColor selectionHandleColor{};
  // TODO: Rename to `tintColor` and make universal.
  SharedColor underlineColorAndroid{};

  int maxLength = std::numeric_limits<int>::max();

  /*
   * "Private" (only used by TextInput.js) props
   */
  std::string text{};
  int mostRecentEventCount{0};

  bool autoFocus{false};

  std::string autoCapitalize{};

  bool editable{true};
  bool readOnly{false};

  SubmitBehavior submitBehavior{SubmitBehavior::Default};

  bool multiline{false};

  bool disableKeyboardShortcuts{false};

  std::optional<std::vector<std::string>> acceptDragAndDropTypes{};
};

} // namespace facebook::react
