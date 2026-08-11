/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>
#include <string>

namespace facebook {
namespace jsi {
namespace jni {

namespace jni = ::facebook::jni;

class HermesMemoryDumper : public jni::JavaClass<HermesMemoryDumper> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/hermes/instrumentation/HermesMemoryDumper;";

  bool shouldSaveSnapshot() {
    static auto shouldSaveSnapshotMethod =
        javaClassStatic()->getMethod<jboolean()>("shouldSaveSnapshot");
    return shouldSaveSnapshotMethod(self());
  }

  std::string getInternalStorage() {
    static auto getInternalStorageMethod =
        javaClassStatic()->getMethod<jstring()>("getInternalStorage");
    return getInternalStorageMethod(self())->toStdString();
  }

  std::string getId() {
    static auto getInternalStorageMethod =
        javaClassStatic()->getMethod<jstring()>("getId");
    return getInternalStorageMethod(self())->toStdString();
  }

  void setMetaData(std::string crashId) {
    static auto getIdMethod =
        javaClassStatic()->getMethod<void(std::string)>("setMetaData");
    getIdMethod(self(), crashId);
  }
};

} // namespace jni
} // namespace jsi
} // namespace facebook
