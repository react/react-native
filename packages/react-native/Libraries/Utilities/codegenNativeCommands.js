/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../src/private/types/HostInstance';

const {dispatchCommand} = require('../ReactNative/RendererProxy');

type NativeCommandsOptions<T = string> = Readonly<{
  supportedCommands: ReadonlyArray<T>,
}>;

declare function castCommandObject<T extends interface {}>(commandObj: {
  [keyof T]: (...ReadonlyArray<unknown>) => void,
}): T;
function castCommandObject(commandObj: interface {}) {
  return commandObj;
}

function codegenNativeCommands<T extends interface {}>(
  options: NativeCommandsOptions<keyof T & string>,
): T {
  const commandObj: {[keyof T]: (...ReadonlyArray<unknown>) => void} = {};

  options.supportedCommands.forEach(command => {
    commandObj[command] = (
      ref: HostInstance,
      ...args: Array<unknown>
    ): void => {
      dispatchCommand(ref, command, args);
    };
  });

  return castCommandObject(commandObj);
}

export default codegenNativeCommands;
