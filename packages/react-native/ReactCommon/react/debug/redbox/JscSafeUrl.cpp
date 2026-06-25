/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JscSafeUrl.h"

#include <cassert>
#include <regex> // NOLINT(facebook-hte-BadInclude-regex)
#include <stdexcept>
#include <string_view>

// @lint-ignore-every CLANGTIDY facebook-hte-StdRegexIsAwful

namespace facebook::react::unstable_redbox {

namespace {

// We use regex-based URL parsing as defined in RFC 3986 because it's easier to
// determine whether the input is a complete URI, a path-absolute or a
// path-rootless (as defined in the spec), and be as faithful to the input as
// possible. This will match any string, and does not imply validity.
//
// https://www.rfc-editor.org/rfc/rfc3986#appendix-B
const std::regex& uriRegex() {
  static const std::regex re(
      R"(^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?)");
  return re;
}

struct ParsedUri {
  std::string_view schemeAndAuthority;
  std::string_view path;
  bool hasQueryPart = false;
  std::string_view queryWithoutQuestionMark;
  std::string_view fragmentWithHash;
};

ParsedUri rfc3986Parse(std::string_view url) {
  std::cmatch match;
  if (!std::regex_match(
          url.data(), url.data() + url.size(), match, uriRegex())) {
    throw std::runtime_error("Unexpected error - failed to regex-match URL");
  }

  // match[1] = scheme with colon (e.g. "http:")
  // match[3] = authority with slashes (e.g. "//host")
  // match[5] = path
  // match[6] = query with question mark (e.g. "?key=val")
  // match[7] = query without question mark
  // match[8] = fragment with hash (e.g. "#frag")

  auto viewOf = [&](int group) -> std::string_view {
    if (!match[group].matched) {
      return {};
    }
    return {match[group].first, static_cast<size_t>(match[group].length())};
  };

  // schemeAndAuthority = (match[1] || "") + (match[3] || "")
  // These are contiguous when both present, but may be individually absent.
  std::string_view schemeAndAuthority;
  if (match[1].matched && match[3].matched) {
    assert(match[1].second == match[3].first);
    schemeAndAuthority = {
        match[1].first, static_cast<size_t>(match[3].second - match[1].first)};
  } else if (match[1].matched) {
    schemeAndAuthority = viewOf(1);
  } else if (match[3].matched) {
    schemeAndAuthority = viewOf(3);
  }

  return ParsedUri{
      .schemeAndAuthority = schemeAndAuthority,
      .path = viewOf(5),
      .hasQueryPart = match[6].matched,
      .queryWithoutQuestionMark = viewOf(7),
      .fragmentWithHash = viewOf(8),
  };
}

} // namespace

bool isJscSafeUrl(std::string_view url) {
  return !rfc3986Parse(url).hasQueryPart;
}

std::string toNormalUrl(std::string url) {
  auto parsed = rfc3986Parse(url);
  auto markerPos = parsed.path.find("//&");
  if (markerPos == std::string_view::npos) {
    return url;
  }

  // path before //&, then ?, then path after //&
  std::string_view pathBefore = parsed.path.substr(0, markerPos);
  std::string_view pathAfter = parsed.path.substr(markerPos + 3);

  // We don't expect JSC urls to also have query strings, but interpret
  // liberally and append them.
  bool hasExistingQuery = !parsed.queryWithoutQuestionMark.empty();

  // Likewise, JSC URLs will usually have their fragments stripped, but
  // preserve if we find one.
  size_t totalSize = parsed.schemeAndAuthority.size() + pathBefore.size() +
      1 /* ? */ + pathAfter.size() +
      (hasExistingQuery ? 1 + parsed.queryWithoutQuestionMark.size() : 0) +
      parsed.fragmentWithHash.size();

  std::string result;
  result.reserve(totalSize);
  result += parsed.schemeAndAuthority;
  result += pathBefore;
  result += '?';
  result += pathAfter;
  if (hasExistingQuery) {
    result += '&';
    result += parsed.queryWithoutQuestionMark;
  }
  result += parsed.fragmentWithHash;
  assert(result.size() == totalSize);
  return result;
}

std::string toJscSafeUrl(std::string url) {
  if (!rfc3986Parse(url).hasQueryPart) {
    return url;
  }
  url = toNormalUrl(std::move(url));
  auto parsed = rfc3986Parse(url);
  if (!parsed.queryWithoutQuestionMark.empty() &&
      (parsed.path.empty() || parsed.path == "/")) {
    throw std::invalid_argument(
        "The given URL \"" + url +
        "\" has an empty path and cannot be converted to a JSC-safe format.");
  }

  // Query strings may contain '?' (e.g. in key or value names) - these
  // must be percent-encoded to form a valid path, and not be stripped.
  // Count them first so we can preallocate exactly.
  bool hasQuery = !parsed.queryWithoutQuestionMark.empty();
  size_t questionMarks = 0;
  if (hasQuery) {
    for (char c : parsed.queryWithoutQuestionMark) {
      if (c == '?') {
        questionMarks++;
      }
    }
  }

  // Each '?' becomes "%3F" (+2 bytes), plus "//&" delimiter (+3 bytes)
  size_t totalSize = parsed.schemeAndAuthority.size() + parsed.path.size() +
      (hasQuery ? 3 + parsed.queryWithoutQuestionMark.size() + questionMarks * 2
                : 0) +
      // We expect JSC to strip this - we don't handle fragments for now.
      parsed.fragmentWithHash.size();

  std::string result;
  result.reserve(totalSize);
  result += parsed.schemeAndAuthority;
  result += parsed.path;
  if (hasQuery) {
    result += "//&";
    for (char c : parsed.queryWithoutQuestionMark) {
      if (c == '?') {
        result += "%3F";
      } else {
        result += c;
      }
    }
  }
  result += parsed.fragmentWithHash;
  assert(result.size() == totalSize);
  return result;
}

} // namespace facebook::react::unstable_redbox
