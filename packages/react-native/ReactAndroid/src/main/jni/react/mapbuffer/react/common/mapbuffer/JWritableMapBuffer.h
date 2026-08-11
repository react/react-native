/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/common/mapbuffer/JReadableMapBuffer.h>

namespace facebook::react {

class JWritableMapBuffer : public jni::JavaClass<JWritableMapBuffer> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/common/mapbuffer/WritableMapBuffer;";

  MapBuffer getMapBuffer();
};

} // namespace facebook::react
