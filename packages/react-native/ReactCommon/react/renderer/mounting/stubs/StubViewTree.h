/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <unordered_map>

#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/mounting/stubs/StubView.h>

namespace facebook::react {

class StubViewTree {
 public:
  StubViewTree() = default;
  StubViewTree(const ShadowView &shadowView);

  void mutate(const ShadowViewMutationList &mutations);

  void dispatchCommand(const ShadowView &shadowView, const std::string &commandName, const folly::dynamic &args);

  const StubView &getRootStubView() const;

  /*
   * Returns a view with given tag.
   */
  const StubView &getStubView(Tag tag) const;

  /*
   * Returns the total amount of views in the tree.
   */
  size_t size() const;

  /**
   * Returns the list of mounting operations in the buffer and clears it.
   */
  std::vector<std::string> takeMountingLogs();

  bool hasTag(Tag tag) const
  {
    return registry_.find(tag) != registry_.end();
  }

 private:
  Tag rootTag_{};
  std::unordered_map<Tag, StubView::Shared> registry_{};
  std::vector<std::string> mountingLogs_{};

  friend bool operator==(const StubViewTree &lhs, const StubViewTree &rhs);

  std::ostream &dumpTags(std::ostream &stream) const;

  std::string getNativeId(Tag tag);
  std::string getNativeId(const ShadowView &shadowView);
  void recordMutation(const ShadowViewMutation &mutation);
};

bool operator==(const StubViewTree &lhs, const StubViewTree &rhs);

} // namespace facebook::react
