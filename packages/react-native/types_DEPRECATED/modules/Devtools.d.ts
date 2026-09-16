/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

declare module 'react-native/Libraries/Core/Devtools/parseErrorStack' {
  export type StackFrame = {
    column: number | null | undefined;
    file: string | null | undefined;
    lineNumber: number | null | undefined;
    methodName: string;
  };

  export default function parseErrorStack(errorStack?: string): StackFrame[];
}

declare module 'react-native/Libraries/Core/Devtools/symbolicateStackTrace' {
  import {StackFrame} from 'react-native/Libraries/Core/Devtools/parseErrorStack';

  export type CodeFrame = Readonly<{
    content: string;
    location:
      | {
          row: number;
          column: number;
          [key: string]: any;
        }
      | null
      | undefined;
    fileName: string;
  }>;

  export type SymbolicatedStackTrace = Readonly<{
    stack: ReadonlyArray<StackFrame>;
    codeFrame: CodeFrame | null | undefined;
  }>;

  export default function symbolicateStackTrace(
    stack: ReadonlyArray<StackFrame>,
    extraData?: any,
  ): Promise<SymbolicatedStackTrace>;
}
