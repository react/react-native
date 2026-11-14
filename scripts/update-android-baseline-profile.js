/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

/**
 * Updates the Baseline Profile shipped with ReactAndroid
 * (packages/react-native/ReactAndroid/src/main/baseline-prof.txt) from the
 * profile collected by RNTester's BaselineProfileGenerator.
 *
 * The collected profile covers the whole app. This keeps only the rules for
 * classes that ship in ReactAndroid, marks every method rule as hot, startup
 * and post-startup (HSP), because Android 14 and older only compile hot methods
 * at install, and sorts the result so updates produce readable diffs.
 *
 * With --check, it doesn't update anything. It fails if a rule in the shipped
 * profile names a class or method that no longer exists in ReactAndroid.
 *
 * Usage:
 *   node scripts/update-android-baseline-profile.js [--classes-jar <path>] [<collected profile>...]
 *   node scripts/update-android-baseline-profile.js --check [--classes-jar <path>]
 *
 * The classes jar defaults to the Gradle build output. Without collected
 * profiles, it uses the most recent one in the benchmark outputs; with several,
 * for example from several devices, it merges them. See
 * BaselineProfileGenerator.kt for how to collect the profile.
 */

const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {parseArgs} = require('node:util');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(
  ROOT,
  'packages/react-native/ReactAndroid/src/main/baseline-prof.txt',
);
const DEFAULT_CLASSES_JAR = path.join(
  ROOT,
  'packages/react-native/ReactAndroid/build/intermediates/aar_main_jar/release/syncReleaseLibJars/classes.jar',
);
const BENCHMARK_OUTPUTS = path.join(
  ROOT,
  'packages/rn-tester/android/app/benchmark/build/outputs/connected_android_test_additional_output',
);

// A rule starts with optional flags followed by a class descriptor, e.g.
// `HSPLcom/facebook/react/ReactHost;->start()V` or `Lcom/facebook/yoga/YogaNode;`.
const RULE = /^([HSP]*)(L[^;]+;)(.*)$/;
// Lambdas and outlined code that D8/R8 synthesize are named after the class
// they came from. Keep their rules: R8 recreates them in minified apps, but
// non-minified apps only get them from this profile.
const SYNTHETIC_SUFFIX = /(-?\$\$ExternalSynthetic\w*|\$\$Lambda\$?\w*);$/;
// Members that D8 adds to existing classes: lambda bodies, accessors for
// private fields used by nested classes, and constructors that take them.
// Like synthetic classes, they don't exist in ReactAndroid's classes.jar.
const SYNTHETIC_MEMBER = /^->(\$r8\$|-\$\$Nest\$)|-IA;/;

function findCollectedProfile() {
  const found = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (
        entry.name.startsWith('BaselineProfileGenerator_') &&
        entry.name.endsWith('-baseline-prof.txt')
      ) {
        found.push(entryPath);
      }
    }
  };
  if (fs.existsSync(BENCHMARK_OUTPUTS)) {
    visit(BENCHMARK_OUTPUTS);
  }
  if (found.length === 0) {
    throw new Error(
      `No collected profile found under ${BENCHMARK_OUTPUTS}. Run BaselineProfileGenerator first.`,
    );
  }
  return found.sort(
    (a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs,
  )[0];
}

// Lists the classes in a jar from its central directory.
function listClasses(classesJar) {
  const jar = fs.readFileSync(classesJar);
  const end = jar.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) {
    throw new Error(`${classesJar} isn't a jar`);
  }
  const classes = new Set();
  let offset = jar.readUInt32LE(end + 16);
  for (let i = jar.readUInt16LE(end + 10); i > 0; i--) {
    const nameLength = jar.readUInt16LE(offset + 28);
    const name = jar.toString('utf8', offset + 46, offset + 46 + nameLength);
    if (name.endsWith('.class')) {
      classes.add(`L${name.slice(0, -'.class'.length)};`);
    }
    offset +=
      46 +
      nameLength +
      jar.readUInt16LE(offset + 30) +
      jar.readUInt16LE(offset + 32);
  }
  return classes;
}

// Lists the methods of the given classes, as `->name(args)return`.
function listMethods(classesJar, descriptors) {
  const methods = new Map(descriptors.map(d => [d, new Set()]));
  const javap = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', 'javap')
    : 'javap';
  for (let i = 0; i < descriptors.length; i += 100) {
    const batch = descriptors.slice(i, i + 100);
    const output = execFileSync(
      javap,
      [
        '-p',
        '-s',
        '-cp',
        classesJar,
        ...batch.map(d => d.slice(1, -1).replaceAll('/', '.')),
      ],
      {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
    );
    // javap prints each member's declaration, followed by its descriptor on
    // the next line. Constructors are declared with the class's full name.
    let current = null;
    let declaration = '';
    for (const line of output.split('\n')) {
      const header = /^(?:\S.*[ @])?(?:class|interface|enum) ([^\s<{]+)/.exec(
        line,
      );
      if (header != null) {
        current = methods.get(`L${header[1].replaceAll('.', '/')};`);
        continue;
      }
      const descriptor = /^\s+descriptor: (\(.*)$/.exec(line);
      if (descriptor != null && current != null) {
        const name = declaration.startsWith('static {}')
          ? '<clinit>'
          : declaration.slice(0, declaration.indexOf('(')).split(' ').pop();
        current.add(
          `->${name.includes('.') ? '<init>' : name}${descriptor[1]}`,
        );
      }
      declaration = line.trim();
    }
  }
  return methods;
}

function check(classesJar) {
  const classes = listClasses(classesJar);
  const rules = fs
    .readFileSync(OUTPUT, 'utf8')
    .split('\n')
    .map(line => RULE.exec(line))
    .filter(
      match =>
        match != null &&
        !SYNTHETIC_SUFFIX.test(match[2]) &&
        !SYNTHETIC_MEMBER.test(match[3]),
    );
  const methods = listMethods(classesJar, [
    ...new Set(
      rules
        .map(match => match[2])
        .filter(descriptor => classes.has(descriptor)),
    ),
  ]);
  const stale = rules
    .filter(([, , descriptor, member]) =>
      member === ''
        ? !classes.has(descriptor)
        : !methods.get(descriptor)?.has(member),
    )
    .map(match => match[0]);
  if (stale.length > 0) {
    console.error(
      `${stale.length} rules in ${path.relative(ROOT, OUTPUT)} name classes or methods that no longer exist:\n` +
        stale.map(rule => `  ${rule}`).join('\n') +
        '\nRegenerate it with the steps in BaselineProfileGenerator.kt.',
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `All ${rules.length} rules in ${path.relative(ROOT, OUTPUT)} match ReactAndroid.`,
  );
}

function update(collectedProfiles, classesJar) {
  const classes = listClasses(classesJar);

  const rules = new Map();
  for (const collectedProfile of collectedProfiles) {
    for (const line of fs.readFileSync(collectedProfile, 'utf8').split('\n')) {
      const match = RULE.exec(line.trim());
      if (match == null) {
        continue;
      }
      const [, , descriptor, member] = match;
      if (
        !classes.has(descriptor) &&
        !classes.has(descriptor.replace(SYNTHETIC_SUFFIX, ';'))
      ) {
        continue;
      }
      const rule = member === '' ? descriptor : `HSP${descriptor}${member}`;
      rules.set(rule, [descriptor, member]);
    }
  }
  // R8 renames most classes, so a profile collected from a minified build
  // matches almost nothing.
  if (
    ![...rules.keys()].some(rule =>
      rule.startsWith('HSPLcom/facebook/react/ReactActivity;'),
    )
  ) {
    throw new Error(
      `${collectedProfiles.join(', ')} has no rules for ReactActivity. Was it collected from a minified build? Pass -Preact.internal.disableMinifyInReleaseBuilds=true.`,
    );
  }

  // Each class rule first, followed by its method rules.
  const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const sorted = [...rules.keys()].sort((a, b) => {
    const [classA, memberA] = rules.get(a);
    const [classB, memberB] = rules.get(b);
    return compare(classA, classB) || compare(memberA, memberB);
  });
  fs.writeFileSync(OUTPUT, sorted.join('\n') + '\n');

  const methodRules = sorted.filter(rule => rule.includes('->')).length;
  console.log(
    `Wrote ${sorted.length} rules (${sorted.length - methodRules} classes, ${methodRules} methods) from ${collectedProfiles.map(p => path.relative(ROOT, p)).join(', ')} to ${path.relative(ROOT, OUTPUT)}`,
  );
}

function main() {
  const {
    values: {check: checkOnly, 'classes-jar': classesJar},
    positionals,
  } = parseArgs({
    allowPositionals: true,
    options: {
      check: {type: 'boolean', default: false},
      'classes-jar': {type: 'string', default: DEFAULT_CLASSES_JAR},
    },
  });
  if (!fs.existsSync(classesJar)) {
    throw new Error(
      `${classesJar} not found. Build ReactAndroid first with ./gradlew :packages:react-native:ReactAndroid:assembleRelease`,
    );
  }
  if (checkOnly) {
    check(classesJar);
  } else {
    update(
      positionals.length > 0 ? positionals : [findCollectedProfile()],
      classesJar,
    );
  }
}

main();
