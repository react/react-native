/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <functional>
#import <iterator>

namespace FB {

template <typename T, typename U>
class LazyIterator {
 public:
  using value_type = T;
  using pointer = std::unique_ptr<T>;
  using reference = T;
  using iterator_category = std::random_access_iterator_tag;
  using difference_type = std::int32_t;
  using size_type = std::int32_t;
  using convert_type = std::function<T(U)>;

 public:
  LazyIterator() = default;

  LazyIterator(U vector, convert_type convert, size_type i) : _v(vector), _i(i), _convert(std::move(convert)) {}

  bool operator==(const LazyIterator &other) const
  {
    return _i == other._i && _v == other._v;
  }

  bool operator<(const LazyIterator &b) const
  {
    return _i < b._i;
  }

  value_type operator*() const
  {
    return _convert(_v[_i]);
  }

  std::unique_ptr<value_type> operator->() const
  {
    return std::make_unique<value_type>(*this);
  }

  LazyIterator operator+(difference_type n) const
  {
    return LazyIterator(_v, _convert, _i + n);
  }

  LazyIterator &operator+=(difference_type n)
  {
    _i += n;
    return *this;
  }

  LazyIterator &operator-=(difference_type n)
  {
    _i -= n;
    return *this;
  }

  LazyIterator operator-(difference_type n) const
  {
    return LazyIterator(_v, _i - n);
  }

  difference_type operator-(const LazyIterator &a) const
  {
    return _i - a._i;
  }

  LazyIterator &operator++()
  {
    return *this += 1;
  }

  LazyIterator operator++(int)
  {
    auto tmp = *this;
    ++*this;
    return tmp;
  }

  LazyIterator &operator--()
  {
    return *this -= 1;
  }

  LazyIterator operator--(int)
  {
    auto tmp = *this;
    --*this;
    return tmp;
  }

  value_type operator[](difference_type n) const
  {
    return _convert(_v[_i + n]);
  }

 private:
  U _v;
  size_type _i;
  convert_type _convert;
};

template <typename T, typename U>
LazyIterator<T, U> operator+(typename LazyIterator<T, U>::difference_type n, const LazyIterator<T, U> &i)
{
  return i + n;
}

template <typename T, typename U>
bool operator<=(const LazyIterator<T, U> &a, const LazyIterator<T, U> &b)
{
  return a < b || a == b;
}

template <typename T, typename U>
bool operator>(const LazyIterator<T, U> &a, const LazyIterator<T, U> &b)
{
  return b < a;
}

template <typename T, typename U>
bool operator>=(const LazyIterator<T, U> &a, const LazyIterator<T, U> &b)
{
  return a > b || a == b;
}

} // namespace FB
