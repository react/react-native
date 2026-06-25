/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/uimanager/PointerEventsProcessor.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/timing/primitives.h>

namespace facebook::react {

/*
 * Exposes UIManager to JavaScript realm.
 */
class UIManagerBinding : public jsi::HostObject {
 public:
  /*
   * Installs UIManagerBinding into JavaScript runtime if needed.
   * Creates and sets `UIManagerBinding` into the global namespace.
   * Thread synchronization must be enforced externally.
   */
  static void createAndInstallIfNeeded(jsi::Runtime &runtime, const std::shared_ptr<UIManager> &uiManager);

  /*
   * Returns a pointer to UIManagerBinding previously installed into a runtime.
   * Thread synchronization must be enforced externally.
   */
  static std::shared_ptr<UIManagerBinding> getBinding(jsi::Runtime &runtime);

  UIManagerBinding(std::shared_ptr<UIManager> uiManager);

  ~UIManagerBinding() override;

  /*
   * Delivers raw event data to JavaScript.
   * Thread synchronization must be enforced externally.
   */
  void dispatchEvent(
      jsi::Runtime &runtime,
      EventTarget *eventTarget,
      const std::string &type,
      ReactEventPriority priority,
      const EventPayload &payload,
      HighResTimeStamp eventTimestamp) const;

  /*
   * Invalidates the binding and underlying UIManager.
   * Allows to save some resources and prevents UIManager's delegate to be
   * called.
   * Calling public methods of this class after calling this method is UB.
   * Can be called on any thread.
   */
  void invalidate() const;

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;

  UIManager &getUIManager();
  PointerEventsProcessor &getPointerEventsProcessor();

 private:
  /*
   * Internal method that sends the event to JS. Should only be called from
   * UIManagerBinding::dispatchEvent.
   */
  void dispatchEventToJS(
      jsi::Runtime &runtime,
      EventTarget *eventTarget,
      const std::string &type,
      ReactEventPriority priority,
      const EventPayload &payload,
      HighResTimeStamp eventTimestamp) const;

  std::shared_ptr<UIManager> uiManager_;
  std::unique_ptr<jsi::Function> eventHandler_;
  mutable PointerEventsProcessor pointerEventsProcessor_;
  mutable ReactEventPriority currentEventPriority_;
};

} // namespace facebook::react
