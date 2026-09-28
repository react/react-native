/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/ImageManager.h>
#include <React/RendererCore.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/components/iostextinput/conversions.h>
#include <react/renderer/components/iostextinput/primitives.h>
#include <react/renderer/components/textinput/BaseTextInputProps.h>

namespace facebook::react {

class TextInputProps final : public BaseTextInputProps {
 public:
  TextInputProps() = default;
  TextInputProps(const PropsParserContext &context, const TextInputProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props
  const TextInputTraits traits{};

  /*
   * "Private" (only used by TextInput.js) props
   */
  std::optional<Selection> selection{};

  const std::string inputAccessoryViewID{};
  const std::string inputAccessoryViewButtonLabel{};

  bool onKeyPressSync{false};
  bool onChangeSync{false};
};

} // namespace facebook::react
