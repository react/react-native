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

const dotslash = require('fb-dotslash');
const {promises: fs} = require('fs');
const {applyEdits, modify, parse} = require('jsonc-parser');
const os = require('os');
const path = require('path');
const signedsource = require('signedsource');
const execFile = require('util').promisify(require('child_process').execFile);

/*::
export type DotSlashHttpProvider = {
  type?: 'http',
  url: string,
};

export type DotSlashProvider = DotSlashHttpProvider | {
  type: 'github-release',
  repo: string,
  tag: string,
  name: string,
};

type DotSlashPlatformSpec = {
  providers: DotSlashProvider[],
  hash: 'blake3' | 'sha256',
  digest: string,
  size: number,
  format?: string,
  ...
};

export type DotSlashArtifactInfo = Readonly<{
  size: number,
  hash: 'blake3' | 'sha256',
  digest: string,
  ...
}>;

type JSONCFormattingOptions = {
  tabSize?: number,
  insertSpaces?: boolean,
  eol?: string,
};

type DotSlashProvidersTransformFn = (
  providers: ReadonlyArray<DotSlashProvider>,
  suggestedFilename: string,
  artifactInfo: DotSlashArtifactInfo,
) => ?ReadonlyArray<DotSlashProvider> | Promise<?ReadonlyArray<DotSlashProvider>>;
*/

const DEFAULT_FORMATTING_OPTIONS /*: Readonly<JSONCFormattingOptions> */ = {
  tabSize: 4,
  insertSpaces: true,
  eol: '\n',
};

/**
 * Process a DotSlash file and call a callback with the providers for each platform.
 * The callback can return a new providers array to update the file.
 * The function will preserve formatting and comments in the file (except any comments
 * that are within the providers array).
 */
async function processDotSlashFileInPlace(
  filename /*: string */,
  transformProviders /*: DotSlashProvidersTransformFn */,
  formattingOptions /*: Readonly<JSONCFormattingOptions> */ = DEFAULT_FORMATTING_OPTIONS,
) /*: Promise<void> */ {
  // Validate the file using `dotslash` itself so we can be reasonably sure that it conforms
  // to the expected format.
  await validateAndParseDotSlashFile(filename);

  const originalContents = await fs.readFile(filename, 'utf-8');
  const [shebang, originalContentsJson] =
    splitShebangFromContents(originalContents);
  const json = parse(originalContentsJson);
  let intermediateContentsJson = originalContentsJson;
  for (const [platform, platformSpec] of Object.entries(json.platforms) /*::
   as ReadonlyArray<[string, DotSlashPlatformSpec]>
  */) {
    const providers = platformSpec.providers;
    const suggestedFilename =
      `${sanitizeFileNameComponent(json.name)}-${platform}` +
      (platformSpec.format != null ? `.${platformSpec.format}` : '');
    const {hash, digest, size} = platformSpec;
    const newProviders =
      (await transformProviders(providers, suggestedFilename, {
        hash,
        digest,
        size,
      })) ?? providers;
    if (newProviders !== providers) {
      const edits = modify(
        intermediateContentsJson,
        ['platforms', platform, 'providers'],
        newProviders,
        {
          formattingOptions,
        },
      );
      intermediateContentsJson = applyEdits(intermediateContentsJson, edits);
    }
  }
  if (originalContentsJson !== intermediateContentsJson) {
    await fs.writeFile(filename, shebang + intermediateContentsJson);
    // Validate the modified file to make sure we haven't broken it.
    await validateAndParseDotSlashFile(filename);
  }
}

function sanitizeFileNameComponent(
  fileNameComponent /*: string */,
) /*: string */ {
  return fileNameComponent.replace(/[^a-zA-Z0-9.]/g, '.');
}

function splitShebangFromContents(
  contents /*: string */,
) /*: [string, string] */ {
  const shebangMatch = contents.match(/^#!.*\n/);
  const shebang = shebangMatch ? shebangMatch[0] : '';
  const contentsWithoutShebang = shebang
    ? contents.substring(shebang.length)
    : contents;
  return [shebang, contentsWithoutShebang];
}

/**
 * Validate a DotSlash file and return its parsed contents.
 * Throws an error if the file is not valid.
 *
 * See https://dotslash-cli.com/docs/dotslash-file/
 */
async function validateAndParseDotSlashFile(
  filename /*: string */,
) /*: unknown */ {
  const {stdout} = await execFile(dotslash, ['--', 'parse', filename]);
  return JSON.parse(stdout);
}

/**
 * Re-sign a file previously signed with `signedsource`. Use with caution.
 */
async function dangerouslyResignGeneratedFile(
  filename /*: string */,
) /*: Promise<void> */ {
  const GENERATED = '@' + 'generated';
  const PATTERN = new RegExp(`${GENERATED} (?:SignedSource<<([a-f0-9]{32})>>)`);
  const originalContents = await fs.readFile(filename, 'utf-8');

  const newContents = signedsource.signFile(
    originalContents.replace(PATTERN, signedsource.getSigningToken()),
  );
  await fs.writeFile(filename, newContents);
}

/**
 * Checks that the given buffer matches the given hash and size. This is
 * equivalent to the validation that DotSlash performs after fetching a blob
 * and before extracting/executing it.
 */
async function validateDotSlashArtifactData(
  data /*: Buffer */,
  artifactInfo /*: DotSlashArtifactInfo */,
) /*: Promise<void> */ {
  const {digest: expectedDigest, hash, size} = artifactInfo;
  if (data.length !== size) {
    throw new Error(`size mismatch: expected ${size}, got ${data.length}`);
  }
  const hashFunction = hash === 'blake3' ? 'b3sum' : 'sha256';

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'validate-artifact-hash-'),
  );
  try {
    const tempFile = path.join(tempDir, 'data');
    await fs.writeFile(tempFile, data);
    const {stdout} = await execFile(dotslash, ['--', hashFunction, tempFile]);
    const actualDigest = stdout.trim();
    if (actualDigest !== expectedDigest) {
      throw new Error(
        `${hash} mismatch: expected ${expectedDigest}, got ${actualDigest}`,
      );
    }
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true});
  }
}

function isHttpProvider(
  provider /*: DotSlashProvider */,
) /*: implies provider is DotSlashHttpProvider */ {
  return provider.type === 'http' || provider.type == null;
}

module.exports = {
  DEFAULT_FORMATTING_OPTIONS,
  dangerouslyResignGeneratedFile,
  isHttpProvider,
  processDotSlashFileInPlace,
  validateAndParseDotSlashFile,
  validateDotSlashArtifactData,
};
