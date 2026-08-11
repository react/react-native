/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>

namespace facebook::react {

/**
 * Prior to D63303709 AttributedString could not represent formatting on an
 * empty string, and so some text content was forcefully added to empty strings
 * during measurement. Usages of this function should be replaced with
 * formatting based off of baseTextAttributes.
 */
inline AttributedString ensurePlaceholderIfEmpty_DO_NOT_USE(
    const AttributedString& attributedString) {
  if (attributedString.isEmpty()) {
    AttributedString placeholder{attributedString};
    placeholder.appendFragment(
        {.string = "I",
         .textAttributes = attributedString.getBaseTextAttributes(),
         .parentShadowView = {}});
    return placeholder;
  }

  return attributedString;
}

} // namespace facebook::react
