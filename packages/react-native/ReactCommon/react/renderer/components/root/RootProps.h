/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/RendererCore.h>
#include <React/View.h>

namespace facebook::react {

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(const PropsParserContext &context, const RootProps &sourceProps, const RawProps &rawProps);
  RootProps(
      const PropsParserContext &context,
      const RootProps &sourceProps,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext);

#pragma mark - Props

  LayoutConstraints layoutConstraints{};
  LayoutContext layoutContext{};
};

} // namespace facebook::react
