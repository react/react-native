/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {LLVMFileData, LLVMFunctionData} from '../convertLLVMCoverage';

export type LLVMCoverage = {
  file: LLVMFileData,
  functions: Array<LLVMFunctionData>,
  lcov: string[],
};

export default function loadLLVMCoverage(
  name:
    | 'AppSettings.cpp'
    | 'Class.h'
    | 'DevSettingsModule.h'
    | 'NativeFantom.h'
    | 'NativeFantom.cpp'
    | 'RawPropsKey.cpp',
): LLVMCoverage {
  match (name) {
    'AppSettings.cpp' => {
      return {
        // $FlowExpectedError[untyped-import]
        file: require('./resources/AppSettings.cpp.json') as LLVMFileData,
        functions:
          // $FlowExpectedError[untyped-import]
          require('./resources/AppSettings.cpp.functions.json') as Array<LLVMFunctionData>,
        // $FlowExpectedError[untyped-import]
        lcov: require('./resources/AppSettings.cpp.lcov.json') as string[],
      };
    }
    'Class.h' => {
      return {
        // $FlowExpectedError[untyped-import]
        file: require('./resources/Class.h.json') as LLVMFileData,
        functions:
          // $FlowExpectedError[untyped-import]
          require('./resources/Class.h.functions.json') as Array<LLVMFunctionData>,
        // $FlowExpectedError[untyped-import]
        lcov: require('./resources/Class.h.lcov.json') as string[],
      };
    }
    'DevSettingsModule.h' => {
      return {
        // $FlowExpectedError[untyped-import]
        file: require('./resources/DevSettingsModule.h.json') as LLVMFileData,
        functions:
          // $FlowExpectedError[untyped-import]
          require('./resources/DevSettingsModule.h.functions.json') as Array<LLVMFunctionData>,
        // $FlowExpectedError[untyped-import]
        lcov: require('./resources/DevSettingsModule.h.lcov.json') as string[],
      };
    }
    'NativeFantom.cpp' => {
      return {
        // $FlowExpectedError[untyped-import]
        file: require('./resources/NativeFantom.cpp.json') as LLVMFileData,
        functions:
          // $FlowExpectedError[untyped-import]
          require('./resources/NativeFantom.cpp.functions.json') as Array<LLVMFunctionData>,
        // $FlowExpectedError[untyped-import]
        lcov: require('./resources/NativeFantom.cpp.lcov.json') as string[],
      };
    }
    'NativeFantom.h' => {
      return {
        // $FlowExpectedError[untyped-import]
        file: require('./resources/NativeFantom.h.json') as LLVMFileData,
        functions:
          // $FlowExpectedError[untyped-import]
          require('./resources/NativeFantom.h.functions.json') as Array<LLVMFunctionData>,
        // $FlowExpectedError[untyped-import]
        lcov: require('./resources/NativeFantom.h.lcov.json') as string[],
      };
    }
    'RawPropsKey.cpp' => {
      return {
        // $FlowExpectedError[untyped-import]
        file: require('./resources/RawPropsKey.cpp.json') as LLVMFileData,
        functions:
          // $FlowExpectedError[untyped-import]
          require('./resources/RawPropsKey.cpp.functions.json') as Array<LLVMFunctionData>,
        // $FlowExpectedError[untyped-import]
        lcov: require('./resources/RawPropsKey.cpp.lcov.json') as string[],
      };
    }
  }
}
