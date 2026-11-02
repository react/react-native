/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/components/text/primitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawValue.h>
#include <string>

namespace facebook::react {

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, DataDetectorType &result)
{
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "all") {
      result = DataDetectorType::All;
    } else if (string == "email") {
      result = DataDetectorType::Email;
    } else if (string == "link") {
      result = DataDetectorType::Link;
    } else if (string == "none") {
      result = DataDetectorType::None;
    } else if (string == "phoneNumber") {
      result = DataDetectorType::PhoneNumber;
    } else {
      // sane default
      LOG(ERROR) << "Unsupported DataDetectorType value: " << string;
      react_native_expect(false);
      result = DataDetectorType::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported DataDetectorType type";
  react_native_expect(false);
  result = DataDetectorType::None;
}

inline std::string toString(const DataDetectorType &value)
{
  switch (value) {
    case DataDetectorType::All:
      return "all";
    case DataDetectorType::Email:
      return "email";
    case DataDetectorType::Link:
      return "link";
    case DataDetectorType::None:
      return "none";
    case DataDetectorType::PhoneNumber:
      return "phoneNumber";
  }

  LOG(ERROR) << "Unsupported DataDetectorType value";
  react_native_expect(false);
  return "none";
}

} // namespace facebook::react
