/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gmock/gmock.h>

#pragma once

/**
 * A variant of GMOCK_ON_CALL_IMPL that allows specifying the source location as
 * a std::source_location parameter.
 */
#define GMOCK_ON_CALL_WITH_SOURCE_LOCATION_IMPL_(location, mock_expr, Setter, call) \
  ((mock_expr).gmock_##call)(::testing::internal::WithoutMatchers::Get(), nullptr)  \
      .Setter((location).file_name(), (location).line(), #mock_expr, #call)

/**
 * A variant of EXPECT_CALL that allows specifying the source location as a
 * std::source_location parameter;
 */
#define EXPECT_CALL_WITH_SOURCE_LOCATION(location, obj, call) \
  GMOCK_ON_CALL_WITH_SOURCE_LOCATION_IMPL_(location, obj, InternalExpectedAt, call)
