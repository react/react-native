/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidTextInputShadowNode.h"
#include "AndroidTextInputState.h"

#include <fbjni/fbjni.h>

#include <yoga/YGEnums.h>
#include <yoga/YGValue.h>

#include <unordered_map>

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <AndroidTextInput> component.
 */
class AndroidTextInputComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidTextInputShadowNode> {
 public:
  AndroidTextInputComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor<AndroidTextInputShadowNode>(parameters),
        textLayoutManager_(
            std::make_shared<TextLayoutManager>(contextContainer_)) {}

  virtual State::Shared createInitialState(
      const Props::Shared& props,
      const ShadowNodeFamily::Shared& family) const override {
    int surfaceId = family->getSurfaceId();

    ThemePadding theme;
    // TODO: figure out RTL/start/end/left/right stuff here
    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      theme = surfaceIdToThemePaddingMap_[surfaceId];
    } else {
      const jni::global_ref<jobject>& fabricUIManager =
          contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

      auto env = jni::Environment::current();
      auto defaultTextInputPaddingArray = env->NewFloatArray(4);
      static auto getThemeData =
          jni::findClassStatic(UIManagerJavaDescriptor)
              ->getMethod<jboolean(jint, jfloatArray)>("getThemeData");

      if (getThemeData(
              fabricUIManager, surfaceId, defaultTextInputPaddingArray) != 0u) {
        jfloat* defaultTextInputPadding =
            env->GetFloatArrayElements(defaultTextInputPaddingArray, nullptr);
        theme.start = defaultTextInputPadding[0];
        theme.end = defaultTextInputPadding[1];
        theme.top = defaultTextInputPadding[2];
        theme.bottom = defaultTextInputPadding[3];
        surfaceIdToThemePaddingMap_.emplace(std::make_pair(surfaceId, theme));
        env->ReleaseFloatArrayElements(
            defaultTextInputPaddingArray, defaultTextInputPadding, JNI_ABORT);
      }
      env->DeleteLocalRef(defaultTextInputPaddingArray);
    }

    return std::make_shared<AndroidTextInputShadowNode::ConcreteState>(
        std::make_shared<const AndroidTextInputState>(
            AndroidTextInputState({}, {}, {}, 0)),
        family);
  }

 protected:
  void adopt(ShadowNode& shadowNode) const override {
    auto& textInputShadowNode =
        static_cast<AndroidTextInputShadowNode&>(shadowNode);

    // `TextInputShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    textInputShadowNode.setTextLayoutManager(textLayoutManager_);

    int surfaceId = textInputShadowNode.getSurfaceId();
    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      const auto& theme = surfaceIdToThemePaddingMap_[surfaceId];

      auto& textInputProps = textInputShadowNode.getConcreteProps();

      // Override padding
      // Node is still unsealed during adoption, before layout is complete
      // TODO: T62959168 account for RTL and paddingLeft when setting default
      // paddingStart, and vice-versa with paddingRight/paddingEnd.
      // For now this assumes no RTL.
      auto& style = const_cast<yoga::Style&>(textInputProps.yogaStyle);
      bool changedPadding = false;
      if (!textInputProps.hasPadding && !textInputProps.hasPaddingStart &&
          !textInputProps.hasPaddingLeft &&
          !textInputProps.hasPaddingHorizontal) {
        changedPadding = true;
        style.setPadding(
            yoga::Edge::Start, yoga::StyleLength::points(theme.start));
      }
      if (!textInputProps.hasPadding && !textInputProps.hasPaddingEnd &&
          !textInputProps.hasPaddingRight &&
          !textInputProps.hasPaddingHorizontal) {
        changedPadding = true;
        style.setPadding(yoga::Edge::End, yoga::StyleLength::points(theme.end));
      }
      if (!textInputProps.hasPadding && !textInputProps.hasPaddingTop &&
          !textInputProps.hasPaddingVertical) {
        changedPadding = true;
        style.setPadding(yoga::Edge::Top, yoga::StyleLength::points(theme.top));
      }
      if (!textInputProps.hasPadding && !textInputProps.hasPaddingBottom &&
          !textInputProps.hasPaddingVertical) {
        changedPadding = true;
        style.setPadding(
            yoga::Edge::Bottom, yoga::StyleLength::points(theme.bottom));
      }

      // If the TextInput initially does not have paddingLeft or paddingStart, a
      // paddingStart may be set from the theme. If that happens, when there's a
      // paddingLeft update, we must explicitly unset paddingStart... (same with
      // paddingEnd)
      // TODO: support RTL
      if ((textInputProps.hasPadding || textInputProps.hasPaddingLeft ||
           textInputProps.hasPaddingHorizontal) &&
          !textInputProps.hasPaddingStart) {
        style.setPadding(yoga::Edge::Start, yoga::StyleLength::undefined());
      }
      if ((textInputProps.hasPadding || textInputProps.hasPaddingRight ||
           textInputProps.hasPaddingHorizontal) &&
          !textInputProps.hasPaddingEnd) {
        style.setPadding(yoga::Edge::End, yoga::StyleLength::undefined());
      }

      // Note that this is expensive: on every adopt, we need to set the Yoga
      // props again, which normally only happens during prop parsing. Every
      // commit, state update, etc, will incur this cost.
      if (changedPadding) {
        // Communicate new props to Yoga part of the node
        textInputShadowNode.updateYogaProps();
      }
    }

    textInputShadowNode.dirtyLayout();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }

 private:
  struct ThemePadding {
    float start{};
    float end{};
    float top{};
    float bottom{};
  };

  // TODO T68526882: Unify with Binding::UIManagerJavaDescriptor
  constexpr static auto UIManagerJavaDescriptor =
      "com/facebook/react/fabric/FabricUIManager";

  const std::shared_ptr<TextLayoutManager> textLayoutManager_;
  mutable std::unordered_map<int, ThemePadding> surfaceIdToThemePaddingMap_;
};

} // namespace facebook::react
