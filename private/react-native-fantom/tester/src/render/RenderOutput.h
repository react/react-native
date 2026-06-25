/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/json.h>
#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/mounting/stubs/StubViewTree.h>
#include "RenderFormatOptions.h"

namespace facebook::react {
class RenderOutput {
 public:
  std::string render(const StubViewTree &tree, const RenderFormatOptions &options);

  void markMutated(SurfaceId surfaceId)
  {
    treesMutated_.insert(surfaceId);
  }

 private:
  folly::dynamic renderView(const StubView &view, const RenderFormatOptions &options);

#if RN_DEBUG_STRING_CONVERTIBLE
  folly::dynamic renderProps(const SharedDebugStringConvertibleList &propsList);
#endif

  folly::dynamic renderAttributedString(const Tag &selfTag, const AttributedString &string);

  // If true, the next call to render() will re-render the entire tree.
  std::unordered_set<SurfaceId> treesMutated_{};
};
} // namespace facebook::react
