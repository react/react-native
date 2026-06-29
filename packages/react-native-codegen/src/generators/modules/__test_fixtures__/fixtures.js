/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {SchemaType} from '../../../CodegenSchema.js';

const EMPTY_NATIVE_MODULES: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [],
      },
      moduleName: 'SampleTurboModule',
    },
  },
};

const EVENT_EMITTER_MODULES: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {
        ObjectStruct: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              name: 'a',
              optional: false,
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              name: 'b',
              optional: false,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              name: 'c',
              optional: true,
              typeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'StringTypeAnnotation',
                },
              },
            },
          ],
        },
      },
      enumMap: {},
      spec: {
        eventEmitters: [
          {
            name: 'onEvent1',
            optional: false,
            typeAnnotation: {
              type: 'EventEmitterTypeAnnotation',
              typeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
            },
          },
          {
            name: 'onEvent2',
            optional: false,
            typeAnnotation: {
              type: 'EventEmitterTypeAnnotation',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
          },
          {
            name: 'onEvent3',
            optional: false,
            typeAnnotation: {
              type: 'EventEmitterTypeAnnotation',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
          },
          {
            name: 'onEvent4',
            optional: false,
            typeAnnotation: {
              type: 'EventEmitterTypeAnnotation',
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
            },
          },
          {
            name: 'onEvent5',
            optional: false,
            typeAnnotation: {
              type: 'EventEmitterTypeAnnotation',
              typeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'ObjectStruct',
              },
            },
          },
          {
            name: 'onEvent6',
            optional: false,
            typeAnnotation: {
              type: 'EventEmitterTypeAnnotation',
              typeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'TypeAliasTypeAnnotation',
                  name: 'ObjectStruct',
                },
              },
            },
          },
        ],
        methods: [
          {
            name: 'voidFunc',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModule',
    },
  },
};

const SIMPLE_NATIVE_MODULES: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {
        NumEnum: {
          type: 'EnumDeclarationWithMembers',
          name: 'NumEnum',
          memberType: 'NumberTypeAnnotation',
          members: [
            {
              name: 'ONE',
              value: {
                type: 'NumberLiteralTypeAnnotation',
                value: 1,
              },
            },
            {
              name: 'TWO',
              value: {
                type: 'NumberLiteralTypeAnnotation',
                value: 2,
              },
            },
          ],
        },
        StringEnum: {
          type: 'EnumDeclarationWithMembers',
          name: 'StringEnum',
          memberType: 'StringTypeAnnotation',
          members: [
            {
              name: 'HELLO',
              value: {
                type: 'StringLiteralTypeAnnotation',
                value: 'hello',
              },
            },
            {
              name: 'GoodBye',
              value: {
                type: 'StringLiteralTypeAnnotation',
                value: 'goodbye',
              },
            },
          ],
        },
      },
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [
                  {
                    optional: false,
                    name: 'const1',
                    typeAnnotation: {
                      type: 'BooleanTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'const2',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'const3',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                ],
              },
              params: [],
            },
          },
          {
            name: 'voidFunc',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
          {
            name: 'getBool',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getNumber',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getString',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'StringTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getArray',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'GenericObjectTypeAnnotation',
                },
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',

                    elementType: {
                      type: 'GenericObjectTypeAnnotation',
                    },
                  },
                },
              ],
            },
          },
          {
            name: 'getObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'GenericObjectTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'GenericObjectTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getRootTag',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ReservedTypeAnnotation',
                name: 'RootTag',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'ReservedTypeAnnotation',
                    name: 'RootTag',
                  },
                },
              ],
            },
          },
          {
            name: 'getValue',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'GenericObjectTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'x',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'y',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'z',
                  typeAnnotation: {
                    type: 'GenericObjectTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getEnumReturn',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'EnumDeclaration',
                name: 'NumEnum',
                memberType: 'NumberTypeAnnotation',
              },
              params: [],
            },
          },
          {
            name: 'getValueWithCallback',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  name: 'callback',
                  optional: false,
                  typeAnnotation: {
                    type: 'FunctionTypeAnnotation',
                    params: [],
                    returnTypeAnnotation: {
                      type: 'VoidTypeAnnotation',
                    },
                  },
                },
              ],
            },
          },
          {
            name: 'getValueWithPromise',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
                elementType: {
                  type: 'VoidTypeAnnotation',
                },
              },
              params: [
                {
                  optional: false,
                  name: 'error',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getValueWithOptionalArg',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
                elementType: {
                  type: 'VoidTypeAnnotation',
                },
              },
              params: [
                {
                  optional: true,
                  name: 'parameter',
                  typeAnnotation: {
                    type: 'GenericObjectTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getEnums',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                name: 'StringEnum',
                type: 'EnumDeclaration',
                memberType: 'StringTypeAnnotation',
              },
              params: [
                {
                  name: 'enumInt',
                  optional: false,
                  typeAnnotation: {
                    name: 'NumEnum',
                    type: 'EnumDeclaration',
                    memberType: 'NumberTypeAnnotation',
                  },
                },
                {
                  name: 'enumString',
                  optional: false,
                  typeAnnotation: {
                    name: 'StringEnum',
                    type: 'EnumDeclaration',
                    memberType: 'StringTypeAnnotation',
                  },
                },
              ],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModule',
    },
  },
};

const TWO_MODULES_DIFFERENT_FILES: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'voidFunc',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModule',
    },
    NativeSampleTurboModule2: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [],
              },
              params: [],
            },
          },
          {
            name: 'voidFunc',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModule2',
    },
  },
};

const COMPLEX_OBJECTS: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'difficult',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [
                  {
                    optional: false,
                    name: 'D',
                    typeAnnotation: {
                      type: 'BooleanTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'E',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'F',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                ],
              },
              params: [
                {
                  optional: false,
                  name: 'A',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    properties: [
                      {
                        optional: false,
                        name: 'D',
                        typeAnnotation: {
                          type: 'BooleanTypeAnnotation',
                        },
                      },
                      {
                        optional: false,
                        name: 'E',
                        typeAnnotation: {
                          type: 'ObjectTypeAnnotation',
                          properties: [
                            {
                              optional: false,
                              name: 'D',
                              typeAnnotation: {
                                type: 'BooleanTypeAnnotation',
                              },
                            },
                            {
                              optional: false,
                              name: 'E',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                              },
                            },
                            {
                              optional: false,
                              name: 'F',
                              typeAnnotation: {
                                type: 'StringTypeAnnotation',
                              },
                            },
                            {
                              optional: false,
                              name: 'id',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                              },
                            },
                          ],
                        },
                      },
                      {
                        optional: false,
                        name: 'F',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'optionals',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'A',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    properties: [
                      {
                        optional: true,
                        name: 'optionalNumberProperty',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                        },
                      },
                      {
                        optional: true,
                        name: 'optionalArrayProperty',
                        typeAnnotation: {
                          type: 'ArrayTypeAnnotation',
                          elementType: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                      },
                      {
                        optional: true,
                        name: 'optionalObjectProperty',
                        typeAnnotation: {
                          type: 'ObjectTypeAnnotation',
                          properties: [
                            {
                              optional: false,
                              name: 'x',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                              },
                            },
                            {
                              optional: false,
                              name: 'y',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                              },
                            },
                          ],
                        },
                      },
                      {
                        optional: true,
                        name: 'optionalGenericObjectProperty',
                        typeAnnotation: {
                          type: 'GenericObjectTypeAnnotation',
                        },
                      },
                      {
                        optional: true,
                        name: 'optionalBooleanTypeProperty',
                        typeAnnotation: {
                          type: 'BooleanTypeAnnotation',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'optionalMethod',
            optional: true,
            typeAnnotation: {
              type: 'NullableTypeAnnotation',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'options',
                    typeAnnotation: {
                      type: 'GenericObjectTypeAnnotation',
                    },
                  },
                  {
                    name: 'callback',
                    optional: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                      params: [],
                      returnTypeAnnotation: {
                        type: 'VoidTypeAnnotation',
                      },
                    },
                  },
                  {
                    name: 'extras',
                    optional: true,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {
                        type: 'ObjectTypeAnnotation',
                        properties: [
                          {
                            optional: false,
                            name: 'key',
                            typeAnnotation: {
                              type: 'StringTypeAnnotation',
                            },
                          },
                          {
                            optional: false,
                            name: 'value',
                            typeAnnotation: {
                              type: 'GenericObjectTypeAnnotation',
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            name: 'getArrays',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'options',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    properties: [
                      {
                        optional: false,
                        name: 'arrayOfNumbers',
                        typeAnnotation: {
                          type: 'ArrayTypeAnnotation',
                          elementType: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                      },
                      {
                        optional: true,
                        name: 'optionalArrayOfNumbers',
                        typeAnnotation: {
                          type: 'ArrayTypeAnnotation',
                          elementType: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                      },
                      {
                        optional: false,
                        name: 'arrayOfStrings',
                        typeAnnotation: {
                          type: 'ArrayTypeAnnotation',
                          elementType: {
                            type: 'StringTypeAnnotation',
                          },
                        },
                      },
                      {
                        optional: true,
                        name: 'optionalArrayOfStrings',
                        typeAnnotation: {
                          type: 'ArrayTypeAnnotation',
                          elementType: {
                            type: 'StringTypeAnnotation',
                          },
                        },
                      },
                      {
                        optional: false,
                        name: 'arrayOfObjects',
                        typeAnnotation: {
                          type: 'ArrayTypeAnnotation',
                          elementType: {
                            type: 'ObjectTypeAnnotation',
                            properties: [
                              {
                                optional: false,
                                name: 'numberProperty',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'getNullableObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
              },
              params: [],
            },
          },
          {
            name: 'getNullableGenericObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'GenericObjectTypeAnnotation',
                },
              },
              params: [],
            },
          },
          {
            name: 'getNullableArray',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'ArrayTypeAnnotation',
                  elementType: {
                    type: 'AnyTypeAnnotation',
                  },
                },
              },
              params: [],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModule',
    },
  },
};

const NATIVE_MODULES_WITH_TYPE_ALIASES: SchemaType = {
  modules: {
    AliasTurboModule: {
      type: 'NativeModule',
      aliasMap: {
        Options: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              optional: false,
              name: 'offset',
              typeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [
                  {
                    optional: false,
                    name: 'x',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'y',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                ],
              },
            },
            {
              optional: false,
              name: 'size',
              typeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [
                  {
                    optional: false,
                    name: 'width',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'height',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                ],
              },
            },
            {
              optional: true,
              name: 'displaySize',
              typeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [
                  {
                    optional: false,
                    name: 'width',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'height',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                ],
              },
            },
            {
              optional: true,
              name: 'resizeMode',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'allowExternalStorage',
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
            },
          ],
        },
      },
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [],
              },
              params: [],
            },
          },
          {
            name: 'cropImage',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'cropData',
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'Options',
                  },
                },
              ],
            },
          },
        ],
      },
      moduleName: 'AliasTurboModule',
    },
  },
};

const REAL_MODULE_EXAMPLE: SchemaType = {
  modules: {
    NativeCameraRollManager: {
      type: 'NativeModule',
      aliasMap: {
        PhotoIdentifierImage: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              optional: false,
              name: 'uri',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'playableDuration',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'width',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'height',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'isStored',
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'filename',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
          ],
        },
        PhotoIdentifier: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              optional: false,
              name: 'node',
              typeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [
                  {
                    optional: false,
                    name: 'image',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'PhotoIdentifierImage',
                    },
                  },
                  {
                    optional: false,
                    name: 'type',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'group_name',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'timestamp',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                  {
                    optional: false,
                    name: 'location',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      properties: [
                        {
                          optional: false,
                          name: 'longitude',
                          typeAnnotation: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                        {
                          optional: false,
                          name: 'latitude',
                          typeAnnotation: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                        {
                          optional: true,
                          name: 'altitude',
                          typeAnnotation: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                        {
                          optional: true,
                          name: 'heading',
                          typeAnnotation: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                        {
                          optional: true,
                          name: 'speed',
                          typeAnnotation: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
        PhotoIdentifiersPage: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              optional: false,
              name: 'edges',
              typeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'TypeAliasTypeAnnotation',
                  name: 'PhotoIdentifier',
                },
              },
            },
            {
              optional: false,
              name: 'page_info',
              typeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [
                  {
                    optional: false,
                    name: 'has_next_page',
                    typeAnnotation: {
                      type: 'BooleanTypeAnnotation',
                    },
                  },
                  {
                    optional: true,
                    name: 'start_cursor',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    optional: true,
                    name: 'end_cursor',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                ],
              },
            },
          ],
        },
        GetPhotosParams: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              optional: false,
              name: 'first',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'after',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'groupName',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'groupTypes',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'assetType',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'maxSize',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'mimeTypes',
              typeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'StringTypeAnnotation',
                },
              },
            },
          ],
        },
      },
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [],
              },
              params: [],
            },
          },
          {
            name: 'getPhotos',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
                elementType: {
                  type: 'VoidTypeAnnotation',
                },
              },
              params: [
                {
                  optional: false,
                  name: 'params',
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'GetPhotosParams',
                  },
                },
              ],
            },
          },
          {
            name: 'saveToCameraRoll',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
                elementType: {
                  type: 'VoidTypeAnnotation',
                },
              },
              params: [
                {
                  optional: false,
                  name: 'uri',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'type',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'deletePhotos',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
                elementType: {
                  type: 'VoidTypeAnnotation',
                },
              },
              params: [
                {
                  name: 'assets',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      moduleName: 'CameraRollManager',
    },
    NativeExceptionsManager: {
      type: 'NativeModule',
      aliasMap: {
        StackFrame: {
          properties: [
            {
              optional: true,
              name: 'column',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'file',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'lineNumber',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'methodName',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'collapse',
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
            },
          ],
          type: 'ObjectTypeAnnotation',
        },
        ExceptionData: {
          properties: [
            {
              optional: false,
              name: 'message',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'originalMessage',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'name',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'componentStack',
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'stack',
              typeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'TypeAliasTypeAnnotation',
                  name: 'StackFrame',
                },
              },
            },
            {
              optional: false,
              name: 'id',
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              optional: false,
              name: 'isFatal',
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
            },
            {
              optional: true,
              name: 'extraData',
              typeAnnotation: {
                type: 'GenericObjectTypeAnnotation',
              },
            },
          ],
          type: 'ObjectTypeAnnotation',
        },
      },
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'reportFatalException',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'message',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  name: 'stack',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'StackFrame',
                    },
                  },
                },
                {
                  optional: false,
                  name: 'exceptionId',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'reportSoftException',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'message',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  name: 'stack',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'StackFrame',
                    },
                  },
                },
                {
                  optional: false,
                  name: 'exceptionId',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'reportException',
            optional: true,
            typeAnnotation: {
              type: 'NullableTypeAnnotation',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'data',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'ExceptionData',
                    },
                  },
                ],
              },
            },
          },
          {
            name: 'updateExceptionMessage',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'message',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  name: 'stack',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'StackFrame',
                    },
                  },
                },
                {
                  optional: false,
                  name: 'exceptionId',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'dismissRedbox',
            optional: true,
            typeAnnotation: {
              type: 'NullableTypeAnnotation',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'VoidTypeAnnotation',
                },
                params: [],
              },
            },
          },
        ],
      },
      moduleName: 'ExceptionsManager',
    },
  },
};

const CXX_ONLY_NATIVE_MODULES: SchemaType = {
  modules: {
    // $FlowFixMe[incompatible-type]
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {
        ConstantsStruct: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              name: 'const1',
              optional: false,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
            },
            {
              name: 'const2',
              optional: false,
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              name: 'const3',
              optional: false,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
          ],
        },
        CustomHostObject: {
          type: 'ObjectTypeAnnotation',
          properties: [],
        },
        BinaryTreeNode: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              name: 'left',
              optional: true,
              typeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'BinaryTreeNode',
              },
            },
            {
              name: 'value',
              optional: false,
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              name: 'right',
              optional: true,
              typeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'BinaryTreeNode',
              },
            },
          ],
        },
        GraphNode: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              name: 'label',
              optional: false,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              name: 'neighbors',
              optional: true,
              typeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'TypeAliasTypeAnnotation',
                  name: 'GraphNode',
                },
              },
            },
          ],
        },
        ObjectStruct: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              name: 'a',
              optional: false,
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              name: 'b',
              optional: false,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              name: 'c',
              optional: true,
              typeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'StringTypeAnnotation',
                },
              },
            },
          ],
        },
        ValueStruct: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              name: 'x',
              optional: false,
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
            {
              name: 'y',
              optional: false,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              name: 'z',
              optional: false,
              typeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'ObjectStruct',
              },
            },
          ],
        },
        MenuItem: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              name: 'label',
              optional: false,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
              },
            },
            {
              name: 'onPress',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    name: 'value',
                    optional: false,
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    name: 'flag',
                    optional: false,
                    typeAnnotation: {
                      type: 'BooleanTypeAnnotation',
                    },
                  },
                ],
              },
            },
            {
              name: 'shortcut',
              optional: true,
              typeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'StringTypeAnnotation',
                },
              },
            },
            {
              name: 'items',
              optional: true,
              typeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'TypeAliasTypeAnnotation',
                  name: 'MenuItem',
                },
              },
            },
          ],
        },
      },
      enumMap: {
        EnumInt: {
          name: 'EnumInt',
          type: 'EnumDeclarationWithMembers',
          memberType: 'NumberTypeAnnotation',
          members: [
            {
              name: 'IA',
              value: {
                type: 'NumberLiteralTypeAnnotation',
                value: 23,
              },
            },
            {
              name: 'IB',
              value: {
                type: 'NumberLiteralTypeAnnotation',
                value: 42,
              },
            },
          ],
        },
        EnumFloat: {
          name: 'EnumFloat',
          type: 'EnumDeclarationWithMembers',
          memberType: 'NumberTypeAnnotation',
          members: [
            {
              name: 'FA',
              value: {
                type: 'NumberLiteralTypeAnnotation',
                value: 1.23,
              },
            },
            {
              name: 'FB',
              value: {
                type: 'NumberLiteralTypeAnnotation',
                value: 4.56,
              },
            },
          ],
        },
        EnumNone: {
          name: 'EnumNone',
          type: 'EnumDeclarationWithMembers',
          memberType: 'StringTypeAnnotation',
          members: [
            {
              name: 'NA',
              value: {
                type: 'StringLiteralTypeAnnotation',
                value: 'NA',
              },
            },
            {
              name: 'NB',
              value: {
                type: 'StringLiteralTypeAnnotation',
                value: 'NB',
              },
            },
          ],
        },
        EnumStr: {
          name: 'EnumStr',
          type: 'EnumDeclarationWithMembers',
          memberType: 'StringTypeAnnotation',
          members: [
            {
              name: 'SA',
              value: {
                type: 'StringLiteralTypeAnnotation',
                value: 's---a',
              },
            },
            {
              name: 'SB',
              value: {
                type: 'StringLiteralTypeAnnotation',
                value: 's---b',
              },
            },
          ],
        },
      },
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'getArray',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'AnyTypeAnnotation',
                },
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getBool',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'ConstantsStruct',
              },
              params: [],
            },
          },
          {
            name: 'getCustomEnum',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                name: 'EnumInt',
                type: 'EnumDeclaration',
                memberType: 'NumberTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    name: 'EnumInt',
                    type: 'EnumDeclaration',
                    memberType: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getCustomHostObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'CustomHostObject',
              },
              params: [],
            },
          },
          {
            name: 'consumeCustomHostObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'StringTypeAnnotation',
              },
              params: [
                {
                  name: 'customHostObject',
                  optional: false,
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'CustomHostObject',
                  },
                },
              ],
            },
          },
          {
            name: 'getBinaryTreeNode',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'BinaryTreeNode',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'BinaryTreeNode',
                  },
                },
              ],
            },
          },
          {
            name: 'getGraphNode',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'GraphNode',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'GraphNode',
                  },
                },
              ],
            },
          },
          {
            name: 'getNumEnum',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                name: 'EnumFloat',
                type: 'EnumDeclaration',
                memberType: 'NumberTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    name: 'EnumInt',
                    type: 'EnumDeclaration',
                    memberType: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getStrEnum',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                name: 'EnumStr',
                type: 'EnumDeclaration',
                memberType: 'StringTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    name: 'EnumNone',
                    type: 'EnumDeclaration',
                    memberType: 'StringTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getMap',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'GenericObjectTypeAnnotation',
                dictionaryValueType: {
                  type: 'NullableTypeAnnotation',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'GenericObjectTypeAnnotation',
                    dictionaryValueType: {
                      type: 'NullableTypeAnnotation',
                      typeAnnotation: {
                        type: 'NumberTypeAnnotation',
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            name: 'getNumber',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'ObjectStruct',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'ObjectStruct',
                  },
                },
              ],
            },
          },
          {
            name: 'getSet',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'NumberTypeAnnotation',
                },
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                },
              ],
            },
          },
          {
            name: 'getString',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'StringTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getUnion',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'StringTypeAnnotation',
              },
              params: [
                {
                  name: 'x',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'NumberTypeAnnotation',
                      },
                    ],
                  },
                },
                {
                  name: 'y',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'StringTypeAnnotation',
                      },
                    ],
                  },
                },
                {
                  name: 'y-literal',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'StringLiteralTypeAnnotation',
                        value: 'foo',
                      },
                      {
                        type: 'StringLiteralTypeAnnotation',
                        value: 'bar',
                      },
                    ],
                  },
                },
                {
                  name: 'z',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'ObjectTypeAnnotation',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'getValue',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'ValueStruct',
              },
              params: [
                {
                  name: 'x',
                  optional: false,
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  name: 'y',
                  optional: false,
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  name: 'z',
                  optional: false,
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'ObjectStruct',
                  },
                },
              ],
            },
          },
          {
            name: 'getValueWithCallback',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  name: 'callback',
                  optional: false,
                  typeAnnotation: {
                    type: 'FunctionTypeAnnotation',
                    returnTypeAnnotation: {
                      type: 'VoidTypeAnnotation',
                    },
                    params: [
                      {
                        name: 'value',
                        optional: false,
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'getValueWithPromise',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
                elementType: {
                  type: 'StringTypeAnnotation',
                },
              },
              params: [
                {
                  name: 'error',
                  optional: false,
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getWithWithOptionalArgs',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'BooleanTypeAnnotation',
                },
              },
              params: [
                {
                  name: 'optionalArg',
                  optional: true,
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'voidFunc',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
          {
            name: 'setMenu',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  name: 'menuItem',
                  optional: false,
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'MenuItem',
                  },
                },
              ],
            },
          },
          {
            name: 'emitCustomDeviceEvent',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  name: 'eventName',
                  optional: false,
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'voidFuncThrows',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },

          {
            name: 'getObjectThrows',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'ObjectStruct',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'ObjectStruct',
                  },
                },
              ],
            },
          },
          {
            name: 'voidFuncAssert',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
          {
            name: 'getObjectAssert',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'TypeAliasTypeAnnotation',
                name: 'ObjectStruct',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'ObjectStruct',
                  },
                },
              ],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModuleCxx',
      excludedPlatforms: ['iOS', 'android'],
    },
  },
};

const ARRAY_BUFFER_NATIVE_MODULE: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'getArrayBuffer',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ArrayBufferTypeAnnotation',
              },
              params: [],
            },
          },
          {
            name: 'voidArrayBuffer',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayBufferTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'voidNullableArrayBuffer',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'NullableTypeAnnotation',
                    typeAnnotation: {
                      type: 'ArrayBufferTypeAnnotation',
                    },
                  },
                },
              ],
            },
          },
          {
            name: 'promiseArrayBuffer',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
                elementType: {
                  type: 'ArrayBufferTypeAnnotation',
                },
              },
              params: [],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModule',
      excludedPlatforms: ['android'],
    },
  },
};

const SAMPLE_WITH_UPPERCASE_NAME: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      enumMap: {},
      aliasMap: {},
      spec: {
        eventEmitters: [],
        methods: [],
      },
      moduleName: 'SampleTurboModule',
    },
  },
};

const UNION_MODULE: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {},
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'getUnion',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'UnionTypeAnnotation',
                types: [
                  {
                    type: 'ObjectTypeAnnotation',
                    properties: [
                      {
                        name: 'low',
                        optional: false,
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                        },
                      },
                    ],
                  },
                ],
              },
              params: [
                {
                  name: 'chooseInt',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'NumberTypeAnnotation',
                      },
                      {
                        type: 'NumberLiteralTypeAnnotation',
                        value: 1,
                      },
                    ],
                  },
                },
                {
                  name: 'chooseFloat',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'NumberTypeAnnotation',
                      },
                      {
                        type: 'NumberLiteralTypeAnnotation',
                        value: 2.88,
                      },
                    ],
                  },
                },
                {
                  name: 'chooseObject',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'ObjectTypeAnnotation',
                        properties: [
                          {
                            name: 'low',
                            optional: false,
                            typeAnnotation: {
                              type: 'StringTypeAnnotation',
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  name: 'chooseString',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'StringLiteralTypeAnnotation',
                        value: 'One',
                      },
                      {
                        type: 'StringTypeAnnotation',
                      },
                    ],
                  },
                },
                {
                  name: 'chooseStringLiteral',
                  optional: false,
                  typeAnnotation: {
                    type: 'UnionTypeAnnotation',
                    types: [
                      {
                        type: 'StringLiteralTypeAnnotation',
                        value: 'foo',
                      },
                      {
                        type: 'StringLiteralTypeAnnotation',
                        value: 'bar',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModule',
    },
  },
};

const STRING_LITERALS: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {},
      spec: {
        eventEmitters: [
          {
            name: 'literalEvent',
            optional: false,
            typeAnnotation: {
              type: 'EventEmitterTypeAnnotation',
              typeAnnotation: {
                type: 'StringLiteralTypeAnnotation',
                value: 'A String Literal Event',
              },
            },
          },
        ],
        methods: [
          {
            name: 'getStringLiteral',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'StringLiteralTypeAnnotation',
                value: 'A String Literal Return',
              },
              params: [
                {
                  name: 'literalParam',
                  optional: false,
                  typeAnnotation: {
                    type: 'StringLiteralTypeAnnotation',
                    value: 'A String Literal Param',
                  },
                },
              ],
            },
          },
        ],
      },
      moduleName: 'SampleTurboModule',
    },
  },
};

module.exports = {
  array_buffer_native_module: ARRAY_BUFFER_NATIVE_MODULE,
  complex_objects: COMPLEX_OBJECTS,
  two_modules_different_files: TWO_MODULES_DIFFERENT_FILES,
  empty_native_modules: EMPTY_NATIVE_MODULES,
  event_emitter_module: EVENT_EMITTER_MODULES,
  simple_native_modules: SIMPLE_NATIVE_MODULES,
  native_modules_with_type_aliases: NATIVE_MODULES_WITH_TYPE_ALIASES,
  real_module_example: REAL_MODULE_EXAMPLE,
  cxx_only_native_modules: CXX_ONLY_NATIVE_MODULES,
  SampleWithUppercaseName: SAMPLE_WITH_UPPERCASE_NAME,
  union_module: UNION_MODULE,
  string_literals: STRING_LITERALS,
};
