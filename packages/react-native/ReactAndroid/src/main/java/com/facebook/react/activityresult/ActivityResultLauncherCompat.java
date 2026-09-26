/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.activityresult;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContract;

abstract class ActivityResultLauncherCompat<I> extends ActivityResultLauncher<I> {
  private final ActivityResultContract<I, ?> contract;

  ActivityResultLauncherCompat(ActivityResultContract<I, ?> contract) {
    this.contract = contract;
  }

  @Override
  public ActivityResultContract<I, ?> getContract() {
    return contract;
  }
}
