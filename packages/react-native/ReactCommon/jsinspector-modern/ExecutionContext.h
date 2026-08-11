/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "UniqueMonostate.h"

#include <optional>
#include <string>
#include <unordered_set>
#include <variant>

namespace facebook::react::jsinspector_modern {

struct ExecutionContextDescription {
  int32_t id{};
  std::string origin;
  std::string name{"<anonymous>"};
  std::optional<std::string> uniqueId;
};

/**
 * A type-safe selector for execution contexts.
 */
class ExecutionContextSelector {
 public:
  /**
   * Returns true iff this selector matches \c context.
   */
  bool matches(const ExecutionContextDescription& context) const noexcept;

  /**
   * Returns a new selector that matches only the given execution context ID.
   */
  static ExecutionContextSelector byId(int32_t id);

  /**
   * Returns a new selector that matches only the given execution context name.
   */
  static ExecutionContextSelector byName(std::string name);

  /**
   * Returns a new selector that matches any execution context.
   */
  static ExecutionContextSelector all();

  ExecutionContextSelector() = delete;
  ExecutionContextSelector(const ExecutionContextSelector& other) = default;
  ExecutionContextSelector(ExecutionContextSelector&& other) noexcept = default;
  ExecutionContextSelector& operator=(const ExecutionContextSelector& other) =
      default;
  ExecutionContextSelector& operator=(
      ExecutionContextSelector&& other) noexcept = default;
  ~ExecutionContextSelector() = default;

  inline bool operator==(const ExecutionContextSelector& other) const noexcept {
    return value_ == other.value_;
  }

 private:
  /**
   * Marker type used to represent "all execution contexts".
   *
   * Q: What is a UniqueMonostate?
   * A: std::monostate, but it's distinct from other UniqueMonostate<...>s, so
   *    you can use multiple of them in the same variant without ambiguity.
   */
  using AllContexts = UniqueMonostate<0>;
  using ContextId = int32_t;
  using ContextName = std::string;

  using Representation = std::variant<AllContexts, ContextId, ContextName>;

  explicit inline ExecutionContextSelector(Representation&& r) : value_(r) {}

  Representation value_;

  friend struct std::hash<
      facebook::react::jsinspector_modern::ExecutionContextSelector>;
};

using ExecutionContextSelectorSet =
    std::unordered_set<ExecutionContextSelector>;

bool matchesAny(
    const ExecutionContextDescription& context,
    const ExecutionContextSelectorSet& selectors);

} // namespace facebook::react::jsinspector_modern

namespace std {

template <>
struct hash<::facebook::react::jsinspector_modern::ExecutionContextSelector> {
  size_t operator()(
      const ::facebook::react::jsinspector_modern::ExecutionContextSelector&
          selector) const {
    return hash<::facebook::react::jsinspector_modern::
                    ExecutionContextSelector::Representation>{}(
        selector.value_);
  }
};

} // namespace std
