/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BlobModule.h"

#include <cmath>
#include <limits>
#include <utility>

namespace facebook::react {

namespace {

constexpr const char* kBlobCollectorProvider = "__blobCollectorProvider";

/// Lets JavaScript-held blobs free their bytes when garbage collected.
/// BlobManager.createFromOptions attaches a collector to each Blob.
class BlobCollector : public jsi::HostObject {
 public:
  BlobCollector(std::weak_ptr<BlobStore> store, std::string blobId)
      : store_(std::move(store)), blobId_(std::move(blobId)) {}

  BlobCollector(const BlobCollector&) = delete;
  BlobCollector& operator=(const BlobCollector&) = delete;
  BlobCollector(BlobCollector&&) = delete;
  BlobCollector& operator=(BlobCollector&&) = delete;

  ~BlobCollector() override {
    if (auto store = store_.lock()) {
      store->remove(blobId_);
    }
  }

 private:
  std::weak_ptr<BlobStore> store_;
  std::string blobId_;
};

/// Converts a JavaScript offset/size to an index, rejecting values that are not
/// non-negative integers representable as `std::size_t`.
std::optional<std::size_t> toBlobIndex(const jsi::Value& value) {
  if (!value.isNumber()) {
    return std::nullopt;
  }
  const double number = value.getNumber();
  // `!(number >= 0)` also rejects NaN. The size_t maximum rounds up to a power
  // of two as a double, so `<` keeps the cast in range.
  if (!(number >= 0) ||
      number >= static_cast<double>(std::numeric_limits<std::size_t>::max()) ||
      std::trunc(number) != number) {
    return std::nullopt;
  }
  return static_cast<std::size_t>(number);
}

} // namespace

std::optional<std::vector<uint8_t>> resolveBlobData(
    jsi::Runtime& rt,
    const jsi::Object& blobData,
    const BlobStore& store) {
  auto blobId = blobData.getProperty(rt, "blobId");
  auto offset = toBlobIndex(blobData.getProperty(rt, "offset"));
  auto size = toBlobIndex(blobData.getProperty(rt, "size"));
  if (!blobId.isString() || !offset || !size) {
    return std::nullopt;
  }
  return store.resolve(blobId.getString(rt).utf8(rt), *offset, *size);
}

BlobModule::BlobModule(
    std::shared_ptr<CallInvoker> jsInvoker,
    std::shared_ptr<BlobStore> store)
    : NativeBlobModuleCxxSpec(std::move(jsInvoker)), store_(std::move(store)) {}

jsi::Object BlobModule::getConstants(jsi::Runtime& rt) {
  auto constants = jsi::Object(rt);
  constants.setProperty(
      rt, "BLOB_URI_SCHEME", jsi::String::createFromAscii(rt, "blob"));
  constants.setProperty(rt, "BLOB_URI_HOST", jsi::Value::null());
  return constants;
}

void BlobModule::addNetworkingHandler(jsi::Runtime& /*rt*/) {}

void BlobModule::addWebSocketHandler(jsi::Runtime& rt, double /*id*/) {
  throw jsi::JSError(rt, "BlobModule: WebSocket blobs are not supported");
}

void BlobModule::removeWebSocketHandler(jsi::Runtime& /*rt*/, double /*id*/) {}

void BlobModule::sendOverSocket(
    jsi::Runtime& rt,
    jsi::Object /*blob*/,
    double /*socketID*/) {
  throw jsi::JSError(rt, "BlobModule: WebSocket blobs are not supported");
}

void BlobModule::createFromParts(
    jsi::Runtime& rt,
    jsi::Array parts,
    const std::string& withId) {
  std::vector<uint8_t> bytes;
  const auto count = parts.size(rt);
  for (size_t i = 0; i < count; ++i) {
    auto part = parts.getValueAtIndex(rt, i).asObject(rt);
    auto type = part.getProperty(rt, "type").asString(rt).utf8(rt);
    if (type == "string") {
      auto text = part.getProperty(rt, "data").asString(rt).utf8(rt);
      bytes.insert(bytes.end(), text.begin(), text.end());
    } else if (type == "blob") {
      auto data = resolveBlobData(
          rt, part.getProperty(rt, "data").asObject(rt), *store_);
      if (!data) {
        throw jsi::JSError(
            rt, "BlobModule: createFromParts references an invalid blob");
      }
      bytes.insert(bytes.end(), data->begin(), data->end());
    } else {
      throw jsi::JSError(rt, "BlobModule: invalid type for blob: " + type);
    }
  }
  store_->store(withId, std::move(bytes));
}

void BlobModule::release(jsi::Runtime& /*rt*/, const std::string& blobId) {
  store_->remove(blobId);
}

void BlobModule::installJSIBindingsWithRuntime(jsi::Runtime& rt) {
  auto global = rt.global();
  if (global.hasProperty(rt, kBlobCollectorProvider)) {
    return;
  }
  auto name = jsi::PropNameID::forAscii(rt, kBlobCollectorProvider);
  global.setProperty(
      rt,
      name,
      jsi::Function::createFromHostFunction(
          rt,
          name,
          1,
          [store = std::weak_ptr<BlobStore>(store_)](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t count) -> jsi::Value {
            if (count < 1 || !args->isString()) {
              throw jsi::JSError(
                  rt, "__blobCollectorProvider expects a blob id");
            }
            return jsi::Object::createFromHostObject(
                rt,
                std::make_shared<BlobCollector>(
                    store, args->getString(rt).utf8(rt)));
          }));
}

BlobNetworkingResponseHandler::BlobNetworkingResponseHandler(
    std::shared_ptr<BlobStore> store)
    : store_(std::move(store)) {}

bool BlobNetworkingResponseHandler::supports(
    const std::string& responseType) const {
  return responseType == "blob";
}

jsi::Value BlobNetworkingResponseHandler::toResponseData(
    jsi::Runtime& rt,
    std::vector<uint8_t> body) {
  const auto size = static_cast<double>(body.size());
  auto blobId = store_->store(std::move(body));
  try {
    auto blobData = jsi::Object(rt);
    blobData.setProperty(rt, "blobId", jsi::String::createFromUtf8(rt, blobId));
    blobData.setProperty(rt, "offset", 0);
    blobData.setProperty(rt, "size", size);
    return blobData;
  } catch (...) {
    store_->remove(blobId);
    throw;
  }
}

} // namespace facebook::react
