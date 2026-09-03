/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {dispatchCommand} = require('../ReactNative/RendererProxy');

type NativeCommandsOptions<T = string> = Readonly<{
  supportedCommands: ReadonlyArray<T>,
}>;

function codegenNativeCommands<T extends interface {}>(
  options: NativeCommandsOptions<keyof T>,
): T {
  const commandObj: {[keyof T]: (...ReadonlyArray<unknown>) => void} = {};

  options.supportedCommands.forEach(command => {
    // $FlowFixMe[missing-local-annot]
    commandObj[command] = (ref, ...args) => {
      // $FlowFixMe[incompatible-type]
      dispatchCommand(ref, command, args);
    };
  });

  // $FlowFixMe[unclear-type] - dynamic command object cannot be statically typed as the generic interface T
  return commandObj as any as T;
}

export default codegenNativeCommands;
