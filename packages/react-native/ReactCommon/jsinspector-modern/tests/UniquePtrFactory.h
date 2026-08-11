/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

namespace facebook {

/**
 * A factory that creates objects of type T wrapped in unique_ptr, and provides
 * non-owning access to those objects. Note that the factory MUST outlive the
 * objects it creates.
 *
 * Example usage:
 *
 * struct Foo { virtual ~foo() = default; };
 * UniquePtrFactory<Foo> objects;
 * std::unique_ptr<Foo> object = objects.make_unique();
 * assert(objects[0] == object.get());
 * object.reset();
 * assert(objects[0] == nullptr);
 *
 * See UniquePtrFactoryTest.cpp for more examples.
 */
template <typename T>
class UniquePtrFactory {
  static_assert(
      std::has_virtual_destructor_v<T>,
      "T must have a virtual destructor");

 public:
  /**
   * Creates a new object of type T, and returns a unique_ptr wrapping it.
   */
  template <typename... Args>
  std::unique_ptr<T> make_unique(Args&&... args) {
    size_t index = objectPtrs_.size();
    auto ptr =
        std::make_unique<Facade>(*this, index, std::forward<Args>(args)...);
    objectPtrs_.push_back(ptr.get());
    return ptr;
  }

  /**
   * Returns a function that can be used to create objects of type T. The
   * function may only be used while the factory is alive.
   */
  template <typename... Args>
  std::function<std::unique_ptr<T>(Args&&...)> lazily_make_unique() {
    return [this](Args&&... args) {
      return make_unique(std::forward<Args>(args)...);
    };
  }

  /**
   * Returns a pointer to the `index`th object created by this factory,
   * or nullptr if the object has been destroyed (or not created yet).
   */
  T* operator[](size_t index) {
    return index >= objectPtrs_.size() ? nullptr : objectPtrs_[index];
  }

  /**
   * Returns a pointer to the `index`th object created by this factory,
   * or nullptr if the object has been destroyed (or not created yet).
   */
  const T* operator[](size_t index) const {
    return index >= objectPtrs_.size() ? nullptr : objectPtrs_[index];
  }

  /**
   * Returns the total number of objects created by this factory, including
   * those that have already been destroyed.
   */
  size_t objectsVended() const {
    return objectPtrs_.size();
  }

 private:
  friend class Facade;

  /**
   * Extends T to clean up the reference in objectPtrs_ when the object is
   * destroyed.
   */
  class Facade : public T {
   public:
    template <typename... Args>
    Facade(UniquePtrFactory& container, size_t index, Args&&... args)
        : T(std::forward<Args>(args)...),
          container_(container),
          index_(index) {}

    virtual ~Facade() override {
      container_.objectPtrs_[index_] = nullptr;
    }

    UniquePtrFactory& container_;
    size_t index_;
  };
  std::vector<T*> objectPtrs_;
};

} // namespace facebook
