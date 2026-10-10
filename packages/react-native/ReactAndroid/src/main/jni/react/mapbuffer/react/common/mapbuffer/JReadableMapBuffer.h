/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <React/Debug.h>
#include <React/MapBuffer.h>
#include <fbjni/fbjni.h>

#include <fbjni/ByteBuffer.h>

namespace facebook::react {

class JReadableMapBuffer : public jni::HybridClass<JReadableMapBuffer> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/common/mapbuffer/ReadableMapBuffer;";

  static jni::local_ref<JReadableMapBuffer::jhybridobject> createWithContents(MapBuffer &&map);

  explicit JReadableMapBuffer(MapBuffer &&map);

  std::vector<uint8_t> data() const;

 private:
  jni::local_ref<jni::JByteBuffer> importByteBuffer();

  std::vector<uint8_t> serializedData_;
};

} // namespace facebook::react
