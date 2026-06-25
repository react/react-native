/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/State.h>

namespace facebook::react {

/*
 * An object which supposed to be used as a parameter specifying a shape
 * of created or cloned ShadowNode.
 * Note: Most of the fields are `const &` references (essentially just raw
 * pointers) which means that the Fragment does not copy/store them nor
 * retain ownership of them.
 */
struct ShadowNodeFragment {
  const Props::Shared &props = propsPlaceholder();
  const std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>> &children = childrenPlaceholder();
  const State::Shared &state = statePlaceholder();
  const bool runtimeShadowNodeReference = true;

  /*
   * Placeholders.
   * Use as default arguments as an indication that the field does not need to
   * be changed.
   */
  static const Props::Shared &propsPlaceholder();
  static const std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>> &childrenPlaceholder();
  static const State::Shared &statePlaceholder();
};

} // namespace facebook::react
