/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LongLivedObject.h"
#include <unordered_map>

namespace facebook::react {

// LongLivedObjectCollection

LongLivedObjectCollection& LongLivedObjectCollection::get(
    jsi::Runtime& runtime) {
  static std::unordered_map<void*, std::shared_ptr<LongLivedObjectCollection>>
      instances;
  static std::mutex instancesMutex;

  std::scoped_lock lock(instancesMutex);
  void* key = static_cast<void*>(&runtime);
  auto entry = instances.find(key);
  if (entry == instances.end()) {
    entry =
        instances.emplace(key, std::make_shared<LongLivedObjectCollection>())
            .first;
  }
  return *(entry->second);
}

void LongLivedObjectCollection::add(std::shared_ptr<LongLivedObject> so) {
  std::scoped_lock lock(collectionMutex_);
  collection_.insert(std::move(so));
}

void LongLivedObjectCollection::remove(const LongLivedObject* o) {
  std::scoped_lock lock(collectionMutex_);
  // Empty owner: lookup-only alias, with no ownership or control block.
  const std::shared_ptr<LongLivedObject> lookupKey{
      std::shared_ptr<LongLivedObject>{}, const_cast<LongLivedObject*>(o)};

  // A shared_ptr hashes and compares by the pointer it stores, so a
  // non-owning shared_ptr to `o` finds its entry without walking the set.
  auto entry = collection_.find(lookupKey);
  if (entry != collection_.end()) {
    collection_.erase(entry);
  }
}

void LongLivedObjectCollection::clear() {
  std::scoped_lock lock(collectionMutex_);
  collection_.clear();
}

size_t LongLivedObjectCollection::size() const {
  std::scoped_lock lock(collectionMutex_);
  return collection_.size();
}

// LongLivedObject

void LongLivedObject::allowRelease() {
  LongLivedObjectCollection::get(runtime_).remove(this);
}

} // namespace facebook::react
