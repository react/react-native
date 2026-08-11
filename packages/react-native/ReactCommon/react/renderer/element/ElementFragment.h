/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <vector>

#include <react/renderer/core/ShadowNode.h>

namespace facebook::react {

/*
 * This is an implementation detail, do not use it directly.
 * A type-erased version of `Element<>`.
 * `ElementFragment` carries all information that is stored inside `Element<>`
 * in some generalized, type-erased manner.
 */
class ElementFragment final {
 public:
  using Shared = std::shared_ptr<ElementFragment>;
  using List = std::vector<ElementFragment>;
  using ListOfShared = std::vector<Shared>;
  using ReferenceCallback =
      std::function<void(const std::shared_ptr<ShadowNode>& shadowNode)>;
  using FinalizeCallback = std::function<void(ShadowNode& shadowNode)>;
  using StateCallback =
      std::function<StateData::Shared(const State::Shared& state)>;

  /*
   * ComponentDescriptor part (describes the type)
   */
  ComponentHandle componentHandle;
  ComponentName componentName;

  /*
   * ShadowNodeFamily part (describes the family)
   */
  Tag tag;
  SurfaceId surfaceId;

  /*
   * ShadowNode part (describes the instance)
   */
  Props::Shared props;
  List children;

  /*
   * Other
   */
  ReferenceCallback referenceCallback;
  FinalizeCallback finalizeCallback;
  StateCallback stateCallback;
};

} // namespace facebook::react
