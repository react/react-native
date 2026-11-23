/**
 * @flow strict
 * @format
 */

type StackFrame = {
  file: string,
  methodName: string,
  lineNumber: number,
  column: ?number,
};

declare module 'stacktrace-parser' {
  declare module.exports: {
    parse: (v: string) => Array<StackFrame>,
  };
}
