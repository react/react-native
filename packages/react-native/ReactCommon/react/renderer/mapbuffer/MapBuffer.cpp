/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MapBuffer.h"
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

namespace facebook::react {

static inline int32_t bucketOffset(int32_t index) {
  return sizeof(MapBuffer::Header) + sizeof(MapBuffer::Bucket) * index;
}

static inline int32_t valueOffset(int32_t bucketIndex) {
  return bucketOffset(bucketIndex) + offsetof(MapBuffer::Bucket, data);
}

// TODO T83483191: Extend MapBuffer C++ implementation to support basic random
// access
MapBuffer::MapBuffer(std::vector<uint8_t> data) : bytes_(std::move(data)) {
  auto header = reinterpret_cast<const Header*>(bytes_.data());
  count_ = header->count;

  if (header->bufferSize != bytes_.size()) {
    LOG(ERROR) << "Error: Data size does not match, expected "
               << header->bufferSize << " found: " << bytes_.size();
    abort();
  }
}

int32_t MapBuffer::getKeyBucket(Key key) const {
  int32_t lo = 0;
  int32_t hi = count_ - 1;
  while (lo <= hi) {
    int32_t mid = (lo + hi) >> 1;

    Key midVal =
        *reinterpret_cast<const Key*>(bytes_.data() + bucketOffset(mid));

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
  return *reinterpret_cast<const int32_t*>(
      bytes_.data() + valueOffset(bucketIndex));
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

  return *reinterpret_cast<const int64_t*>(
      bytes_.data() + valueOffset(bucketIndex));
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

  return *reinterpret_cast<const double*>(
      bytes_.data() + valueOffset(bucketIndex));
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
  int32_t stringLength =
      *reinterpret_cast<const int32_t*>(bytes_.data() + offset);
  const uint8_t* stringPtr = bytes_.data() + offset + sizeof(int);

  return {stringPtr, stringPtr + stringLength};
}

MapBuffer MapBuffer::getMapBuffer(Key key) const {
  auto bucketIndex = getKeyBucket(key);
  react_native_assert(bucketIndex != -1 && "Key not found in MapBuffer");
  if (bucketIndex == -1) {
    return MapBufferBuilder::EMPTY();
  }

  int32_t offset = getDynamicDataOffset() + getIntAtBucket(bucketIndex);
  int32_t mapBufferLength =
      *reinterpret_cast<const int32_t*>(bytes_.data() + offset);
  size_t maxLength = bytes_.size() - offset - sizeof(int32_t);
  if (mapBufferLength > maxLength) {
    mapBufferLength = maxLength;
  }

  std::vector<uint8_t> value(mapBufferLength);

  memcpy(
      value.data(), bytes_.data() + offset + sizeof(int32_t), mapBufferLength);

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
  int32_t mapBufferListLength =
      *reinterpret_cast<const int32_t*>(bytes_.data() + offset);
  offset = offset + sizeof(uint32_t);

  int32_t curLen = 0;
  while (curLen < mapBufferListLength) {
    int32_t mapBufferLength =
        *reinterpret_cast<const int32_t*>(bytes_.data() + offset + curLen);
    curLen = curLen + sizeof(uint32_t);
    std::vector<uint8_t> value(mapBufferLength);
    memcpy(value.data(), bytes_.data() + offset + curLen, mapBufferLength);
    mapBufferList.emplace_back(std::move(value));
    curLen = curLen + mapBufferLength;
  }
  return mapBufferList;
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
