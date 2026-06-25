/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/text/ParagraphState.h>
#ifdef RN_SERIALIZABLE_STATE
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
inline MapBuffer toMapBuffer(const ParagraphState &paragraphState)
{
  auto builder = MapBufferBuilder();
  auto attStringMapBuffer = toMapBuffer(paragraphState.attributedString);
  builder.putMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING, attStringMapBuffer);
  auto paMapBuffer = toMapBuffer(paragraphState.paragraphAttributes);
  builder.putMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES, paMapBuffer);
  builder.putInt(TX_STATE_KEY_HASH, attStringMapBuffer.getInt(AS_KEY_HASH));
  return builder.build();
}
#endif

} // namespace facebook::react
