/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <algorithm>
#include <cstddef>
#include <iterator>
#include <span>
#include <sstream>
#include <vector>

#include <react/renderer/attributedstring/TextAttributes.h>

namespace facebook::react {
namespace {

struct Member {
  const char* name;
  size_t offset;
  size_t size;
};

template <typename T>
Member describeMember(
    const char* name,
    const TextAttributes& attributes,
    const T& member) {
  const auto attributeBytes = std::as_bytes(std::span{&attributes, 1});
  const auto memberBytes = std::as_bytes(std::span{&member, 1});
  const auto memberPosition = std::find_if(
      attributeBytes.begin(),
      attributeBytes.end(),
      [memberAddress = memberBytes.data()](const std::byte& byte) {
        return &byte == memberAddress;
      });
  EXPECT_NE(memberPosition, attributeBytes.end());

  return Member{
      .name = name,
      .offset = static_cast<size_t>(
          std::distance(attributeBytes.begin(), memberPosition)),
      .size = sizeof(T)};
}

} // namespace

// The Font group of TextAttributes lists its 4-byte fields before its 2-byte
// optionals to mitigate alignment gaps. This checks the span the group's
// fields cover against the sum of their sizes, so it does not depend on the
// order below matching the header's. A field added to the group belongs among
// the fields of its size, and in this list.
TEST(TextAttributesLayoutTest, fontGroupHasNoAlignmentGaps) {
  TextAttributes attributes;
#define MEMBER(field) describeMember(#field, attributes, attributes.field)
  std::vector<Member> fontGroup = {
      MEMBER(fontFamily),
      MEMBER(fontSize),
      MEMBER(fontSizeMultiplier),
      MEMBER(maxFontSizeMultiplier),
      MEMBER(letterSpacing),
      MEMBER(fontVariant),
      MEMBER(fontVariationSettings),
      MEMBER(fontWeight),
      MEMBER(fontStyle),
      MEMBER(allowFontScaling),
      MEMBER(dynamicTypeRamp),
      MEMBER(textTransform),
  };
#undef MEMBER

  std::sort(
      fontGroup.begin(), fontGroup.end(), [](const auto& a, const auto& b) {
        return a.offset < b.offset;
      });
  size_t total = 0;
  std::ostringstream gaps;
  for (size_t i = 0; i < fontGroup.size(); i++) {
    total += fontGroup[i].size;
    if (i > 0) {
      auto previousEnd = fontGroup[i - 1].offset + fontGroup[i - 1].size;
      if (fontGroup[i].offset > previousEnd) {
        gaps << " " << (fontGroup[i].offset - previousEnd) << " bytes after "
             << fontGroup[i - 1].name << ",";
      }
    }
  }
  auto span = fontGroup.back().offset + fontGroup.back().size -
      fontGroup.front().offset;

  EXPECT_EQ(span, total)
      << "The Font group of TextAttributes spans " << span
      << " bytes but its fields total " << total << ". Gaps:" << gaps.str()
      << " either a field is out of size order in TextAttributes.h or a Font "
      << "field is missing from this test's list.";
}

} // namespace facebook::react
