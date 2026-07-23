/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type Greeting = Readonly<{
  name: string;
  language: string;
}>;

export function formatGreeting(g: Greeting): string;
export function getVersion(): Promise<string>;
