/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {PACKAGES_DIR} = require('../shared/consts');
// $FlowFixMe[untyped-import]: TODO type ansi-styles
const ansiStyles = require('ansi-styles');
const {execSync, spawnSync} = require('child_process');
const {promises: fs} = require('fs');
const nullthrows = require('nullthrows');
const {hostname, tmpdir, userInfo} = require('os');
const path = require('path');
// $FlowFixMe[untyped-import]: TODO type rimraf
const rimraf = require('rimraf');
// $FlowFixMe[untyped-import]: TODO type signedsource
const SignedSource = require('signedsource');
// $FlowFixMe[untyped-import]: TODO type supports-color
const supportsColor = require('supports-color');
const {parseArgs, styleText} = require('util');

const DEVTOOLS_FRONTEND_REPO_URL =
  'https://github.com/react/react-native-devtools-frontend';

const config = {
  allowPositionals: true,
  options: {
    branch: {type: 'string'},
    'keep-scratch': {type: 'boolean'},
    nohooks: {type: 'boolean'},
    help: {type: 'boolean'},
    'create-diff': {type: 'boolean'},
    'no-build': {type: 'boolean'},
  },
};

/*::
type DiffBaseInfo = {
  packagePath: string,
  baseGitRevision: string,
};

type ParsedBuildInfo = {
  gitRevision: string,
  isLocalCheckout: boolean,
};
*/

async function main() {
  const {
    positionals,
    values: {
      help,
      branch,
      nohooks,
      'keep-scratch': keepScratch,
      'create-diff': createDiff,
      'no-build': noBuild,
    },
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help === true) {
    showHelp();
    process.exitCode = 0;
    return;
  }

  const localCheckoutPath = positionals?.[0];

  if (branch == null && !localCheckoutPath?.length) {
    console.error(styleText('red', 'Error: Missing option --branch'));
    showHelp();
    process.exitCode = 1;
    return;
  }

  console.log(
    '\n' +
      styleText(['bold', 'inverse'], 'Syncing debugger-frontend') +
      (noBuild ? ' (--no-build)' : '') +
      '\n',
  );

  const scratchPath = await fs.mkdtemp(
    path.join(tmpdir(), 'debugger-frontend-build-'),
  );
  process.stdout.write(styleText('dim', `Scratch path: ${scratchPath}\n\n`));

  await checkRequiredTools();
  const packagePath = path.join(PACKAGES_DIR, 'debugger-frontend');
  let diffBaseInfo;
  if (createDiff) {
    diffBaseInfo = await checkCanCreateDiff(packagePath);
  }
  const {checkoutPath} = await buildDebuggerFrontend(
    packagePath,
    scratchPath,
    localCheckoutPath,
    {
      branch: branch ?? '',
      gclientSyncOptions: {nohooks: nohooks === true},
      noBuild,
    },
  );
  if (createDiff && diffBaseInfo) {
    await createSyncDiff(diffBaseInfo, scratchPath, {checkoutPath, noBuild});
  }
  await cleanup(scratchPath, keepScratch === true);
  if (!noBuild) {
    process.stdout.write(
      styleText('green', 'Sync done.') +
        ' Check in any updated files under packages/debugger-frontend.\n',
    );
  }
}

function showHelp() {
  console.log(`
  Usage: node scripts/debugger-frontend/sync-and-build [OPTIONS] [checkout path]

  Sync and build the debugger frontend into @react-native/debugger-frontend.

  By default, checks out the currently pinned revision of the DevTools frontend.
  If an existing checkout path is provided, builds it instead.

  Options:
    --branch           The DevTools frontend branch to use. Ignored when
                       providing a local checkout path.
    --nohooks          Don't run gclient hooks in the devtools checkout (useful
                       for existing checkouts).
    --keep-scratch     Don't clean up temporary files.
    --create-diff      Create a diff with the updated files.
    --no-build         Skip actually building and updating the frontend.
`);
}

async function checkRequiredTools() {
  process.stdout.write('Checking that required tools are available' + '\n');
  await spawnSafe('git', ['--version'], {stdio: 'ignore'});
  try {
    await spawnSafe('gclient', ['--version'], {stdio: 'ignore'});
    await spawnSafe('which', ['gn'], {stdio: 'ignore'});
    await spawnSafe('which', ['autoninja'], {stdio: 'ignore'});
  } catch (e) {
    process.stderr.write(
      'Install depot_tools first: ' +
        'https://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html#_setting_up' +
        '\n',
    );
    throw e;
  }
  process.stdout.write('\n');
}

async function buildDebuggerFrontend(
  packagePath /*: string */,
  scratchPath /*: string */,
  localCheckoutPath /*: ?string */,
  {branch, gclientSyncOptions, noBuild} /*: Readonly<{
    branch: string,
    gclientSyncOptions: Readonly<{nohooks: boolean}>,
    noBuild: boolean,
  }>*/,
) /*: Promise<{checkoutPath: string}> */ {
  let checkoutPath;
  if (localCheckoutPath == null) {
    const scratchCheckoutPath = path.join(scratchPath, 'devtools-frontend');

    await fs.mkdir(scratchPath, {recursive: true});

    await checkoutDevToolsFrontend(scratchCheckoutPath, branch);
    checkoutPath = scratchCheckoutPath;
  } else {
    checkoutPath = localCheckoutPath;
  }

  let gnArgsSummary = '<not built>';
  if (!noBuild) {
    await setupGclientWorkspace(scratchPath, checkoutPath, gclientSyncOptions);

    let buildPath;
    ({buildPath, gnArgsSummary} = await performReleaseBuild(checkoutPath));

    const destPathInPackage = path.join(packagePath, 'dist', 'third-party');
    await cleanPackageFiles(destPathInPackage);

    await copyFrontendFilesToPackage(buildPath, destPathInPackage);
    await copyLicenseToPackage(checkoutPath, destPathInPackage);
  }
  await generateBuildInfo({
    checkoutPath,
    packagePath,
    branch,
    isLocalCheckout: localCheckoutPath != null,
    gclientSyncOptions,
    gnArgsSummary,
    noBuild,
  });
  return {
    checkoutPath,
  };
}

async function checkoutDevToolsFrontend(
  checkoutPath /*: string */,
  branch /*: string */,
) {
  process.stdout.write('Checking out devtools-frontend\n');
  await fs.mkdir(checkoutPath, {recursive: true});
  await spawnSafe('git', [
    'clone',
    DEVTOOLS_FRONTEND_REPO_URL,
    '--branch',
    branch,
    '--single-branch',
    '--depth',
    '1',
    checkoutPath,
  ]);
  // Fetch the full history for changelog purposes
  await spawnSafe(
    'git',
    [
      'fetch',
      '--all',
      '--unshallow',
      // Just the history, not file contents
      '--filter=blob:none',
    ],
    {
      cwd: checkoutPath,
    },
  );
  process.stdout.write('\n');
}

async function setupGclientWorkspace(
  scratchPath /*: string */,
  checkoutPath /*: string */,
  {nohooks} /*: Readonly<{nohooks: boolean}> */,
) {
  process.stdout.write('Setting up gclient workspace' + '\n');
  await spawnSafe(
    'gclient',
    ['config', '--unmanaged', checkoutPath, '--name', 'devtools-frontend'],
    {
      cwd: scratchPath,
    },
  );
  await spawnSafe(
    'gclient',
    ['sync', '--no-history', ...(nohooks ? ['--nohooks'] : [])],
    {
      env: {
        ...process.env,
        DEPOT_TOOLS_UPDATE: '0',
      },
      cwd: scratchPath,
    },
  );
  process.stdout.write('\n');
}

async function performReleaseBuild(
  checkoutPath /*: string */,
) /*: Promise<{buildPath: string, gnArgsSummary: string}> */ {
  process.stdout.write('Performing release build of devtools-frontend' + '\n');
  const buildPath = path.join(checkoutPath, 'out/Release');
  await fs.mkdir(buildPath, {recursive: true});
  await fs.writeFile(
    path.join(buildPath, 'args.gn'),
    // NOTE: Per the DevTools repo's documentation, is_official_build has nothing
    // to do with branding and only controls certain release build optimisations.
    'is_official_build=true\n',
  );
  await spawnSafe('gn', ['gen', 'out/Release'], {
    cwd: checkoutPath,
  });
  const {stdout: gnArgsStdout} = await spawnSafe(
    'gn',
    ['args', 'out/Release', '--list', '--short', '--overrides-only'],
    {
      cwd: checkoutPath,
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  const gnArgsSummary = gnArgsStdout.toString().trim();
  process.stdout.write(styleText('dim', gnArgsSummary) + '\n');
  await spawnSafe('autoninja', ['-C', 'out/Release'], {cwd: checkoutPath});
  process.stdout.write('\n');
  return {gnArgsSummary, buildPath};
}

async function cleanPackageFiles(destPathInPackage /*: string */) {
  process.stdout.write(
    'Cleaning stale generated files in debugger-frontend' + '\n',
  );
  rimraf.sync(destPathInPackage);
  process.stdout.write('\n');
}

async function copyFrontendFilesToPackage(
  buildPath /*: string */,
  destPathInPackage /*: string */,
) {
  process.stdout.write(
    'Copying built devtools-frontend files to debugger-frontend' + '\n\n',
  );
  // The DevTools build generates a manifest of all files meant for packaging
  // into Chrome. These are exactly the files we need to ship.
  const files = JSON.parse(
    await fs.readFile(
      path.join(buildPath, 'gen', 'input_grd_files.json'),
      'utf8',
    ),
  );
  await Promise.all(
    files.map(async file => {
      const destPath = path.join(destPathInPackage, file);
      const destDir = path.dirname(destPath);
      await fs.mkdir(destDir, {recursive: true});
      await fs.copyFile(path.join(buildPath, 'gen', file), destPath);
    }),
  );
}

async function copyLicenseToPackage(
  checkoutPath /*: string */,
  destPathInPackage /*: string */,
) {
  process.stdout.write(
    'Copying LICENSE from devtools-frontend to debugger-frontend package\n\n',
  );
  await fs.copyFile(
    path.join(checkoutPath, 'LICENSE'),
    path.join(destPathInPackage, 'LICENSE'),
  );
}

async function generateBuildInfo(
  info /*: Readonly<{
  checkoutPath: string,
  isLocalCheckout: boolean,
  branch: string,
  packagePath: string,
  gclientSyncOptions: Readonly<{nohooks: boolean}>,
  gnArgsSummary: string,
  noBuild: boolean,
}> */,
) {
  process.stdout.write('Generating BUILD_INFO for debugger-frontend\n\n');
  const gitStatusLines = execSync('git status --porcelain', {
    cwd: info.checkoutPath,
    encoding: 'utf-8',
  })
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => '  ' + line);
  if (!gitStatusLines.length) {
    gitStatusLines.push('  <no changes>');
  }
  const gnSummaryLines = info.gnArgsSummary
    .split('\n')
    .map(line => '  ' + line.trim());
  if (!gnSummaryLines.length) {
    gnSummaryLines.push('  <none>');
  }
  const contents = [
    SignedSource.getSigningToken(),
    'Git revision: ' +
      execSync('git rev-parse HEAD', {
        cwd: info.checkoutPath,
        encoding: 'utf-8',
      }).trim(),
    'Built with --nohooks: ' + String(info.gclientSyncOptions.nohooks),
    'Is local checkout: ' + String(info.isLocalCheckout),
    ...(!info.isLocalCheckout
      ? [
          'Remote URL: ' + DEVTOOLS_FRONTEND_REPO_URL,
          'Remote branch: ' + info.branch,
        ]
      : ['Hostname: ' + hostname(), 'User: ' + userInfo().username]),
    'GN build args (overrides only): ',
    ...gnSummaryLines,
    'Git status in checkout:',
    ...gitStatusLines,
    '',
    info.noBuild ? '--no-build @' + 'nocommit' : null,
  ]
    .filter(x => x != null)
    .join('\n');
  await fs.writeFile(
    path.join(info.packagePath, 'BUILD_INFO'),
    SignedSource.signFile(contents),
  );
}
async function cleanup(scratchPath /*: string */, keepScratch /*: boolean */) {
  if (!keepScratch) {
    process.stdout.write('Cleaning up temporary files\n\n');
    await rimraf.sync(scratchPath);
  } else {
    process.stdout.write(
      'Not cleaning up temporary files because of --keep-scratch\n\n',
    );
  }
}
async function spawnSafe(
  cmd /*: string */,
  args /*: Array<string> */ = [],
  opts /*: child_process$spawnSyncOpts */ = {},
) /*: Promise<{
  stdout: string | Buffer,
  stderr: string | Buffer,
}> */ {
  process.stdout.write(` > ${cmd} ${args.join(' ')}\n`);
  if (supportsColor.stdout) {
    process.stdout.write(ansiStyles.dim.open);
  }
  if (supportsColor.stderr) {
    process.stderr.write(ansiStyles.dim.open);
  }
  try {
    const {error, status, signal, stdout, stderr} = spawnSync(cmd, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      ...opts,
    });
    if (error) {
      throw error;
    }
    if (status != null && status !== 0) {
      throw new Error(`Command failed with exit code ${status}`);
    }
    if (signal != null) {
      throw new Error(`Command terminated by signal ${signal}`);
    }
    return {stdout, stderr};
  } finally {
    if (supportsColor.stdout) {
      process.stdout.write(ansiStyles.dim.close);
    }
    if (supportsColor.stderr) {
      process.stderr.write(ansiStyles.dim.close);
    }
  }
}

async function checkCanCreateDiff(
  packagePath /*: string */,
) /*: Promise<DiffBaseInfo> */ {
  process.stdout.write('Checking that we can create a diff' + '\n');
  try {
    const {stdout: hgRootStdout} = await spawnSafe('hg', ['root'], {
      cwd: packagePath,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const repoRoot = hgRootStdout.toString().trim();
    const projectid = (
      await fs.readFile(path.join(repoRoot, '.projectid'), 'utf8')
    ).trim();
    if (projectid !== 'fbsource') {
      throw new Error(
        'Expected .projectid to contain "fbsource" but found: ' + projectid,
      );
    }
    await spawnSafe('jf', ['-v'], {cwd: packagePath, stdio: 'ignore'});
  } catch (e) {
    process.stderr.write(
      'Must be in an fbsource checkout (Meta-only) to create a diff\n',
    );
    throw e;
  }
  try {
    const {stdout: hgStatusStdout} = await spawnSafe(
      'hg',
      ['status', 'BUILD_INFO'],
      {cwd: packagePath, stdio: ['ignore', 'pipe', 'inherit']},
    );
    if (hgStatusStdout.toString().trim() !== '') {
      throw new Error(
        'Must have a clean base BUILD_INFO file to create a diff',
      );
    }
    const {gitRevision: baseGitRevision} = await readBuildInfo(packagePath);
    return {
      packagePath,
      baseGitRevision,
    };
  } catch (e) {
    process.stderr.write('Must have a BUILD_INFO file to create a diff\n');
    throw e;
  }
}

async function readBuildInfo(
  packagePath /*: string*/,
) /*: Promise<ParsedBuildInfo> */ {
  const buildInfo = await fs.readFile(
    path.join(packagePath, 'BUILD_INFO'),
    'utf8',
  );
  const GIT_REV_RE = /^Git revision: ([0-9a-f]{40})/m;
  const gitRevision = nullthrows(
    GIT_REV_RE.exec(buildInfo),
    'Could not extract git revision from BUILD_INFO',
  )[1];
  const isLocalCheckout = !/^Is local checkout: false$/m.test(buildInfo);
  return {
    isLocalCheckout,
    gitRevision,
  };
}

function generateChangelogTable(
  checkoutPath /*: string */,
  baseRevision /*: string */,
  newRevision /*: string */,
) /*: string */ {
  process.stdout.write('Generating changelog table\n');
  let changelogTable = '';
  // Get commits between base and new revision, excluding commits brought in by merges
  // Use NUL character as field separator to avoid issues with pipe characters in commit messages
  const gitLogCmd = `git log --first-parent --pretty=format:"%h%x00%an%x00%ae%x00%aI%x00%s" ${baseRevision}..${newRevision}`;

  const gitLog = execSync(gitLogCmd, {
    cwd: checkoutPath,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer to handle large outputs
  }).trim();

  if (gitLog) {
    const commits = gitLog.split('\n');
    const maxCommits = 50;
    const limitedCommits = commits.slice(0, maxCommits);

    const tableRows = [
      '',
      '### Changelog',
      '',
      '| Commit | Author | Date/Time | Subject |',
      '| ------ | ------ | --------- | ------- |',
    ];

    limitedCommits.forEach(commit => {
      const [hash, author, email, timestamp, subject] = commit.split('\0');
      // Escape pipe characters in the subject to avoid breaking the markdown table
      const escapedSubject = subject.replace(/\|/g, '\\|');
      // Create links for commit hash and description
      const commitUrl = `${DEVTOOLS_FRONTEND_REPO_URL}/commit/${hash}`;
      const hashLink = `[${hash}](${commitUrl})`;
      const subjectLink = `[${escapedSubject}](${commitUrl})`;
      const authorUnixname = email.endsWith('@meta.com')
        ? email.slice(0, -'@meta.com'.length)
        : undefined;
      const authorText =
        authorUnixname != null
          ? `${author} (@${authorUnixname})`
          : `${author} (${email})`;
      tableRows.push(
        `| ${hashLink} | ${authorText} | ${timestamp} | ${subjectLink} |`,
      );
    });

    if (commits.length > maxCommits) {
      tableRows.push(
        `| ... | ... | ... | ... | ${commits.length - maxCommits} more commit${
          commits.length - maxCommits > 1 ? 's' : ''
        } not shown |`,
      );
    }

    changelogTable = tableRows.join('\n');
  }
  return changelogTable;
}

async function createSyncDiff(
  diffBaseInfo /*: DiffBaseInfo */,
  scratchPath /*: string */,
  {
    checkoutPath,
    noBuild,
  } /*: Readonly<{checkoutPath: string, noBuild: boolean}> */,
) {
  process.stdout.write('Creating a sync diff\n');
  const {packagePath, baseGitRevision} = diffBaseInfo;
  const baseGitRevisionShort = baseGitRevision.slice(0, 7);
  const {gitRevision: newGitRevision, isLocalCheckout} =
    await readBuildInfo(packagePath);
  const newGitRevisionShort = newGitRevision.slice(0, 7);

  // Generate the changelog table
  const changelogTable = await generateChangelogTable(
    checkoutPath,
    baseGitRevision,
    newGitRevision,
  );

  const commitMessage = [
    (isLocalCheckout || noBuild ? 'DO NOT LAND ' : '') +
      `[RN] Update debugger-frontend from ${baseGitRevisionShort}...${newGitRevisionShort}`,
    '',
    'Summary:',
    `Changelog: [Internal] - Update \`@react-native/debugger-frontend\` from ${baseGitRevisionShort}...${newGitRevisionShort}`,
    '',
    `Resyncs \`@react-native/debugger-frontend\` from GitHub - see \`rn-chrome-devtools-frontend\` [changelog](${DEVTOOLS_FRONTEND_REPO_URL}/compare/${baseGitRevision}...${newGitRevision}).`,
    '',
    changelogTable,
    '',
    'Test Plan: CI',
    '',
    'Reviewers: #rn-debugging',
    '',
    'Tags: msdkland[metro]',
    '',
  ].join('\n');

  const commitMessageFile = path.join(scratchPath, 'commit-msg');
  await fs.writeFile(commitMessageFile, commitMessage);
  await spawnSafe(
    'hg',
    ['commit', packagePath, '--addremove', '-l', commitMessageFile],
    {cwd: packagePath},
  );
  await spawnSafe('jf', ['submit', '--draft'], {
    cwd: packagePath,
  });
  if (noBuild) {
    await spawnSafe('jf', ['action', '--abandon'], {
      cwd: packagePath,
    });
  }
}

if (require.main === module) {
  void main();
}
