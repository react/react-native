/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <folly/dynamic.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <unordered_map>

namespace facebook::react {

class LegacyViewManagerInteropViewProps final : public ViewProps {
 public:
  LegacyViewManagerInteropViewProps() = default;
  LegacyViewManagerInteropViewProps(
      const PropsParserContext &context,
      const LegacyViewManagerInteropViewProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  const folly::dynamic otherProps;
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
