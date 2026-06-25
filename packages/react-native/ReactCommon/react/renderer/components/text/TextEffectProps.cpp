/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextEffectProps.h"

#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

TextEffectProps::TextEffectProps(
    const PropsParserContext& context,
    const TextEffectProps& sourceProps,
    const RawProps& rawProps)
    : Props(context, sourceProps, rawProps),
      effectName(convertRawProp(
          context,
          rawProps,
          "effectName",
          sourceProps.effectName,
          std::string{})),
      effectProps(convertRawProp(
          context,
          rawProps,
          "effectProps",
          sourceProps.effectProps,
          folly::dynamic(nullptr))) {}

#ifdef RN_SERIALIZABLE_STATE

ComponentName TextEffectProps::getDiffPropsImplementationTarget() const {
  return "TextEffect";
}

folly::dynamic TextEffectProps::getDiffProps(const Props* prevProps) const {
  folly::dynamic result = folly::dynamic::object();

  static const auto defaultProps = TextEffectProps();

  const TextEffectProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const TextEffectProps*>(prevProps);

  if (effectName != oldProps->effectName) {
    result["effectName"] = effectName;
  }
  if (effectProps != oldProps->effectProps) {
    result["effectProps"] = effectProps;
  }

  return result;
}

#endif

} // namespace facebook::react
