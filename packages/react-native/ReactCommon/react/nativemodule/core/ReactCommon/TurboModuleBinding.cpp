/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModuleBinding.h"

#include <ReactCommon/TurboModuleWithJSIBindings.h>
#include <cxxreact/TraceSection.h>
#include <react/utils/jsi-utils.h>
#include <stdexcept>
#include <string>

using namespace facebook;

namespace facebook::react {

class BridgelessNativeModuleProxy : public jsi::HostObject {
  TurboModuleBinding turboBinding_;
  std::optional<TurboModuleBinding> legacyBinding_;

 public:
  BridgelessNativeModuleProxy(
      jsi::Runtime& runtime,
      TurboModuleProviderFunctionTypeWithRuntime&& moduleProvider,
      TurboModuleProviderFunctionTypeWithRuntime&& legacyModuleProvider,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection)
      : turboBinding_(
            runtime,
            std::move(moduleProvider),
            longLivedObjectCollection),
        legacyBinding_(
            legacyModuleProvider
                ? std::make_optional<TurboModuleBinding>(TurboModuleBinding(
                      runtime,
                      std::move(legacyModuleProvider),
                      longLivedObjectCollection))
                : std::nullopt) {}

  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override {
    /**
     * BatchedBridge/NativeModules.js contains this line:
     *
     * module.exports = global.nativeModuleProxy
     *
     * This means that NativeModuleProxy is exported as a module from
     * 'NativeModules.js'. Whenever some JavaScript requires 'NativeModule.js',
     * Metro checks this module's __esModule property to see if the module is an
     * ES6 module.
     *
     * We return false from this property access, so that we can fail on the
     * actual NativeModule require that happens later, which is more actionable.
     */
    std::string moduleName = name.utf8(runtime);
    if (moduleName == "__esModule") {
      return {false};
    }

    auto turboModule = turboBinding_.getModule(runtime, moduleName);
    if (turboModule.isObject()) {
      return turboModule;
    }

    if (legacyBinding_) {
      auto legacyModule = legacyBinding_->getModule(runtime, moduleName);
      if (legacyModule.isObject()) {
        return legacyModule;
      }
    }

    return jsi::Value::null();
  }

  void set(
      jsi::Runtime& runtime,
      const jsi::PropNameID& /*name*/,
      const jsi::Value& /*value*/) override {
    throw jsi::JSError(
        runtime,
        "Tried to insert a NativeModule into the bridge's NativeModule proxy.");
  }
};

/**
 * Public API to install the TurboModule system.
 */

TurboModuleBinding::TurboModuleBinding(
    jsi::Runtime& runtime,
    TurboModuleProviderFunctionTypeWithRuntime&& moduleProvider,
    std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection)
    : runtime_(runtime),
      moduleProvider_(std::move(moduleProvider)),
      longLivedObjectCollection_(std::move(longLivedObjectCollection)) {}

void TurboModuleBinding::install(
    jsi::Runtime& runtime,
    TurboModuleProviderFunctionType&& moduleProvider,
    TurboModuleProviderFunctionType&& legacyModuleProvider,
    std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection) {
  install(
      runtime,
      [moduleProvider = std::move(moduleProvider)](
          jsi::Runtime& runtime, const std::string& name) {
        return moduleProvider(name);
      },
      legacyModuleProvider == nullptr
          ? (TurboModuleProviderFunctionTypeWithRuntime) nullptr
          : [legacyModuleProvider = std::move(legacyModuleProvider)](
                jsi::Runtime& runtime,
                const std::string& name) { return legacyModuleProvider(name); },
      longLivedObjectCollection);
}

void TurboModuleBinding::install(
    jsi::Runtime& runtime,
    TurboModuleProviderFunctionTypeWithRuntime&& moduleProvider,
    TurboModuleProviderFunctionTypeWithRuntime&& legacyModuleProvider,
    std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection) {
  // TODO(T208105802): We can get this information from the native side!
  auto isBridgeless = runtime.global().hasProperty(runtime, "RN$Bridgeless");

  if (!isBridgeless) {
    runtime.global().setProperty(
        runtime,
        "__turboModuleProxy",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "__turboModuleProxy"),
            1,
            [binding = TurboModuleBinding(
                 runtime,
                 std::move(moduleProvider),
                 longLivedObjectCollection)](
                jsi::Runtime& rt,
                const jsi::Value& /*thisVal*/,
                const jsi::Value* args,
                size_t count) {
              if (count < 1) {
                throw std::invalid_argument(
                    "__turboModuleProxy must be called with at least 1 argument");
              }
              std::string moduleName = args[0].getString(rt).utf8(rt);
              return binding.getModule(rt, moduleName);
            }));
    return;
  }

  defineReadOnlyGlobal(
      runtime,
      "nativeModuleProxy",
      jsi::Object::createFromHostObject(
          runtime,
          std::make_shared<BridgelessNativeModuleProxy>(
              runtime,
              std::move(moduleProvider),
              std::move(legacyModuleProvider),
              longLivedObjectCollection)));
}

TurboModuleBinding::~TurboModuleBinding() {
  LongLivedObjectCollection::get(runtime_).clear();
  if (longLivedObjectCollection_) {
    longLivedObjectCollection_->clear();
  }
}

jsi::Value TurboModuleBinding::getModule(
    jsi::Runtime& runtime,
    const std::string& moduleName) const {
  std::shared_ptr<TurboModule> module;
  {
    TraceSection s("TurboModuleBinding::moduleProvider", "module", moduleName);
    module = moduleProvider_(runtime, moduleName);
  }
  if (module) {
    TurboModuleWithJSIBindings::installJSIBindings(module, runtime);
    // What is jsRepresentation? A cache for the TurboModule's properties
    // Henceforth, always return the cache (i.e: jsRepresentation) to JavaScript
    //
    // If a jsRepresentation is found on the TurboModule, return it.
    //
    // Note: TurboModules are cached by name in TurboModuleManagers. Hence,
    // jsRepresentation is also cached by by name by the TurboModuleManager
    auto& weakJsRepresentation = module->jsRepresentation_;
    if (weakJsRepresentation) {
      auto jsRepresentation = weakJsRepresentation->lock(runtime);
      if (!jsRepresentation.isUndefined()) {
        return jsRepresentation;
      }
    }

    // Status: No jsRepresentation found on TurboModule
    // Create a brand new jsRepresentation, and attach it to TurboModule
    jsi::Object jsRepresentation(runtime);
    weakJsRepresentation =
        std::make_unique<jsi::WeakObject>(runtime, jsRepresentation);

    // Lazily populate the jsRepresentation, on property access.
    //
    // How does this work?
    //   1. Initially jsRepresentation is empty: {}
    //   2. If property lookup on jsRepresentation fails, the JS runtime will
    //   search jsRepresentation's prototype: jsi::Object(TurboModule).
    //   3. TurboModule::get(runtime, propKey) executes. This creates the
    //   property, caches it on jsRepresentation, then returns it to
    //   JavaScript.
    auto hostObject =
        jsi::Object::createFromHostObject(runtime, std::move(module));
    jsRepresentation.setProperty(runtime, "__proto__", std::move(hostObject));

    return jsRepresentation;
  } else {
    return jsi::Value::null();
  }
}

} // namespace facebook::react
