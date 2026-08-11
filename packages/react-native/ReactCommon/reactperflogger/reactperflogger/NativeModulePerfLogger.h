/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <cstdint>

namespace facebook::react {

/**
 * A platform-agnostic interface to do performance logging on NativeModules and
 * TuboModules.
 */
class NativeModulePerfLogger {
 public:
  virtual ~NativeModulePerfLogger() = default;

  /**
   * NativeModule Initialization.
   *
   * The initialization of two NativeModules can interleave. Therefore,
   * performance markers should use the moduleName as a unique key.
   */

  /**
   * On iOS:
   *   - NativeModule initialization is split into two phases, which sometimes
   *     have a pause in the middle.
   *   - TurboModule initialization happens all at once.
   *
   * On Android:
   *   - NativeModule and TurboModule initialization happens all at once.
   *
   * These markers are meant for iOS NativeModules:
   *  - moduleDataCreateStart: very beginning of first phase.
   *  - moduleDataCreateEnd: after RCTModuleData has been created.
   */
  virtual void moduleDataCreateStart(const char* moduleName, int32_t id) = 0;
  virtual void moduleDataCreateEnd(const char* moduleName, int32_t id) = 0;

  /**
   * How long does it take to create the platform NativeModule object?
   *   - moduleCreateStart: start creating platform NativeModule
   *   - moduleCreateEnd: stop creating platform NativeModule
   */
  virtual void moduleCreateStart(const char* moduleName, int32_t id) = 0;
  virtual void moduleCreateCacheHit(const char* moduleName, int32_t id) = 0;
  virtual void moduleCreateConstructStart(
      const char* moduleName,
      int32_t id) = 0;
  virtual void moduleCreateConstructEnd(const char* moduleName, int32_t id) = 0;
  virtual void moduleCreateSetUpStart(const char* moduleName, int32_t id) = 0;
  virtual void moduleCreateSetUpEnd(const char* moduleName, int32_t id) = 0;
  virtual void moduleCreateEnd(const char* moduleName, int32_t id) = 0;
  virtual void moduleCreateFail(const char* moduleName, int32_t id) = 0;

  /**
   * How long, after starting JS require, does it take to start creating the
   * platform NativeModule?
   *   - moduleJSRequireBeginningStart: start of JS require
   *   - moduleJSRequireBeginningEnd: start creating platform NativeModule
   */
  virtual void moduleJSRequireBeginningStart(const char* moduleName) = 0;
  virtual void moduleJSRequireBeginningCacheHit(const char* moduleName) = 0;
  virtual void moduleJSRequireBeginningEnd(const char* moduleName) = 0;
  virtual void moduleJSRequireBeginningFail(const char* moduleName) = 0;

  /**
   * How long does it take to return from the JS require after the platform
   * NativeModule is created?
   *   - moduleJSRequireEndingStart: end creating platform NativeModule
   *   - moduleJSRequireEndingEnd: end of JS require
   */
  virtual void moduleJSRequireEndingStart(const char* moduleName) = 0;
  virtual void moduleJSRequireEndingEnd(const char* moduleName) = 0;
  virtual void moduleJSRequireEndingFail(const char* moduleName) = 0;

  // Sync method calls
  virtual void syncMethodCallStart(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void syncMethodCallArgConversionStart(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void syncMethodCallArgConversionEnd(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void syncMethodCallExecutionStart(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void syncMethodCallExecutionEnd(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void syncMethodCallReturnConversionStart(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void syncMethodCallReturnConversionEnd(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void syncMethodCallEnd(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void syncMethodCallFail(
      const char* moduleName,
      const char* methodName) = 0;

  // Async method calls
  virtual void asyncMethodCallStart(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void asyncMethodCallArgConversionStart(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void asyncMethodCallArgConversionEnd(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void asyncMethodCallDispatch(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void asyncMethodCallEnd(
      const char* moduleName,
      const char* methodName) = 0;
  virtual void asyncMethodCallFail(
      const char* moduleName,
      const char* methodName) = 0;

  /**
   * In the NativeModule system, we batch async NativeModule method calls.
   * When we execute a batch of NativeModule method calls, we convert the batch
   * from a jsi::Value to folly::dynamic to std::vector<MethodCall>. This marker
   * documents that work.
   */
  virtual void asyncMethodCallBatchPreprocessStart() = 0;
  virtual void asyncMethodCallBatchPreprocessEnd(int batchSize) = 0;

  // Async method call execution
  virtual void asyncMethodCallExecutionStart(
      const char* moduleName,
      const char* methodName,
      int32_t id) = 0;
  virtual void asyncMethodCallExecutionArgConversionStart(
      const char* moduleName,
      const char* methodName,
      int32_t id) = 0;
  virtual void asyncMethodCallExecutionArgConversionEnd(
      const char* moduleName,
      const char* methodName,
      int32_t id) = 0;
  virtual void asyncMethodCallExecutionEnd(
      const char* moduleName,
      const char* methodName,
      int32_t id) = 0;
  virtual void asyncMethodCallExecutionFail(
      const char* moduleName,
      const char* methodName,
      int32_t id) = 0;
};

} // namespace facebook::react
