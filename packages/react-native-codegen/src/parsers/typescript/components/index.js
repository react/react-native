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
import type {Parser} from '../../parser';
import type {ComponentSchemaBuilderConfig} from '../../schema.js';

const {
  findComponentConfig,
  getCommandProperties,
  getOptions,
} = require('../../parsers-commons');
const {getCommands} = require('./commands');
const {getEvents} = require('./events');
const {categorizeProps} = require('./extends');

type PropsAST = Object;

function buildComponentSchema(
  ast: $FlowFixMe,
  parser: Parser,
): ComponentSchemaBuilderConfig {
  const {componentName, propsTypeName, optionsExpression} = findComponentConfig(
    ast,
    parser,
  );

  const types = parser.getTypes(ast);

  const propProperties = parser.getProperties(propsTypeName, types);

  const commandProperties = getCommandProperties(ast, parser);

  const options = getOptions(optionsExpression);

  const componentEventAsts: Array<PropsAST> = [];
  categorizeProps(propProperties, types, componentEventAsts, parser);
  const {props, extendsProps} = parser.getProps(propProperties, types);
  const events = getEvents(componentEventAsts, types, parser);
  const commands = getCommands(commandProperties, types, parser);

  return {
    filename: componentName,
    componentName,
    options,
    extendsProps,
    events,
    props,
    commands,
  };
}

module.exports = {
  buildComponentSchema,
};
