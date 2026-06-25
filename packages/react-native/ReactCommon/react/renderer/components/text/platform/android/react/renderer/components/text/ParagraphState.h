/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/renderer/textlayoutmanager/TextLayoutManagerExtended.h>

#include <fbjni/fbjni.h>
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>

#include <utility>

namespace facebook::react {

// constants for Text State serialization
constexpr static MapBuffer::Key TX_STATE_KEY_ATTRIBUTED_STRING = 0;
constexpr static MapBuffer::Key TX_STATE_KEY_PARAGRAPH_ATTRIBUTES = 1;
// Used for TextInput only
constexpr static MapBuffer::Key TX_STATE_KEY_HASH = 2;
constexpr static MapBuffer::Key TX_STATE_KEY_MOST_RECENT_EVENT_COUNT = 3;

/*
 * State for <Paragraph> component.
 * Represents what to render and how to render.
 */
class ParagraphState final {
 public:
  /*
   * All content of <Paragraph> component represented as an `AttributedString`.
   */
  AttributedString attributedString;

  /*
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes;

  /*
   * `TextLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   */
  std::weak_ptr<const TextLayoutManager> layoutManager;

  /**
   * A fully prepared representation of a text layout to mount
   */
  MeasuredPreparedTextLayout measuredLayout;

  ParagraphState(
      AttributedString attributedString,
      ParagraphAttributes paragraphAttributes,
      std::weak_ptr<const TextLayoutManager> layoutManager,
      MeasuredPreparedTextLayout measuredLayout)
      : attributedString(std::move(attributedString)),
        paragraphAttributes(std::move(paragraphAttributes)),
        layoutManager(std::move(layoutManager)),
        measuredLayout(std::move(measuredLayout))
  {
  }

  ParagraphState(
      AttributedString attributedString,
      ParagraphAttributes paragraphAttributes,
      std::weak_ptr<const TextLayoutManager> layoutManager)
      : ParagraphState(std::move(attributedString), std::move(paragraphAttributes), std::move(layoutManager), {})
  {
  }

  ParagraphState() = default;
  ParagraphState(const ParagraphState & /*previousState*/, const folly::dynamic & /*data*/)
  {
    react_native_assert(false && "Not supported");
  };

  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const;
  jni::local_ref<jobject> getJNIReference() const;
};

} // namespace facebook::react
