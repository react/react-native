/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/graphics/Float.h>

namespace facebook::react {

/*
 * TextLayoutContext: Additional contextual information useful for text
 * measurement.
 */
struct TextLayoutContext {
  /*
   * Reflects the scale factor needed to convert from the logical coordinate
   * space into the device coordinate space of the physical screen.
   * Some layout systems *might* use this to round layout metric values
   * to `pixel value`.
   */
  Float pointScaleFactor{1.0};

  /**
   * The ID of the surface being laid out
   */
  SurfaceId surfaceId{-1};

  bool operator==(const TextLayoutContext& rhs) const = default;
};

} // namespace facebook::react
