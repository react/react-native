/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <gtest/gtest.h>
#include <react/utils/TokenStreamWriter.h>

#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <limits>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace facebook::react {
namespace {

using Error = TokenStreamWriter::Error;
using ValueRange = TokenStreamWriter::ValueRange;

// This decoder is only used for shallow documents, never the deep input test.
class TestTokenStreamDecoder {
 public:
  explicit TestTokenStreamDecoder(const std::vector<uint8_t>& bytes)
      : bytes_(bytes) {}

  folly::dynamic readDocument() {
    for (const auto expected : {0x42, 0x54, 0x53, 0x01, 0x03}) {
      if (byte() != expected) {
        throw std::runtime_error("Invalid document header");
      }
    }
    auto result = folly::dynamic::array();
    while (bytes_.at(position_) != 0x04) {
      result.push_back(value());
    }
    ++position_;
    if (position_ != bytes_.size()) {
      throw std::runtime_error("Unexpected trailing bytes");
    }
    return result;
  }

 private:
  uint8_t byte() {
    return bytes_.at(position_++);
  }

  uint64_t unsignedInteger() {
    uint64_t result = 0;
    for (unsigned int shift = 0; shift < 64; shift += 7) {
      const auto next = byte();
      if (shift == 63 && (next & 0xfe) != 0) {
        throw std::runtime_error("Invalid unsigned integer");
      }
      result |= static_cast<uint64_t>(next & 0x7f) << shift;
      if ((next & 0x80) == 0) {
        return result;
      }
    }
    throw std::runtime_error("Unterminated unsigned integer");
  }

  std::string text() {
    const auto length = unsignedInteger();
    if (length > bytes_.size() - position_) {
      throw std::runtime_error("Truncated text");
    }
    std::string result(
        reinterpret_cast<const char*>(bytes_.data() + position_), length);
    position_ += length;
    return result;
  }

  std::string string(uint8_t tag) {
    if (tag == 0x0b || tag == 0x0d) {
      return strings_.at(unsignedInteger());
    }
    if (tag != 0x0a && tag != 0x0c) {
      throw std::runtime_error("Unexpected string tag");
    }
    auto result = text();
    strings_.push_back(result);
    return result;
  }

  folly::dynamic value() {
    const auto tag = byte();
    switch (tag) {
      case 0x01: {
        folly::dynamic result = folly::dynamic::object();
        while (bytes_.at(position_) != 0x02) {
          const auto nameTag = byte();
          if (nameTag != 0x0c && nameTag != 0x0d) {
            throw std::runtime_error("Unexpected object name tag");
          }
          auto name = string(nameTag);
          auto child = value();
          result[std::move(name)] = std::move(child);
        }
        ++position_;
        return result;
      }
      case 0x03: {
        auto result = folly::dynamic::array();
        while (bytes_.at(position_) != 0x04) {
          result.push_back(value());
        }
        ++position_;
        return result;
      }
      case 0x05:
        return nullptr;
      case 0x06:
        return false;
      case 0x07:
        return true;
      case 0x08: {
        const auto encoded = unsignedInteger();
        const auto magnitude = static_cast<int64_t>(encoded >> 1);
        return (encoded & 1) != 0 ? -magnitude - 1 : magnitude;
      }
      case 0x09: {
        const auto number = text();
        char* end = nullptr;
        const auto result = std::strtod(number.c_str(), &end);
        if (number.empty() || end != number.c_str() + number.size()) {
          throw std::runtime_error("Invalid number text");
        }
        return result;
      }
      case 0x0a:
      case 0x0b:
        return string(tag);
      default:
        throw std::runtime_error("Unexpected value tag");
    }
  }

  const std::vector<uint8_t>& bytes_;
  size_t position_ = 0;
  std::vector<std::string> strings_;
};

uint64_t doubleBits(double value) {
  uint64_t result;
  static_assert(sizeof(result) == sizeof(value));
  std::memcpy(&result, &value, sizeof(result));
  return result;
}

std::vector<uint8_t> valueBytes(
    const std::vector<uint8_t>& document,
    ValueRange range) {
  if (range.offset > document.size() ||
      range.length > document.size() - range.offset) {
    throw std::runtime_error("Value range is outside the document");
  }
  return {
      document.begin() + range.offset,
      document.begin() + range.offset + range.length};
}

} // namespace

TEST(TokenStreamWriterTest, finishesEmptyDocument) {
  TokenStreamWriter writer;
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(
      *document, (std::vector<uint8_t>{0x42, 0x54, 0x53, 0x01, 0x03, 0x04}));
}

TEST(TokenStreamWriterTest, writesGoldenSharedStringDocumentAndRanges) {
  TokenStreamWriter writer;
  auto first = writer.write(folly::dynamic::object("shared", "shared"));
  auto second = writer.write("shared");
  auto third = writer.write(
      folly::dynamic::object(
          "other",
          folly::dynamic::array(
              "shared", folly::dynamic::object("shared", "other"))));
  ASSERT_TRUE(first.hasValue());
  ASSERT_TRUE(second.hasValue());
  ASSERT_TRUE(third.hasValue());
  EXPECT_EQ(*first, (ValueRange{5, 12}));
  EXPECT_EQ(*second, (ValueRange{17, 2}));
  EXPECT_EQ(*third, (ValueRange{19, 19}));

  // Derived from the format: "shared" has index zero, "other" has index one.
  const std::vector<uint8_t> expected{
      0x42, 0x54, 0x53, 0x01, 0x03, 0x01, 0x0c, 0x06, 's',  'h',
      'a',  'r',  'e',  'd',  0x0b, 0x00, 0x02, 0x0b, 0x00, 0x01,
      0x0c, 0x05, 'o',  't',  'h',  'e',  'r',  0x03, 0x0b, 0x00,
      0x01, 0x0d, 0x00, 0x0b, 0x01, 0x02, 0x04, 0x02, 0x04};
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(*document, expected);
}

TEST(TokenStreamWriterTest, sharesValueStringsWithNamesAcrossMaps) {
  TokenStreamWriter writer;
  ASSERT_TRUE(writer.write("key").hasValue());
  ASSERT_TRUE(writer.write(folly::dynamic::object("key", "value")).hasValue());
  ASSERT_TRUE(writer.write(folly::dynamic::object("value", "key")).hasValue());

  const std::vector<uint8_t> expected{0x42, 0x54, 0x53, 0x01, 0x03, 0x0a, 0x03,
                                      'k',  'e',  'y',  0x01, 0x0d, 0x00, 0x0a,
                                      0x05, 'v',  'a',  'l',  'u',  'e',  0x02,
                                      0x01, 0x0d, 0x01, 0x0b, 0x00, 0x02, 0x04};
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(*document, expected);
}

TEST(TokenStreamWriterTest, sharesEmptyStringsBetweenNamesAndValues) {
  TokenStreamWriter writer;
  ASSERT_TRUE(writer.write("").hasValue());
  ASSERT_TRUE(writer.write(folly::dynamic::object("", "")).hasValue());
  ASSERT_TRUE(writer.write("").hasValue());

  const std::vector<uint8_t> expected{
      0x42,
      0x54,
      0x53,
      0x01,
      0x03,
      0x0a,
      0x00,
      0x01,
      0x0d,
      0x00,
      0x0b,
      0x00,
      0x02,
      0x0b,
      0x00,
      0x04};
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(*document, expected);
}

TEST(TokenStreamWriterTest, writesScalarTagsAndAbsoluteRanges) {
  const std::vector<folly::dynamic> values{
      nullptr, false, true, int64_t{0}, int64_t{-1}, int64_t{64}};
  const std::vector<ValueRange> expectedRanges{
      {5, 1}, {6, 1}, {7, 1}, {8, 2}, {10, 2}, {12, 3}};
  TokenStreamWriter writer;
  std::vector<ValueRange> ranges;
  for (const auto& value : values) {
    auto range = writer.write(value);
    ASSERT_TRUE(range.hasValue());
    ranges.push_back(*range);
  }
  EXPECT_EQ(ranges, expectedRanges);

  const std::vector<uint8_t> expected{
      0x42,
      0x54,
      0x53,
      0x01,
      0x03,
      0x05,
      0x06,
      0x07,
      0x08,
      0x00,
      0x08,
      0x01,
      0x08,
      0x80,
      0x01,
      0x04};
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(*document, expected);
}

TEST(TokenStreamWriterTest, preservesFullWidthIntegersAndZigzagBoundaries) {
  const std::vector<std::pair<int64_t, std::vector<uint8_t>>> cases{
      {0, {0x08, 0x00}},
      {-1, {0x08, 0x01}},
      {1, {0x08, 0x02}},
      {-64, {0x08, 0x7f}},
      {63, {0x08, 0x7e}},
      {64, {0x08, 0x80, 0x01}},
      {-65, {0x08, 0x81, 0x01}},
      {std::numeric_limits<int64_t>::min(),
       {0x08, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01}},
      {std::numeric_limits<int64_t>::max(),
       {0x08, 0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01}},
      {9007199254740993LL,
       {0x08, 0x82, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x20}},
      {-9007199254740993LL,
       {0x08, 0x81, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x20}}};
  for (const auto& [value, encoded] : cases) {
    SCOPED_TRACE(value);
    TokenStreamWriter writer;
    auto range = writer.write(value);
    ASSERT_TRUE(range.hasValue());
    EXPECT_EQ(*range, (ValueRange{5, static_cast<uint32_t>(encoded.size())}));
    auto document = std::move(writer).finish();
    ASSERT_TRUE(document.hasValue());
    EXPECT_EQ(valueBytes(*document, *range), encoded);
    const auto decoded = TestTokenStreamDecoder(*document).readDocument();
    ASSERT_TRUE(decoded[0].isInt());
    EXPECT_EQ(decoded[0].getInt(), value);
  }
}

TEST(TokenStreamWriterTest, roundTripsFiniteDoubleBitsIncludingSignedZero) {
  const std::vector<double> values{
      0.0,
      -0.0,
      1.0,
      -1.0,
      0.1,
      1.0 / 3.0,
      -1.0 / 3.0,
      std::nextafter(1.0, 0.0),
      std::nextafter(1.0, 2.0),
      std::numeric_limits<double>::denorm_min(),
      -std::numeric_limits<double>::denorm_min(),
      std::numeric_limits<double>::min(),
      -std::numeric_limits<double>::min(),
      std::numeric_limits<double>::max(),
      -std::numeric_limits<double>::max(),
      9007199254740992.0,
      9007199254740994.0,
      9223372036854775808.0,
      1e20,
      1e-100,
      1e100};
  TokenStreamWriter writer;
  for (const auto value : values) {
    ASSERT_TRUE(writer.write(value).hasValue());
  }
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  const auto decoded = TestTokenStreamDecoder(*document).readDocument();
  ASSERT_EQ(decoded.size(), values.size());
  for (size_t index = 0; index < values.size(); ++index) {
    SCOPED_TRACE(index);
    ASSERT_TRUE(decoded[index].isDouble());
    EXPECT_EQ(
        doubleBits(decoded[index].getDouble()), doubleBits(values[index]));
  }
}

TEST(TokenStreamWriterTest, preservesNonfiniteNumbersAsNumberText) {
  TokenStreamWriter writer;
  ASSERT_TRUE(
      writer.write(std::numeric_limits<double>::quiet_NaN()).hasValue());
  ASSERT_TRUE(writer.write(std::numeric_limits<double>::infinity()).hasValue());
  ASSERT_TRUE(
      writer.write(-std::numeric_limits<double>::infinity()).hasValue());

  const std::vector<uint8_t> expected{
      0x42, 0x54, 0x53, 0x01, 0x03, 0x09, 0x03, 'N', 'a', 'N',  0x09,
      0x08, 'I',  'n',  'f',  'i',  'n',  'i',  't', 'y', 0x09, 0x09,
      '-',  'I',  'n',  'f',  'i',  'n',  'i',  't', 'y', 0x04};
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(*document, expected);
  const auto decoded = TestTokenStreamDecoder(*document).readDocument();
  ASSERT_EQ(decoded.size(), 3);
  ASSERT_TRUE(decoded[0].isDouble());
  EXPECT_TRUE(std::isnan(decoded[0].getDouble()));
  ASSERT_TRUE(decoded[1].isDouble());
  EXPECT_EQ(decoded[1].getDouble(), std::numeric_limits<double>::infinity());
  ASSERT_TRUE(decoded[2].isDouble());
  EXPECT_EQ(decoded[2].getDouble(), -std::numeric_limits<double>::infinity());
}

TEST(TokenStreamWriterTest, writesNestedEmptyAndMixedContainers) {
  const auto value = folly::dynamic::array(
      folly::dynamic::array(),
      folly::dynamic::object(),
      folly::dynamic::array(nullptr, false, true, int64_t{-42}),
      folly::dynamic::object(
          "nested",
          folly::dynamic::array(folly::dynamic::object("text", "value"), 2.5)));
  TokenStreamWriter writer;
  auto range = writer.write(value);
  ASSERT_TRUE(range.hasValue());
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(
      *range, (ValueRange{5, static_cast<uint32_t>(document->size() - 6)}));
  EXPECT_EQ(
      TestTokenStreamDecoder(*document).readDocument(),
      folly::dynamic::array(value));
}

TEST(TokenStreamWriterTest, preservesUnicodeControlCharactersAndEmptyStrings) {
  const std::vector<std::string> strings{
      "",
      "plain",
      std::string("\0\b\f\n\r\t\"\\\x01\x1f", 10),
      "caf\xc3\xa9 \xe4\xb8\xad\xe6\x96\x87 \xf0\x9f\x98\x80",
      "\x7f\xc2\x80\xdf\xbf\xe0\xa0\x80\xed\x9f\xbf\xee\x80\x80"
      "\xef\xbf\xbf\xf0\x90\x80\x80\xf4\x8f\xbf\xbf"};
  auto expected = folly::dynamic::array();
  TokenStreamWriter writer;
  for (const auto& string : strings) {
    ASSERT_TRUE(writer.write(string).hasValue());
    expected.push_back(string);
    const folly::dynamic object = folly::dynamic::object(string, string);
    ASSERT_TRUE(writer.write(object).hasValue());
    expected.push_back(object);
  }
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(TestTokenStreamDecoder(*document).readDocument(), expected);
}

TEST(TokenStreamWriterTest, usesVarintByteLengthsForLongStrings) {
  const std::string string(130, 'x');
  TokenStreamWriter writer;
  auto range = writer.write(string);
  ASSERT_TRUE(range.hasValue());
  EXPECT_EQ(*range, (ValueRange{5, 133}));
  auto reference = writer.write(string);
  ASSERT_TRUE(reference.hasValue());
  EXPECT_EQ(*reference, (ValueRange{138, 2}));
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());

  std::vector<uint8_t> expected{0x0a, 0x82, 0x01};
  expected.insert(expected.end(), string.begin(), string.end());
  EXPECT_EQ(valueBytes(*document, *range), expected);
  EXPECT_EQ(
      valueBytes(*document, *reference), (std::vector<uint8_t>{0x0b, 0x00}));
}

TEST(
    TokenStreamWriterTest,
    keepsReferencesAfterReallocationAndInputDestruction) {
  const std::string seed(1024, 's');
  auto expected = folly::dynamic::array();
  TokenStreamWriter writer;
  {
    auto input = folly::dynamic(seed);
    ASSERT_TRUE(writer.write(input).hasValue());
    expected.push_back(input);
    input = nullptr;
  }

  std::string lastString;
  for (size_t index = 0; index < 160; ++index) {
    lastString = std::to_string(index) + std::string(2048, 'x');
    auto input = folly::dynamic(lastString);
    ASSERT_TRUE(writer.write(input).hasValue());
    expected.push_back(input);
    input = "overwritten";
  }
  auto seedReference = writer.write(seed);
  auto lastReference = writer.write(lastString);
  const folly::dynamic object = folly::dynamic::object(lastString, seed);
  auto nameReference = writer.write(object);
  ASSERT_TRUE(seedReference.hasValue());
  ASSERT_TRUE(lastReference.hasValue());
  ASSERT_TRUE(nameReference.hasValue());
  expected.push_back(seed);
  expected.push_back(lastString);
  expected.push_back(object);

  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_GT(document->size(), 300000);
  EXPECT_EQ(
      valueBytes(*document, *seedReference),
      (std::vector<uint8_t>{0x0b, 0x00}));
  EXPECT_EQ(
      valueBytes(*document, *lastReference),
      (std::vector<uint8_t>{0x0b, 0xa0, 0x01}));
  EXPECT_EQ(
      valueBytes(*document, *nameReference),
      (std::vector<uint8_t>{0x01, 0x0d, 0xa0, 0x01, 0x0b, 0x00, 0x02}));
  EXPECT_EQ(TestTokenStreamDecoder(*document).readDocument(), expected);
}

TEST(TokenStreamWriterTest, doesNotModifyRepeatedInput) {
  const folly::dynamic input = folly::dynamic::object(
      "shared",
      folly::dynamic::array(
          "shared", int64_t{123}, folly::dynamic::object("child", "shared")));
  const auto original = input;
  TokenStreamWriter writer;
  auto first = writer.write(input);
  ASSERT_TRUE(first.hasValue());
  EXPECT_EQ(input, original);
  auto second = writer.write(input);
  ASSERT_TRUE(second.hasValue());
  EXPECT_EQ(input, original);
  EXPECT_LT(second->length, first->length);
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(
      TestTokenStreamDecoder(*document).readDocument(),
      folly::dynamic::array(original, original));
  EXPECT_EQ(input, original);
}

TEST(TokenStreamWriterTest, rejectsMalformedUnicodeInNamesAndValues) {
  const std::vector<std::string> invalidStrings{
      "\x80",
      "\xc0\xaf",
      "\xe0\x80\x80",
      "\xf0\x80\x80\x80",
      "\xc2",
      "\xe2\x82",
      "\xf0\x9f\x92",
      "\xed\xa0\x80",
      "\xed\xbf\xbf",
      "\xf4\x90\x80\x80",
      "\xf5\x80\x80\x80",
      "\xe2\x28\xa1",
      "\xff",
      std::string("valid\0\x80", 7)};
  for (size_t index = 0; index < invalidStrings.size(); ++index) {
    SCOPED_TRACE(index);
    TokenStreamWriter writer;
    auto value = writer.write(invalidStrings[index]);
    ASSERT_TRUE(value.hasError());
    EXPECT_EQ(value.error(), Error::InvalidUnicode);
    auto name =
        writer.write(folly::dynamic::object(invalidStrings[index], true));
    ASSERT_TRUE(name.hasError());
    EXPECT_EQ(name.error(), Error::InvalidUnicode);
    auto valid = writer.write(true);
    ASSERT_TRUE(valid.hasValue());
    EXPECT_EQ(*valid, (ValueRange{5, 1}));
    auto document = std::move(writer).finish();
    ASSERT_TRUE(document.hasValue());
    EXPECT_EQ(
        *document,
        (std::vector<uint8_t>{0x42, 0x54, 0x53, 0x01, 0x03, 0x07, 0x04}));
  }
}

TEST(TokenStreamWriterTest, rejectsNonStringObjectKeys) {
  const std::vector<folly::dynamic> keys{nullptr, false, int64_t{-7}, 1.5};
  for (const auto& key : keys) {
    TokenStreamWriter writer;
    auto result = writer.write(folly::dynamic::object(key, "value"));
    ASSERT_TRUE(result.hasError());
    EXPECT_EQ(result.error(), Error::NonStringKey);
    ASSERT_TRUE(writer.write(nullptr).hasValue());
    auto document = std::move(writer).finish();
    ASSERT_TRUE(document.hasValue());
    EXPECT_EQ(
        *document,
        (std::vector<uint8_t>{0x42, 0x54, 0x53, 0x01, 0x03, 0x05, 0x04}));
  }
}

TEST(
    TokenStreamWriterTest,
    rollsBackBytesAndReferenceIndexesAfterValidationErrors) {
  const std::vector<std::pair<folly::dynamic, Error>> failures{
      {folly::dynamic::array(
           "transient", folly::dynamic::object("scratch", "\xed\xa0\x80")),
       Error::InvalidUnicode},
      {folly::dynamic::array(
           "transient",
           folly::dynamic::object("scratch", true),
           folly::dynamic::object(7, nullptr)),
       Error::NonStringKey}};
  for (const auto& [input, error] : failures) {
    TokenStreamWriter writer;
    ASSERT_TRUE(writer.write("seed").hasValue());
    auto failed = writer.write(input);
    ASSERT_TRUE(failed.hasError());
    EXPECT_EQ(failed.error(), error);
    auto recovered = writer.write("transient");
    ASSERT_TRUE(recovered.hasValue());
    EXPECT_EQ(*recovered, (ValueRange{11, 11}));
    ASSERT_TRUE(
        writer.write(folly::dynamic::object("transient", "seed")).hasValue());
    ASSERT_TRUE(writer.write("scratch").hasValue());
    ASSERT_TRUE(writer.write("scratch").hasValue());
    auto document = std::move(writer).finish();
    ASSERT_TRUE(document.hasValue());

    const std::vector<uint8_t> expected{
        0x42, 0x54, 0x53, 0x01, 0x03, 0x0a, 0x04, 's',  'e',  'e',
        'd',  0x0a, 0x09, 't',  'r',  'a',  'n',  's',  'i',  'e',
        'n',  't',  0x01, 0x0d, 0x01, 0x0b, 0x00, 0x02, 0x0a, 0x07,
        's',  'c',  'r',  'a',  't',  'c',  'h',  0x0b, 0x02, 0x04};
    EXPECT_EQ(*document, expected);
  }
}

TEST(TokenStreamWriterTest, rollsBackBytesAndReferenceIndexesAfterSizeFailure) {
  TokenStreamWriter writer(32);
  ASSERT_TRUE(writer.write("seed").hasValue());
  auto failed =
      writer.write(folly::dynamic::array("transient", std::string(64, 'x')));
  ASSERT_TRUE(failed.hasError());
  EXPECT_EQ(failed.error(), Error::SizeLimitExceeded);
  auto recovered = writer.write("transient");
  ASSERT_TRUE(recovered.hasValue());
  EXPECT_EQ(*recovered, (ValueRange{11, 11}));
  ASSERT_TRUE(writer.write("transient").hasValue());
  ASSERT_TRUE(writer.write("seed").hasValue());
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());

  const std::vector<uint8_t> expected{0x42, 0x54, 0x53, 0x01, 0x03, 0x0a, 0x04,
                                      's',  'e',  'e',  'd',  0x0a, 0x09, 't',
                                      'r',  'a',  'n',  's',  'i',  'e',  'n',
                                      't',  0x0b, 0x01, 0x0b, 0x00, 0x04};
  EXPECT_EQ(*document, expected);
}

TEST(TokenStreamWriterTest, failsSafelyBelowMinimumDocumentSize) {
  for (size_t limit = 0; limit < 6; ++limit) {
    SCOPED_TRACE(limit);
    TokenStreamWriter writer(limit);
    auto value = writer.write(nullptr);
    ASSERT_TRUE(value.hasError());
    EXPECT_EQ(value.error(), Error::SizeLimitExceeded);
    auto document = std::move(writer).finish();
    ASSERT_TRUE(document.hasError());
    EXPECT_EQ(document.error(), Error::SizeLimitExceeded);
  }
}

TEST(TokenStreamWriterTest, reservesClosingArrayByteWithinSizeLimit) {
  TokenStreamWriter writer(6);
  auto value = writer.write(nullptr);
  ASSERT_TRUE(value.hasError());
  EXPECT_EQ(value.error(), Error::SizeLimitExceeded);
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(
      *document, (std::vector<uint8_t>{0x42, 0x54, 0x53, 0x01, 0x03, 0x04}));
}

TEST(TokenStreamWriterTest, acceptsExactSizeLimitAndRejectsNextAppend) {
  TokenStreamWriter writer(7);
  auto first = writer.write(nullptr);
  ASSERT_TRUE(first.hasValue());
  EXPECT_EQ(*first, (ValueRange{5, 1}));
  auto second = writer.write(false);
  ASSERT_TRUE(second.hasError());
  EXPECT_EQ(second.error(), Error::SizeLimitExceeded);
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  EXPECT_EQ(
      *document,
      (std::vector<uint8_t>{0x42, 0x54, 0x53, 0x01, 0x03, 0x05, 0x04}));
}

TEST(TokenStreamWriterTest, includesNestedContainerClosingBytesInSizeLimit) {
  for (const size_t limit : {7, 8}) {
    TokenStreamWriter writer(limit);
    auto value = writer.write(folly::dynamic::array());
    if (limit == 7) {
      ASSERT_TRUE(value.hasError());
      EXPECT_EQ(value.error(), Error::SizeLimitExceeded);
    } else {
      ASSERT_TRUE(value.hasValue());
      EXPECT_EQ(*value, (ValueRange{5, 2}));
    }
    auto document = std::move(writer).finish();
    ASSERT_TRUE(document.hasValue());
    const auto expected = limit == 7
        ? std::vector<uint8_t>{0x42, 0x54, 0x53, 0x01, 0x03, 0x04}
        : std::vector<uint8_t>{0x42, 0x54, 0x53, 0x01, 0x03, 0x03, 0x04, 0x04};
    EXPECT_EQ(*document, expected);
  }
}

TEST(TokenStreamWriterTest, rejectsWriteAndFinishAfterFinishing) {
  TokenStreamWriter writer;
  ASSERT_TRUE(writer.write(true).hasValue());
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());
  auto writeAgain = writer.write(false);
  ASSERT_TRUE(writeAgain.hasError());
  EXPECT_EQ(writeAgain.error(), Error::AlreadyFinished);
  auto finishAgain = std::move(writer).finish();
  ASSERT_TRUE(finishAgain.hasError());
  EXPECT_EQ(finishAgain.error(), Error::AlreadyFinished);
  EXPECT_EQ(
      *document,
      (std::vector<uint8_t>{0x42, 0x54, 0x53, 0x01, 0x03, 0x07, 0x04}));
}

TEST(TokenStreamWriterTest, writesDeepMixedInputWithoutRecursion) {
  constexpr size_t depth = 10000;
  auto input = folly::dynamic(nullptr);
  auto* current = &input;
  for (size_t level = depth; level > 0; --level) {
    if ((level - 1) % 2 == 0) {
      *current = folly::dynamic::array();
      current->push_back(nullptr);
      current = &(*current)[0];
    } else {
      *current = folly::dynamic::object();
      current = &(*current)["child"];
    }
  }

  TokenStreamWriter writer;
  auto range = writer.write(input);
  // Dismantle the input before assertions so its destructor does not recurse.
  while (input.isArray() || input.isObject()) {
    auto child =
        input.isArray() ? std::move(input[0]) : std::move(input["child"]);
    input = std::move(child);
  }
  ASSERT_TRUE(range.hasValue());
  auto document = std::move(writer).finish();
  ASSERT_TRUE(document.hasValue());

  std::vector<uint8_t> expected{0x42, 0x54, 0x53, 0x01, 0x03};
  bool firstName = true;
  for (size_t level = depth; level > 0; --level) {
    if ((level - 1) % 2 == 0) {
      expected.push_back(0x03);
    } else {
      expected.push_back(0x01);
      if (firstName) {
        expected.insert(expected.end(), {0x0c, 0x05, 'c', 'h', 'i', 'l', 'd'});
        firstName = false;
      } else {
        expected.insert(expected.end(), {0x0d, 0x00});
      }
    }
  }
  expected.push_back(0x05);
  for (size_t level = 0; level < depth; ++level) {
    expected.push_back(level % 2 == 0 ? 0x04 : 0x02);
  }
  expected.push_back(0x04);
  EXPECT_EQ(*document, expected);
  EXPECT_EQ(
      *range, (ValueRange{5, static_cast<uint32_t>(expected.size() - 6)}));
}

} // namespace facebook::react
