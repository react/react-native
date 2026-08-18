/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

type ErrorHandlerCallback = (error: any, isFatal?: boolean) => void;

export interface ErrorUtils {
  setGlobalHandler: (callback: ErrorHandlerCallback) => void;
  getGlobalHandler: () => ErrorHandlerCallback;
}
