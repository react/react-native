/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawColorParser.h"

#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/graphics/Color.h>

namespace facebook::react {

namespace {

jni::local_ref<jni::JInteger> parse(
    jni::alias_ref<jclass> /*unused*/,
    std::string value) {
  auto cssColor = parseCSSProperty<CSSColor>(value);
  if (std::holds_alternative<CSSColor>(cssColor)) {
    auto c = std::get<CSSColor>(cssColor);
    return jni::JInteger::valueOf(
        hostPlatformColorFromRGBA(c.r, c.g, c.b, c.a));
  }
  return nullptr;
}

} // namespace

void RawColorParser::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("nativeParse", parse),
  });
}

} // namespace facebook::react
