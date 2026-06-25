/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/debug/DebugStringConvertible.h>

#include <react/renderer/components/view/Touch.h>

namespace facebook::react {

/*
 * Defines the `touchstart`, `touchend`, `touchmove`, and `touchcancel` event
 * types.
 */
struct TouchEvent {
  /*
   * A list of Touches for every point of contact currently touching the
   * surface.
   */
  Touches touches;

  /*
   * A list of Touches for every point of contact which contributed to the
   * event.
   */
  Touches changedTouches;

  /*
   * A list of Touches for every point of contact that is touching the surface
   * and started on the element that is the target of the current event.
   */
  Touches targetTouches;
};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const TouchEvent &touchEvent);
std::vector<DebugStringConvertibleObject> getDebugProps(
    const TouchEvent &touchEvent,
    DebugStringConvertibleOptions options);

#endif

} // namespace facebook::react
