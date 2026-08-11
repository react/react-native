/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>

namespace facebook::react {

/*
 * State for <TextInput> component.
 */
class TextInputState final {
 public:
  TextInputState() = default;

  TextInputState(
      AttributedStringBox attributedStringBox,
      AttributedString reactTreeAttributedString,
      ParagraphAttributes paragraphAttributes,
      int64_t mostRecentEventCount)
      : attributedStringBox(std::move(attributedStringBox)),
        reactTreeAttributedString(std::move(reactTreeAttributedString)),
        paragraphAttributes(std::move(paragraphAttributes)),
        mostRecentEventCount(mostRecentEventCount) {}

  /*
   * All content of <TextInput> component.
   */
  AttributedStringBox attributedStringBox;

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   * This stores the previous computed *from the React tree*. This usually
   * doesn't change as the TextInput contents are being updated. If it does
   * change, we need to wipe out current contents of the TextInput and replace
   * with the new value from the tree.
   */
  AttributedString reactTreeAttributedString{};

  /*
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes;

  int64_t mostRecentEventCount{0};
};

} // namespace facebook::react
