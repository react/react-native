/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModulePerfLogger.h"

#include <reactperflogger/NativeModulePerfLogger.h>

namespace facebook::react::TurboModulePerfLogger {

std::unique_ptr<NativeModulePerfLogger> g_perfLogger = nullptr;

void enableLogging(std::unique_ptr<NativeModulePerfLogger>&& newPerfLogger) {
  g_perfLogger = std::move(newPerfLogger);
}

void disableLogging() {
  g_perfLogger = nullptr;
}

void moduleDataCreateStart(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleDataCreateStart(moduleName, id);
  }
}

void moduleDataCreateEnd(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleDataCreateEnd(moduleName, id);
  }
}

void moduleCreateStart(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleCreateStart(moduleName, id);
  }
}

void moduleCreateCacheHit(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleCreateCacheHit(moduleName, id);
  }
}

void moduleCreateConstructStart(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleCreateConstructStart(moduleName, id);
  }
}

void moduleCreateConstructEnd(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleCreateConstructEnd(moduleName, id);
  }
}

void moduleCreateSetUpStart(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleCreateSetUpStart(moduleName, id);
  }
}

void moduleCreateSetUpEnd(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleCreateSetUpEnd(moduleName, id);
  }
}

void moduleCreateEnd(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleCreateEnd(moduleName, id);
  }
}

void moduleCreateFail(const char* moduleName, int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleCreateFail(moduleName, id);
  }
}

void moduleJSRequireBeginningStart(const char* moduleName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleJSRequireBeginningStart(moduleName);
  }
}

void moduleJSRequireBeginningCacheHit(const char* moduleName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleJSRequireBeginningCacheHit(moduleName);
  }
}

void moduleJSRequireBeginningEnd(const char* moduleName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleJSRequireBeginningEnd(moduleName);
  }
}

void moduleJSRequireBeginningFail(const char* moduleName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleJSRequireBeginningFail(moduleName);
  }
}

void moduleJSRequireEndingStart(const char* moduleName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleJSRequireEndingStart(moduleName);
  }
}

void moduleJSRequireEndingEnd(const char* moduleName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleJSRequireEndingEnd(moduleName);
  }
}

void moduleJSRequireEndingFail(const char* moduleName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->moduleJSRequireEndingFail(moduleName);
  }
}

void syncMethodCallStart(const char* moduleName, const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallStart(moduleName, methodName);
  }
}

void syncMethodCallArgConversionStart(
    const char* moduleName,
    const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallArgConversionStart(moduleName, methodName);
  }
}

void syncMethodCallArgConversionEnd(
    const char* moduleName,
    const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallArgConversionEnd(moduleName, methodName);
  }
}

void syncMethodCallExecutionStart(
    const char* moduleName,
    const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallExecutionStart(moduleName, methodName);
  }
}
void syncMethodCallExecutionEnd(
    const char* moduleName,
    const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallExecutionEnd(moduleName, methodName);
  }
}

void syncMethodCallReturnConversionStart(
    const char* moduleName,
    const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallReturnConversionStart(moduleName, methodName);
  }
}

void syncMethodCallReturnConversionEnd(
    const char* moduleName,
    const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallReturnConversionEnd(moduleName, methodName);
  }
}

void syncMethodCallEnd(const char* moduleName, const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallEnd(moduleName, methodName);
  }
}

void syncMethodCallFail(const char* moduleName, const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->syncMethodCallFail(moduleName, methodName);
  }
}

void asyncMethodCallStart(const char* moduleName, const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallStart(moduleName, methodName);
  }
}

void asyncMethodCallArgConversionStart(
    const char* moduleName,
    const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallArgConversionStart(moduleName, methodName);
  }
}

void asyncMethodCallArgConversionEnd(
    const char* moduleName,
    const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallArgConversionEnd(moduleName, methodName);
  }
}

void asyncMethodCallDispatch(const char* moduleName, const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallDispatch(moduleName, methodName);
  }
}

void asyncMethodCallEnd(const char* moduleName, const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallEnd(moduleName, methodName);
  }
}

void asyncMethodCallFail(const char* moduleName, const char* methodName) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallFail(moduleName, methodName);
  }
}

void asyncMethodCallBatchPreprocessStart() {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallBatchPreprocessStart();
  }
}

void asyncMethodCallBatchPreprocessEnd(int batchSize) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallBatchPreprocessEnd(batchSize);
  }
}

void asyncMethodCallExecutionStart(
    const char* moduleName,
    const char* methodName,
    int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallExecutionStart(moduleName, methodName, id);
  }
}

void asyncMethodCallExecutionArgConversionStart(
    const char* moduleName,
    const char* methodName,
    int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallExecutionArgConversionStart(
        moduleName, methodName, id);
  }
}

void asyncMethodCallExecutionArgConversionEnd(
    const char* moduleName,
    const char* methodName,
    int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallExecutionArgConversionEnd(
        moduleName, methodName, id);
  }
}

void asyncMethodCallExecutionEnd(
    const char* moduleName,
    const char* methodName,
    int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallExecutionEnd(moduleName, methodName, id);
  }
}

void asyncMethodCallExecutionFail(
    const char* moduleName,
    const char* methodName,
    int32_t id) {
  NativeModulePerfLogger* logger = g_perfLogger.get();
  if (logger != nullptr) {
    logger->asyncMethodCallExecutionFail(moduleName, methodName, id);
  }
}

} // namespace facebook::react::TurboModulePerfLogger
