/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <ReactCommon/TurboModuleWithJSIBindings.h>
#include <jsi/jsi.h>
#include <react/io/BlobStore.h>
#include <react/io/NetworkingModule.h>
#include <memory>
#include <optional>
#include <string>

namespace facebook::react {

/// Returns the bytes referenced by a JS `BlobData` object
/// (`{blobId, offset, size}`), or `std::nullopt` if they are not stored.
std::optional<std::vector<uint8_t>>
resolveBlobData(facebook::jsi::Runtime &rt, const facebook::jsi::Object &blobData, const BlobStore &store);

/// C++ implementation of React Native's `BlobModule` TurboModule (see
/// `Libraries/Blob/NativeBlobModule.js`). WebSocket blobs are not supported.
class BlobModule : public NativeBlobModuleCxxSpec<BlobModule>, public TurboModuleWithJSIBindings {
 public:
  BlobModule(std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<BlobStore> store);

  facebook::jsi::Object getConstants(facebook::jsi::Runtime &rt);
  void addNetworkingHandler(facebook::jsi::Runtime &rt);
  [[noreturn]] void addWebSocketHandler(facebook::jsi::Runtime &rt, double id);
  void removeWebSocketHandler(facebook::jsi::Runtime &rt, double id);
  [[noreturn]] void sendOverSocket(facebook::jsi::Runtime &rt, facebook::jsi::Object blob, double socketID);
  void createFromParts(facebook::jsi::Runtime &rt, facebook::jsi::Array parts, const std::string &withId);
  void release(facebook::jsi::Runtime &rt, const std::string &blobId);

 private:
  void installJSIBindingsWithRuntime(jsi::Runtime &rt) override;

  std::shared_ptr<BlobStore> store_;
};

/// Stores `Networking` response bodies requested with responseType "blob" and
/// delivers them to JS as `BlobData`, as Android's `BlobModule` does.
class BlobNetworkingResponseHandler : public INetworkingResponseHandler {
 public:
  explicit BlobNetworkingResponseHandler(std::shared_ptr<BlobStore> store);

  [[nodiscard]] bool supports(const std::string &responseType) const override;
  facebook::jsi::Value toResponseData(facebook::jsi::Runtime &rt, std::vector<uint8_t> body) override;

 private:
  std::shared_ptr<BlobStore> store_;
};

} // namespace facebook::react
