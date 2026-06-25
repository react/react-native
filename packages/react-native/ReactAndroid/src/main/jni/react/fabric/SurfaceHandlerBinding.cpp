/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceHandlerBinding.h"
#include <react/renderer/scheduler/Scheduler.h>

namespace facebook::react {

SurfaceHandlerBinding::SurfaceHandlerBinding(
    SurfaceId surfaceId,
    const std::string& moduleName)
    : surfaceHandler_(moduleName, surfaceId) {}

void SurfaceHandlerBinding::setDisplayMode(jint mode) {
  surfaceHandler_.setDisplayMode(static_cast<DisplayMode>(mode));
}

jint SurfaceHandlerBinding::getSurfaceId() {
  return surfaceHandler_.getSurfaceId();
}

jboolean SurfaceHandlerBinding::isRunning() {
  return static_cast<jboolean>(
      surfaceHandler_.getStatus() == SurfaceHandler::Status::Running);
}

jni::local_ref<jstring> SurfaceHandlerBinding::getModuleName() {
  return jni::make_jstring(surfaceHandler_.getModuleName());
}

void SurfaceHandlerBinding::initHybrid(
    jni::alias_ref<jhybridobject> jobj,
    jint surfaceId,
    jni::alias_ref<jstring> moduleName) {
  return setCxxInstance(jobj, surfaceId, moduleName->toStdString());
}

void SurfaceHandlerBinding::setLayoutConstraints(
    jfloat minWidth,
    jfloat maxWidth,
    jfloat minHeight,
    jfloat maxHeight,
    jfloat offsetX,
    jfloat offsetY,
    jboolean doLeftAndRightSwapInRTL,
    jboolean isRTL,
    jfloat pixelDensity,
    jfloat fontScale) {
  LayoutConstraints constraints = {};
  constraints.minimumSize = {.width = minWidth, .height = minHeight};
  constraints.maximumSize = {.width = maxWidth, .height = maxHeight};
  constraints.layoutDirection = (isRTL != 0u) ? LayoutDirection::RightToLeft
                                              : LayoutDirection::LeftToRight;

  LayoutContext context = {};
  context.swapLeftAndRightInRTL = (doLeftAndRightSwapInRTL != 0u);
  context.pointScaleFactor = pixelDensity;
  context.viewportOffset = {.x = offsetX, .y = offsetY};
  context.viewportSize = {.width = maxWidth, .height = maxHeight};
  context.fontSizeMultiplier = fontScale;

  surfaceHandler_.constraintLayout(constraints, context);
}

void SurfaceHandlerBinding::setProps(NativeMap* props) {
  surfaceHandler_.setProps(
      props != nullptr ? props->consume() : folly::dynamic::object());
}

const SurfaceHandler& SurfaceHandlerBinding::getSurfaceHandler() {
  return surfaceHandler_;
}

void SurfaceHandlerBinding::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", SurfaceHandlerBinding::initHybrid),
      makeNativeMethod("_getSurfaceId", SurfaceHandlerBinding::getSurfaceId),
      makeNativeMethod("_isRunning", SurfaceHandlerBinding::isRunning),
      makeNativeMethod("_getModuleName", SurfaceHandlerBinding::getModuleName),
      makeNativeMethod(
          "setLayoutConstraintsNative",
          SurfaceHandlerBinding::setLayoutConstraints),
      makeNativeMethod("setProps", SurfaceHandlerBinding::setProps),
      makeNativeMethod("setDisplayMode", SurfaceHandlerBinding::setDisplayMode),
  });
}

} // namespace facebook::react
