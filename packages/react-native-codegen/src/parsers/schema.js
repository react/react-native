/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  CommandTypeAnnotation,
  EventTypeShape,
  ExtendsPropsShape,
  NamedShape,
  OptionsShape,
  PropTypeAnnotation,
  SchemaType,
} from '../CodegenSchema.js';

export type ComponentSchemaBuilderConfig = Readonly<{
  filename: string,
  componentName: string,
  extendsProps: ReadonlyArray<ExtendsPropsShape>,
  events: ReadonlyArray<EventTypeShape>,
  props: ReadonlyArray<NamedShape<PropTypeAnnotation>>,
  commands: ReadonlyArray<NamedShape<CommandTypeAnnotation>>,
  options?: ?OptionsShape,
}>;

function wrapComponentSchema({
  filename,
  componentName,
  extendsProps,
  events,
  props,
  options,
  commands,
}: ComponentSchemaBuilderConfig): SchemaType {
  return {
    modules: {
      [filename]: {
        type: 'Component',
        components: {
          [componentName]: {
            ...(options || {}),
            extendsProps,
            events,
            props,
            commands,
          },
        },
      },
    },
  };
}

module.exports = {
  wrapComponentSchema,
};
