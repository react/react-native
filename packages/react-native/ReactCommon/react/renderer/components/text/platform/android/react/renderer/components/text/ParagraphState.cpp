/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphState.h"

#include <react/renderer/components/text/stateConversions.h>
#include <react/renderer/core/ConcreteState.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

static_assert(StateDataWithMapBuffer<ParagraphState>);
static_assert(StateDataWithJNIReference<ParagraphState>);

folly::dynamic ParagraphState::getDynamic() const {
  LOG(FATAL) << "ParagraphState may only be serialized to MapBuffer";
}

MapBuffer ParagraphState::getMapBuffer() const {
  return toMapBuffer(*this);
}

jni::local_ref<jobject> ParagraphState::getJNIReference() const {
  return jni::make_local(measuredLayout.preparedTextLayout.get());
}

} // namespace facebook::react
