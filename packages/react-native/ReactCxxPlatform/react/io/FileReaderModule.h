/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <jsi/jsi.h>
#include <react/io/BlobStore.h>
#include <memory>
#include <string>
#include <string_view>

namespace facebook::react {

/// C++ implementation of React Native's `FileReaderModule` TurboModule (see
/// `Libraries/Blob/NativeFileReaderModule.js`), reading from `BlobStore`.
class FileReaderModule : public NativeFileReaderModuleCxxSpec<FileReaderModule> {
 public:
  FileReaderModule(std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<BlobStore> store);

  /// Decodes bytes as UTF-8 with Folly, dropping a leading byte-order mark.
  /// Invalid sequences advance one byte at a time and emit U+FFFD.
  static std::string decodeUtf8(std::string_view bytes);

  AsyncPromise<std::string> readAsDataURL(facebook::jsi::Runtime &rt, facebook::jsi::Object blob);

  /// Only UTF-8 is implemented; other labels also decode as UTF-8, the File
  /// API's fallback for encodings a reader does not support.
  AsyncPromise<std::string>
  readAsText(facebook::jsi::Runtime &rt, facebook::jsi::Object blob, const std::string &encoding);

 private:
  std::shared_ptr<BlobStore> store_;
};

} // namespace facebook::react
