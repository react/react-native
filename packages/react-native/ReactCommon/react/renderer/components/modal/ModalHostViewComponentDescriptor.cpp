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
  // For Android, we need to get the size of the screen without the vertical
  // insets to correctly position the modal on the first rendering.
  // For this reason we provide the `createInitialState` implementation
  // that will query FabricUIManager for the size of the screen without
  // vertical insets.

  int surfaceId = family->getSurfaceId();

  auto fabricUIManager =
      contextContainer_->at<jni::alias_ref<jobject>>("FabricUIManager");

  static auto getEncodedScreenSizeWithoutVerticalInsets =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<jlong(jint)>("getEncodedScreenSizeWithoutVerticalInsets");

  auto result =
      getEncodedScreenSizeWithoutVerticalInsets(fabricUIManager, surfaceId);

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
