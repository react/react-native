/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {SchemaDiff, TypeStore} from '../DiffResults';

import {schemaDiffExporter} from '../DiffResults.js';
import {
  addedEnumMessage,
  addedPropertiesMessage,
  buildSchemaDiff,
  hasUpdatesTypes,
  removedEnumMessage,
  removedPropertiesMessage,
  summarizeDiffSet,
  tooOptionalPropertiesMessage,
  typeNullableChangeMessage,
} from '../VersionDiffing.js';
import {getTestSchema} from './utilities/getTestSchema.js';

const schemaBeforeAfterTypes = makeRN(
  'native-module-before-after-types/NativeModuleBeforeAfterTypes',
);

const schemaBeforeAfterTypesTypesRemoved = makeRN(
  'native-module-before-after-types-removed/NativeModuleBeforeAfterTypes',
);

const schemaWithRN = makeRN('native-module/NativeModule');
const schemaWithRNChanged = makeRN('native-module-changed/NativeModule');

const schemaGetConstants = makeRN('native-module-get-constants/NativeModule');

const schemaGetConstantsAddedRequiredConstant = makeRN(
  'native-module-get-constants-added-required-constant/NativeModule',
);

const schemaGetConstantsAddedOptionalConstant = makeRN(
  'native-module-get-constants-added-optional-constant/NativeModule',
);

const schemaGetConstantsReadOnly = makeRN(
  'native-module-get-constants-readonly/NativeModule',
);

const schemaGetConstantsAddedRequiredConstantReadOnly = makeRN(
  'native-module-get-constants-added-required-constant-readonly/NativeModule',
);

const schemaGetConstantsAddedOptionalConstantReadOnly = makeRN(
  'native-module-get-constants-added-optional-constant-readonly/NativeModule',
);

const schemaBeforeAfterTypesTypeChanged = makeRN(
  'native-module-before-after-types-type-changed/NativeModuleBeforeAfterTypes',
);

function makeRN(name: string) {
  return getTestSchema(__dirname, '__fixtures__', name + '.js.flow');
}

const schemaWithRnNestedObject = makeRN('native-module-nested/NativeModule');
const schemaWithRnNestedChanged = makeRN(
  'native-module-nested-changed/NativeModule',
);
const schemaWithRnNestedOptions = makeRN(
  'native-module-nested-optional/NativeModule',
);
const schemaWithRnNestedNullable = makeRN(
  'native-module-nested-nullable/NativeModule',
);
const schemaWithEnum = makeRN('native-module-with-enum/NativeModule');
const schemaWithEnumChanges = makeRN(
  'native-module-with-enum-changes/NativeModule',
);
const schemaWithEnumTypeChanges = makeRN(
  'native-module-with-enum-type-changes/NativeModule',
);
const schemaWithEnumValueChanges = makeRN(
  'native-module-with-enum-value-changes/NativeModule',
);

const schemaWithEnumFromNative = makeRN(
  'native-module-with-enum-from-native/NativeModule',
);
const schemaWithEnumFromNativeChanges = makeRN(
  'native-module-with-enum-from-native-changes/NativeModule',
);
const schemaWithEnumFromNativeTypeChanges = makeRN(
  'native-module-with-enum-from-native-type-changes/NativeModule',
);
const schemaWithEnumFromNativeValueChanges = makeRN(
  'native-module-with-enum-from-native-value-changes/NativeModule',
);

const schemaWithEventEmitter = makeRN(
  'native-module-with-eventemitter/NativeModule',
);
const schemaWithEventEmitterChanges = makeRN(
  'native-module-with-eventemitter-changes/NativeModule',
);
const schemaWithOptionalArgument = makeRN(
  'native-module-with-optional-argument/NativeModule',
);
const schemaWithUnion = makeRN('native-module-with-union/NativeModule');
const schemaWithUnionChanges = makeRN(
  'native-module-with-union-changes/NativeModule',
);
const schemaWithUnionFromNative = makeRN(
  'native-module-with-union-from-native/NativeModule',
);
const schemaWithUnionFromNativeChanges = makeRN(
  'native-module-with-union-from-native-changes/NativeModule',
);
const schemaWithUnionObject = makeRN(
  'native-module-with-union-object/NativeModule',
);
const schemaWithUnionObjectAdded = makeRN(
  'native-module-with-union-object-added/NativeModule',
);

const schemaWithRNNativeComponent = makeRN('native-component/NativeComponent');
const schemaNativeComponentWithCommand = makeRN(
  'native-component-with-command/NativeComponent',
);
const schemaNativeComponentWithCommandExtraArg = makeRN(
  'native-component-with-command-extra-arg/NativeComponent',
);

const schemaNativeComponentWithCommandExtraCommand = makeRN(
  'native-component-with-command-extra-command/NativeComponent',
);

const schemaNativeComponentWithProps = makeRN(
  'native-component-with-props/NativeComponent',
);

const schemaNativeComponentWithPropsAddedOptionalProp = makeRN(
  'native-component-with-props-added-optional-prop/NativeComponent',
);
const schemaNativeComponentWithPropsAddedRequiredProp = makeRN(
  'native-component-with-props-added-required-prop/NativeComponent',
);

const schemaNativeComponentWithPropsChanges = makeRN(
  'native-component-with-props-changes/NativeComponent',
);

const schemaNativeComponentWithPropsDefaultChange = makeRN(
  'native-component-with-props-default-change/NativeComponent',
);

const schemaNativeComponentWithPropsNestedObject = makeRN(
  'native-component-with-props-nested-object/NativeComponent',
);

const schemaNativeComponentWithPropsNestedObjectAddedOptionalKey = makeRN(
  'native-component-with-props-nested-object-added-optional-key/NativeComponent',
);

const schemaNativeComponentWithPropsNestedObjectAddedRequiredKey = makeRN(
  'native-component-with-props-nested-object-added-required-key/NativeComponent',
);

const schemaNativeComponentWithPropsUnion = makeRN(
  'native-component-with-props-union/NativeComponent',
);

const schemaNativeComponentWithPropsUnionAdded = makeRN(
  'native-component-with-props-union-added/NativeComponent',
);

const schemaNativeComponentWithPropsArrayUnion = makeRN(
  'native-component-with-props-array-union/NativeComponent',
);

const schemaNativeComponentWithPropsArrayUnionAdded = makeRN(
  'native-component-with-props-array-union-added/NativeComponent',
);

describe('hasUpdates', () => {
  it('is given empty sets', () => {
    expect(
      hasUpdatesTypes({
        newTypes: new Set(),
        deprecatedTypes: new Set(),
        objectTypeChanges: new Set(),
        incompatibleChanges: new Set(),
      }),
    ).toBeFalsy();
  });
  const set = new Set<TypeStore>();
  set.add({
    typeName: 'name',
    typeInformation: {
      type: 'AnyTypeAnnotation',
    },
    filename: 'name',
  });
  it('is given nonempty newTypes', () => {
    expect(
      hasUpdatesTypes({
        newTypes: set,
        deprecatedTypes: new Set(),
        objectTypeChanges: new Set(),
        incompatibleChanges: new Set(),
      }),
    ).toBeTruthy();
  });
  it('is given nonempty deprecatedTypes', () => {
    expect(
      hasUpdatesTypes({
        newTypes: new Set(),
        deprecatedTypes: set,
        objectTypeChanges: new Set(),
        incompatibleChanges: new Set(),
      }),
    ).toBeTruthy();
  });
});

describe('buildSchemaDiff', () => {
  it('same file, no changes', () => {
    expect(
      buildSchemaDiff(schemaBeforeAfterTypes, schemaBeforeAfterTypes),
    ).toEqual(new Set());
  });
  it('same RN file, no changes', () => {
    expect(buildSchemaDiff(schemaWithRN, schemaWithRN)).toEqual(new Set());
  });
  it('two RN files, with incompatible Spec changes', () => {
    expect(
      schemaDiffExporter(
        Array.from(buildSchemaDiff(schemaWithRN, schemaWithRNChanged))[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.anything(),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });
  it('RN file with nested object properties, no changes', () => {
    expect(
      buildSchemaDiff(schemaWithRnNestedObject, schemaWithRnNestedObject),
    ).toEqual(new Set());
  });
  it('RN file with nested object properties, added', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(schemaWithRnNestedChanged, schemaWithRnNestedObject),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                objectTypeChanges: expect.any(Object),
                incompatibleChanges: expect.not.arrayContaining([
                  expect.anything(),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });
  it('RN file with nested object properties, removed', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(schemaWithRnNestedObject, schemaWithRnNestedChanged),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorCode: 'removedProps',
                    errorInformation: expect.objectContaining({
                      mismatchedProperties: expect.arrayContaining([
                        expect.objectContaining({
                          fault: expect.objectContaining({
                            previousError: expect.objectContaining({
                              previousError: expect.objectContaining({
                                message: removedPropertiesMessage,
                              }),
                            }),
                          }),
                        }),
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });
  it('RN file with nested object properties, optional removed', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(schemaWithRnNestedOptions, schemaWithRnNestedObject),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorCode: 'optionalProps',
                    errorInformation: expect.objectContaining({
                      mismatchedProperties: expect.arrayContaining([
                        expect.objectContaining({
                          fault: expect.objectContaining({
                            previousError: expect.objectContaining({
                              previousError: expect.objectContaining({
                                message: tooOptionalPropertiesMessage,
                              }),
                            }),
                          }),
                        }),
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });
  it('RN file with nested object properties, nullable added', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(
            schemaWithRnNestedNullable,
            schemaWithRnNestedOptions,
          ),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorCode: 'nullableOfNonNull',
                    errorInformation: expect.objectContaining({
                      mismatchedProperties: expect.arrayContaining([
                        expect.objectContaining({
                          fault: expect.objectContaining({
                            previousError: expect.objectContaining({
                              previousError: expect.objectContaining({
                                message: typeNullableChangeMessage,
                              }),
                            }),
                          }),
                        }),
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });
  it('RN file with nested object properties on function, made optional', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(schemaWithRnNestedOptions, schemaWithRnNestedChanged),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorCode: 'optionalProps',
                    errorInformation: expect.objectContaining({
                      mismatchedProperties: expect.arrayContaining([
                        expect.objectContaining({
                          fault: expect.objectContaining({
                            previousError: expect.objectContaining({
                              previousError: expect.objectContaining({
                                message: tooOptionalPropertiesMessage,
                              }),
                            }),
                          }),
                        }),
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  describe('enums', () => {
    describe('toNative', () => {
      it('RN with enum types, same module', () => {
        expect(buildSchemaDiff(schemaWithEnum, schemaWithEnum)).toEqual(
          new Set(),
        );
      });
      it('RN with enum types, and removal', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(schemaWithEnum, schemaWithEnumChanges),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    newTypes: expect.not.arrayContaining([expect.anything()]),
                    deprecatedTypes: expect.not.arrayContaining([
                      expect.anything(),
                    ]),
                    incompatibleChanges: expect.not.arrayContaining([
                      expect.anything(),
                    ]),
                    objectTypeChanges: expect.any(Object),
                  }),
                }),
              ]),
            }),
          }),
        );
      });
      it('RN with enum types, and addition', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(schemaWithEnumChanges, schemaWithEnum),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorCode: 'addedMemberCases',
                        errorInformation: expect.objectContaining({
                          mismatchedProperties: expect.arrayContaining([
                            expect.objectContaining({
                              fault: expect.objectContaining({
                                previousError: expect.objectContaining({
                                  previousError: expect.objectContaining({
                                    message: addedEnumMessage,
                                  }),
                                }),
                              }),
                            }),
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });
      it('RN with enum types, and type changes', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(schemaWithEnum, schemaWithEnumTypeChanges),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorInformation: expect.objectContaining({
                          mismatchedProperties: expect.arrayContaining([
                            expect.objectContaining({
                              fault: expect.objectContaining({
                                previousError: expect.objectContaining({
                                  previousError: expect.objectContaining({
                                    message:
                                      'EnumDeclaration member types are not the same',
                                  }),
                                }),
                              }),
                            }),
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });
      it('RN with enum types, and value changes', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(schemaWithEnum, schemaWithEnumValueChanges),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorInformation: expect.objectContaining({
                          mismatchedProperties: expect.arrayContaining([
                            expect.objectContaining({
                              fault: expect.objectContaining({
                                previousError: expect.objectContaining({
                                  previousError: expect.objectContaining({
                                    message: 'Enum types do not match',
                                    previousError: expect.objectContaining({
                                      message:
                                        'Enum contained a member with a type mismatch',
                                      mismatchedMembers: expect.arrayContaining(
                                        [
                                          expect.objectContaining({
                                            member: 'B',
                                          }),
                                        ],
                                      ),
                                    }),
                                  }),
                                }),
                              }),
                            }),
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });
    });

    describe('fromNative', () => {
      it('RN with enum types, same module', () => {
        expect(
          buildSchemaDiff(schemaWithEnumFromNative, schemaWithEnumFromNative),
        ).toEqual(new Set());
      });
      it('RN with enum types, and removal', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaWithEnumFromNative,
                schemaWithEnumFromNativeChanges,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorCode: 'removedMemberCases',
                        errorInformation: expect.objectContaining({
                          mismatchedProperties: expect.arrayContaining([
                            expect.objectContaining({
                              fault: expect.objectContaining({
                                previousError: expect.objectContaining({
                                  mismatchedProperties: expect.arrayContaining([
                                    expect.objectContaining({
                                      fault: expect.objectContaining({
                                        previousError: expect.objectContaining({
                                          message: removedEnumMessage,
                                        }),
                                      }),
                                    }),
                                  ]),
                                }),
                              }),
                            }),
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });
      it('RN with enum types, and addition', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaWithEnumFromNativeChanges,
                schemaWithEnumFromNative,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    newTypes: expect.not.arrayContaining([expect.anything()]),
                    deprecatedTypes: expect.not.arrayContaining([
                      expect.anything(),
                    ]),
                    incompatibleChanges: expect.not.arrayContaining([
                      expect.anything(),
                    ]),
                    objectTypeChanges: expect.any(Object),
                  }),
                }),
              ]),
            }),
          }),
        );
      });
      it('RN with enum types, and type changes', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaWithEnumFromNative,
                schemaWithEnumFromNativeTypeChanges,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorInformation: expect.objectContaining({
                          mismatchedProperties: expect.arrayContaining([
                            expect.objectContaining({
                              fault: expect.objectContaining({
                                previousError: expect.objectContaining({
                                  previousError: expect.objectContaining({
                                    mismatchedProperties:
                                      expect.arrayContaining([
                                        expect.objectContaining({
                                          fault: expect.objectContaining({
                                            previousError:
                                              expect.objectContaining({
                                                message:
                                                  'EnumDeclaration member types are not the same',
                                              }),
                                          }),
                                        }),
                                      ]),
                                  }),
                                }),
                              }),
                            }),
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });
      it('RN with enum types, and value changes', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaWithEnumFromNative,
                schemaWithEnumFromNativeValueChanges,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorInformation: expect.objectContaining({
                          mismatchedProperties: expect.arrayContaining([
                            expect.objectContaining({
                              fault: expect.objectContaining({
                                previousError: expect.objectContaining({
                                  previousError: expect.objectContaining({
                                    mismatchedProperties:
                                      expect.arrayContaining([
                                        expect.objectContaining({
                                          fault: expect.objectContaining({
                                            previousError:
                                              expect.objectContaining({
                                                message:
                                                  'Enum types do not match',
                                                previousError:
                                                  expect.objectContaining({
                                                    message:
                                                      'Enum contained a member with a type mismatch',
                                                    mismatchedMembers:
                                                      expect.arrayContaining([
                                                        expect.objectContaining(
                                                          {
                                                            member: 'B',
                                                          },
                                                        ),
                                                      ]),
                                                  }),
                                              }),
                                          }),
                                        }),
                                      ]),
                                  }),
                                }),
                              }),
                            }),
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });
    });
  });

  it('RN with eventEmitters, same module', () => {
    expect(
      buildSchemaDiff(schemaWithEventEmitter, schemaWithEventEmitter),
    ).toEqual(new Set());
  });

  it('RN with eventEmitters, and eventType changes', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(
            schemaWithEventEmitter,
            schemaWithEventEmitterChanges,
          ),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorInformation: expect.objectContaining({
                      message:
                        'Object contained properties with type mismatches',
                      mismatchedProperties: expect.arrayContaining([
                        expect.objectContaining({
                          fault: expect.objectContaining({
                            message: 'has conflicting type changes',
                            previousError: expect.objectContaining({
                              message:
                                'EventEmitter eventTypes are not equivalent',
                            }),
                          }),
                        }),
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  it('RN with adding an optional argument to function', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(schemaWithOptionalArgument, schemaWithRN),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorInformation: expect.objectContaining({
                      message:
                        'Object contained a property with a type mismatch',
                      mismatchedProperties: expect.arrayContaining([
                        expect.objectContaining({
                          fault: expect.objectContaining({
                            message: 'has conflicting type changes',
                            previousError: expect.objectContaining({
                              message:
                                'Function types have differing length of arguments',
                            }),
                          }),
                        }),
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  it('RN with removing an optional argument to function', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(schemaWithRN, schemaWithOptionalArgument),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorInformation: expect.objectContaining({
                      message:
                        'Object contained a property with a type mismatch',
                      mismatchedProperties: expect.arrayContaining([
                        expect.objectContaining({
                          fault: expect.objectContaining({
                            message: 'has conflicting type changes',
                            previousError: expect.objectContaining({
                              message:
                                'Function types have differing length of arguments',
                            }),
                          }),
                        }),
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  it('RN with union types, same module', () => {
    expect(buildSchemaDiff(schemaWithUnion, schemaWithUnion)).toEqual(
      new Set(),
    );
  });

  it('RN with union types, and addition', () => {
    expect(
      schemaDiffExporter(
        Array.from(buildSchemaDiff(schemaWithUnionChanges, schemaWithUnion))[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        name: 'NativeModule',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                objectTypeChanges: expect.arrayContaining([
                  expect.objectContaining({
                    propertyChange: expect.objectContaining({
                      nestedPropertyChanges: expect.arrayContaining([
                        [
                          'exampleFunction',
                          expect.objectContaining({
                            status: 'functionChange',
                            functionChangeLog: expect.objectContaining({
                              parameterTypes: expect.objectContaining({
                                nestedChanges: expect.arrayContaining([
                                  [
                                    0,
                                    0,
                                    expect.objectContaining({
                                      status: 'members',
                                      memberLog: expect.objectContaining({
                                        memberKind: 'union',
                                        addedMembers: expect.arrayContaining([
                                          expect.objectContaining({
                                            type: 'StringLiteralTypeAnnotation',
                                            value: 'd',
                                          }),
                                        ]),
                                      }),
                                    }),
                                  ],
                                ]),
                              }),
                            }),
                          }),
                        ],
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });
  it('RN with union types, and removal', () => {
    expect(
      schemaDiffExporter(
        Array.from(buildSchemaDiff(schemaWithUnion, schemaWithUnionChanges))[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        name: 'NativeModule',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                objectTypeChanges: expect.arrayContaining([
                  expect.objectContaining({
                    propertyChange: expect.objectContaining({
                      nestedPropertyChanges: expect.arrayContaining([
                        [
                          'exampleFunction',
                          expect.objectContaining({
                            status: 'functionChange',
                            functionChangeLog: expect.objectContaining({
                              parameterTypes: expect.objectContaining({
                                nestedChanges: expect.arrayContaining([
                                  [
                                    0,
                                    0,
                                    expect.objectContaining({
                                      status: 'members',
                                      memberLog: expect.objectContaining({
                                        memberKind: 'union',
                                        missingMembers: expect.arrayContaining([
                                          expect.objectContaining({
                                            type: 'StringLiteralTypeAnnotation',
                                            value: 'd',
                                          }),
                                        ]),
                                      }),
                                    }),
                                  ],
                                ]),
                              }),
                            }),
                          }),
                        ],
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });
  it('RN with union types from native, and addition', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(
            schemaWithUnionFromNativeChanges,
            schemaWithUnionFromNative,
          ),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        name: 'NativeModule',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                objectTypeChanges: expect.arrayContaining([
                  expect.objectContaining({
                    propertyChange: expect.objectContaining({
                      nestedPropertyChanges: expect.arrayContaining([
                        [
                          'getConstants',
                          expect.objectContaining({
                            status: 'functionChange',
                            functionChangeLog: expect.objectContaining({
                              returnType: expect.objectContaining({
                                status: 'properties',
                                propertyLog: expect.objectContaining({
                                  nestedPropertyChanges: expect.arrayContaining(
                                    [
                                      [
                                        'exampleConstant',
                                        expect.objectContaining({
                                          status: 'members',
                                          memberLog: expect.objectContaining({
                                            memberKind: 'union',
                                            addedMembers:
                                              expect.arrayContaining([
                                                expect.objectContaining({
                                                  type: 'StringLiteralTypeAnnotation',
                                                  value: 'd',
                                                }),
                                              ]),
                                          }),
                                        }),
                                      ],
                                    ],
                                  ),
                                }),
                              }),
                            }),
                          }),
                        ],
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });
  it('RN with union types from native, and removal', () => {
    expect(
      schemaDiffExporter(
        Array.from(
          buildSchemaDiff(
            schemaWithUnionFromNative,
            schemaWithUnionFromNativeChanges,
          ),
        )[0],
      ),
    ).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        name: 'NativeModule',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                objectTypeChanges: expect.arrayContaining([
                  expect.objectContaining({
                    propertyChange: expect.objectContaining({
                      nestedPropertyChanges: expect.arrayContaining([
                        [
                          'getConstants',
                          expect.objectContaining({
                            status: 'functionChange',
                            functionChangeLog: expect.objectContaining({
                              returnType: expect.objectContaining({
                                status: 'properties',
                                propertyLog: expect.objectContaining({
                                  nestedPropertyChanges: expect.arrayContaining(
                                    [
                                      [
                                        'exampleConstant',
                                        expect.objectContaining({
                                          status: 'members',
                                          memberLog: expect.objectContaining({
                                            memberKind: 'union',
                                            missingMembers:
                                              expect.arrayContaining([
                                                expect.objectContaining({
                                                  type: 'StringLiteralTypeAnnotation',
                                                  value: 'd',
                                                }),
                                              ]),
                                          }),
                                        }),
                                      ],
                                    ],
                                  ),
                                }),
                              }),
                            }),
                          }),
                        ],
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  it('RN with union object types, and addition', () => {
    const schemaDiff = buildSchemaDiff(
      schemaWithUnionObjectAdded, // new: ObjectA | ObjectB | ObjectC
      schemaWithUnionObject, // old: ObjectA | ObjectB
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('incompatible');
    expect(schemaDiffExporter(Array.from(schemaDiff)[0])).toEqual(
      expect.objectContaining({
        framework: 'ReactNative',
        name: 'NativeModule',
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorCode: 'addedMemberCases',
                  }),
                ]),
                objectTypeChanges: expect.arrayContaining([
                  expect.objectContaining({
                    propertyChange: expect.objectContaining({
                      nestedPropertyChanges: expect.arrayContaining([
                        [
                          'exampleFunction',
                          expect.objectContaining({
                            status: 'functionChange',
                            functionChangeLog: expect.objectContaining({
                              parameterTypes: expect.objectContaining({
                                nestedChanges: expect.arrayContaining([
                                  [
                                    0,
                                    0,
                                    expect.objectContaining({
                                      status: 'members',
                                      memberLog: expect.objectContaining({
                                        memberKind: 'union',
                                        addedMembers: expect.arrayContaining([
                                          expect.objectContaining({
                                            type: 'TypeAliasTypeAnnotation',
                                            name: 'ObjectC',
                                          }),
                                        ]),
                                      }),
                                    }),
                                  ],
                                ]),
                              }),
                            }),
                          }),
                        ],
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  it('RN with union object types, removal is ok', () => {
    const schemaDiff = buildSchemaDiff(
      schemaWithUnionObject, // new: ObjectA | ObjectB
      schemaWithUnionObjectAdded, // old: ObjectA | ObjectB | ObjectC
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });

  describe('NativeComponent', () => {
    it('module to component; deprecated + new', () => {
      expect(
        Array.from(buildSchemaDiff(schemaWithRNNativeComponent, schemaWithRN)),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'NativeComponent',
            status: 'new',
          }),
          expect.objectContaining({
            name: 'NativeModule',
            status: 'deprecated',
          }),
        ]),
      );
    });

    it('component changed to module; deprecated + new', () => {
      expect(
        Array.from(buildSchemaDiff(schemaWithRN, schemaWithRNNativeComponent)),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'NativeModule',
            status: 'new',
          }),
          expect.objectContaining({
            name: 'NativeComponent',
            status: 'deprecated',
          }),
        ]),
      );
    });

    it('same RN component, no changes', () => {
      expect(
        buildSchemaDiff(
          schemaWithRNNativeComponent,
          schemaWithRNNativeComponent,
        ),
      ).toEqual(new Set());
    });

    describe('commands', () => {
      it('Command with additional arg', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaNativeComponentWithCommandExtraArg,
                schemaNativeComponentWithCommand,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorInformation: expect.objectContaining({
                          mismatchedProperties: expect.arrayContaining([
                            expect.objectContaining({
                              fault: expect.objectContaining({
                                previousError: expect.objectContaining({
                                  message:
                                    'Function types have differing length of arguments',
                                }),
                              }),
                            }),
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });

      it('Command with arg removed', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaNativeComponentWithCommand,
                schemaNativeComponentWithCommandExtraArg,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorInformation: expect.objectContaining({
                          mismatchedProperties: expect.arrayContaining([
                            expect.objectContaining({
                              fault: expect.objectContaining({
                                previousError: expect.objectContaining({
                                  message:
                                    'Function types have differing length of arguments',
                                }),
                              }),
                            }),
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });

      it('1 command to 2 commands is allowed', () => {
        // This could technically result in an OTA issue if the command
        // is called immediately and the native side throws on unrecognized
        // commands. However, there is no way to do feature detection
        // of commands today to protect against that.
        // We are choosing to allow this change to be made since we previously
        // had no protection for commands at all.
        // See https://fb.workplace.com/groups/615693552291894/posts/1905124013348835
        // for more information.
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithCommandExtraCommand,
              schemaNativeComponentWithCommand,
            ),
          ).status,
        ).toEqual('ok');
      });

      it('2 commands to 1 command is allowed', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithCommand,
              schemaNativeComponentWithCommandExtraCommand,
            ),
          ).status,
        ).toEqual('ok');
      });

      it('0 commands to 1 command is allowed', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithCommand,
              schemaWithRNNativeComponent,
            ),
          ).status,
        ).toEqual('ok');
      });

      it('1 command to 0 commands is allowed', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaWithRNNativeComponent,
              schemaNativeComponentWithCommand,
            ),
          ).status,
        ).toEqual('ok');
      });
    });

    describe('props', () => {
      it('prop with changed value', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaNativeComponentWithPropsChanges,
                schemaNativeComponentWithProps,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.arrayContaining([
                      expect.objectContaining({
                        errorInformation: expect.objectContaining({
                          message:
                            'Object contained a property with a type mismatch',
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });

      it('prop with changed default value should be okay', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithPropsDefaultChange,
              schemaNativeComponentWithProps,
            ),
          ).status,
        ).toBe('ok');
      });

      it('props with optional prop added should be okay', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithPropsAddedOptionalProp,
              schemaNativeComponentWithProps,
            ),
          ).status,
        ).toBe('ok');
      });

      it('props with optional prop removed should be okay', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithProps,
              schemaNativeComponentWithPropsAddedOptionalProp,
            ),
          ).status,
        ).toBe('ok');
      });

      it('props with required prop added should be okay', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithPropsAddedRequiredProp,
              schemaNativeComponentWithProps,
            ),
          ).status,
        ).toBe('ok');
      });

      it('props with required prop removed should fail', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaNativeComponentWithProps,
                schemaNativeComponentWithPropsAddedRequiredProp,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    incompatibleChanges: expect.objectContaining({
                      '0': expect.objectContaining({
                        errorInformation: expect.objectContaining({
                          message: removedPropertiesMessage,
                        }),
                      }),
                    }),
                  }),
                }),
              ]),
            }),
          }),
        );
      });

      it('props with nested object, adding an optional key should be okay', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithPropsNestedObjectAddedOptionalKey,
              schemaNativeComponentWithPropsNestedObject,
            ),
          ).status,
        ).toBe('ok');
      });

      it('props with nested object, removing an optional key should be okay', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithPropsNestedObject,
              schemaNativeComponentWithPropsNestedObjectAddedOptionalKey,
            ),
          ).status,
        ).toBe('ok');
      });

      it('props with nested object, adding a required key should be okay', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithPropsNestedObjectAddedRequiredKey,
              schemaNativeComponentWithPropsNestedObject,
            ),
          ).status,
        ).toBe('ok');
      });

      it('props with union and added option should fail', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaNativeComponentWithPropsUnionAdded,
                schemaNativeComponentWithPropsUnion,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            name: 'NativeComponent',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    objectTypeChanges: expect.arrayContaining([
                      expect.objectContaining({
                        propertyChange: expect.objectContaining({
                          nestedPropertyChanges: expect.arrayContaining([
                            [
                              'size',
                              expect.objectContaining({
                                status: 'members',
                                memberLog: expect.objectContaining({
                                  memberKind: 'union',
                                  addedMembers: expect.arrayContaining([
                                    expect.objectContaining({
                                      type: 'StringLiteralTypeAnnotation',
                                      value: 'huge',
                                    }),
                                  ]),
                                }),
                              }),
                            ],
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });

      it('props with union and removed option should be ok', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithPropsUnion,
              schemaNativeComponentWithPropsUnionAdded,
            ),
          ).status,
        ).toBe('ok');
      });

      it('props with array union and added option should fail', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(
                schemaNativeComponentWithPropsArrayUnionAdded,
                schemaNativeComponentWithPropsArrayUnion,
              ),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            framework: 'ReactNative',
            name: 'NativeComponent',
            status: expect.objectContaining({
              incompatibleSpecs: expect.arrayContaining([
                expect.objectContaining({
                  changeInformation: expect.objectContaining({
                    objectTypeChanges: expect.arrayContaining([
                      expect.objectContaining({
                        propertyChange: expect.objectContaining({
                          nestedPropertyChanges: expect.arrayContaining([
                            [
                              'sizes',
                              expect.objectContaining({
                                status: 'members',
                                memberLog: expect.objectContaining({
                                  memberKind: 'union',
                                  addedMembers: expect.arrayContaining([
                                    expect.objectContaining({
                                      type: 'StringLiteralTypeAnnotation',
                                      value: 'huge',
                                    }),
                                  ]),
                                }),
                              }),
                            ],
                          ]),
                        }),
                      }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        );
      });

      it('props with array union and removed option should be ok', () => {
        // This is risky due to these being stored from component props codegen
        // in C++ ints via bitshift which might change the resulting
        // int value for the same inputs.
        expect(
          summarizeDiffSet(
            buildSchemaDiff(
              schemaNativeComponentWithPropsArrayUnion,
              schemaNativeComponentWithPropsArrayUnionAdded,
            ),
          ).status,
        ).toBe('ok');
      });
    });
  });

  describe('RN new codegen', () => {
    describe('Native Module', () => {
      it('removed', () => {
        expect(
          summarizeDiffSet(
            buildSchemaDiff(schemaWithRNNativeComponent, schemaWithRN),
          ).status,
        ).toEqual('patchable');
      });
      it('added', () => {
        expect(
          schemaDiffExporter(
            Array.from(
              buildSchemaDiff(schemaWithRN, schemaWithRNNativeComponent),
            )[0],
          ),
        ).toEqual(
          expect.objectContaining({
            name: 'NativeModule',
            status: 'new',
          }),
        );
      });
    });
  });
});

describe('RN NativeModule getConstants type diffing', () => {
  it('should not allow required constants to be added to NativeModules', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsAddedRequiredConstant, // new
      schemaGetConstants, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('incompatible');
    expect(schemaDiffExporter(Array.from(schemaDiff)[0])).toEqual(
      expect.objectContaining({
        status: expect.objectContaining({
          incompatibleSpecs: expect.arrayContaining([
            expect.objectContaining({
              changeInformation: expect.objectContaining({
                incompatibleChanges: expect.arrayContaining([
                  expect.objectContaining({
                    errorCode: 'addedProps',
                    errorInformation: expect.objectContaining({
                      mismatchedProperties: expect.arrayContaining([
                        expect.objectContaining({
                          fault: expect.objectContaining({
                            previousError: expect.objectContaining({
                              message: addedPropertiesMessage,
                            }),
                          }),
                        }),
                      ]),
                    }),
                  }),
                ]),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  it('should allow optional constants to be added to NativeModules', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsAddedOptionalConstant, // new
      schemaGetConstants, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });

  it('should allow removal of required constants from NativeModules', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstants, // new
      schemaGetConstantsAddedRequiredConstant, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });

  it('should allow removal of optional constants from NativeModules', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstants, // new
      schemaGetConstantsAddedOptionalConstant, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });

  it('should not allow promotion of optional constants to required constants', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsAddedRequiredConstant, // new
      schemaGetConstantsAddedOptionalConstant, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('incompatible');
  });

  it('should allow required constants to become optional constants', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsAddedOptionalConstant, // new
      schemaGetConstantsAddedRequiredConstant, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });
});

describe('RN NativeModule getConstants $ReadOnly type diffing', () => {
  it('should not allow required constants to be added to NativeModules', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsAddedRequiredConstantReadOnly, // new
      schemaGetConstantsReadOnly, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('incompatible');
  });

  it('should allow optional constants to be added to NativeModules', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsAddedOptionalConstantReadOnly, // new
      schemaGetConstantsReadOnly, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });

  it('should allow removal of required constants from NativeModules', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsReadOnly, // new
      schemaGetConstantsAddedRequiredConstantReadOnly, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });

  it('should allow removal of optional constants from NativeModules', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsReadOnly, // new
      schemaGetConstantsAddedOptionalConstantReadOnly, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });

  it('should not allow promotion of optional constants to required constants', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsAddedRequiredConstantReadOnly, // new
      schemaGetConstantsAddedOptionalConstantReadOnly, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('incompatible');
  });

  it('should allow required constants to become optional constants', () => {
    const schemaDiff = buildSchemaDiff(
      schemaGetConstantsAddedOptionalConstantReadOnly, // new
      schemaGetConstantsAddedRequiredConstantReadOnly, // old
    );

    expect(summarizeDiffSet(schemaDiff).status).toBe('ok');
  });
});

describe('summarizeDiffSet', () => {
  const set = new Set<SchemaDiff>();
  it('is given empty set', () => {
    expect(summarizeDiffSet(set).status).toBe('ok');
  });
  it('is given set with one new', () => {
    set.add({
      name: 'SampleName',
      framework: 'ReactNative',
      status: 'new',
    });
    expect(summarizeDiffSet(set).status).toBe('patchable');
  });
  it('is given complex set', () => {
    expect(
      summarizeDiffSet(
        buildSchemaDiff(
          schemaBeforeAfterTypes,
          schemaBeforeAfterTypesTypesRemoved,
        ),
      ).status,
    ).toBe('incompatible');
  });
  it('is given a diff that has incompatible changes in the boundary', () => {
    expect(
      summarizeDiffSet(
        buildSchemaDiff(
          schemaBeforeAfterTypes,
          schemaBeforeAfterTypesTypeChanged,
        ),
      ).status,
    ).toBe('incompatible');
  });
});
