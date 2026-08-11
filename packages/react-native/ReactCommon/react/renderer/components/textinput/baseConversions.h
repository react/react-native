/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/textinput/basePrimitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawValue.h>
#include <string>

namespace facebook::react {

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    SubmitBehavior& result) {
  auto string = static_cast<std::string>(value);
  if (string == "newline") {
    result = SubmitBehavior::Newline;
  } else if (string == "submit") {
    result = SubmitBehavior::Submit;
  } else if (string == "blurAndSubmit") {
    result = SubmitBehavior::BlurAndSubmit;
  } else {
    abort();
  }
}

inline folly::dynamic toDynamic(const SubmitBehavior& value) {
  switch (value) {
    case SubmitBehavior::Newline:
      return "newline";
    case SubmitBehavior::Submit:
      return "submit";
    case SubmitBehavior::BlurAndSubmit:
      return "blurAndSubmit";
    case SubmitBehavior::Default:
      return {nullptr};
  }
}

} // namespace facebook::react
