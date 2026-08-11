/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

namespace facebook::react {

/*
 * `Tag` and `InstanceHandle` are used to address React Native components.
 */
using Tag = int32_t;

/*
 * An id of a running Surface instance that is used to refer to the instance.
 */
using SurfaceId = int32_t;

/*
 * Universal component handle which allows to refer to `ComponentDescriptor`s
 * in maps efficiently.
 * Practically, it's something that concrete ShadowNode and concrete
 * ComponentDescriptor have in common.
 */
using ComponentHandle = int64_t;

/*
 * String identifier for components used for addressing them from
 * JavaScript side.
 */
using ComponentName = const char*;

/*
 * Defines how visual side effects (views, images, text, and so on) are
 * mounted (on not) on the screen.
 */
enum class DisplayMode {
  /*
   * The surface is running normally. All visual side-effects will be rendered
   * on the screen.
   */
  Visible = 0,

  /*
   * The surface is `Suspended`. All new (committed after switching to the
   * mode) visual side-effects will *not* be mounted on the screen (the screen
   * will stop updating).
   *
   * The mode can be used for preparing a surface for possible future use.
   * The surface will be prepared without spending computing resources
   * on mounting, and then can be instantly mounted if needed.
   */
  Suspended = 1,

  /*
   * The surface is `Hidden`. All previously mounted visual side-effects
   * will be unmounted, and all new (committed after switching to the mode)
   * visual side-effects will *not* be mounted on the screen until the mode is
   * switched back to `normal`.
   *
   * The mode can be used for temporarily freeing computing resources of
   * off-the-screen surfaces.
   */
  Hidden = 2,
};

} // namespace facebook::react
