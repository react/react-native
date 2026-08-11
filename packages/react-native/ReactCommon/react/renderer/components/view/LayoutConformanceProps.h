/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/YogaStylableProps.h>
#include <react/renderer/components/view/propsConversions.h>

namespace facebook::react {

struct LayoutConformanceProps final : public YogaStylableProps {
  /**
   * Whether to layout the subtree with strict conformance to W3C standard
   * (YGErrataNone) or for compatibility with legacy RN bugs (YGErrataAll)
   */
  LayoutConformance mode{LayoutConformance::Strict};

  LayoutConformanceProps() = default;
  LayoutConformanceProps(
      const PropsParserContext& context,
      const LayoutConformanceProps& sourceProps,
      const RawProps& rawProps)
      : YogaStylableProps(context, sourceProps, rawProps),
        mode{convertRawProp(
            context,
            rawProps,
            "mode",
            mode,
            LayoutConformance::Strict)} {}
};

} // namespace facebook::react
