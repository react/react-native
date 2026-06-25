/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string>
#include <vector>

namespace facebook::react::unstable_redbox {

struct AnsiColor {
  uint8_t r, g, b;
};

struct AnsiSpan {
  std::string text;
  std::optional<AnsiColor> foregroundColor;
  std::optional<AnsiColor> backgroundColor;
};

/**
 * Parse ANSI escape sequences in text and produce a list of styled spans.
 * Uses the Afterglow color theme (matching LogBox's AnsiHighlight.js).
 */
std::vector<AnsiSpan> parseAnsi(const std::string &text);

/** Strip all ANSI escape sequences from text. */
std::string stripAnsi(const std::string &text);

} // namespace facebook::react::unstable_redbox
