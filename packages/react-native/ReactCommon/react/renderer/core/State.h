/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef RN_SERIALIZABLE_STATE
#include <fbjni/fbjni.h>
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#endif

#include <react/renderer/core/ShadowNodeFamily.h>

namespace facebook::react {

/*
 * An abstract interface of State.
 * State is used to control and continuously advance a single vision of some
 * state (arbitrary data) associated with a family of shadow nodes.
 */
class State {
 public:
  using Shared = std::shared_ptr<const State>;

  static size_t constexpr initialRevisionValue = 1;

 protected:
  /*
   * Constructors are protected to make calling them directly with
   * type-erasured arguments impossible.
   */
  explicit State(StateData::Shared data, const State& previousState);
  explicit State(StateData::Shared data, ShadowNodeFamily::Weak family);

 public:
  virtual ~State() = default;

  /*
   * Returns a momentary value of the most recently committed state
   * associated with a family of nodes which this state belongs to.
   * Sequential calls might return different values.
   */
  State::Shared getMostRecentState() const;

  /*
   * Returns the most recent state (same as `getMostRecentState()` method)
   * if this state is obsolete, otherwise returns `nullptr`.
   */
  State::Shared getMostRecentStateIfObsolete() const;

  /*
   * Returns a revision number of the `State` object.
   * The number is being automatically assigned during the creation of `State`
   * objects.
   * Revision `0` represents a case when we don't have any info about state
   * object (actual State instances cannot have it).
   * Revision `1` represents a newly created initial state object.
   */
  size_t getRevision() const;

#ifdef RN_SERIALIZABLE_STATE
  virtual folly::dynamic getDynamic() const = 0;
  virtual MapBuffer getMapBuffer() const = 0;
  virtual jni::local_ref<jobject> getJNIReference() const = 0;
  virtual void updateState(folly::dynamic&& data) const = 0;
#endif

 protected:
  friend class ShadowNodeFamily;
  friend class UIManager;

  /*
   * Returns a shared pointer to data.
   * To be used by `UIManager` only.
   */
  const StateData::Shared& getDataPointer() const {
    return data_;
  }

  /*
   * A family of a node with this state is associated.
   * Must be a weak pointer to avoid retain cycle among `State`, `ShadowNode`,
   * and `ShadowNodeFamily` instances.
   */
  ShadowNodeFamily::Weak family_;

  /*
   * Type-erasured pointer to arbitrary component-specific data held by the
   * `State`.
   */
  StateData::Shared data_;

  /*
   * Indicates that the state was committed once and then was replaced by a
   * newer one.
   * To be used by `StateCoordinator` only.
   * Protected by mutex inside `StateCoordinator`.
   */
  mutable bool isObsolete_{false};

  /*
   * Revision of the State object.
   */
  size_t revision_;
};

} // namespace facebook::react
