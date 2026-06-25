/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/css/CSSDataType.h>

namespace facebook::react {

/**
 * Allows grouping together multiple possible CSSDataType to parse.
 * CSSCompoundDataType is a std::variant of the allowed types, serving both
 * as storage and for template parameter deduction during parsing.
 */
template <CSSDataType... AllowedTypesT>
using CSSCompoundDataType = std::variant<AllowedTypesT...>;

namespace detail {
template <typename T>
struct is_variant_of_data_types : std::false_type {};

template <CSSDataType... Ts>
struct is_variant_of_data_types<std::variant<Ts...>> : std::true_type {};
} // namespace detail

template <typename T>
concept CSSValidCompoundDataType = detail::is_variant_of_data_types<T>::value;

/**
 * A concrete data type, or a compound data type which represents multiple other
 * data types.
 */
template <typename T>
concept CSSMaybeCompoundDataType = CSSDataType<T> || CSSValidCompoundDataType<T>;

namespace detail {

// inspired by https://stackoverflow.com/a/76255307
template <CSSMaybeCompoundDataType... AllowedTypesT>
struct merge_data_types;

template <CSSDataType... AlllowedTypes1T, CSSDataType... AlllowedTypes2T, CSSMaybeCompoundDataType... RestT>
struct merge_data_types<std::variant<AlllowedTypes1T...>, std::variant<AlllowedTypes2T...>, RestT...> {
  using type = typename merge_data_types<std::variant<AlllowedTypes1T..., AlllowedTypes2T...>, RestT...>::type;
};

template <CSSDataType AlllowedType1T, CSSDataType... AlllowedTypes2T, CSSMaybeCompoundDataType... RestT>
struct merge_data_types<AlllowedType1T, std::variant<AlllowedTypes2T...>, RestT...> {
  using type = typename merge_data_types<std::variant<AlllowedType1T, AlllowedTypes2T...>, RestT...>::type;
};

template <CSSDataType AlllowedType2T, CSSDataType... AlllowedTypes1T, CSSMaybeCompoundDataType... RestT>
struct merge_data_types<std::variant<AlllowedTypes1T...>, AlllowedType2T, RestT...> {
  using type = typename merge_data_types<std::variant<AlllowedTypes1T..., AlllowedType2T>, RestT...>::type;
};

template <CSSDataType AlllowedType1T, CSSDataType AlllowedType2T, CSSMaybeCompoundDataType... RestT>
struct merge_data_types<AlllowedType1T, AlllowedType2T, RestT...> {
  using type = typename merge_data_types<std::variant<AlllowedType1T, AlllowedType2T>, RestT...>::type;
};

template <CSSDataType... AllowedTypesT>
struct merge_data_types<std::variant<AllowedTypesT...>> {
  using type = std::variant<AllowedTypesT...>;
};

template <CSSDataType AllowedTypeT>
struct merge_data_types<AllowedTypeT> {
  using type = std::variant<AllowedTypeT>;
};

template <typename... T>
struct merge_variant;

template <CSSDataType... AllowedTypesT, typename... RestT>
struct merge_variant<std::variant<AllowedTypesT...>, RestT...> {
  using type = std::variant<RestT..., AllowedTypesT...>;
};
} // namespace detail

/**
 * Merges a set of compound or non-compound data types into a single compound
 * data type
 */
template <CSSMaybeCompoundDataType... T>
using CSSMergedDataTypes = typename detail::merge_data_types<T...>::type;

template <typename MergedTypeT, typename... RestT>
using CSSVariantWithTypes = typename detail::merge_variant<MergedTypeT, RestT...>::type;

} // namespace facebook::react
