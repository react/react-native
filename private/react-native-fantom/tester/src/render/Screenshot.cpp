/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Screenshot.h"

#include <include/core/SkStream.h>
#include <include/encode/SkPngEncoder.h>
#include <openssl/evp.h>
#include <algorithm>
#include <array>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <span>
#include <stdexcept>
#include <string_view>

namespace facebook::react {

Screenshot::Screenshot(Surface surface) : surface_(std::move(surface)) {
  surface_.setImmutable();
}

size_t Screenshot::getMemorySize() const {
  return static_cast<size_t>(surface_.rowBytes()) * surface_.height() +
      (png_ ? png_->size() : 0);
}

const std::string& Screenshot::getHash() {
  if (hash_) {
    return *hash_;
  }
  auto context = std::unique_ptr<EVP_MD_CTX, decltype(&EVP_MD_CTX_free)>(
      EVP_MD_CTX_new(), EVP_MD_CTX_free);
  if (!context ||
      EVP_DigestInit_ex(context.get(), EVP_sha256(), nullptr) != 1) {
    throw std::runtime_error("Cannot initialize screenshot hash");
  }
  const auto width = surface_.width();
  const auto height = surface_.height();
  std::array<unsigned char, 8> dimensions{};
  for (size_t index = 0; index < 4; ++index) {
    dimensions[index] = static_cast<unsigned char>(width >> (24 - index * 8));
    dimensions[index + 4] =
        static_cast<unsigned char>(height >> (24 - index * 8));
  }
  if (EVP_DigestUpdate(context.get(), dimensions.data(), dimensions.size()) !=
      1) {
    throw std::runtime_error("Cannot hash screenshot dimensions");
  }
  const auto* data = static_cast<const unsigned char*>(surface_.getPixels());
  if (data == nullptr) {
    throw std::runtime_error("Cannot read screenshot pixels");
  }
  const auto stride = static_cast<size_t>(surface_.rowBytes());
  const auto pixels = std::span(data, stride * height);
  std::vector<unsigned char> row(static_cast<size_t>(width) * 4);
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      const auto offset = static_cast<size_t>(x) * 4;
      const auto pixel = pixels.subspan(y * stride + offset, 4);
      row[offset] = pixel[2];
      row[offset + 1] = pixel[1];
      row[offset + 2] = pixel[0];
      row[offset + 3] = pixel[3];
    }
    if (EVP_DigestUpdate(context.get(), row.data(), row.size()) != 1) {
      throw std::runtime_error("Cannot hash screenshot pixels");
    }
  }
  std::array<unsigned char, EVP_MAX_MD_SIZE> digest{};
  unsigned int length = 0;
  if (EVP_DigestFinal_ex(context.get(), digest.data(), &length) != 1) {
    throw std::runtime_error("Cannot finish screenshot hash");
  }
  constexpr std::string_view digits = "0123456789abcdef";
  std::string hash;
  for (const auto byte : std::span(digest.data(), length)) {
    hash += digits[byte >> 4];
    hash += digits[byte & 15];
  }
  hash_ = std::move(hash);
  return *hash_;
}

bool Screenshot::isEqual(const Screenshot& other) const {
  const auto width = surface_.width();
  const auto height = surface_.height();
  if (width != other.surface_.width() || height != other.surface_.height()) {
    return false;
  }
  const auto* data = static_cast<const unsigned char*>(surface_.getPixels());
  const auto* otherData =
      static_cast<const unsigned char*>(other.surface_.getPixels());
  if (data == nullptr || otherData == nullptr) {
    throw std::runtime_error("Cannot read screenshot pixels");
  }
  const auto stride = static_cast<size_t>(surface_.rowBytes());
  const auto otherStride = static_cast<size_t>(other.surface_.rowBytes());
  const auto pixels = std::span(data, stride * height);
  const auto otherPixels = std::span(otherData, otherStride * height);
  const auto rowSize = static_cast<size_t>(width) * 4;
  for (int row = 0; row < height; ++row) {
    if (!std::ranges::equal(
            pixels.subspan(row * stride, rowSize),
            otherPixels.subspan(row * otherStride, rowSize))) {
      return false;
    }
  }
  return true;
}

const std::vector<unsigned char>& Screenshot::getPNG() {
  if (!png_) {
    SkDynamicMemoryWStream stream;
    if (!SkPngEncoder::Encode(&stream, surface_.pixmap(), {})) {
      throw std::runtime_error("Cannot encode Fantom screenshot PNG");
    }
    const auto bytes = stream.detachAsData();
    const auto* data = static_cast<const unsigned char*>(bytes->data());
    const auto pixels = std::span(data, bytes->size());
    png_ = std::vector<unsigned char>(pixels.begin(), pixels.end());
  }
  return *png_;
}

void Screenshot::saveToFile(const std::string& filePath) {
  if (filePath.empty() || filePath.find('\0') != std::string::npos) {
    throw std::runtime_error(
        "Screenshot path must be nonempty and contain no NUL characters");
  }
  const auto& bytes = getPNG();
  const std::filesystem::path path(filePath);
  if (path.has_parent_path()) {
    std::filesystem::create_directories(path.parent_path());
  }
  std::ofstream file(filePath, std::ios::binary | std::ios::trunc);
  // NOLINTBEGIN(cppcoreguidelines-pro-type-reinterpret-cast)
  file.write(
      reinterpret_cast<const char*>(bytes.data()),
      static_cast<std::streamsize>(bytes.size()));
  // NOLINTEND(cppcoreguidelines-pro-type-reinterpret-cast)
  file.close();
  if (!file) {
    throw std::runtime_error("Cannot write Fantom screenshot to " + filePath);
  }
}

jsi::Value Screenshot::get(jsi::Runtime& runtime, const jsi::PropNameID& name) {
  const auto property = name.utf8(runtime);
  if (property != "getHash" && property != "saveToFile" &&
      property != "isEqual") {
    return jsi::Value::undefined();
  }
  return jsi::Function::createFromHostFunction(
      runtime,
      name,
      property == "getHash" ? 0 : 1,
      [screenshot = shared_from_this(), property](
          jsi::Runtime& runtime,
          const jsi::Value& receiver,
          const jsi::Value* arguments,
          size_t count) -> jsi::Value {
        const auto args = std::span(arguments, count);
        try {
          if (property == "getHash") {
            return jsi::String::createFromUtf8(runtime, screenshot->getHash());
          }
          if (property == "isEqual") {
            if (count != 1 || !args[0].isObject() ||
                !args[0].asObject(runtime).isHostObject<Screenshot>(runtime)) {
              return false;
            }
            return screenshot->isEqual(
                *args[0].asObject(runtime).getHostObject<Screenshot>(runtime));
          }
          if (count != 1 || !args[0].isString()) {
            throw jsi::JSError(runtime, "Expected a screenshot file path");
          }
          screenshot->saveToFile(args[0].asString(runtime).utf8(runtime));
          if (receiver.isObject()) {
            receiver.asObject(runtime).setExternalMemoryPressure(
                runtime, screenshot->getMemorySize());
          }
          return jsi::Value::undefined();
        } catch (const std::exception& error) {
          throw jsi::JSError(runtime, error.what());
        }
      });
}

} // namespace facebook::react
