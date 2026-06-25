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

import type {ComponentShape} from '../../CodegenSchema';

const {
  getJavaImportsForReservedPrimitive,
} = require('../ReservedPrimitiveTypes');
const {toSafeIdentifier} = require('../Utils');

function getInterfaceJavaClassName(componentName: string): string {
  return `${componentName.replace(/^RCT/, '')}ManagerInterface`;
}

function getDelegateJavaClassName(componentName: string): string {
  return `${componentName.replace(/^RCT/, '')}ManagerDelegate`;
}

function toSafeJavaString(
  input: string,
  shouldUpperCaseFirst?: boolean,
): string {
  return toSafeIdentifier(input, shouldUpperCaseFirst !== false);
}

function getImports(
  component: ComponentShape,
  type: 'interface' | 'delegate',
): Set<string> {
  const imports: Set<string> = new Set();

  if (type === 'interface') {
    imports.add(
      'import com.facebook.react.uimanager.ViewManagerWithGeneratedInterface;',
    );
  }

  component.extendsProps.forEach(extendProps => {
    switch (extendProps.type) {
      case 'ReactNativeBuiltInType':
        switch (extendProps.knownTypeName) {
          case 'ReactNativeCoreViewProps':
            imports.add('import android.view.View;');
            return;
          default:
            extendProps.knownTypeName as empty;
            throw new Error('Invalid knownTypeName');
        }
      default:
        extendProps.type as empty;
        throw new Error('Invalid extended type');
    }
  });

  function addImportsForNativeName(
    name:
      | 'ColorPrimitive'
      | 'EdgeInsetsPrimitive'
      | 'ImageSourcePrimitive'
      | 'PointPrimitive'
      | 'DimensionPrimitive',
  ) {
    for (const javaImport of getJavaImportsForReservedPrimitive(name, type)) {
      imports.add(javaImport);
    }
  }

  component.props.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;

    if (typeAnnotation.type === 'ReservedPropTypeAnnotation') {
      // $FlowFixMe[incompatible-type]
      addImportsForNativeName(typeAnnotation.name);
    }

    if (typeAnnotation.type === 'ArrayTypeAnnotation') {
      imports.add('import com.facebook.react.bridge.ReadableArray;');
    }

    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      imports.add('import com.facebook.react.bridge.ReadableMap;');
    }

    if (typeAnnotation.type === 'MixedTypeAnnotation') {
      if (type === 'delegate') {
        imports.add('import com.facebook.react.bridge.DynamicFromObject;');
      } else {
        imports.add('import com.facebook.react.bridge.Dynamic;');
      }
    }
  });

  component.commands.forEach(command => {
    command.typeAnnotation.params.forEach(param => {
      const cmdParamType = param.typeAnnotation.type;
      if (cmdParamType === 'ArrayTypeAnnotation') {
        imports.add('import com.facebook.react.bridge.ReadableArray;');
      }
    });
  });

  return imports;
}

module.exports = {
  getInterfaceJavaClassName,
  getDelegateJavaClassName,
  toSafeJavaString,
  getImports,
};
