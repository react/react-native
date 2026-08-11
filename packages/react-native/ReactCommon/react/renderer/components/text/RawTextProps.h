/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook::react {

class RawTextProps;

using SharedRawTextProps = std::shared_ptr<const RawTextProps>;

class RawTextProps : public Props {
 public:
  RawTextProps() = default;
  RawTextProps(
      const PropsParserContext& context,
      const RawTextProps& sourceProps,
      const RawProps& rawProps);

#pragma mark - Props

  std::string text{};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif

#ifdef RN_SERIALIZABLE_STATE
  ComponentName getDiffPropsImplementationTarget() const override;
  folly::dynamic getDiffProps(const Props* prevProps) const override;
#endif
};

} // namespace facebook::react
