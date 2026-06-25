/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict
 * @format
 */

declare module 'signedsource' {
  declare type SignedSource = {
    TokenNotFoundError: Error,
    getSigningToken(): string,
    isSigned(data: string): boolean,
    signFile(data: string): string,
    verifySignature(data: string): boolean,
    [key: string]: unknown,
  };

  declare module.exports: SignedSource;
}
