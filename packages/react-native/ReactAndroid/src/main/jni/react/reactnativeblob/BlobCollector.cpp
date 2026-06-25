/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BlobCollector.h"

#include <fbjni/fbjni.h>
#include <memory>
#include <utility>

using namespace facebook;

namespace facebook::react {

static constexpr auto kBlobModuleJavaDescriptor =
    "com/facebook/react/modules/blob/BlobModule";

BlobCollector::BlobCollector(
    jni::global_ref<jobject> blobModule,
    std::string blobId)
    : blobModule_(std::move(blobModule)), blobId_(std::move(blobId)) {}

BlobCollector::~BlobCollector() {
  jni::ThreadScope::WithClassLoader([&] {
    static auto removeMethod = jni::findClassStatic(kBlobModuleJavaDescriptor)
                                   ->getMethod<void(jstring)>("remove");
    removeMethod(blobModule_, jni::make_jstring(blobId_).get());
    blobModule_.reset();
  });
}

size_t BlobCollector::getBlobLength() {
  static auto getLengthMethod =
      jni::findClassStatic(kBlobModuleJavaDescriptor)
          ->getMethod<jlong(jstring)>("getLengthOfBlob");
  auto length = getLengthMethod(blobModule_, jni::make_jstring(blobId_).get());
  return static_cast<size_t>(length);
}

// static
void BlobModuleJSIBindings::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "getBindingsInstaller", BlobModuleJSIBindings::getBindingsInstaller),
  });
}

// static
jni::local_ref<BindingsInstallerHolder::javaobject>
BlobModuleJSIBindings::getBindingsInstaller(
    jni::alias_ref<BlobModuleJSIBindings> jobj) {
  auto blobModuleRef = jni::make_global(jobj);
  return BindingsInstallerHolder::newObjectCxxArgs(
      [blobModuleRef = std::move(blobModuleRef)](
          jsi::Runtime& runtime, const std::shared_ptr<CallInvoker>&) {
        runtime.global().setProperty(
            runtime,
            "__blobCollectorProvider",
            jsi::Function::createFromHostFunction(
                runtime,
                jsi::PropNameID::forAscii(runtime, "__blobCollectorProvider"),
                1,
                [blobModuleRef](
                    jsi::Runtime& rt,
                    const jsi::Value& /*thisVal*/,
                    const jsi::Value* args,
                    size_t /*count*/) {
                  // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                  auto blobId = args[0].asString(rt).utf8(rt);
                  auto blobCollector =
                      std::make_shared<BlobCollector>(blobModuleRef, blobId);
                  auto blobCollectorJsObject =
                      jsi::Object::createFromHostObject(rt, blobCollector);
                  blobCollectorJsObject.setExternalMemoryPressure(
                      rt, blobCollector->getBlobLength());
                  return blobCollectorJsObject;
                }));
      });
}

} // namespace facebook::react
