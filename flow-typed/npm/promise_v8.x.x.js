/**
 * @flow strict
 * @format
 */

declare module 'promise/setimmediate/es6-extensions' {
  declare module.exports: typeof Promise;
}

declare module 'promise/setimmediate/done' {
  declare module.exports: typeof Promise;
}

declare module 'promise/setimmediate/finally' {
  declare module.exports: typeof Promise;
}

declare module 'promise/setimmediate/rejection-tracking' {
  declare module.exports: {
    enable: (
      options?: ?{
        whitelist?: ?Array<unknown>,
        allRejections?: ?boolean,
        onUnhandled?: ?(v0: number, v1: unknown) => void,
        onHandled?: ?(v0: number, v1: unknown) => void,
      },
    ) => void,
    disable: () => void,
  };
}
