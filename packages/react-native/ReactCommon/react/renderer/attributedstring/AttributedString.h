/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/core/Sealable.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

/*
 * Simple, cross-platform, React-specific implementation of attributed string
 * (aka spanned string).
 * `AttributedString` is basically a list of `Fragments` which have `string` and
 * `textAttributes` + `shadowNode` associated with the `string`.
 */
class AttributedString : public Sealable, public DebugStringConvertible {
 public:
  class Fragment {
   public:
    static std::string AttachmentCharacter();

    std::string string;
    TextAttributes textAttributes;
    ShadowView parentShadowView;

    /*
     * Returns true is the Fragment represents an attachment.
     * Equivalent to `string == AttachmentCharacter()`.
     */
    bool isAttachment() const;

    /*
     * Returns whether the underlying text and attributes are equal,
     * disregarding layout or other information.
     */
    bool isContentEqual(const Fragment &rhs) const;

    bool operator==(const Fragment &rhs) const;
  };

  class Range {
   public:
    int location{0};
    int length{0};
  };

  using Fragments = std::vector<Fragment>;

  /*
   * Appends and prepends a `fragment` to the string.
   */
  void appendFragment(Fragment &&fragment);
  void prependFragment(Fragment &&fragment);

  /*
   * Sets attributes which would apply to hypothetical text not included in the
   * AttributedString.
   */
  void setBaseTextAttributes(const TextAttributes &defaultAttributes);

  /*
   * Returns a read-only reference to a list of fragments.
   */
  const Fragments &getFragments() const;

  /*
   * Returns a reference to a list of fragments.
   */
  Fragments &getFragments();

  /*
   * Returns a string constructed from all strings in all fragments.
   */
  std::string getString() const;

  const TextAttributes &getBaseTextAttributes() const;

  /*
   * Returns `true` if the string is empty (has no any fragments).
   */
  bool isEmpty() const;

  /**
   * Compares equality of TextAttributes of all Fragments on both sides.
   */
  bool compareTextAttributesWithoutFrame(const AttributedString &rhs) const;

  bool isContentEqual(const AttributedString &rhs) const;

  bool operator==(const AttributedString &rhs) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugChildren() const override;
#endif

 private:
  Fragments fragments_;
  TextAttributes baseAttributes_;
};

} // namespace facebook::react

namespace std {
template <>
struct hash<facebook::react::AttributedString::Fragment> {
  size_t operator()(const facebook::react::AttributedString::Fragment &fragment) const
  {
    return facebook::react::hash_combine(
        fragment.string,
        fragment.textAttributes,
        fragment.parentShadowView.tag,
        fragment.parentShadowView.layoutMetrics);
  }
};

template <>
struct hash<facebook::react::AttributedString> {
  size_t operator()(const facebook::react::AttributedString &attributedString) const
  {
    auto seed = size_t{0};

    facebook::react::hash_combine(seed, attributedString.getBaseTextAttributes());
    for (const auto &fragment : attributedString.getFragments()) {
      facebook::react::hash_combine(seed, fragment);
    }

    return seed;
  }
};
} // namespace std
