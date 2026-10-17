/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/Debug.h>
#include <React/Graphics.h>
#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>

namespace facebook::react {

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

  /*
   * Size of the content frame that the paragraph was laid out with.
   * The mounted view can temporarily have a different size (e.g. while
   * LayoutAnimation interpolates its frame), so it lays out text in this size
   * to keep line breaks stable.
   */
  Size layoutSize;
};

} // namespace facebook::react
