/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MapBuffer.h"
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

#include <algorithm>
#include <cstring>

namespace facebook::react {

namespace {
// Reads a value of type T from a (possibly unaligned) offset in the buffer.
// MapBuffer's packed layout places multi-byte values at offsets that are not
// naturally aligned for their type (e.g. an 8-byte value at a 2-byte boundary),
// so dereferencing a reinterpret_cast pointer there is undefined behavior and
// can fault on 32-bit ARM. memcpy compiles to a single unaligned load on
// arm64/x86 and to alignment-safe loads on armv7.
template <typename T>
inline T readUnaligned(const uint8_t* data, int32_t offset) {
  T value;
  std::memcpy(&value, data + offset, sizeof(T));
  return value;
}

// Debug-asserts on OOB (catches corrupt buffers early in dev) AND clamps in
// release so a corrupt bucket length can never drive an OOB memcpy read.
// react_native_assert is compiled out in release, so the runtime cost outside
// dev is the single min() call.
inline int32_t
clampToBufferBounds(int32_t offset, int32_t byteLength, size_t bufferSize) {
  react_native_assert(offset >= 0 && byteLength >= 0);
  react_native_assert(
      static_cast<size_t>(offset) + static_cast<size_t>(byteLength) <=
      bufferSize);
  size_t maxLength = bufferSize > static_cast<size_t>(offset)
      ? bufferSize - static_cast<size_t>(offset)
      : 0;
  return static_cast<int32_t>(
      std::min(static_cast<size_t>(std::max(byteLength, 0)), maxLength));
}
} // namespace

static inline int32_t bucketOffset(int32_t index) {
  return sizeof(MapBuffer::Header) + sizeof(MapBuffer::Bucket) * index;
}

static inline int32_t valueOffset(int32_t bucketIndex) {
  return bucketOffset(bucketIndex) + offsetof(MapBuffer::Bucket, data);
}

// Dynamic-data entries pack [offset (low 32 bits)][byteLength (high 32 bits)]
// into the bucket's 8-byte value, so the payload in the dynamic data section
// carries no in-band length prefix. This returns the position of the high
// 32 bits (the length).
static inline int32_t lengthOffset(int32_t bucketIndex) {
  return valueOffset(bucketIndex) + static_cast<int32_t>(sizeof(int32_t));
}

// TODO T83483191: Extend MapBuffer C++ implementation to support basic random
// access
MapBuffer::MapBuffer(std::vector<uint8_t> data) : bytes_(std::move(data)) {
  if (bytes_.size() >= sizeof(Header)) {
    auto header = reinterpret_cast<const Header*>(bytes_.data());
    count_ = header->count;
  }
}

int32_t MapBuffer::getKeyBucket(Key key) const {
  int32_t lo = 0;
  int32_t hi = count_ - 1;
  while (lo <= hi) {
    int32_t mid = (lo + hi) >> 1;

    Key midVal = readUnaligned<Key>(bytes_.data(), bucketOffset(mid));

    if (midVal < key) {
      lo = mid + 1;
    } else if (midVal > key) {
      hi = mid - 1;
    } else {
      return mid;
    }
  }

  return -1;
}

inline int32_t MapBuffer::getIntAtBucket(int32_t bucketIndex) const {
  return readUnaligned<int32_t>(bytes_.data(), valueOffset(bucketIndex));
}

int32_t MapBuffer::getInt(Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return 0;
  }

  return getIntAtBucket(bucketIndex);
}

int64_t MapBuffer::getLong(Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return 0;
  }

  return readUnaligned<int64_t>(bytes_.data(), valueOffset(bucketIndex));
}

bool MapBuffer::getBool(Key key) const {
  return getInt(key) != 0;
}

double MapBuffer::getDouble(Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return 0;
  }

  return readUnaligned<double>(bytes_.data(), valueOffset(bucketIndex));
}

int32_t MapBuffer::getDynamicDataOffset() const {
  // The start of dynamic data can be calculated as the offset of the next
  // key in the map
  return bucketOffset(count_);
}

std::string MapBuffer::getString(Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return "";
  }

  int32_t offset = getDynamicDataOffset() + getIntAtBucket(bucketIndex);
  auto stringLength =
      readUnaligned<int32_t>(bytes_.data(), lengthOffset(bucketIndex));
  stringLength = clampToBufferBounds(offset, stringLength, bytes_.size());
  const uint8_t* stringPtr = bytes_.data() + offset;

  return {stringPtr, stringPtr + stringLength};
}

MapBuffer MapBuffer::getMapBuffer(Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return MapBufferBuilder::EMPTY();
  }

  int32_t offset = getDynamicDataOffset() + getIntAtBucket(bucketIndex);
  auto mapBufferLength =
      readUnaligned<int32_t>(bytes_.data(), lengthOffset(bucketIndex));
  mapBufferLength = clampToBufferBounds(offset, mapBufferLength, bytes_.size());

  std::vector<uint8_t> value(mapBufferLength);

  memcpy(value.data(), bytes_.data() + offset, mapBufferLength);

  return MapBuffer(std::move(value));
}

std::vector<MapBuffer> MapBuffer::getMapBufferList(MapBuffer::Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return {};
  }

  std::vector<MapBuffer> mapBufferList;
  int32_t offset = getDynamicDataOffset() + getIntAtBucket(bucketIndex);
  auto mapBufferListLength =
      readUnaligned<int32_t>(bytes_.data(), lengthOffset(bucketIndex));
  mapBufferListLength =
      clampToBufferBounds(offset, mapBufferListLength, bytes_.size());

  int32_t curLen = 0;
  while (curLen < mapBufferListLength) {
    if (curLen + sizeof(int32_t) > mapBufferListLength) {
      break;
    }

    auto mapBufferLength =
        readUnaligned<int32_t>(bytes_.data(), offset + curLen);
    curLen += sizeof(int32_t);

    mapBufferLength =
        clampToBufferBounds(offset + curLen, mapBufferLength, bytes_.size());
    std::vector<uint8_t> value(mapBufferLength);
    memcpy(value.data(), bytes_.data() + offset + curLen, mapBufferLength);
    mapBufferList.emplace_back(std::move(value));
    curLen += mapBufferLength;
  }
  return mapBufferList;
}

std::vector<int32_t> MapBuffer::getIntBuffer(MapBuffer::Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return {};
  }

  int32_t offset = getDynamicDataOffset() + getIntAtBucket(bucketIndex);
  auto byteLength =
      readUnaligned<int32_t>(bytes_.data(), lengthOffset(bucketIndex));
  byteLength = clampToBufferBounds(offset, byteLength, bytes_.size());
  int32_t count = byteLength / static_cast<int32_t>(sizeof(int32_t));

  std::vector<int32_t> result(count);
  if (count > 0) {
    // Copy only whole elements: a clamped byteLength may not be a multiple of
    // sizeof(int32_t), and result holds exactly count elements.
    memcpy(
        result.data(),
        bytes_.data() + offset,
        static_cast<size_t>(count) * sizeof(int32_t));
  }
  return result;
}

std::vector<double> MapBuffer::getDoubleBuffer(MapBuffer::Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return {};
  }

  int32_t offset = getDynamicDataOffset() + getIntAtBucket(bucketIndex);
  auto byteLength =
      readUnaligned<int32_t>(bytes_.data(), lengthOffset(bucketIndex));
  byteLength = clampToBufferBounds(offset, byteLength, bytes_.size());
  int32_t count = byteLength / static_cast<int32_t>(sizeof(double));

  std::vector<double> result(count);
  if (count > 0) {
    // Copy only whole elements: a clamped byteLength may not be a multiple of
    // sizeof(double), and result holds exactly count elements.
    memcpy(
        result.data(),
        bytes_.data() + offset,
        static_cast<size_t>(count) * sizeof(double));
  }
  return result;
}

size_t MapBuffer::size() const {
  return bytes_.size();
}

const uint8_t* MapBuffer::data() const {
  return bytes_.data();
}

uint16_t MapBuffer::count() const {
  return count_;
}

} // namespace facebook::react
