/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <string_view>

namespace facebook::react {

namespace {
// Vendored from Folly
// https://github.com/facebook/folly/blob/v2024.07.08.00/folly/detail/base64_detail/Base64Scalar.h
constexpr char kBase64Charset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

constexpr char kBase64URLCharset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

template <bool isURL>
struct Base64ScalarImpl {
  static constexpr const char *kCharset = isURL ? kBase64URLCharset : kBase64Charset;

  // 0, 1 or 2 bytes
  static constexpr char *encodeTail(const char *f, const char *l, char *o)
  {
    if (f == l) {
      return o;
    }

    std::uint8_t aaab = f[0];
    std::uint8_t aaa = aaab >> 2;
    *o++ = kCharset[aaa];

    // duplicating some tail handling to try to do less jumps
    if (l - f == 1) {
      std::uint8_t b00 = aaab << 4 & 0x3f;
      *o++ = kCharset[b00];
      if constexpr (!isURL) {
        *o++ = '=';
        *o++ = '=';
      }
      return o;
    }

    // l - f == 2
    std::uint8_t bbcc = f[1];
    std::uint8_t bbb = ((aaab << 4) | (bbcc >> 4)) & 0x3f;
    std::uint8_t cc0 = (bbcc << 2) & 0x3f;
    *o++ = kCharset[bbb];
    *o++ = kCharset[cc0];
    if constexpr (!isURL) {
      *o++ = '=';
    }
    return o;
  }

  static constexpr char *encode(const char *f, const char *l, char *o)
  {
    while ((l - f) >= 3) {
      std::uint8_t aaab = f[0];
      std::uint8_t bbcc = f[1];
      std::uint8_t cddd = f[2];

      std::uint8_t aaa = aaab >> 2;
      std::uint8_t bbb = ((aaab << 4) | (bbcc >> 4)) & 0x3f;
      std::uint8_t ccc = ((bbcc << 2) | (cddd >> 6)) & 0x3f;
      std::uint8_t ddd = cddd & 0x3f;

      o[0] = kCharset[aaa];
      o[1] = kCharset[bbb];
      o[2] = kCharset[ccc];
      o[3] = kCharset[ddd];

      f += 3;
      o += 4;
    }

    return encodeTail(f, l, o);
  }
};

// https://github.com/facebook/folly/blob/v2024.07.08.00/folly/detail/base64_detail/Base64Common.h#L24
constexpr std::size_t base64EncodedSize(std::size_t inSize)
{
  return ((inSize + 2) / 3) * 4;
}
} // namespace

inline std::string base64Encode(const std::string_view s)
{
  std::string res(base64EncodedSize(s.size()), '\0');
  Base64ScalarImpl<false>::encode(s.data(), s.data() + s.size(), res.data());
  return res;
}

} // namespace facebook::react
