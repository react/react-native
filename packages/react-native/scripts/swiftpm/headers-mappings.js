/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const path = require('node:path');

/*::
type MappingOption = {
  destination: string;
  excludeFolders: Array<string>;
  preserveStructure: boolean
}
*/

function reactCommonMappings(
  reactCommonPath /*: string */,
  headersOutput /*: string */,
) /*: { [string]: MappingOption } */ {
  let mappings /*: { [string]: MappingOption } */ = {};
  mappings[`${reactCommonPath}/react`] = {
    destination: path.join(headersOutput, 'react'),
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/react/renderer/components/view/platform/cxx`] = {
    destination: path.join(headersOutput, 'React/renderer/components/view'),
    excludeFolders: [],
    preserveStructure: false,
  };
  mappings[`${reactCommonPath}/react/renderer/graphics/platform/ios`] = {
    destination: path.join(headersOutput, 'react/renderer/graphics'),
    excludeFolders: [],
    preserveStructure: false,
  };
  mappings[`${reactCommonPath}/react/runtime/platform/ios/ReactCommon`] = {
    destination: path.join(headersOutput, 'ReactCommon'),
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/react/nativemodule/core/platform/ios`] = {
    destination: headersOutput,
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/react/nativemodule/samples/platform/ios`] = {
    destination: headersOutput,
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/callinvoker`] = {
    destination: headersOutput,
    excludeFolders: ['tests'],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/cxxreact`] = {
    destination: path.join(headersOutput, 'cxxreact'),
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/jserrorhandler`] = {
    destination: path.join(headersOutput, 'jserrorhandler'),
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/jsinspector-modern`] = {
    destination: path.join(headersOutput, 'jsinspector-modern'),
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/oscompat`] = {
    destination: path.join(headersOutput, 'oscompat'),
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/runtimeexecutor`] = {
    destination: headersOutput,
    excludeFolders: [],
    preserveStructure: true,
  };
  mappings[`${reactCommonPath}/yoga/yoga`] = {
    destination: path.join(headersOutput, 'yoga'),
    excludeFolders: [],
    preserveStructure: true,
  };

  return mappings;
}

function reactMappings(
  reactNativePath /*: string */,
  headersOutput /*: string */,
) /*: { [string]: MappingOption } */ {
  let mappings /*: { [string]: MappingOption } */ = {};
  mappings[`${reactNativePath}/React`] = {
    destination: path.join(headersOutput, 'React'),
    excludeFolders: ['includes', 'headers', 'tests'],
    preserveStructure: false,
  };

  mappings[`${reactNativePath}/React/FBReactNativeSpec`] = {
    destination: headersOutput,
    excludeFolders: ['tests'],
    preserveStructure: true,
  };
  return mappings;
}

function librariesMappings(
  reactNativePath /*: string */,
  headersOutput /*: string */,
) /*: { [string]: MappingOption } */ {
  let mappings /*: { [string]: MappingOption } */ = {};
  mappings[`${reactNativePath}/Libraries`] = {
    destination: path.join(headersOutput, 'React'),
    excludeFolders: ['tests'],
    preserveStructure: false,
  };

  mappings[`${reactNativePath}/Libraries/FBLazyVector`] = {
    destination: path.join(headersOutput, 'FBLazyVector'),
    excludeFolders: ['tests'],
    preserveStructure: false,
  };

  mappings[`${reactNativePath}/Libraries/Required`] = {
    destination: path.join(headersOutput, 'RCTRequired'),
    excludeFolders: ['tests'],
    preserveStructure: false,
  };

  mappings[`${reactNativePath}/Libraries/TypeSafety`] = {
    destination: path.join(headersOutput, 'RCTTypeSafety'),
    excludeFolders: ['tests'],
    preserveStructure: false,
  };
  return mappings;
}

module.exports = {
  librariesMappings,
  reactCommonMappings,
  reactMappings,
};
