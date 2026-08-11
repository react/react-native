/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <hermes/Public/CrashManager.h>
#import <jsi/jsi.h>
#import <react/runtime/JSRuntimeFactory.h>

namespace facebook::react {

class MessageQueueThread;

using CrashManagerProvider =
    std::function<std::shared_ptr<::hermes::vm::CrashManager>()>;

// ObjC++ wrapper for HermesInstance.cpp
class RCTHermesInstance : public JSRuntimeFactory {
 public:
  RCTHermesInstance() : RCTHermesInstance(nullptr, false) {}
  RCTHermesInstance(CrashManagerProvider crashManagerProvider)
      : RCTHermesInstance(std::move(crashManagerProvider), false) {}
  RCTHermesInstance(
      CrashManagerProvider crashManagerProvider,
      bool allocInOldGenBeforeTTI)
      : _crashManagerProvider(std::move(crashManagerProvider)),
        _allocInOldGenBeforeTTI(allocInOldGenBeforeTTI) {}

  std::unique_ptr<JSRuntime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept override;

  ~RCTHermesInstance() override{};

 private:
  CrashManagerProvider _crashManagerProvider;
  bool _allocInOldGenBeforeTTI;
};

} // namespace facebook::react
