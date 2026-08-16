/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/StyleConditionPrimitives.h>

namespace facebook::react {

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(const PropsParserContext &context, const RootProps &sourceProps, const RawProps &rawProps);
  RootProps(
      const PropsParserContext &context,
      const RootProps &sourceProps,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext,
      ColorScheme colorScheme);

#pragma mark - Props

  LayoutConstraints layoutConstraints{};
  LayoutContext layoutContext{};

  /*
   * The interface color scheme conditional (`@media (prefers-color-scheme)`)
   * styles are resolved against. Lives on the root (like `layoutConstraints`)
   * so the `ShadowTree` can read it per surface when committing.
   */
  ColorScheme colorScheme{ColorScheme::Light};
};

} // namespace facebook::react
