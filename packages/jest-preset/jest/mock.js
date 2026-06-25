/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

/**
 * Mocks the module referenced by `moduleRef` (expected to begin with `m#`)
 * while enforcing type safety of mock factories.
 *
 * If `factoryRef` is provided, it is expected to reference a module that
 * exports the same type signature as the module referenced by `moduleRef`.
 */
export default function mock<TModuleRef extends $Flow$ModuleRef<unknown>>(
  moduleRef: TModuleRef,
  factoryRef?: NoInfer<TModuleRef>,
): void {
  // NOTE: Jest's `babel-plugin-jest-hoist` requires that the second argument to
  // `jest.mock` be an inline function, so structure this code accordingly.
  if (factoryRef === undefined) {
    jest.mock(deref(moduleRef));
  } else {
    // NOTE: Jest's `babel-plugin-jest-hoist` requires that module factories
    // only reference local variables or variables starting with "mock", so be
    // careful when renaming this `mockFactory` variable.
    const mockFactory = deref(factoryRef);
    jest.mock(deref(moduleRef), () => jest.requireActual(mockFactory));
  }
}

function deref(ref: $Flow$ModuleRef<unknown>): string {
  // $FlowFixMe[incompatible-type]
  return (ref as string).substring(2);
}
