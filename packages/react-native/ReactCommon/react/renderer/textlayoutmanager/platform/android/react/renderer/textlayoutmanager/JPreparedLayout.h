/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react {

class JPreparedLayout : public jni::JavaClass<JPreparedLayout> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/views/text/PreparedLayout;";
};

} // namespace facebook::react
