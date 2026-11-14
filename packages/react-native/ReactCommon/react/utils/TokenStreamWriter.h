/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <folly/Expected.h>

#include <cstddef>
#include <cstdint>
#include <functional>
#include <limits>
#include <string_view>
#include <unordered_set>
#include <vector>

namespace folly {
struct dynamic;
}

namespace facebook::react {

/**
 * Appends native values to one version-one binary token stream array document.
 * Names and string values share a table across all appended values. Returned
 * ranges address values inside that document, not independently decodable streams.
 * No JavaScript runtime is needed, and input values are not copied or modified.
 */
class TokenStreamWriter final {
 public:
  struct ValueRange {
    uint32_t offset;
    uint32_t length;

    bool operator==(const ValueRange &) const = default;
  };

  enum class Error : uint8_t {
    InvalidUnicode,
    NonStringKey,
    SizeLimitExceeded,
    AlreadyFinished,
  };

  /** The byte limit includes the document header and enclosing array. */
  explicit TokenStreamWriter(size_t maxBytes = std::numeric_limits<int32_t>::max());

  TokenStreamWriter(const TokenStreamWriter &) = delete;
  TokenStreamWriter(TokenStreamWriter &&) = delete;
  TokenStreamWriter &operator=(const TokenStreamWriter &) = delete;
  TokenStreamWriter &operator=(TokenStreamWriter &&) = delete;
  ~TokenStreamWriter() = default;

  /**
   * Encodes a value without recursion. Invalid Unicode, non-string object keys
   * and oversized output leave the document and string table unchanged.
   * Integers retain their full width; doubles retain finite values, signed zero,
   * infinities and the distinction between a number and null.
   */
  [[nodiscard]] folly::Expected<ValueRange, Error> write(const folly::dynamic &value);

  /** Completes the array and transfers ownership of its bytes without copying. */
  [[nodiscard]] folly::Expected<std::vector<uint8_t>, Error> finish() &&;

 private:
  struct Entry {
    size_t offset;
    size_t length;
    size_t hash;
    uint32_t index;
  };

  struct StringHash {
    size_t operator()(const Entry &entry) const noexcept;
  };

  struct StringEqual {
    std::reference_wrapper<const TokenStreamWriter> writer;
    bool operator()(const Entry &first, const Entry &second) const noexcept;
  };

  std::vector<uint8_t> bytes_;
  std::unordered_set<Entry, StringHash, StringEqual> strings_;
  std::string_view pendingString_;
  size_t maxBytes_;
  uint32_t nextIndex_ = 0;
  bool finished_ = false;

  std::string_view view(const Entry &entry) const noexcept;
  bool append(const void *data, size_t length);
  bool tag(uint8_t value);
  bool varint(uint64_t value);
  bool numberText(std::string_view text);
  bool string(std::string_view value, uint8_t literalTag, Error &error);
  bool scalar(const folly::dynamic &value, Error &error);
  bool value(const folly::dynamic &value, Error &error);
  void rollback(size_t offset, uint32_t stringIndex);
};

} // namespace facebook::react
