/**
 * @flow strict
 * @format
 */

declare module 'pngjs/lib/png' {
  declare export class PNG {
    constructor(options: {width: number, height: number}): void;
    width: number;
    height: number;
    data: Buffer;
    static sync: {
      read(buffer: Buffer): PNG,
      write(image: PNG): Buffer,
    };
  }
}
