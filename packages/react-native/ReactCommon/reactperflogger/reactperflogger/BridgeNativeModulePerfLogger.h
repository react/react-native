/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <memory>
#include "NativeModulePerfLogger.h"

namespace facebook::react::BridgeNativeModulePerfLogger {
void enableLogging(std::unique_ptr<NativeModulePerfLogger>&& logger);
void disableLogging();

void moduleDataCreateStart(const char* moduleName, int32_t id);
void moduleDataCreateEnd(const char* moduleName, int32_t id);

/**
 * Create NativeModule platform object
 */
void moduleCreateStart(const char* moduleName, int32_t id);
void moduleCreateCacheHit(const char* moduleName, int32_t id);
void moduleCreateConstructStart(const char* moduleName, int32_t id);
void moduleCreateConstructEnd(const char* moduleName, int32_t id);
void moduleCreateSetUpStart(const char* moduleName, int32_t id);
void moduleCreateSetUpEnd(const char* moduleName, int32_t id);
void moduleCreateEnd(const char* moduleName, int32_t id);
void moduleCreateFail(const char* moduleName, int32_t id);

/**
 * JS require beginning
 */
void moduleJSRequireBeginningStart(const char* moduleName);
void moduleJSRequireBeginningCacheHit(const char* moduleName);
void moduleJSRequireBeginningEnd(const char* moduleName);
void moduleJSRequireBeginningFail(const char* moduleName);

/**
 * JS require ending
 */
void moduleJSRequireEndingStart(const char* moduleName);
void moduleJSRequireEndingEnd(const char* moduleName);
void moduleJSRequireEndingFail(const char* moduleName);

// Sync method calls
void syncMethodCallStart(const char* moduleName, const char* methodName);
void syncMethodCallArgConversionStart(
    const char* moduleName,
    const char* methodName);
void syncMethodCallArgConversionEnd(
    const char* moduleName,
    const char* methodName);
void syncMethodCallExecutionStart(
    const char* moduleName,
    const char* methodName);
void syncMethodCallExecutionEnd(const char* moduleName, const char* methodName);
void syncMethodCallReturnConversionStart(
    const char* moduleName,
    const char* methodName);
void syncMethodCallReturnConversionEnd(
    const char* moduleName,
    const char* methodName);
void syncMethodCallEnd(const char* moduleName, const char* methodName);
void syncMethodCallFail(const char* moduleName, const char* methodName);

// Async method calls
void asyncMethodCallStart(const char* moduleName, const char* methodName);
void asyncMethodCallArgConversionStart(
    const char* moduleName,
    const char* methodName);
void asyncMethodCallArgConversionEnd(
    const char* moduleName,
    const char* methodName);
void asyncMethodCallDispatch(const char* moduleName, const char* methodName);
void asyncMethodCallEnd(const char* moduleName, const char* methodName);
void asyncMethodCallFail(const char* moduleName, const char* methodName);

/**
 * Pre-processing async method call batch
 */
void asyncMethodCallBatchPreprocessStart();
void asyncMethodCallBatchPreprocessEnd(int batchSize);

// Async method call execution
void asyncMethodCallExecutionStart(
    const char* moduleName,
    const char* methodName,
    int32_t id);
void asyncMethodCallExecutionArgConversionStart(
    const char* moduleName,
    const char* methodName,
    int32_t id);
void asyncMethodCallExecutionArgConversionEnd(
    const char* moduleName,
    const char* methodName,
    int32_t id);
void asyncMethodCallExecutionEnd(
    const char* moduleName,
    const char* methodName,
    int32_t id);
void asyncMethodCallExecutionFail(
    const char* moduleName,
    const char* methodName,
    int32_t id);

} // namespace facebook::react::BridgeNativeModulePerfLogger
