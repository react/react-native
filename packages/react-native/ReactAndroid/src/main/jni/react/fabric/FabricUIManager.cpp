/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricUIManager.h"

#include <utility>

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/conversions.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

Size measureHostComponent(
    const ContextContainer* contextContainer,
    FabricUIManagerMeasureArgs args) {
  if (contextContainer == nullptr) {
    return {};
  }

  auto fabricUIManager =
      contextContainer->at<jni::alias_ref<jobject>>("FabricUIManager");
  static const auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat)>("measure");

  auto toReadableMap =
      [](folly::dynamic& value) -> jni::local_ref<ReadableMap::javaobject> {
    if (value.isNull()) {
      return {};
    }
    auto nativeMap = jni::make_local(
        ReadableNativeMap::createWithContents(std::move(value)));
    // NOLINTBEGIN(cppcoreguidelines-pro-type-reinterpret-cast)
    return jni::adopt_local(
        reinterpret_cast<ReadableMap::javaobject>(nativeMap.release()));
    // NOLINTEND(cppcoreguidelines-pro-type-reinterpret-cast)
  };

  auto componentName = jni::make_jstring(args.componentName);
  auto localData = toReadableMap(args.localData);
  auto props = toReadableMap(args.props);
  auto state = toReadableMap(args.state);
  const auto& minimumSize = args.layoutConstraints.minimumSize;
  const auto& maximumSize = args.layoutConstraints.maximumSize;

  return yogaMeassureToSize(measure(
      fabricUIManager,
      args.surfaceId,
      componentName.get(),
      localData.get(),
      props.get(),
      state.get(),
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height));
}

} // namespace facebook::react
