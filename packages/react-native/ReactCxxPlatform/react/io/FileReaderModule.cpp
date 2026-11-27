/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FileReaderModule.h"

#include <folly/Unicode.h>
#include <react/io/BlobModule.h>
#include <react/utils/Base64.h>
#include <utility>

namespace facebook::react {

namespace {

constexpr std::string_view kUtf8Bom = "\xEF\xBB\xBF";
constexpr const char* kInvalidBlob = "The specified blob is invalid";

std::string_view asStringView(const std::vector<uint8_t>& bytes) {
  if (bytes.empty()) {
    return std::string_view{""};
  }
  // Character views may alias byte storage; the caller keeps the vector alive.
  // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
  return {reinterpret_cast<const char*>(bytes.data()), bytes.size()};
}

} // namespace

/* static */
std::string FileReaderModule::decodeUtf8(std::string_view bytes) {
  if (bytes.starts_with(kUtf8Bom)) {
    bytes.remove_prefix(kUtf8Bom.size());
  }

  if (bytes.empty()) {
    return {};
  }

  std::string out;
  out.reserve(bytes.size());
  // Unsigned character views may alias the input bytes for Folly's decoder.
  // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
  auto cursor = reinterpret_cast<const unsigned char*>(bytes.data());
  // The one-past-end pointer stays within the non-empty input range.
  // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  auto end = cursor + bytes.size();
  while (cursor < end) {
    folly::appendCodePointToUtf8(
        folly::utf8ToCodePoint(cursor, end, /*skipOnError=*/true), out);
  }
  return out;
}

FileReaderModule::FileReaderModule(
    std::shared_ptr<CallInvoker> jsInvoker,
    std::shared_ptr<BlobStore> store)
    : NativeFileReaderModuleCxxSpec(std::move(jsInvoker)),
      store_(std::move(store)) {}

AsyncPromise<std::string> FileReaderModule::readAsDataURL(
    jsi::Runtime& rt,
    jsi::Object blob) {
  AsyncPromise<std::string> promise(rt, jsInvoker_);
  auto bytes = resolveBlobData(rt, blob, *store_);
  if (!bytes) {
    promise.reject(Error(kInvalidBlob));
    return promise;
  }
  auto type = blob.getProperty(rt, "type");
  std::string mimeType = "application/octet-stream";
  if (type.isString()) {
    if (auto value = type.getString(rt).utf8(rt); !value.empty()) {
      mimeType = std::move(value);
    }
  }
  auto view = asStringView(*bytes);
  promise.resolve("data:" + mimeType + ";base64," + base64Encode(view));
  return promise;
}

AsyncPromise<std::string> FileReaderModule::readAsText(
    jsi::Runtime& rt,
    jsi::Object blob,
    const std::string& /*encoding*/) {
  AsyncPromise<std::string> promise(rt, jsInvoker_);
  auto bytes = resolveBlobData(rt, blob, *store_);
  if (!bytes) {
    promise.reject(Error(kInvalidBlob));
    return promise;
  }
  auto view = asStringView(*bytes);
  promise.resolve(decodeUtf8(view));
  return promise;
}

} // namespace facebook::react
