/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TokenStreamWriter.h"

#include <fmt/format.h>
#include <folly/dynamic.h>

#include <algorithm>
#include <cmath>
#include <iterator>

namespace facebook::react {
namespace {

constexpr uint8_t kStartObject = 0x01;
constexpr uint8_t kEndObject = 0x02;
constexpr uint8_t kStartArray = 0x03;
constexpr uint8_t kEndArray = 0x04;
constexpr uint8_t kNull = 0x05;
constexpr uint8_t kFalse = 0x06;
constexpr uint8_t kTrue = 0x07;
constexpr uint8_t kInteger = 0x08;
constexpr uint8_t kNumber = 0x09;
constexpr uint8_t kString = 0x0a;
constexpr uint8_t kName = 0x0c;
constexpr size_t kPendingOffset = std::numeric_limits<size_t>::max();

bool validUnicode(std::string_view value) {
  size_t position = 0;
  while (position < value.size()) {
    const auto lead = static_cast<uint8_t>(value[position++]);
    if (lead < 0x80) {
      continue;
    }
    size_t count;
    if (lead >= 0xc2 && lead <= 0xdf) {
      count = 1;
    } else if (lead >= 0xe0 && lead <= 0xef) {
      count = 2;
    } else if (lead >= 0xf0 && lead <= 0xf4) {
      count = 3;
    } else {
      return false;
    }
    if (count > value.size() - position) {
      return false;
    }
    const auto second = static_cast<uint8_t>(value[position]);
    if ((lead == 0xe0 && second < 0xa0) || (lead == 0xed && second > 0x9f) ||
        (lead == 0xf0 && second < 0x90) || (lead == 0xf4 && second > 0x8f)) {
      return false;
    }
    for (size_t i = 0; i < count; ++i) {
      if ((static_cast<uint8_t>(value[position++]) & 0xc0) != 0x80) {
        return false;
      }
    }
  }
  return true;
}

struct ValueFrame {
  const folly::dynamic* input;
  folly::dynamic::const_item_iterator next;
  folly::dynamic::const_item_iterator end;
  size_t index = 0;

  explicit ValueFrame(const folly::dynamic& value) : input(&value) {
    if (value.isObject()) {
      next = value.items().begin();
      end = value.items().end();
    }
  }
};

} // namespace

TokenStreamWriter::TokenStreamWriter(size_t maxBytes)
    : bytes_{'B', 'T', 'S', 1, kStartArray},
      strings_(0, StringHash{}, StringEqual{*this}),
      maxBytes_(
          std::min(
              maxBytes,
              static_cast<size_t>(std::numeric_limits<int32_t>::max()))) {}

size_t TokenStreamWriter::StringHash::operator()(
    const Entry& entry) const noexcept {
  return entry.hash;
}

bool TokenStreamWriter::StringEqual::operator()(
    const Entry& first,
    const Entry& second) const noexcept {
  return writer.get().view(first) == writer.get().view(second);
}

std::string_view TokenStreamWriter::view(const Entry& entry) const noexcept {
  if (entry.offset == kPendingOffset) {
    return pendingString_;
  }
  return {
      reinterpret_cast<const char*>(bytes_.data() + entry.offset),
      entry.length};
}

bool TokenStreamWriter::append(const void* data, size_t length) {
  // Reserve the enclosing array's closing tag in every size check.
  if (maxBytes_ == 0 || length > maxBytes_ - 1 ||
      bytes_.size() > maxBytes_ - 1 - length) {
    return false;
  }
  if (length != 0) {
    const auto* begin = static_cast<const uint8_t*>(data);
    bytes_.insert(bytes_.end(), begin, begin + length);
  }
  return true;
}

bool TokenStreamWriter::tag(uint8_t value) {
  return append(&value, 1);
}

bool TokenStreamWriter::varint(uint64_t value) {
  uint8_t encoded[10];
  size_t length = 0;
  while (value >= 0x80) {
    encoded[length++] = static_cast<uint8_t>((value & 0x7f) | 0x80);
    value >>= 7;
  }
  encoded[length++] = static_cast<uint8_t>(value);
  return append(encoded, length);
}

bool TokenStreamWriter::numberText(std::string_view text) {
  return tag(kNumber) && varint(text.size()) &&
      append(text.data(), text.size());
}

bool TokenStreamWriter::string(
    std::string_view text,
    uint8_t literalTag,
    Error& error) {
  if (!validUnicode(text)) {
    error = Error::InvalidUnicode;
    return false;
  }
  pendingString_ = text;
  const auto hash = std::hash<std::string_view>{}(text);
  const auto found = strings_.find(Entry{kPendingOffset, text.size(), hash, 0});
  if (found != strings_.end()) {
    pendingString_ = {};
    return tag(literalTag + 1) && varint(found->index);
  }
  if (!tag(literalTag) || !varint(text.size())) {
    pendingString_ = {};
    return false;
  }
  const auto offset = bytes_.size();
  if (!append(text.data(), text.size())) {
    pendingString_ = {};
    return false;
  }
  // Offsets survive output-vector growth; views into that vector would not.
  strings_.insert(Entry{offset, text.size(), hash, nextIndex_++});
  pendingString_ = {};
  return true;
}

bool TokenStreamWriter::scalar(const folly::dynamic& input, Error& error) {
  if (input.isNull()) {
    return tag(kNull);
  }
  if (input.isBool()) {
    return tag(input.getBool() ? kTrue : kFalse);
  }
  if (input.isInt()) {
    const auto integer = input.getInt();
    const auto zigzag = (static_cast<uint64_t>(integer) << 1) ^
        (integer < 0 ? std::numeric_limits<uint64_t>::max() : 0);
    return tag(kInteger) && varint(zigzag);
  }
  if (input.isDouble()) {
    const auto number = input.getDouble();
    if (std::isnan(number)) {
      return numberText("NaN");
    }
    if (std::isinf(number)) {
      return numberText(number < 0 ? "-Infinity" : "Infinity");
    }
    if (number == 0 && std::signbit(number)) {
      return numberText("-0");
    }
    fmt::memory_buffer text;
    fmt::format_to(std::back_inserter(text), "{}", number);
    return numberText({text.data(), text.size()});
  }
  return string(input.getString(), kString, error);
}

bool TokenStreamWriter::value(const folly::dynamic& input, Error& error) {
  std::vector<ValueFrame> stack;
  const folly::dynamic* current = &input;
  while (current != nullptr || !stack.empty()) {
    if (current != nullptr) {
      if (current->isObject() || current->isArray()) {
        if (!tag(current->isObject() ? kStartObject : kStartArray)) {
          return false;
        }
        stack.emplace_back(*current);
      } else if (!scalar(*current, error)) {
        return false;
      }
      current = nullptr;
    }
    while (!stack.empty()) {
      auto& frame = stack.back();
      if (frame.input->isArray()) {
        if (frame.index < frame.input->size()) {
          current = &(*frame.input)[frame.index++];
          break;
        }
      } else if (frame.next != frame.end) {
        const auto& property = *frame.next++;
        if (!property.first.isString()) {
          error = Error::NonStringKey;
          return false;
        }
        if (!string(property.first.getString(), kName, error)) {
          return false;
        }
        current = &property.second;
        break;
      }
      if (!tag(frame.input->isObject() ? kEndObject : kEndArray)) {
        return false;
      }
      stack.pop_back();
    }
  }
  return true;
}

void TokenStreamWriter::rollback(size_t offset, uint32_t stringIndex) {
  // Remove entries while their bytes still exist, before shrinking the output.
  for (auto entry = strings_.begin(); entry != strings_.end();) {
    if (entry->index >= stringIndex) {
      entry = strings_.erase(entry);
    } else {
      ++entry;
    }
  }
  bytes_.resize(offset);
  nextIndex_ = stringIndex;
  pendingString_ = {};
}

folly::Expected<TokenStreamWriter::ValueRange, TokenStreamWriter::Error>
TokenStreamWriter::write(const folly::dynamic& input) {
  if (finished_) {
    return folly::makeUnexpected(Error::AlreadyFinished);
  }
  const auto offset = bytes_.size();
  const auto stringIndex = nextIndex_;
  auto error = Error::SizeLimitExceeded;
  if (!value(input, error)) {
    rollback(offset, stringIndex);
    return folly::makeUnexpected(error);
  }
  return ValueRange{
      static_cast<uint32_t>(offset),
      static_cast<uint32_t>(bytes_.size() - offset)};
}

folly::Expected<std::vector<uint8_t>, TokenStreamWriter::Error>
TokenStreamWriter::finish() && {
  if (finished_) {
    return folly::makeUnexpected(Error::AlreadyFinished);
  }
  finished_ = true;
  if (bytes_.size() >= maxBytes_) {
    return folly::makeUnexpected(Error::SizeLimitExceeded);
  }
  bytes_.push_back(kEndArray);
  return folly::makeExpected<Error>(std::move(bytes_));
}

} // namespace facebook::react
