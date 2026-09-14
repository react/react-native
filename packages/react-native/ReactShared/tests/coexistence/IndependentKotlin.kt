/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shared.fixture

// Deliberately compiled as an independent framework, without ReactNativeShared.
public class IndependentToken(public val value: String)

public object IndependentProbe {
  public fun makeToken(seed: Int): IndependentToken = IndependentToken("independent-$seed")

  public fun verifyToken(token: IndependentToken, seed: Int): Boolean =
      token.value == "independent-$seed"

  public fun sum(values: List<Double>): Double = values.sum()
}
