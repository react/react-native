/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct false_type {};
struct true_type {};

// Primary template inherits from false_type.
// Partial specialization inherits from true_type.
// Doxygen may incorrectly merge both base class lists into the
// specialization, producing : false_type, true_type.  The parser
// should subtract the primary template's bases and keep only true_type.

template <typename>
struct is_special : public false_type {};

template <typename T>
struct is_special<T *> : public true_type {};

// Duplicate base class via Doxygen merging template-substituted bases.
struct BaseA {};

struct Derived : public BaseA, public BaseA {};

} // namespace test
