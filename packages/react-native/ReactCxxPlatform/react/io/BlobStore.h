/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstddef>
#include <cstdint>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

namespace facebook::react {

/// Thread-safe byte storage shared by BlobModule, FileReaderModule and
/// blob-aware Networking. Contents are undecoded byte vectors.
class BlobStore {
 public:
  /// Stores `bytes` under a newly generated id and returns that id.
  std::string store(std::vector<uint8_t> bytes);
  void store(const std::string &blobId, std::vector<uint8_t> bytes);

  /// Returns `size` bytes starting at `offset`, or `std::nullopt` when the id
  /// is unknown or the range is out of bounds.
  std::optional<std::vector<uint8_t>> resolve(const std::string &blobId, std::size_t offset, std::size_t size) const;

  void remove(const std::string &blobId);

 private:
  mutable std::mutex mutex_;
  std::unordered_map<std::string, std::vector<uint8_t>> blobs_;
  uint64_t nextId_{0};
};

} // namespace facebook::react
