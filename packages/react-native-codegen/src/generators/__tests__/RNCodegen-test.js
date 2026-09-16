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

const fixture = require('../__test_fixtures__/fixtures.js');
const rnCodegen = require('../RNCodegen.js');

const packageName = 'na';

describe('RNCodegen.generate', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('when type `all`, with default paths', () => {
    jest.mock('node:fs', () => ({
      existsSync: location => {
        return true;
      },
      writeFileSync: (location, content) => {
        // Jest in the OSS does not allow to capture variables in closures.
        // Therefore, we have to bring the variables inside the closure.
        // see: https://github.com/facebook/jest/issues/2567
        const path = require('node:path');
        const outputDirectory = 'tmp/out/';
        const componentsOutputDir = 'react/renderer/components/library';
        const modulesOutputDir = 'library';
        const expectedPaths = {
          'library.h': modulesOutputDir,
          'library-generated.mm': modulesOutputDir,
          'ShadowNodes.h': componentsOutputDir,
          'ShadowNodes.cpp': componentsOutputDir,
          'Props.h': componentsOutputDir,
          'Props.cpp': componentsOutputDir,
          'States.h': componentsOutputDir,
          'States.cpp': componentsOutputDir,
          'RCTComponentViewHelpers.h': componentsOutputDir,
          'EventEmitters.h': componentsOutputDir,
          'EventEmitters.cpp': componentsOutputDir,
          'ComponentDescriptors.h': componentsOutputDir,
          'ComponentDescriptors.cpp': componentsOutputDir,
        };

        let receivedDir = path.dirname(location);
        let receivedBasename = path.basename(location);

        let expectedPath = path.join(
          outputDirectory,
          // $FlowFixMe[invalid-computed-prop]
          expectedPaths[receivedBasename],
        );
        expect(receivedDir).toEqual(expectedPath);
      },
    }));

    const outputDirectory = 'tmp/out/';
    const res = rnCodegen.generate(
      {
        libraryName: 'library',
        schema: fixture.all,
        outputDirectory: outputDirectory,
        packageName: packageName,
        assumeNonnull: true,
      },
      {
        generators: ['componentsIOS', 'modulesIOS'],
        test: false,
      },
    );

    expect(res).toBeTruthy();
  });
});
