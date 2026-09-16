/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <this/header/intentionally/does/not/exist.h>

static_assert(
    false,
    "TestLibraryAppleTests.cpp must not be compiled by the SPM autolinker");
