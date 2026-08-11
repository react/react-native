/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react {

class RuntimeScheduler;

/*
 * Exposes RuntimeScheduler to JavaScript realm.
 */
class RuntimeSchedulerBinding : public jsi::HostObject {
 public:
  RuntimeSchedulerBinding(std::shared_ptr<RuntimeScheduler> runtimeScheduler);

  /*
   * Installs RuntimeSchedulerBinding into JavaScript runtime if needed.
   * Creates and sets `RuntimeSchedulerBinding` into the global namespace.
   * In case if the global namespace already has a `RuntimeSchedulerBinding`
   * installed, returns that.
   */
  static std::shared_ptr<RuntimeSchedulerBinding> createAndInstallIfNeeded(
      jsi::Runtime& runtime,
      const std::shared_ptr<RuntimeScheduler>& runtimeScheduler);

  /*
   * Returns a shared pointer to RuntimeSchedulerBinding previously installed
   * into a runtime. Thread synchronization must be enforced externally.
   */
  static std::shared_ptr<RuntimeSchedulerBinding> getBinding(
      jsi::Runtime& runtime);

  /*
   * Returns shared pointer to RuntimeScheduler for use in native modules
   */
  std::shared_ptr<RuntimeScheduler> getRuntimeScheduler() noexcept;

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;

 private:
  std::shared_ptr<RuntimeScheduler> runtimeScheduler_;
};

} // namespace facebook::react
