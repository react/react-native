/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
export type Command = [string, Array<string>];

export type CommitMessageParts = Readonly<{
  title: string,
  summary: string,
  changelogTable: string,
  changelogEntry: string,
}>;

// Commands are returned rather than run so that the caller can report them
// consistently with the rest of the sync.
export type CommitBackend = Readonly<{
  // Must print nothing when the working directory is clean.
  status: Command,
  // Joined with blank lines; empty entries are dropped.
  messageBlocks: (parts: CommitMessageParts) => ReadonlyArray<string>,
  commit: (packagePath: string, messageFile: string) => ReadonlyArray<Command>,
}>;

export type ResolveContext = Readonly<{
  createDiff: boolean,
  noBuild: boolean,
}>;
*/

const GIT /*: CommitBackend */ = {
  status: ['git', ['status', '--porcelain', '--', '.']],
  messageBlocks: ({title, summary, changelogTable, changelogEntry}) => [
    title,
    summary,
    changelogTable,
    `Changelog: ${changelogEntry}`,
  ],
  commit: (packagePath, messageFile) => [
    ['git', ['add', '-A', '--', packagePath]],
    ['git', ['commit', '-F', messageFile, '--', packagePath]],
  ],
};

function moduleExists(modulePath /*: string */) /*: boolean */ {
  try {
    require.resolve(modulePath);
    return true;
  } catch {
    return false;
  }
}

// Resolved before requiring so that a failure to load the module is not
// mistaken for its absence in the open source repo. The filename is
// deliberately not `commit-backend.fb.js`: Flow and Metro resolve `X.fb.js`
// ahead of `X.js`, but Node - which runs this script - does not.
const resolveFb /*: ?(context: ResolveContext) => Promise<?CommitBackend> */ =
  moduleExists('./fbsource-backend.fb.js')
    ? // $FlowFixMe[cannot-resolve-module] - not resolvable in OSS
      require('./fbsource-backend.fb.js')
    : null;

async function resolveCommitBackend(
  context /*: ResolveContext */,
) /*: Promise<CommitBackend> */ {
  const fbBackend = await resolveFb?.(context);
  if (fbBackend != null) {
    return fbBackend;
  }
  if (context.createDiff) {
    throw new Error('--create-diff requires an fbsource checkout');
  }
  return GIT;
}

module.exports = {
  resolveCommitBackend,
};
