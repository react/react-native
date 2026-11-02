/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>

namespace facebook::react {

TEST(AttributedStringBoxTest, testDefaultConstructor) {
  auto attributedStringBox = AttributedStringBox{};

  EXPECT_EQ(attributedStringBox.getMode(), AttributedStringBox::Mode::Value);
  EXPECT_EQ(attributedStringBox.getValue(), AttributedString{});
}

TEST(AttributedStringBoxTest, testValueConstructor) {
  auto attributedString = AttributedString{};
  auto fragment = AttributedString::Fragment{};
  fragment.string = "test string";
  attributedString.appendFragment(std::move(fragment));
  auto attributedStringBox = AttributedStringBox{attributedString};

  EXPECT_EQ(attributedStringBox.getMode(), AttributedStringBox::Mode::Value);
  EXPECT_EQ(attributedStringBox.getValue(), attributedString);
}

TEST(AttributedStringBoxTest, testValueMoveConstructor) {
  auto attributedString = AttributedString{};
  auto fragment = AttributedString::Fragment{};
  fragment.string = "test string";
  attributedString.appendFragment(std::move(fragment));
  auto expectedAttributedString = attributedString;
  auto attributedStringBox = AttributedStringBox{std::move(attributedString)};

  EXPECT_EQ(attributedStringBox.getMode(), AttributedStringBox::Mode::Value);
  EXPECT_EQ(attributedStringBox.getValue(), expectedAttributedString);
}

TEST(AttributedStringBoxTest, testOpaquePointerConstructor) {
  auto string = std::make_shared<std::string>("test string");
  auto attributedStringBox = AttributedStringBox{string};

  EXPECT_EQ(
      attributedStringBox.getMode(), AttributedStringBox::Mode::OpaquePointer);
  EXPECT_EQ(attributedStringBox.getOpaquePointer(), string);
  EXPECT_EQ(string.use_count(), 2);
}

TEST(AttributedStringBoxTest, testMoveConstructor) {
  {
    auto string = std::make_shared<std::string>("test string");
    auto movedFromAttributedStringBox = AttributedStringBox{string};

    auto moveToAttributedStringBox =
        AttributedStringBox{std::move(movedFromAttributedStringBox)};

    EXPECT_EQ(
        moveToAttributedStringBox.getMode(),
        AttributedStringBox::Mode::OpaquePointer);
    EXPECT_EQ(moveToAttributedStringBox.getOpaquePointer(), string);
    EXPECT_EQ(string.use_count(), 2);
  }
  {
    auto attributedString = AttributedString{};
    auto fragment = AttributedString::Fragment{};
    fragment.string = "test string";
    attributedString.appendFragment(std::move(fragment));
    auto movedFromAttributedStringBox = AttributedStringBox{attributedString};

    auto moveToAttributedStringBox =
        AttributedStringBox{std::move(movedFromAttributedStringBox)};

    EXPECT_EQ(
        moveToAttributedStringBox.getMode(), AttributedStringBox::Mode::Value);
    EXPECT_EQ(moveToAttributedStringBox.getValue(), attributedString);
  }
}

TEST(AttributedStringBoxTest, testMoveAssignment) {
  {
    auto string = std::make_shared<std::string>("test string");
    auto movedFromAttributedStringBox = AttributedStringBox{string};

    auto movedToAttributedStringBox = AttributedStringBox{};
    movedToAttributedStringBox = std::move(movedFromAttributedStringBox);

    EXPECT_EQ(
        movedToAttributedStringBox.getMode(),
        AttributedStringBox::Mode::OpaquePointer);
    EXPECT_EQ(movedToAttributedStringBox.getOpaquePointer(), string);
    EXPECT_EQ(string.use_count(), 2);
  }
  {
    auto attributedString = AttributedString{};
    auto fragment = AttributedString::Fragment{};
    fragment.string = "test string";
    attributedString.appendFragment(std::move(fragment));
    auto movedFromAttributedStringBox = AttributedStringBox{attributedString};

    auto moveToAttributedStringBox = AttributedStringBox{};
    moveToAttributedStringBox = std::move(movedFromAttributedStringBox);

    EXPECT_EQ(
        moveToAttributedStringBox.getMode(), AttributedStringBox::Mode::Value);
    EXPECT_EQ(moveToAttributedStringBox.getValue(), attributedString);
  }
}

} // namespace facebook::react
