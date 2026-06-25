/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>

#include <glog/logging.h>

#include <cstdint>
#include <cstdlib>
#include <limits>
#include <string>
#include <vector>

namespace facebook::react {

class JReadableMapBuffer;

// clang-format off

/**
 * MapBuffer is an optimized sparse array format for transferring props-like
 * objects between C++ and other VMs. The implementation of this map is optimized to:
 * - be compact to optimize space when sparse (sparse is the common case).
 * - be accessible through JNI with zero/minimal copying via ByteBuffer.
 * - have excellent C++ single-write and many-read performance by maximizing
 *   CPU cache performance through compactness, data locality, and fixed offsets
 *   where possible.
 * - be optimized for iteration and intersection against other maps, but with
 *   reasonably good random access as well.
 * - work recursively for nested maps/arrays.
 * - support dynamic types that map to JSON.
 * - don't require mutability/copy - single-write on creation and move semantics.
 * - have minimal APK size and build time impact.
 *
 * MapBuffer data is stored in a continuous chunk of memory (bytes_ field below) with the following layout:
 *
 * ┌─────────────────────Header──────────────────────┐
 * │                    10 bytes                     │
 * ├─Alignment─┬─Item count─┬──────Buffer size───────┤
 * │  2 bytes  │  2 bytes   │        4 bytes         │
 * └───────────┴────────────┴────────────────────────┘
 * ┌────────────────────────────────────────────────────────────────────────────────────────┐
 * │                           Buckets (one per item in the map)                            │
 * │                                                                                        │
 * ├───────────────────────────Bucket───────────────────────────┬───Bucket────┬─────────────┤
 * │                          12 bytes                          │  12 bytes   │             │
 * ├───Key───┬──Type───┬──────Value (primitive or offset)───────┤     ...     │     ...     │
 * │ 2 bytes │ 2 bytes │                8 bytes                 │             │             │
 * └─────────┴─────────┴────────────────────────────────────────┴─────────────┴─────────────┘
 * ┌────────────────────────────────────────────────────────────────────────────────────────┐
 * │  Dynamic data                                                                          │
 * │                                                                                        │
 * │  Free-form data for complex objects (e.g. strings or nested MapBuffers).               │
 * │  When dynamic data is serialized with some object, bucket value contains an offset of  │
 * │  associated byte in the array. The format of the data is not restricted, but common    │
 * │  practice is to use [length | bytes].                                                  │
 * └────────────────────────────────────────────────────────────────────────────────────────┘
 */

// clang-format on

class MapBuffer {
 public:
  using Key = uint16_t;

  // The first value in the buffer, used to check correct encoding/endianness on
  // JVM side.
  constexpr static uint16_t HEADER_ALIGNMENT = 0xFE;

  struct Header {
    uint16_t alignment = HEADER_ALIGNMENT; // alignment of serialization
    uint16_t count; // amount of items in the map
    uint32_t bufferSize; // Amount of bytes used to store the map in memory
  };

#pragma pack(push, 1)
  struct Bucket {
    Key key;
    uint16_t type;
    uint64_t data;

    Bucket(Key key, uint16_t type, uint64_t data) : key(key), type(type), data(data) {}
  };
#pragma pack(pop)

  static_assert(sizeof(Header) == 8, "MapBuffer header size is incorrect.");
  static_assert(sizeof(Bucket) == 12, "MapBuffer bucket size is incorrect.");

  /**
   * Data types available for serialization in MapBuffer
   * Keep in sync with `DataType` enum in `JReadableMapBuffer.java`, which
   * expects the same values after reading them through JNI.
   */
  enum DataType : uint16_t {
    Boolean = 0,
    Int = 1,
    Double = 2,
    String = 3,
    Map = 4,
    Long = 5,
  };

  explicit MapBuffer(std::vector<uint8_t> data);

  MapBuffer(const MapBuffer &buffer) = delete;

  MapBuffer &operator=(const MapBuffer &other) = delete;

  MapBuffer(MapBuffer &&buffer) = default;

  MapBuffer &operator=(MapBuffer &&other) = default;

  int32_t getInt(MapBuffer::Key key) const;

  int64_t getLong(MapBuffer::Key key) const;

  bool getBool(MapBuffer::Key key) const;

  double getDouble(MapBuffer::Key key) const;

  std::string getString(MapBuffer::Key key) const;

  // TODO T83483191: review this declaration
  MapBuffer getMapBuffer(MapBuffer::Key key) const;

  std::vector<MapBuffer> getMapBufferList(MapBuffer::Key key) const;

  size_t size() const;

  const uint8_t *data() const;

  uint16_t count() const;

 private:
  // Buffer and its size
  std::vector<uint8_t> bytes_;

  // amount of items in the MapBuffer
  uint16_t count_ = 0;

  // returns the relative offset of the first byte of dynamic data
  int32_t getDynamicDataOffset() const;

  int32_t getKeyBucket(MapBuffer::Key key) const;

  inline int32_t getIntAtBucket(int32_t bucketIndex) const;

  friend JReadableMapBuffer;
};

} // namespace facebook::react
