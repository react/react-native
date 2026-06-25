/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/BindingsInstallerHolder.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace facebook::react {

class BlobCollector : public jsi::HostObject {
 public:
  BlobCollector(jni::global_ref<jobject> blobModule, std::string blobId);
  ~BlobCollector();

  size_t getBlobLength();

 private:
  jni::global_ref<jobject> blobModule_;
  const std::string blobId_;
};

class BlobModuleJSIBindings : public jni::JavaClass<BlobModuleJSIBindings> {
 public:
  static constexpr const char *kJavaDescriptor = "Lcom/facebook/react/modules/blob/BlobModule;";

  static void registerNatives();

 private:
  static jni::local_ref<BindingsInstallerHolder::javaobject> getBindingsInstaller(
      jni::alias_ref<BlobModuleJSIBindings> jobj);
};

} // namespace facebook::react
