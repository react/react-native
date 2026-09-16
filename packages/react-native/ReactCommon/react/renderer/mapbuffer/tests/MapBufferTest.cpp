/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <limits>
#include <memory>
#include <vector>

#include <gtest/gtest.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

using namespace facebook::react;

TEST(MapBufferTest, testSimpleIntMap) {
  auto builder = MapBufferBuilder();

  builder.putInt(0, 1234);
  builder.putInt(1, 4321);

  auto map = builder.build();

  EXPECT_EQ(map.count(), 2);
  EXPECT_EQ(map.getInt(0), 1234);
  EXPECT_EQ(map.getInt(1), 4321);
}

TEST(MapBufferTest, testSimpleLongMap) {
  auto builder = MapBufferBuilder();

  int64_t minInt64 = std::numeric_limits<int64_t>::min();
  int64_t maxInt64 = std::numeric_limits<int64_t>::max();

  builder.putLong(0, minInt64);
  builder.putLong(1, maxInt64);
  builder.putLong(2, 1125899906842623LL);
  builder.putLong(3, -1125899906842623LL);

  auto map = builder.build();

  EXPECT_EQ(map.count(), 4);
  EXPECT_EQ(map.getLong(0), minInt64);
  EXPECT_EQ(map.getLong(1), maxInt64);
  EXPECT_EQ(map.getLong(2), 1125899906842623LL);
  EXPECT_EQ(map.getLong(3), -1125899906842623LL);
}

TEST(MapBufferTest, testMapBufferExtension) {
  // initialSize is a reserve hint for the number of buckets
  int initialSize = 26;
  auto buffer = MapBufferBuilder(initialSize);

  buffer.putInt(0, 1234);
  buffer.putInt(1, 4321);
  buffer.putInt(2, 2121);
  buffer.putInt(3, 1212);

  auto map = buffer.build();

  EXPECT_EQ(map.count(), 4);

  EXPECT_EQ(map.getInt(0), 1234);
  EXPECT_EQ(map.getInt(1), 4321);
  EXPECT_EQ(map.getInt(2), 2121);
  EXPECT_EQ(map.getInt(3), 1212);
}

TEST(MapBufferTest, testBoolEntries) {
  auto buffer = MapBufferBuilder();

  buffer.putBool(0, true);
  buffer.putBool(1, false);

  auto map = buffer.build();

  EXPECT_EQ(map.count(), 2);
  EXPECT_EQ(map.getBool(0), true);
  EXPECT_EQ(map.getBool(1), false);
}

TEST(MapBufferTest, testDoubleEntries) {
  auto buffer = MapBufferBuilder();

  buffer.putDouble(0, 123.4);
  buffer.putDouble(1, 432.1);

  auto map = buffer.build();

  EXPECT_EQ(map.count(), 2);

  EXPECT_EQ(map.getDouble(0), 123.4);
  EXPECT_EQ(map.getDouble(1), 432.1);
}

TEST(MapBufferTest, testStringEmpty) {
  auto builder = MapBufferBuilder();

  builder.putString(0, "");
  auto map = builder.build();

  EXPECT_EQ(map.getString(0), "");
}

TEST(MapBufferTest, testStringEntries) {
  auto builder = MapBufferBuilder();

  builder.putString(0, "This is a test");
  auto map = builder.build();

  EXPECT_EQ(map.getString(0), "This is a test");
}

TEST(MapBufferTest, testUTFStringEntry) {
  auto builder = MapBufferBuilder();

  builder.putString(0, "Let's count: 的, 一, 是");
  auto map = builder.build();

  EXPECT_EQ(map.getString(0), "Let's count: 的, 一, 是");
}

TEST(MapBufferTest, testEmojiStringEntry) {
  auto builder = MapBufferBuilder();

  builder.putString(
      0, "Let's count: 1️⃣, 2️⃣, 3️⃣, 🤦🏿‍♀️");
  auto map = builder.build();

  EXPECT_EQ(
      map.getString(0),
      "Let's count: 1️⃣, 2️⃣, 3️⃣, 🤦🏿‍♀️");
}

TEST(MapBufferTest, testUTFStringEntries) {
  auto builder = MapBufferBuilder();

  builder.putString(0, "Let's count: 的, 一, 是");
  builder.putString(1, "This is a test");
  auto map = builder.build();

  EXPECT_EQ(map.getString(0), "Let's count: 的, 一, 是");
  EXPECT_EQ(map.getString(1), "This is a test");
}

TEST(MapBufferTest, testEmptyMap) {
  auto builder = MapBufferBuilder();
  auto map = builder.build();
  EXPECT_EQ(map.count(), 0);
}

TEST(MapBufferTest, testEmptyMapConstant) {
  auto map = MapBufferBuilder::EMPTY();
  EXPECT_EQ(map.count(), 0);
}

TEST(MapBufferTest, testMapEntries) {
  auto builder = MapBufferBuilder();
  builder.putString(0, "This is a test");
  builder.putInt(1, 1234);
  auto map = builder.build();

  EXPECT_EQ(map.count(), 2);
  EXPECT_EQ(map.getString(0), "This is a test");
  EXPECT_EQ(map.getInt(1), 1234);

  auto builder2 = MapBufferBuilder();
  builder2.putInt(0, 4321);
  builder2.putMapBuffer(1, map);
  auto map2 = builder2.build();

  EXPECT_EQ(map2.count(), 2);
  EXPECT_EQ(map2.getInt(0), 4321);

  MapBuffer readMap2 = map2.getMapBuffer(1);

  EXPECT_EQ(readMap2.count(), 2);
  EXPECT_EQ(readMap2.getString(0), "This is a test");
  EXPECT_EQ(readMap2.getInt(1), 1234);
}

TEST(MapBufferTest, testMapListEntries) {
  std::vector<MapBuffer> mapBufferList;
  auto builder = MapBufferBuilder();
  builder.putString(0, "This is a test");
  builder.putInt(1, 1234);
  mapBufferList.push_back(builder.build());

  auto builder2 = MapBufferBuilder();
  builder2.putInt(2, 4321);
  builder2.putDouble(3, 908.1);
  mapBufferList.push_back(builder2.build());

  auto builder3 = MapBufferBuilder();
  builder3.putMapBufferList(5, mapBufferList);
  auto map = builder3.build();

  std::vector<MapBuffer> mapBufferList2 = map.getMapBufferList(5);

  EXPECT_EQ(mapBufferList2.size(), 2);
  EXPECT_EQ(mapBufferList2[0].getString(0), "This is a test");
  EXPECT_EQ(mapBufferList2[0].getInt(1), 1234);
  EXPECT_EQ(mapBufferList2[1].getDouble(3), 908.1);
}

TEST(MapBufferTest, testEmptyMapBufferList) {
  auto builder = MapBufferBuilder();

  builder.putMapBufferList(0, {});
  auto map = builder.build();

  EXPECT_EQ(map.getMapBufferList(0).size(), 0);
}

// Place the list behind another dynamic-data entry so its offset is non-zero,
// exercising `getDynamicDataOffset() + getIntAtBucket(...)` against a non-zero
// base rather than the zero-offset path testMapListEntries covers.
TEST(MapBufferTest, testMapListEntriesAtNonZeroOffset) {
  std::vector<MapBuffer> mapBufferList;
  auto inner = MapBufferBuilder();
  inner.putString(0, "inner");
  inner.putInt(1, 42);
  mapBufferList.push_back(inner.build());

  auto builder = MapBufferBuilder();
  builder.putString(0, "prefix");
  builder.putMapBufferList(1, mapBufferList);
  auto map = builder.build();

  EXPECT_EQ(map.getString(0), "prefix");
  std::vector<MapBuffer> readList = map.getMapBufferList(1);
  EXPECT_EQ(readList.size(), 1);
  EXPECT_EQ(readList[0].getString(0), "inner");
  EXPECT_EQ(readList[0].getInt(1), 42);
}

TEST(MapBufferTest, testIntBufferEntries) {
  auto builder = MapBufferBuilder();

  std::vector<int32_t> values{
      1,
      -2,
      3,
      std::numeric_limits<int32_t>::min(),
      std::numeric_limits<int32_t>::max()};
  builder.putIntBuffer(0, values);
  auto map = builder.build();

  EXPECT_EQ(map.count(), 1);
  EXPECT_EQ(map.getIntBuffer(0), values);
}

TEST(MapBufferTest, testEmptyIntBuffer) {
  auto builder = MapBufferBuilder();

  builder.putIntBuffer(0, {});
  auto map = builder.build();

  EXPECT_EQ(map.getIntBuffer(0).size(), 0);
}

TEST(MapBufferTest, testDoubleBufferEntries) {
  auto builder = MapBufferBuilder();

  std::vector<double> values{0.0, -1.5, 3.14159, 1e300, -1e-300};
  builder.putDoubleBuffer(0, values);
  auto map = builder.build();

  EXPECT_EQ(map.count(), 1);
  EXPECT_EQ(map.getDoubleBuffer(0), values);
}

TEST(MapBufferTest, testEmptyDoubleBuffer) {
  auto builder = MapBufferBuilder();

  builder.putDoubleBuffer(0, {});
  auto map = builder.build();

  EXPECT_EQ(map.getDoubleBuffer(0).size(), 0);
}

// Mirrors the batched-animated-props use case: a pair of typed streams plus
// some scalar metadata, with keys inserted out of order to exercise both the
// dynamic-data section and the bucket sort path.
TEST(MapBufferTest, testIntAndDoubleBuffersAlongsideScalars) {
  std::vector<int32_t> intStream{1, 100, 1, 2, 4, 15, 4};
  std::vector<double> doubleStream{0.5, 12.0, 0.25};

  auto builder = MapBufferBuilder();
  builder.putDoubleBuffer(2, doubleStream);
  builder.putInt(0, 7);
  builder.putIntBuffer(1, intStream);
  auto map = builder.build();

  EXPECT_EQ(map.count(), 3);
  EXPECT_EQ(map.getInt(0), 7);
  EXPECT_EQ(map.getIntBuffer(1), intStream);
  EXPECT_EQ(map.getDoubleBuffer(2), doubleStream);
}

TEST(MapBufferTest, testMapRandomAccess) {
  auto builder = MapBufferBuilder();
  builder.putInt(1234, 4321);
  builder.putString(0, "This is a test");
  builder.putDouble(8, 908.1);
  builder.putString(65535, "Let's count: 的, 一, 是");
  auto map = builder.build();

  EXPECT_EQ(map.count(), 4);
  EXPECT_EQ(map.getString(0), "This is a test");
  EXPECT_EQ(map.getDouble(8), 908.1);
  EXPECT_EQ(map.getInt(1234), 4321);
  EXPECT_EQ(map.getString(65535), "Let's count: 的, 一, 是");
}
