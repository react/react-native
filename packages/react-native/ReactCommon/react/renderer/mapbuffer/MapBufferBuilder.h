/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <vector>
#include "MapBuffer.h"

namespace facebook::react {

// Default reserved size for buckets_ vector
constexpr uint32_t INITIAL_BUCKETS_SIZE = 10;

/**
 * MapBufferBuilder is a builder class for MapBuffer
 */
class MapBufferBuilder {
 public:
  MapBufferBuilder(uint32_t initialSize = INITIAL_BUCKETS_SIZE);

  static MapBuffer EMPTY();

  void putInt(MapBuffer::Key key, int32_t value);

  void putLong(MapBuffer::Key key, int64_t value);

  void putBool(MapBuffer::Key key, bool value);

  void putDouble(MapBuffer::Key key, double value);

  void putString(MapBuffer::Key key, const std::string &value);

  void putMapBuffer(MapBuffer::Key key, const MapBuffer &map);

  void putMapBufferList(MapBuffer::Key key, const std::vector<MapBuffer> &mapBufferList);

  void putIntBuffer(MapBuffer::Key key, const std::vector<int32_t> &value);

  void putDoubleBuffer(MapBuffer::Key key, const std::vector<double> &value);

  MapBuffer build();

 private:
  MapBuffer::Header header_;

  std::vector<MapBuffer::Bucket> buckets_{};

  std::vector<uint8_t> dynamicData_{};

  uint16_t lastKey_{0};

  bool needsSort_{false};

  void storeKeyValue(MapBuffer::Key key, MapBuffer::DataType type, const uint8_t *value, uint32_t valueSize);
};

} // namespace facebook::react
