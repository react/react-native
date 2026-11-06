/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/renderer/core/EventEmitter.h>

namespace facebook::react {

TEST(EventEmitterTest, defaultPayloadFactoryCreatesFreshEmptyObjects) {
  auto runtime = hermes::makeHermesRuntime();
  auto factory = EventEmitter::defaultPayloadFactory();

  auto first = factory(*runtime).getObject(*runtime);
  EXPECT_EQ(first.getPropertyNames(*runtime).size(*runtime), 0u);
  first.setProperty(*runtime, "mutation", 42);
  EXPECT_EQ(first.getProperty(*runtime, "mutation").getNumber(), 42);

  auto second = factory(*runtime).getObject(*runtime);
  EXPECT_EQ(second.getPropertyNames(*runtime).size(*runtime), 0u);
  EXPECT_FALSE(second.hasProperty(*runtime, "mutation"));
}

TEST(EventEmitterTest, defaultPayloadFactoryUsesSuppliedRuntime) {
  auto firstRuntime = hermes::makeHermesRuntime();
  auto secondRuntime = hermes::makeHermesRuntime();
  auto factory = EventEmitter::defaultPayloadFactory();

  auto first = factory(*firstRuntime).getObject(*firstRuntime);
  first.setProperty(*firstRuntime, "mutation", 42);

  auto second = factory(*secondRuntime).getObject(*secondRuntime);
  EXPECT_EQ(second.getPropertyNames(*secondRuntime).size(*secondRuntime), 0u);
  EXPECT_FALSE(second.hasProperty(*secondRuntime, "mutation"));
  EXPECT_EQ(first.getProperty(*firstRuntime, "mutation").getNumber(), 42);
}

} // namespace facebook::react
