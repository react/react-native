/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/core/MediaFeatures.h>

namespace facebook::react {

namespace {
const MediaFeatures kDark{.colorScheme = ColorScheme::Dark};
} // namespace

TEST(MediaFeaturesTest, storeDefaultsToLight) {
  EXPECT_EQ(MediaFeaturesStore{}.get().colorScheme, ColorScheme::Light);
}

TEST(MediaFeaturesTest, storeReturnsTheLastSetValue) {
  MediaFeaturesStore store;
  store.set(kDark);
  EXPECT_EQ(store.get(), kDark);
  store.set({});
  EXPECT_EQ(store.get(), MediaFeatures{});
}

TEST(MediaFeaturesTest, getMediaFeaturesReadsTheStore) {
  auto store = std::make_shared<MediaFeaturesStore>();
  ContextContainer contextContainer;
  contextContainer.insert(kMediaFeaturesStoreKey, store);
  store->set(kDark);
  EXPECT_EQ(getMediaFeatures(&contextContainer), kDark);
}

TEST(MediaFeaturesTest, getMediaFeaturesReturnsTheDefaultsWithoutAStore) {
  ContextContainer contextContainer;
  EXPECT_EQ(getMediaFeatures(&contextContainer), MediaFeatures{});
  EXPECT_EQ(getMediaFeatures(nullptr), MediaFeatures{});
}

} // namespace facebook::react
