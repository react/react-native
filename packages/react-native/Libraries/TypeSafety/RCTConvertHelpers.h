/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <optional>

#import <vector>

#import <Foundation/Foundation.h>

#import <FBLazyVector/FBLazyVector.h>

namespace facebook::react {
template <typename T>
using LazyVector = FB::LazyVector<T, id>;
} // namespace facebook::react

template <typename ContainerT>
NSArray *RCTConvertVecToArray(const ContainerT &vec, id (^convertor)(typename ContainerT::value_type element))
{
  NSMutableArray *array = [[NSMutableArray alloc] initWithCapacity:vec.size()];
  for (size_t i = 0, size = vec.size(); i < size; ++i) {
    id object = convertor(vec[i]);
    array[i] = object ?: (id)kCFNull;
  }
  return array;
}
template <typename ContainerT>
NSArray *RCTConvertVecToArray(const ContainerT &vec)
{
  return RCTConvertVecToArray(vec, ^id(typename ContainerT::value_type element) {
    return element;
  });
}

template <typename ContainerT>
NSArray *RCTConvertOptionalVecToArray(
    const std::optional<ContainerT> &vec,
    id (^convertor)(typename ContainerT::value_type element))
{
  return vec.has_value() ? RCTConvertVecToArray(vec.value(), convertor) : nil;
}

template <typename ContainerT>
NSArray *RCTConvertOptionalVecToArray(const std::optional<ContainerT> &vec)
{
  return vec.has_value() ? RCTConvertVecToArray(
                               vec.value(),
                               ^id(typename ContainerT::value_type element) {
                                 return element;
                               })
                         : nil;
}

bool RCTBridgingToBool(id value);
std::optional<bool> RCTBridgingToOptionalBool(id value);
NSString *RCTBridgingToString(id value);
NSString *RCTBridgingToOptionalString(id value);
std::optional<double> RCTBridgingToOptionalDouble(id value);
double RCTBridgingToDouble(id value);
NSArray *RCTBridgingToArray(id value);

template <typename T>
facebook::react::LazyVector<T> RCTBridgingToVec(id value, T (^ctor)(id element))
{
  NSArray *array = RCTBridgingToArray(value);
  using _size_t = typename facebook::react::LazyVector<T>::size_type;
  auto size = static_cast<_size_t>(array.count);
  return facebook::react::LazyVector<T>::fromUnsafeRawValue(array, size, ctor);
}

template <typename T>
std::optional<facebook::react::LazyVector<T>> RCTBridgingToOptionalVec(id value, T (^ctor)(id element))
{
  if (value == nil || value == (id)kCFNull) {
    return std::nullopt;
  } else {
    return RCTBridgingToVec(value, ctor);
  }
}
