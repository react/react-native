/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MapBufferBuilder.h"
#include <algorithm>

namespace facebook::react {

constexpr uint32_t INT_SIZE = sizeof(uint32_t);
constexpr uint32_t LONG_SIZE = sizeof(uint64_t);
constexpr uint32_t DOUBLE_SIZE = sizeof(double);
constexpr uint32_t MAX_BUCKET_VALUE_SIZE = sizeof(uint64_t);

// Dynamic-data entries store their location in the bucket's 8-byte value as
// [offset (low 32 bits)][byteLength (high 32 bits)], so the payload in the
// dynamic data section needs no in-band length prefix.
static inline uint64_t packOffsetAndLength(int32_t offset, int32_t length) {
  return static_cast<uint64_t>(static_cast<uint32_t>(offset)) |
      (static_cast<uint64_t>(static_cast<uint32_t>(length)) << 32);
}

MapBuffer MapBufferBuilder::EMPTY() {
  return MapBufferBuilder(0).build();
}

MapBufferBuilder::MapBufferBuilder(uint32_t initialSize) {
  buckets_.reserve(initialSize);
  header_.count = 0;
}

void MapBufferBuilder::storeKeyValue(
    MapBuffer::Key key,
    MapBuffer::DataType type,
    const uint8_t* value,
    uint32_t valueSize) {
  if (valueSize > MAX_BUCKET_VALUE_SIZE) {
    LOG(ERROR) << "Error: size of value must be <= MAX_VALUE_SIZE. ValueSize: "
               << valueSize;
    abort();
  }

  uint64_t data = 0;
  auto* dataPtr = reinterpret_cast<uint8_t*>(&data);
  memcpy(dataPtr, value, valueSize);

  buckets_.emplace_back(key, static_cast<uint16_t>(type), data);

  header_.count++;

  if (lastKey_ > key) {
    needsSort_ = true;
  }
  lastKey_ = key;
}

void MapBufferBuilder::putBool(MapBuffer::Key key, bool value) {
  int intValue = (int)value;
  storeKeyValue(
      key,
      MapBuffer::DataType::Boolean,
      reinterpret_cast<const uint8_t*>(&intValue),
      INT_SIZE);
}

void MapBufferBuilder::putDouble(MapBuffer::Key key, double value) {
  storeKeyValue(
      key,
      MapBuffer::DataType::Double,
      reinterpret_cast<const uint8_t*>(&value),
      DOUBLE_SIZE);
}

void MapBufferBuilder::putInt(MapBuffer::Key key, int32_t value) {
  storeKeyValue(
      key,
      MapBuffer::DataType::Int,
      reinterpret_cast<const uint8_t*>(&value),
      INT_SIZE);
}

void MapBufferBuilder::putLong(MapBuffer::Key key, int64_t value) {
  storeKeyValue(
      key,
      MapBuffer::DataType::Long,
      reinterpret_cast<const uint8_t*>(&value),
      LONG_SIZE);
}

void MapBufferBuilder::putString(MapBuffer::Key key, const std::string& value) {
  auto strSize = static_cast<int32_t>(value.size());
  auto offset = static_cast<int32_t>(dynamicData_.size());

  // The bucket stores [offset][byteLength]; the dynamic section holds only the
  // raw string bytes.
  dynamicData_.resize(offset + strSize, 0);
  if (strSize > 0) {
    memcpy(dynamicData_.data() + offset, value.data(), strSize);
  }

  uint64_t data = packOffsetAndLength(offset, strSize);
  storeKeyValue(
      key,
      MapBuffer::DataType::String,
      reinterpret_cast<const uint8_t*>(&data),
      sizeof(data));
}

void MapBufferBuilder::putMapBuffer(MapBuffer::Key key, const MapBuffer& map) {
  auto mapBufferSize = static_cast<int32_t>(map.size());
  auto offset = static_cast<int32_t>(dynamicData_.size());

  // The bucket stores [offset][byteLength]; the dynamic section holds only the
  // serialized child MapBuffer bytes.
  dynamicData_.resize(offset + mapBufferSize, 0);
  memcpy(dynamicData_.data() + offset, map.data(), mapBufferSize);

  uint64_t data = packOffsetAndLength(offset, mapBufferSize);
  storeKeyValue(
      key,
      MapBuffer::DataType::Map,
      reinterpret_cast<const uint8_t*>(&data),
      sizeof(data));
}

void MapBufferBuilder::putMapBufferList(
    MapBuffer::Key key,
    const std::vector<MapBuffer>& mapBufferList) {
  auto offset = static_cast<int32_t>(dynamicData_.size());

  // The bucket stores [offset][byteLength] for the whole list region; within it
  // each child stays framed as [int32 childSize][child bytes] so the children
  // remain individually delimited.
  for (const MapBuffer& mapBuffer : mapBufferList) {
    auto mapBufferSize = static_cast<int32_t>(mapBuffer.size());
    auto pos = static_cast<int32_t>(dynamicData_.size());
    dynamicData_.resize(pos + INT_SIZE + mapBufferSize, 0);
    memcpy(dynamicData_.data() + pos, &mapBufferSize, INT_SIZE);
    memcpy(
        dynamicData_.data() + pos + INT_SIZE, mapBuffer.data(), mapBufferSize);
  }

  auto totalSize = static_cast<int32_t>(dynamicData_.size()) - offset;
  uint64_t data = packOffsetAndLength(offset, totalSize);
  // Uses the dedicated MapBufferList type so the entry is self-describing and
  // distinguishable from a single Map.
  storeKeyValue(
      key,
      MapBuffer::DataType::MapBufferList,
      reinterpret_cast<const uint8_t*>(&data),
      sizeof(data));
}

void MapBufferBuilder::putIntBuffer(
    MapBuffer::Key key,
    const std::vector<int32_t>& value) {
  // The bucket stores [offset][byteLength]; the dynamic section holds the raw
  // int32 elements. Element count is recovered as byteLength / sizeof(int32_t).
  auto payloadSize = static_cast<int32_t>(value.size() * sizeof(int32_t));
  auto offset = static_cast<int32_t>(dynamicData_.size());
  dynamicData_.resize(offset + payloadSize, 0);
  if (payloadSize > 0) {
    memcpy(dynamicData_.data() + offset, value.data(), payloadSize);
  }

  uint64_t data = packOffsetAndLength(offset, payloadSize);
  storeKeyValue(
      key,
      MapBuffer::DataType::IntBuffer,
      reinterpret_cast<const uint8_t*>(&data),
      sizeof(data));
}

void MapBufferBuilder::putDoubleBuffer(
    MapBuffer::Key key,
    const std::vector<double>& value) {
  // The bucket stores [offset][byteLength]; the dynamic section holds the raw
  // double elements. Element count is recovered as byteLength / sizeof(double).
  // Doubles are copied byte-for-byte; the reader uses memcpy, so the payload
  // needs no special alignment for correctness. A consumer that wants a
  // zero-copy typed view on the JVM (ByteBuffer::asDoubleBuffer) must ensure
  // 8-byte alignment itself.
  auto payloadSize = static_cast<int32_t>(value.size() * sizeof(double));
  auto offset = static_cast<int32_t>(dynamicData_.size());
  dynamicData_.resize(offset + payloadSize, 0);
  if (payloadSize > 0) {
    memcpy(dynamicData_.data() + offset, value.data(), payloadSize);
  }

  uint64_t data = packOffsetAndLength(offset, payloadSize);
  storeKeyValue(
      key,
      MapBuffer::DataType::DoubleBuffer,
      reinterpret_cast<const uint8_t*>(&data),
      sizeof(data));
}

static inline bool compareBuckets(
    const MapBuffer::Bucket& a,
    const MapBuffer::Bucket& b) {
  return a.key < b.key;
}

MapBuffer MapBufferBuilder::build() {
  // Create buffer: [header] + [key, values] + [dynamic data]
  auto bucketSize = buckets_.size() * sizeof(MapBuffer::Bucket);
  auto headerSize = sizeof(MapBuffer::Header);
  auto bufferSize = headerSize + bucketSize + dynamicData_.size();

  if (needsSort_) {
    std::sort(buckets_.begin(), buckets_.end(), compareBuckets);
  }

  // TODO(T83483191): add pass to check for duplicates

  std::vector<uint8_t> buffer(bufferSize);
  memcpy(buffer.data(), &header_, headerSize);
  // buckets_.data() / dynamicData_.data() return nullptr when the vector is
  // empty; passing nullptr to memcpy is UB even with size 0 (glibc marks the
  // src argument nonnull) and trips UBSan halt-on-error on empty / scalar-only
  // MapBuffers.
  if (!buckets_.empty()) {
    memcpy(buffer.data() + headerSize, buckets_.data(), bucketSize);
  }
  if (!dynamicData_.empty()) {
    memcpy(
        buffer.data() + headerSize + bucketSize,
        dynamicData_.data(),
        dynamicData_.size());
  }

  return MapBuffer(std::move(buffer));
}

} // namespace facebook::react
