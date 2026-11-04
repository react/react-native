/**
 * @flow strict
 * @format
 */

declare module 'base64-js' {
  declare module.exports: {
    byteLength: (v: string) => number,
    fromByteArray: (v: Uint8Array | Array<number>) => string,
    toByteArray: (v: string) => Uint8Array,
  };
}
