/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>

namespace facebook::react {

class TextEffectProps : public Props {
 public:
  TextEffectProps() = default;
  TextEffectProps(const PropsParserContext &context, const TextEffectProps &sourceProps, const RawProps &rawProps);

  std::string effectName;
  folly::dynamic effectProps;

#ifdef RN_SERIALIZABLE_STATE
  ComponentName getDiffPropsImplementationTarget() const override;
  folly::dynamic getDiffProps(const Props *prevProps) const override;
#endif
};

} // namespace facebook::react
