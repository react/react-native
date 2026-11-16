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

import type {
  NamedShape,
  PropTypeAnnotation,
  SchemaType,
} from '../../../CodegenSchema';

const fixtures = require('../__test_fixtures__/fixtures.js');
const generator = require('../GeneratePropsH.js');

describe('GeneratePropsH', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      const fixture = fixtures[fixtureName];

      it(`can generate fixture ${fixtureName}`, () => {
        expect(generator.generate(fixtureName, fixture)).toMatchSnapshot();
      });
    });

  it.each(['auto', 'box-none'])(
    'uses the declared string enum default %s for unknown values',
    defaultValue => {
      const header = generatePropsHeader({
        name: 'pointerEvents',
        optional: true,
        typeAnnotation: {
          type: 'StringEnumTypeAnnotation',
          default: defaultValue,
          options: ['none', 'auto', 'box-none'],
        },
      });
      const conversion = header.match(
        /static inline void fromRawValue[\s\S]*?\n}/,
      )?.[0];

      expect(conversion).toContain(
        `result = TestComponentPointerEvents::${defaultValue === 'auto' ? 'Auto' : 'BoxNone'};\n}`,
      );
      expect(conversion).not.toContain('abort()');
    },
  );

  it.each([0, 2])(
    'uses the declared integer enum default %s for unknown values',
    defaultValue => {
      const header = generatePropsHeader({
        name: 'mode',
        optional: true,
        typeAnnotation: {
          type: 'Int32EnumTypeAnnotation',
          default: defaultValue,
          options: [0, 1, 2],
        },
      });
      const conversion = header.match(
        /static inline void fromRawValue[\s\S]*?\n}/,
      )?.[0];

      expect(conversion).toContain(
        `default:\n      result = TestComponentMode::Mode${defaultValue};`,
      );
      expect(conversion).not.toContain('abort()');
    },
  );
});

function generatePropsHeader(prop: NamedShape<PropTypeAnnotation>): string {
  const schema: SchemaType = {
    modules: {
      TestModule: {
        type: 'Component',
        components: {
          TestComponent: {
            extendsProps: [
              {
                type: 'ReactNativeBuiltInType',
                knownTypeName: 'ReactNativeCoreViewProps',
              },
            ],
            events: [],
            props: [prop],
            commands: [],
          },
        },
      },
    },
  };
  return generator.generate('TestModule', schema).get('Props.h') ?? '';
}
