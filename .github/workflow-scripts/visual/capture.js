/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Captures every visual flow in one Maestro invocation, so the JVM and
 * driver startup (around two minutes on an iOS simulator) is paid once per
 * job rather than once per flow. Flows that fail are rerun, and only those,
 * on later attempts.
 */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const MAESTRO = path.join(process.env.HOME ?? '', '.maestro/bin/maestro');
const DEFAULT_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 30 * 60 * 1000;

const usage = `
node capture.js <platform> <app_path> <app_id> <flows_dir> <output_dir> [ios_udid]

Installs the app, then runs every flow in <flows_dir> in one Maestro
invocation, writing screenshots under <output_dir>. Failed flows are retried
up to ${DEFAULT_ATTEMPTS} attempts in total (VISUAL_CAPTURE_ATTEMPTS).
`;

/** The flows directly inside `flowsDir`, sorted. Helpers live elsewhere. */
function collectFlows(flowsDir) {
  const flows = fs
    .readdirSync(flowsDir, {withFileTypes: true})
    .filter(entry => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map(entry => path.join(flowsDir, entry.name))
    .sort();
  flowsByReportName(flows);
  return flows;
}

/**
 * Maps Maestro's report names to flow paths. Maestro reports a flow under its
 * file name without the extension, so names must be unique.
 */
function flowsByReportName(flows) {
  const byName = new Map();
  for (const flow of flows) {
    const name = path.basename(flow).replace(/\.ya?ml$/, '');
    const existing = byName.get(name);
    if (existing != null) {
      throw new Error(
        `${existing} and ${flow} would both report as '${name}'. Rename one.`,
      );
    }
    byName.set(name, flow);
  }
  return byName;
}

/**
 * The flows a Maestro JUnit report marks as anything but SUCCESS, in report
 * order, matched by the report's file path or, failing that, its name. Throws
 * on a report entry that matches none of `flows`.
 */
function failedFlowsFromJUnit(report, flows) {
  const byName = flowsByReportName(flows);
  const failed = [];
  for (const [, attributes] of report.matchAll(/<testcase\b([^>]*)>/g)) {
    const name = /\bname="([^"]*)"/.exec(attributes)?.[1];
    const file = /\bfile="([^"]*)"/.exec(attributes)?.[1];
    const status = /\bstatus="([^"]*)"/.exec(attributes)?.[1];
    if (name == null || status === 'SUCCESS') {
      continue;
    }
    const flow =
      flows.find(candidate => path.resolve(candidate) === file) ??
      byName.get(name);
    if (flow == null) {
      throw new Error(`The Maestro report has an unknown flow '${name}'`);
    }
    failed.push(flow);
  }
  return failed;
}

function maestroArgs({flows, appId, outputDir, reportPath, udid, attempt}) {
  return [
    ...(udid != null ? [`--udid=${udid}`] : []),
    'test',
    ...flows,
    '--format=junit',
    `--output=${reportPath}`,
    '-e',
    `APP_ID=${appId}`,
    '-e',
    `VISUAL_OUTPUT_DIR=${outputDir}`,
    // The first attempt installs the driver. Retries reuse it.
    ...(attempt > 1 ? ['--no-reinstall-driver'] : []),
  ];
}

function installApp(platform, appPath, udid) {
  if (platform === 'android') {
    childProcess.execFileSync('adb', ['install', '-r', appPath], {
      stdio: 'inherit',
    });
  } else {
    childProcess.execFileSync('xcrun', ['simctl', 'install', udid, appPath], {
      stdio: 'inherit',
    });
  }
}

function runAttempt(args) {
  const result = childProcess.spawnSync(MAESTRO, args, {
    stdio: 'inherit',
    timeout: ATTEMPT_TIMEOUT_MS,
    env: {
      ...process.env,
      MAESTRO_CLI_NO_ANALYTICS: '1',
      MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: 'true',
      MAESTRO_DRIVER_STARTUP_TIMEOUT: '180000',
    },
  });
  if (result.error != null) {
    throw result.error;
  }
  return result.status;
}

function writeSummary(lines) {
  const text = `${lines.join('\n')}\n`;
  console.info(text);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  }
}

function main(args = process.argv.slice(2)) {
  const [platform, appPath, appId, flowsDir, outputDir, udid] = args;
  if (
    !['android', 'ios'].includes(platform) ||
    outputDir == null ||
    (platform === 'ios' && udid == null)
  ) {
    throw new Error(usage);
  }
  const attempts = Number(
    process.env.VISUAL_CAPTURE_ATTEMPTS ?? DEFAULT_ATTEMPTS,
  );
  const allFlows = collectFlows(flowsDir);
  fs.mkdirSync(outputDir, {recursive: true});
  installApp(platform, appPath, udid);

  const summary = [`### Visual capture (${platform})`, ''];
  let pending = allFlows;
  for (let attempt = 1; attempt <= attempts && pending.length > 0; attempt++) {
    const reportPath = path.resolve(`visual-capture-report-${attempt}.xml`);
    const started = Date.now();
    console.info(
      `Attempt ${attempt}/${attempts}: ${pending.length} flow(s) in one Maestro run`,
    );
    const status = runAttempt(
      maestroArgs({
        flows: pending,
        appId,
        outputDir,
        reportPath,
        udid,
        attempt,
      }),
    );
    const report = fs.existsSync(reportPath)
      ? fs.readFileSync(reportPath, 'utf8')
      : '';
    const failed = failedFlowsFromJUnit(report, pending);
    if (status !== 0 && failed.length === 0) {
      // Maestro failed without attributing it to a flow, for example because
      // it could not reach the device. Retrying won't help.
      throw new Error(`Maestro exited with ${status} without a failed flow`);
    }
    summary.push(
      `Attempt ${attempt}: ${pending.length - failed.length} of ${pending.length} flow(s) passed in ${Math.round((Date.now() - started) / 1000)} s`,
    );
    pending = failed;
  }

  if (pending.length > 0) {
    summary.push('', `Failed after ${attempts} attempt(s):`);
    summary.push(...pending.map(flow => `- \`${flow}\``));
  }
  writeSummary(summary);
  if (pending.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {collectFlows, failedFlowsFromJUnit, maestroArgs};
