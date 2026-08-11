/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/graphics/Transform.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook::react {

/**
 * Given animation progress, old props, new props, and an "interpolated" shared
 * props struct, this will mutate the "interpolated" struct in-place to give it
 * values interpolated between the old and new props.
 */
static inline void interpolateViewProps(
    Float animationProgress,
    const Props::Shared& oldPropsShared,
    const Props::Shared& newPropsShared,
    Props::Shared& interpolatedPropsShared,
    const Size& size) {
  const ViewProps* oldViewProps =
      static_cast<const ViewProps*>(oldPropsShared.get());
  const ViewProps* newViewProps =
      static_cast<const ViewProps*>(newPropsShared.get());
  ViewProps* interpolatedProps = const_cast<ViewProps*>(
      static_cast<const ViewProps*>(interpolatedPropsShared.get()));

  interpolatedProps->opacity = oldViewProps->opacity +
      (newViewProps->opacity - oldViewProps->opacity) * animationProgress;
  interpolatedProps->transform = Transform::Interpolate(
      animationProgress,
      oldViewProps->transform,
      newViewProps->transform,
      size);

  // Android uses RawProps, not props, to update props on the platform...
  // Since interpolated props don't interpolate at all using RawProps, we need
  // to "re-hydrate" raw props after interpolating. This is what actually gets
  // sent to the mounting layer. This is a temporary hack, only for platforms
  // that use RawProps/folly::dynamic instead of concrete props on the
  // mounting layer. Once we can remove this, we should change `rawProps` to
  // be const again.
#ifdef ANDROID
  if (!interpolatedProps->rawProps.isNull()) {
    interpolatedProps->rawProps["opacity"] = interpolatedProps->opacity;

    interpolatedProps->rawProps["transform"] =
        (folly::dynamic)interpolatedProps->transform;
  }
#endif
}

} // namespace facebook::react
