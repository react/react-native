/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef WITH_PERFETTO

#include <perfetto.h>

PERFETTO_DEFINE_CATEGORIES_IN_NAMESPACE(
    facebook::react,
    perfetto::Category("react-native")
        .SetDescription("User timing events from React Native"));

#endif
