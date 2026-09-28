/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stdarg.h>
#include <stdbool.h>
#include <stddef.h>

#include <yoga/YGEnums.h>
#include <yoga/YGMacros.h>

YG_EXTERN_C_BEGIN

typedef struct YGNode* YGNodeRef;
typedef const struct YGNode* YGNodeConstRef;

/**
 * Handle to a mutable Yoga configuration.
 */
typedef struct YGConfig* YGConfigRef;

/**
 * Handle to an immutable Yoga configuration.
 */
typedef const struct YGConfig* YGConfigConstRef;

/**
 * Allocates a set of configuration options. The configuration may be applied to
 * multiple nodes (i.e. a single global config), or can be applied more
 * granularly per-node.
 */
YG_EXPORT YGConfigRef YGConfigNew(void);

/**
 * Frees the associated Yoga configuration.
 */
YG_EXPORT void YGConfigFree(YGConfigRef config);

/**
 * Returns the default config values set by Yoga.
 */
YG_EXPORT YGConfigConstRef YGConfigGetDefault(void);

/**
 * Yoga by default creates new nodes with style defaults different from flexbox
 * on web (e.g. `YGFlexDirectionColumn` and `YGPositionRelative`).
 * `UseWebDefaults` instructs Yoga to instead use a default style consistent
 * with the web.
 */
YG_EXPORT void YGConfigSetUseWebDefaults(YGConfigRef config, bool enabled);

/**
 * Whether the configuration is set to use web defaults.
 */
YG_EXPORT bool YGConfigGetUseWebDefaults(YGConfigConstRef config);

/**
 * Yoga will by default round final layout positions and dimensions to the
 * nearest point. `pointScaleFactor` controls the density of the grid used for
 * layout rounding (e.g. to round to the closest display pixel).
 *
 * May be set to 0.0f to avoid rounding the layout results.
 */
YG_EXPORT void YGConfigSetPointScaleFactor(
    YGConfigRef config,
    float pixelsInPoint);

/**
 * Get the currently set point scale factor.
 */
YG_EXPORT float YGConfigGetPointScaleFactor(YGConfigConstRef config);

/**
 * Configures how Yoga balances W3C conformance vs compatibility with layouts
 * created against earlier versions of Yoga.
 *
 * By default Yoga will prioritize W3C conformance. `Errata` may be set to ask
 * Yoga to produce specific incorrect behaviors. E.g. `YGConfigSetErrata(config,
 * YGErrataStretchFlexBasis)`.
 *
 * YGErrata is a bitmask, and multiple errata may be set at once. Predefined
 * constants exist for convenience:
 * 1. YGErrataNone: No errata
 * 2. YGErrataClassic: Match layout behaviors of Yoga 1.x
 * 3. YGErrataAll: Match layout behaviors of Yoga 1.x, including
 * `UseLegacyStretchBehaviour`
 */
YG_EXPORT void YGConfigSetErrata(YGConfigRef config, YGErrata errata);

/**
 * Get the currently set errata.
 */
YG_EXPORT YGErrata YGConfigGetErrata(YGConfigConstRef config);

/**
 * Function pointer type for YGConfigSetLogger.
 */
typedef int (*YGLogger)(
    YGConfigConstRef config,
    YGNodeConstRef node,
    YGLogLevel level,
    const char* format,
    va_list args);

/**
 * Set a custom log function for to use when logging diagnostics or fatal.
 * errors.
 */
YG_EXPORT void YGConfigSetLogger(YGConfigRef config, YGLogger logger);

/**
 * Sets an arbitrary context pointer on the config which may be read from during
 * callbacks.
 */
YG_EXPORT void YGConfigSetContext(YGConfigRef config, void* context);

/**
 * Gets the currently set context.
 */
YG_EXPORT void* YGConfigGetContext(YGConfigConstRef config);

/**
 * Function pointer type for YGConfigSetCloneNodeFunc.
 */
typedef YGNodeRef (*YGCloneNodeFunc)(
    YGNodeConstRef oldNode,
    YGNodeConstRef owner,
    size_t childIndex);

/**
 * Enable an experimental/unsupported feature in Yoga.
 */
YG_EXPORT void YGConfigSetExperimentalFeatureEnabled(
    YGConfigRef config,
    YGExperimentalFeature feature,
    bool enabled);

/**
 * Whether an experimental feature is set.
 */
YG_EXPORT bool YGConfigIsExperimentalFeatureEnabled(
    YGConfigConstRef config,
    YGExperimentalFeature feature);

/**
 * Sets a callback, called during layout, to create a new mutable Yoga node if
 * Yoga must write to it and its owner is not its parent observed during layout.
 */
YG_EXPORT void YGConfigSetCloneNodeFunc(
    YGConfigRef config,
    YGCloneNodeFunc callback);

YG_EXTERN_C_END
