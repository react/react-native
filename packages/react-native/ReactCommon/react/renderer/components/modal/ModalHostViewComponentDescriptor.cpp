/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ModalHostViewComponentDescriptor.h"

namespace facebook::react {

#ifdef ANDROID
State::Shared ModalHostViewComponentDescriptor::createInitialState(
    const Props::Shared& props,
    const ShadowNodeFamily::Shared& family) const {
  // Match the Dialog's system bar configuration before its first measurement.
  const auto& modalProps = static_cast<const ModalHostViewProps&>(*props);

  int surfaceId = family->getSurfaceId();

  auto fabricUIManager =
      contextContainer_->at<jni::alias_ref<jobject>>("FabricUIManager");

  static auto getEncodedScreenSizeWithoutVerticalInsets =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<jlong(jint, jboolean, jboolean)>(
              "getEncodedScreenSizeWithoutVerticalInsets");

  auto result = getEncodedScreenSizeWithoutVerticalInsets(
      fabricUIManager,
      surfaceId,
      modalProps.statusBarTranslucent,
      modalProps.navigationBarTranslucent);

  // Inspired from yogaMeasureToSize from conversions.h
  int32_t wBits = 0xFFFFFFFF & (result >> 32);
  int32_t hBits = 0xFFFFFFFF & result;

  auto* measuredWidth = reinterpret_cast<float*>(&wBits);
  auto* measuredHeight = reinterpret_cast<float*>(&hBits);

  return std::make_shared<ModalHostViewShadowNode::ConcreteState>(
      std::make_shared<const ModalHostViewState>(ModalHostViewState(
          Size{.width = *measuredWidth, .height = *measuredHeight})),
      family);
}
#endif // ANDROID

} // namespace facebook::react
