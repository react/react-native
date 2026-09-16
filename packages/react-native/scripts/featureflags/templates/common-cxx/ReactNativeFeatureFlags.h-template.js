/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagDefinitions} from '../../types';

import {DO_NOT_MODIFY_COMMENT, getCxxTypeFromDefaultValue} from '../../utils';
import signedsource from 'signedsource';

export default function (definitions: FeatureFlagDefinitions): string {
  return signedsource.signFile(`/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 */

${DO_NOT_MODIFY_COMMENT}

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/featureflags/ReactNativeFeatureFlagsAccessor.h>
#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <memory>
#include <optional>
#include <string>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

/**
 * This class provides access to internal React Native feature flags.
 *
 * All the methods are thread-safe (as long as the methods in the overridden
 * provider are).
 */
class ReactNativeFeatureFlags {
 public:
${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  /**
   * ${flagConfig.metadata.description}
   */
  RN_EXPORT static ${getCxxTypeFromDefaultValue(flagConfig.defaultValue)} ${flagName}();`,
  )
  .join('\n\n')}

  /**
   * Overrides the feature flags with the ones provided by the given provider
   * (generally one that extends \`ReactNativeFeatureFlagsDefaults\`).
   *
   * This method must be called before you initialize the React Native runtime.
   *
   * @example
   *
   * \`\`\`
   * class MyReactNativeFeatureFlags : public ReactNativeFeatureFlagsDefaults {
   *  public:
   *   bool someFlag() override;
   * };
   *
   * ReactNativeFeatureFlags.override(
   *     std::make_unique<MyReactNativeFeatureFlags>());
   * \`\`\`
   */
  RN_EXPORT static void override(
      std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

  /**
   * Removes the overridden feature flags and makes the API return default
   * values again.
   *
   * This is **dangerous**. Use it only if you really understand the
   * implications of this method.
   *
   * This should only be called if you destroy the React Native runtime and
   * need to create a new one with different overrides. In that case,
   * call \`dangerouslyReset\` after destroying the runtime and \`override\` again
   * before initializing the new one.
   */
  RN_EXPORT static void dangerouslyReset();

  /**
   * This is a combination of \`dangerouslyReset\` and \`override\` that reduces
   * the likeliness of a race condition between the two calls.
   *
   * This is **dangerous** because it can introduce consistency issues that will
   * be much harder to debug. For example, it could hide the fact that feature
   * flags are read before you set the values you want to use everywhere. It
   * could also cause a workflow to suddenly have different feature flags for
   * behaviors that were configured with different values before.
   *
   * Please see the documentation of \`dangerouslyReset\` for additional details.
   */
  RN_EXPORT static std::optional<std::string> dangerouslyForceOverride(
      std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

 private:
  ReactNativeFeatureFlags() = delete;
  static ReactNativeFeatureFlagsAccessor& getAccessor();
};

} // namespace facebook::react
`);
}
