/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {PluginObj} from '@babel/core';

const {
  hasAnnotation,
  stripAnnotationComments,
} = require('./utils/buildDirectives');

const ANNOTATION_PATTERN = /@build-types\s+protected-constructor\b/;

/**
 * Replace the constructor of a class annotated with
 * `@build-types protected-constructor` with `protected constructor()`.
 *
 * This is used to hide constructor signatures from the public API, indicating
 * that instances are not user-constructible.
 */
const visitor: PluginObj<unknown> = {
  visitor: {
    ClassDeclaration(path) {
      if (!hasAnnotation(path, ANNOTATION_PATTERN)) {
        return;
      }
      stripAnnotationComments(path, ANNOTATION_PATTERN);

      for (const member of path.node.body.body) {
        if (member.kind === 'constructor') {
          // $FlowFixMe[prop-missing]
          member.accessibility = 'protected';
          // $FlowFixMe[prop-missing]
          member.params = [];
          // $FlowFixMe[prop-missing]
          // $FlowFixMe[incompatible-type]
          member.returnType = null;
        }
      }
    },
  },
};

module.exports = visitor;
