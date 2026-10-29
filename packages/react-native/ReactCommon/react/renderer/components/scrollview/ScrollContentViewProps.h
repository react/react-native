/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/components/view/ViewProps.h>

namespace facebook::react {

/*
 * Props for the <ScrollContentView> component, the content container of a
 * <ScrollView>. It takes the props of <View>.
 */
class ScrollContentViewProps final : public ViewProps {
 public:
  ScrollContentViewProps() = default;
  ScrollContentViewProps(
      const PropsParserContext &context,
      const ScrollContentViewProps &sourceProps,
      const RawProps &rawProps);
};

} // namespace facebook::react
