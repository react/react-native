/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

// An app on disk for driving `setup-apple-spm.js` end to end: a plain Xcode
// project with a user-owned scheme, node_modules with one library of each kind
// the tooling treats differently, and two versions of local artifact slots.
// Lives beside the tests, not in __fixtures__, because jest.config.js hides
// scripts/**/__fixtures__/ from the module loader.

const {withProjectSetting} = require('./pbxproj-variants');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const plist = require('plist');

const REACT_NATIVE_ROOT = path.resolve(__dirname, '..', '..', '..');
const APP_DEPLOYMENT_TARGET = '16.4';
const ARTIFACT_VERSIONS = ['0.90.0', '0.90.1'];
const TARGET_UUID = 'AA0000000000000000000101';
const PLUGIN_FRAMEWORKS = ['AcmeHostKit', 'AcmeHostExtras'];

const USER_SCHEME = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1600"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${TARGET_UUID}"
               BuildableName = "MyApp.app"
               BlueprintName = "MyApp"
               ReferencedContainer = "container:MyApp.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <LaunchAction
      buildConfiguration = "Debug"
      launchStyle = "0">
   </LaunchAction>
</Scheme>
`;

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, contents);
}

function writeJson(file, value) {
  write(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFrameworkXcframework(dir, frameworkName, header) {
  const xcframework = path.join(dir, `${frameworkName}.xcframework`);
  const identifier = 'ios-arm64_x86_64-simulator';
  const framework = path.join(
    xcframework,
    identifier,
    `${frameworkName}.framework`,
  );
  write(path.join(framework, 'Headers', `${frameworkName}.h`), header);
  write(
    path.join(framework, 'Modules', 'module.modulemap'),
    `framework module ${frameworkName} {\n  umbrella header "${frameworkName}.h"\n  export *\n}\n`,
  );
  write(path.join(framework, frameworkName), 'not-a-real-mach-o');
  write(
    path.join(xcframework, 'Info.plist'),
    plist.build({
      CFBundlePackageType: 'XFWK',
      XCFrameworkFormatVersion: '1.0',
      AvailableLibraries: [
        {
          LibraryIdentifier: identifier,
          LibraryPath: `${frameworkName}.framework`,
          SupportedArchitectures: ['arm64', 'x86_64'],
          SupportedPlatform: 'ios',
          SupportedPlatformVariant: 'simulator',
        },
      ],
    }),
  );
  return xcframework;
}

function writeHeadersXcframework(dir, name, header) {
  const xcframework = path.join(dir, `${name}.xcframework`);
  const identifier = 'ios-arm64_x86_64-simulator';
  write(path.join(xcframework, identifier, 'Headers', `${name}.h`), header);
  write(
    path.join(xcframework, 'Info.plist'),
    plist.build({
      CFBundlePackageType: 'XFWK',
      XCFrameworkFormatVersion: '1.0',
      AvailableLibraries: [
        {
          LibraryIdentifier: identifier,
          LibraryPath: `lib${name}.a`,
          HeadersPath: 'Headers',
          SupportedArchitectures: ['arm64', 'x86_64'],
          SupportedPlatform: 'ios',
          SupportedPlatformVariant: 'simulator',
        },
      ],
    }),
  );
  return xcframework;
}

// One cache slot, as download-spm-artifacts.js leaves it. Headers carry the
// version so two versions differ, and are identical across flavors, which
// flavored-frameworks.js requires.
function writeArtifactSlot(dir, version) {
  const header = `// React Native ${version}\nvoid Header(void);\n`;
  const artifacts = {};
  for (const [artifactName, frameworkName] of [
    ['React', 'React'],
    ['ReactNativeDependencies', 'ReactNativeDependencies'],
    ['hermes-engine', 'hermesvm'],
  ]) {
    artifacts[artifactName] = {
      xcframeworkPath: writeFrameworkXcframework(dir, frameworkName, header),
    };
  }
  for (const name of ['ReactNativeHeaders', 'ReactNativeDependenciesHeaders']) {
    artifacts[name] = {
      xcframeworkPath: writeHeadersXcframework(dir, name, header),
    };
  }
  write(path.join(dir, 'hermes-headers', 'hermes', 'hermes.h'), header);
  writeJson(path.join(dir, 'artifacts.json'), artifacts);
}

// Prints the CLI config the way `@react-native-community/cli config` does, so
// the tooling runs its real config-command path. Relative to the app, so the
// command pinned into the injection marker names no machine path.
const AUTOLINKING_CONFIG_SCRIPT = `'use strict';
const path = require('path');
const root = __dirname;
const lib = (name, ios = {}) => {
  const libRoot = path.join(root, 'node_modules', name);
  return {name, root: libRoot, platforms: {ios}};
};
const config = {
  root,
  reactNativePath: path.join(root, 'node_modules', 'react-native'),
  project: {ios: {sourceDir: path.join(root, 'ios')}},
  dependencies: {
    'react-native-acme-native': lib('react-native-acme-native'),
    'react-native-acme-widgets': lib('react-native-acme-widgets', {
      podspecPath: path.join(
        root,
        'node_modules',
        'react-native-acme-widgets',
        'react-native-acme-widgets.podspec',
      ),
    }),
    '@acme/react-native-scoped': lib('@acme/react-native-scoped'),
    'react-native-acme-host': lib('react-native-acme-host'),
  },
};
process.stdout.write(JSON.stringify(config, null, 2));
`;

const PLUGIN_SCRIPT = `'use strict';
const fs = require('fs');
const path = require('path');
// Read at call time: Jest caches this module, and the tests change the list.
module.exports = function plugin() {
  const names = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'frameworks.json'), 'utf8'),
  );
  const prebuilt = flavor => name =>
    path.join(__dirname, 'prebuilt', flavor, name + '.xcframework');
  return {
    flavoredFrameworks: names.map(name => ({
      id: name,
      frameworkName: name,
      linkage: 'dynamic',
      flavors: {debug: prebuilt('debug')(name), release: prebuilt('release')(name)},
    })),
    watchPaths: [path.join(__dirname, 'precompiled')],
  };
};
`;

function writeLibraries(nodeModules) {
  // (a) Ships its own Package.swift. The .swiftpm/xcuserdata Xcode keeps in a
  // package root it opened exists before the first sync, as it does for real.
  const selfManaged = path.join(nodeModules, 'react-native-acme-native');
  writeJson(path.join(selfManaged, 'package.json'), {
    name: 'react-native-acme-native',
    version: '1.0.0',
    swiftpmConfig: {name: 'AcmeNative'},
  });
  write(
    path.join(selfManaged, 'Package.swift'),
    `// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "AcmeNative",
    platforms: [.iOS(.v15)],
    products: [.library(name: "AcmeNative", targets: ["AcmeNative"])],
    targets: [.target(name: "AcmeNative", path: "ios")]
)
`,
  );
  write(path.join(selfManaged, 'ios', 'AcmeNative.m'), '');
  fs.mkdirSync(path.join(selfManaged, '.swiftpm', 'xcuserdata'), {
    recursive: true,
  });

  // (b) Podspec only, whose module_name is not derivable from the npm name.
  const podspecOnly = path.join(nodeModules, 'react-native-acme-widgets');
  writeJson(path.join(podspecOnly, 'package.json'), {
    name: 'react-native-acme-widgets',
    version: '1.0.0',
  });
  write(
    path.join(podspecOnly, 'react-native-acme-widgets.podspec'),
    `Pod::Spec.new do |s|
  s.name = "react-native-acme-widgets"
  s.module_name = "AcmeWidgets"
  s.version = "1.0.0"
  s.platforms = { :ios => "13.4" }
  s.source_files = "ios/**/*.{h,m,mm}"
  s.dependency "React-Core"
end
`,
  );
  write(path.join(podspecOnly, 'ios', 'AcmeWidgets.h'), '');
  write(path.join(podspecOnly, 'ios', 'AcmeWidgets.m'), '');

  // (c) Scoped npm name, manifest under ios/, Swift name derived from npm.
  const scoped = path.join(nodeModules, '@acme', 'react-native-scoped');
  writeJson(path.join(scoped, 'package.json'), {
    name: '@acme/react-native-scoped',
    version: '1.0.0',
  });
  write(
    path.join(scoped, 'ios', 'Package.swift'),
    `// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ReactNativeScoped",
    platforms: [.iOS(.v15)],
    products: [.library(name: "ReactNativeScoped", targets: ["ReactNativeScoped"])],
    targets: [.target(name: "ReactNativeScoped", path: "Sources")]
)
`,
  );
  write(path.join(scoped, 'ios', 'Sources', 'Scoped.swift'), '');

  // (d) Autolinking plugin host with precompiled flavored frameworks.
  const pluginHost = path.join(nodeModules, 'react-native-acme-host');
  writeJson(path.join(pluginHost, 'package.json'), {
    name: 'react-native-acme-host',
    version: '1.0.0',
    swiftpmConfig: {autolinkingPlugin: './spm-plugin.js'},
  });
  write(path.join(pluginHost, 'spm-plugin.js'), PLUGIN_SCRIPT);
  for (const flavor of ['debug', 'release']) {
    for (const name of PLUGIN_FRAMEWORKS) {
      writeFrameworkXcframework(
        path.join(pluginHost, 'prebuilt', flavor),
        name,
        `void ${name}(void);\n`,
      );
    }
  }

  return {selfManaged, podspecOnly, scoped, pluginHost};
}

// A stand-in for `node` on PATH while the scheme pre-action runs: it answers
// the pre-action's react-native lookup for real and only records the sync
// dispatch, so a test sees the stale-check verdict without a second sync.
function writeFakeNode(toolsDir) {
  const dispatchLog = path.join(toolsDir, 'dispatched-sync.log');
  write(
    path.join(toolsDir, 'node'),
    `#!/bin/sh
if [ "$1" = "--print" ]; then
  exec "${process.execPath}" "$@"
fi
echo "$*" >> "${dispatchLog}"
`,
  );
  fs.chmodSync(path.join(toolsDir, 'node'), 0o755);
  return dispatchLog;
}

/**
 * Lays out the app in a fresh temp dir. The caller owns cleanup().
 */
function createSpmFixtureApp() {
  const createdRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-lifecycle-'));
  const tmpRoot = fs.realpathSync(createdRoot);
  const projectRoot = path.join(tmpRoot, 'app');
  const appRoot = path.join(projectRoot, 'ios');
  const xcodeprojPath = path.join(appRoot, 'MyApp.xcodeproj');
  const nodeModules = path.join(projectRoot, 'node_modules');
  const toolsDir = path.join(tmpRoot, 'tools');

  writeJson(path.join(projectRoot, 'package.json'), {
    name: 'my-app',
    version: '0.0.1',
    private: true,
  });
  write(
    path.join(projectRoot, 'autolinking-config.js'),
    AUTOLINKING_CONFIG_SCRIPT,
  );
  write(
    path.join(xcodeprojPath, 'project.pbxproj'),
    withProjectSetting(
      fs.readFileSync(
        path.join(__dirname, '__fixtures__', 'plain-app.pbxproj'),
        'utf8',
      ),
      APP_DEPLOYMENT_TARGET,
    ),
  );
  write(
    path.join(xcodeprojPath, 'xcshareddata', 'xcschemes', 'MyApp.xcscheme'),
    USER_SCHEME,
  );
  write(path.join(appRoot, 'MyApp', 'AppDelegate.swift'), '');

  fs.mkdirSync(nodeModules, {recursive: true});
  fs.symlinkSync(REACT_NATIVE_ROOT, path.join(nodeModules, 'react-native'));
  const libs = writeLibraries(nodeModules);
  const pluginFrameworksFile = path.join(libs.pluginHost, 'frameworks.json');
  writeJson(pluginFrameworksFile, PLUGIN_FRAMEWORKS.slice(0, 1));

  const artifactsDirs = {};
  for (const version of ARTIFACT_VERSIONS) {
    const dir = path.join(tmpRoot, 'artifacts', version);
    writeArtifactSlot(path.join(dir, 'debug'), version);
    writeArtifactSlot(path.join(dir, 'release'), version);
    artifactsDirs[version] = dir;
  }

  return {
    projectRoot,
    appRoot,
    xcodeprojPath,
    pbxprojPath: path.join(xcodeprojPath, 'project.pbxproj'),
    schemePath: path.join(
      xcodeprojPath,
      'xcshareddata',
      'xcschemes',
      'MyApp.xcscheme',
    ),
    markerPath: path.join(xcodeprojPath, '.spm-injected.json'),
    configCommand: ['node', 'autolinking-config.js'],
    artifactsDirs,
    libs,
    absentPluginWatchPath: path.join(libs.pluginHost, 'precompiled'),
    toolsDir,
    dispatchLog: writeFakeNode(toolsDir),
    forbiddenPaths: [
      ...new Set([tmpRoot, createdRoot, os.homedir(), REACT_NATIVE_ROOT]),
    ].filter(p => p !== path.parse(p).root),
    setPluginFrameworks(names) {
      writeJson(pluginFrameworksFile, names);
    },
    cleanup() {
      fs.rmSync(tmpRoot, {recursive: true, force: true});
    },
  };
}

module.exports = {
  APP_DEPLOYMENT_TARGET,
  ARTIFACT_VERSIONS,
  PLUGIN_FRAMEWORKS,
  REACT_NATIVE_ROOT,
  createSpmFixtureApp,
};
