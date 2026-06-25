/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

// TODO (T28334063): Consider for codegen.
class ImageProps final : public ViewProps {
 public:
  ImageProps() = default;
  ImageProps(const PropsParserContext &context, const ImageProps &sourceProps, const RawProps &rawProps);

  void
  setProp(const PropsParserContext &context, RawPropsPropNameHash hash, const char *propName, const RawValue &value);

#pragma mark - Props

  ImageSources sources{};
  ImageSource defaultSource{};
  ImageSource loadingIndicatorSource{};
  ImageResizeMode resizeMode{ImageResizeMode::Stretch};
  Float blurRadius{};
  EdgeInsets capInsets{};
  SharedColor tintColor{};
  std::string internal_analyticTag{};
  std::string resizeMethod{"auto"};
  Float resizeMultiplier{1.f};
  bool shouldNotifyLoadEvents{};
  SharedColor overlayColor{};
  Float fadeDuration{300.f};
  bool progressiveRenderingEnabled{};

#ifdef RN_SERIALIZABLE_STATE
  ComponentName getDiffPropsImplementationTarget() const override;
  folly::dynamic getDiffProps(const Props *prevProps) const override;
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace facebook::react
