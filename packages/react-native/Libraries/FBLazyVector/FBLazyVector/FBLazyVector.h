/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <cassert>
#import <functional>
#import <iterator>

#import <FBLazyVector/FBLazyIterator.h>

namespace FB {

/**
 * Presents a type-safe wrapper around an arbitrary object that represents an
 * _immutable_ array of objects. Each item is constructed lazily on demand and
 * reconstructed on each access; there is no caching.
 */
template <typename T, typename U>
class LazyVector {
 public:
  using value_type = T;
  using reference = T;
  using const_reference = T;
  using const_iterator = LazyIterator<T, U>;
  using iterator = const_iterator;
  using size_type = std::int32_t;
  using convert_type = std::function<T(U)>;

  static LazyVector<T, U>
  fromUnsafeRawValue(U v, size_type size, convert_type convert) {
    return {v, size, convert};
  }

  U unsafeRawValue() const {
    return _v;
  }

  bool empty() const {
    return _size == 0;
  }

  size_type size() const {
    return _size;
  }

  const_reference at(size_type pos) const {
#ifndef _LIBCPP_NO_EXCEPTIONS
    if (!(pos < _size)) {
      throw std::out_of_range("out of range");
    }
#else
    assert(pos < _size || !"out of range");
#endif
    return _convert(_v[pos]);
  }

  const_reference operator[](size_type pos) const {
    assert(pos < _size);
    return _convert(_v[pos]);
  }

  const_reference front() const {
    assert(_size);
    return (*this)[0];
  }

  const_reference back() const {
    assert(_size);
    return (*this)[_size - 1];
  }

  const_iterator begin() const {
    return const_iterator(_v, _convert, 0);
  }

  const_iterator cbegin() const {
    return begin();
  }

  const_iterator end() const {
    return const_iterator(_v, _convert, _size);
  }

  const_iterator cend() const {
    return end();
  }

 private:
  /** Wrapped vector */
  LazyVector(U vector, size_type size, convert_type convert)
      : _v(vector), _size(size), _convert(convert) {}

  U _v;
  size_type _size;
  convert_type _convert;
};

} // namespace FB
