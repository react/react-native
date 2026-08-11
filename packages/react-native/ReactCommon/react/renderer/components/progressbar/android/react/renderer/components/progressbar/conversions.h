/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/components/FBReactNativeSpec/Props.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
inline folly::dynamic toDynamic(const AndroidProgressBarProps& props) {
  folly::dynamic serializedProps = folly::dynamic::object();
  serializedProps["styleAttr"] = props.styleAttr;
  serializedProps["typeAttr"] = props.typeAttr;
  serializedProps["indeterminate"] = props.indeterminate;
  serializedProps["progress"] = props.progress;
  serializedProps["animating"] = props.animating;
  serializedProps["color"] = toAndroidRepr(props.color);
  serializedProps["testID"] = props.testID;
  return serializedProps;
}
#endif

} // namespace facebook::react
