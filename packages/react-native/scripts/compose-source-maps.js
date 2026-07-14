#!/usr/bin/env node
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

const fs = require('fs');
const {composeSourceMaps} = require('metro-source-map');

const argv = process.argv.slice(2);
let outputPath;
for (let i = 0; i < argv.length;) {
  if (argv[i] === '-o') {
    outputPath = argv[i + 1];
    argv.splice(i, 2);
    continue;
  }
  ++i;
}
if (!argv.length) {
  process.stderr.write(
    'Usage: node compose-source-maps.js <packager_sourcemap> <compiler_sourcemap> [-o output_file]\n',
  );
  process.exitCode = -1;
} else {
  const [packagerSourcemapPath, compilerSourcemapPath] = argv.splice(0, 2);
  const packagerSourcemap = JSON.parse(
    fs.readFileSync(packagerSourcemapPath, 'utf8'),
  );
  const compilerSourcemap = JSON.parse(
    fs.readFileSync(compilerSourcemapPath, 'utf8'),
  );

  if (
    packagerSourcemap.x_facebook_offsets != null ||
    compilerSourcemap.x_facebook_offsets != null
  ) {
    throw new Error(
      'Random Access Bundle (RAM) format is not supported by this tool; ' +
        'it cannot process the `x_facebook_offsets` field provided ' +
        'in the base and/or target source map(s)',
    );
  }

  if (compilerSourcemap.x_facebook_segments != null) {
    throw new Error(
      'This tool cannot process the `x_facebook_segments` field provided ' +
        'in the target source map.',
    );
  }

  const composedMapJSON = JSON.stringify(
    composeSourceMaps([packagerSourcemap, compilerSourcemap]),
  );
  if (outputPath != null) {
    fs.writeFileSync(outputPath, composedMapJSON, 'utf8');
  } else {
    process.stdout.write(composedMapJSON);
  }
}
