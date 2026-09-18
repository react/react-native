/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * A readonly view of URLSearchParams that only exposes read operations.
 */
export interface ReadonlyURLSearchParams {
  get(name: string): string | null;
  getAll(name: string): Array<string>;
  has(name: string, value?: string): boolean;
  readonly size: number;
  entries(): Iterator<[string, string]>;
  keys(): Iterator<string>;
  values(): Iterator<string>;
  forEach(
    callbackfn: (value: string, key: string, parent: URLSearchParams) => void,
    // $FlowExpectedError[unclear-type]
    thisArg?: any,
  ): void;
  toString(): string;
  @@iterator(): Iterator<[string, string]>;
}

/**
 * A readonly view of URL that prevents mutation of URL properties.
 * Used for URLs passed between module boundaries.
 */
export interface ReadonlyURL {
  readonly hash: string;
  readonly host: string;
  readonly hostname: string;
  readonly href: string;
  readonly origin: string;
  readonly password: string;
  readonly pathname: string;
  readonly port: string;
  readonly protocol: string;
  readonly search: string;
  readonly searchParams: ReadonlyURLSearchParams;
  readonly username: string;
  toString(): string;
  toJSON(): string;
}
