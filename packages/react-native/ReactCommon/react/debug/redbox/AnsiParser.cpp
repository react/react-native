/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnsiParser.h"

#include <optional>

#include <regex> // NOLINT(facebook-hte-BadInclude-regex)

// @lint-ignore-every CLANGTIDY facebook-hte-StdRegexIsAwful
namespace facebook::react::unstable_redbox {

namespace {

// Afterglow theme colors (matching AnsiHighlight.js)
std::optional<AnsiColor> ansiColor(int code) {
  switch (code) {
    case 30:
      return AnsiColor{.r = 27, .g = 27, .b = 27}; // black
    case 31:
      return AnsiColor{.r = 187, .g = 86, .b = 83}; // red
    case 32:
      return AnsiColor{.r = 144, .g = 157, .b = 98}; // green
    case 33:
      return AnsiColor{.r = 234, .g = 193, .b = 121}; // yellow
    case 34:
      return AnsiColor{.r = 125, .g = 169, .b = 199}; // blue
    case 35:
      return AnsiColor{.r = 176, .g = 101, .b = 151}; // magenta
    case 36:
      return AnsiColor{.r = 140, .g = 220, .b = 216}; // cyan
    case 37:
      return std::nullopt; // white = default
    case 90:
      return AnsiColor{.r = 98, .g = 98, .b = 98}; // bright black
    case 91:
      return AnsiColor{.r = 187, .g = 86, .b = 83}; // bright red
    case 92:
      return AnsiColor{.r = 144, .g = 157, .b = 98}; // bright green
    case 93:
      return AnsiColor{.r = 234, .g = 193, .b = 121}; // bright yellow
    case 94:
      return AnsiColor{.r = 125, .g = 169, .b = 199}; // bright blue
    case 95:
      return AnsiColor{.r = 176, .g = 101, .b = 151}; // bright magenta
    case 96:
      return AnsiColor{.r = 140, .g = 220, .b = 216}; // bright cyan
    case 97:
      return AnsiColor{.r = 247, .g = 247, .b = 247}; // bright white
    default:
      return std::nullopt;
  }
}

const std::regex& ansiRegex() {
  static const std::regex re(R"(\x1b\[([0-9;]*)m)");
  return re;
}

int parseSgrCode(const std::string& params, size_t& pos) {
  size_t next = params.find(';', pos);
  if (next == std::string::npos) {
    next = params.size();
  }
  int code = 0;
  for (size_t i = pos; i < next; ++i) {
    code = code * 10 + (params[i] - '0');
  }
  pos = next + 1;
  return code;
}

} // namespace

std::vector<AnsiSpan> parseAnsi(const std::string& text) {
  std::vector<AnsiSpan> spans;
  std::optional<AnsiColor> currentFg;
  std::optional<AnsiColor> currentBg;
  auto it = std::sregex_iterator(text.begin(), text.end(), ansiRegex());
  auto end = std::sregex_iterator();
  size_t lastEnd = 0;

  for (; it != end; ++it) {
    const auto& match = *it;
    auto matchStart = static_cast<size_t>(match.position());

    if (matchStart > lastEnd) {
      spans.push_back(
          AnsiSpan{
              .text = text.substr(lastEnd, matchStart - lastEnd),
              .foregroundColor = currentFg,
              .backgroundColor = currentBg});
    }
    lastEnd = matchStart + match.length();

    std::string params = match[1].str();
    // ESC[m (no params) is equivalent to ESC[0m (reset all attributes)
    if (params.empty()) {
      currentFg = std::nullopt;
      currentBg = std::nullopt;
    }
    size_t pos = 0;
    while (pos < params.size()) {
      int code = parseSgrCode(params, pos);
      if (code == 0) {
        currentFg = std::nullopt;
        currentBg = std::nullopt;
      } else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
        currentFg = ansiColor(code);
      } else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
        currentBg = ansiColor(code - 10);
      } else if (code == 39) {
        currentFg = std::nullopt;
      } else if (code == 49) {
        currentBg = std::nullopt;
      }
    }
  }

  if (lastEnd < text.size()) {
    spans.push_back(
        AnsiSpan{
            .text = text.substr(lastEnd),
            .foregroundColor = currentFg,
            .backgroundColor = currentBg});
  }

  return spans;
}

std::string stripAnsi(const std::string& text) {
  return std::regex_replace(text, ansiRegex(), "");
}

} // namespace facebook::react::unstable_redbox
