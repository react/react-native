/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/timing/primitives.h>

#include <cassert>
#include <optional>
#include <stdexcept>
#include <string>
#include <variant>

namespace facebook::react::jsinspector_modern::tracing {

// https://developer.chrome.com/docs/devtools/performance/extension#inject_your_data_with_consoletimestamp
using ConsoleTimeStampEntry = std::variant<HighResTimeStamp, std::string>;

// https://developer.chrome.com/docs/devtools/performance/extension#devtools_object
// Although warning is not listed in Chrome DevTools announcement, it is
// actually supported.
enum class ConsoleTimeStampColor {
  Primary,
  PrimaryLight,
  PrimaryDark,
  Secondary,
  SecondaryLight,
  SecondaryDark,
  Tertiary,
  TertiaryLight,
  TertiaryDark,
  Warning,
  Error,
};

inline std::string consoleTimeStampColorToString(ConsoleTimeStampColor color) {
  switch (color) {
    case ConsoleTimeStampColor::Primary:
      return "primary";
    case ConsoleTimeStampColor::PrimaryLight:
      return "primary-light";
    case ConsoleTimeStampColor::PrimaryDark:
      return "primary-dark";
    case ConsoleTimeStampColor::Secondary:
      return "secondary";
    case ConsoleTimeStampColor::SecondaryLight:
      return "secondary-light";
    case ConsoleTimeStampColor::SecondaryDark:
      return "secondary-dark";
    case ConsoleTimeStampColor::Tertiary:
      return "tertiary";
    case ConsoleTimeStampColor::TertiaryLight:
      return "tertiary-light";
    case ConsoleTimeStampColor::TertiaryDark:
      return "tertiary-dark";
    case ConsoleTimeStampColor::Warning:
      return "warning";
    case ConsoleTimeStampColor::Error:
      return "error";
    default:
      throw std::runtime_error("Unknown ConsoleTimeStampColor");
  }
};

inline std::optional<ConsoleTimeStampColor> getConsoleTimeStampColorFromString(
    const std::string& str) {
  if (str == "primary") {
    return ConsoleTimeStampColor::Primary;
  } else if (str == "primary-light") {
    return ConsoleTimeStampColor::PrimaryLight;
  } else if (str == "primary-dark") {
    return ConsoleTimeStampColor::PrimaryDark;
  } else if (str == "secondary") {
    return ConsoleTimeStampColor::Secondary;
  } else if (str == "secondary-light") {
    return ConsoleTimeStampColor::SecondaryLight;
  } else if (str == "secondary-dark") {
    return ConsoleTimeStampColor::SecondaryDark;
  } else if (str == "tertiary") {
    return ConsoleTimeStampColor::Tertiary;
  } else if (str == "tertiary-light") {
    return ConsoleTimeStampColor::TertiaryLight;
  } else if (str == "tertiary-dark") {
    return ConsoleTimeStampColor::TertiaryDark;
  } else if (str == "warning") {
    return ConsoleTimeStampColor::Warning;
  } else if (str == "error") {
    return ConsoleTimeStampColor::Error;
  } else {
    return std::nullopt;
  }
};

std::optional<folly::dynamic> getConsoleTimeStampDetailFromObject(
    jsi::Runtime& runtime,
    const jsi::Value& detailValue);

}; // namespace facebook::react::jsinspector_modern::tracing
