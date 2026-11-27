/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BlobStore.h"

#include <utility>

namespace facebook::react {

std::string BlobStore::store(std::vector<uint8_t> bytes) {
  std::lock_guard<std::mutex> lock(mutex_);
  // JavaScript blob identifiers are UUIDs; this generated prefix is distinct.
  auto blobId = "native-blob-" + std::to_string(nextId_++);
  blobs_.insert_or_assign(blobId, std::move(bytes));
  return blobId;
}

void BlobStore::store(const std::string& blobId, std::vector<uint8_t> bytes) {
  std::lock_guard<std::mutex> lock(mutex_);
  blobs_.insert_or_assign(blobId, std::move(bytes));
}

std::optional<std::vector<uint8_t>> BlobStore::resolve(
    const std::string& blobId,
    std::size_t offset,
    std::size_t size) const {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = blobs_.find(blobId);
  if (it == blobs_.end()) {
    return std::nullopt;
  }
  const auto& bytes = it->second;
  if (offset > bytes.size() || size > bytes.size() - offset) {
    return std::nullopt;
  }
  auto first = bytes.begin() +
      static_cast<std::vector<uint8_t>::difference_type>(offset);
  return std::vector<uint8_t>(
      first, first + static_cast<std::vector<uint8_t>::difference_type>(size));
}

void BlobStore::remove(const std::string& blobId) {
  std::lock_guard<std::mutex> lock(mutex_);
  blobs_.erase(blobId);
}

} // namespace facebook::react
