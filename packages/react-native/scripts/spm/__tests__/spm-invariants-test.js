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

const {checkSpmInvariants} = require('./spm-invariants');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PBXPROJ = 'MyApp.xcodeproj/project.pbxproj';
const MARKER = 'MyApp.xcodeproj/.spm-injected.json';
const SCHEME = 'MyApp.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme';
const AUTOLINKED = 'build/generated/autolinking/Package.swift';
const XCFRAMEWORKS = 'build/xcframeworks/Package.swift';
const CODEGEN = 'build/generated/ios/Package.swift';
const SCAFFOLDED = '../node_modules/react-native-acme-widgets/Package.swift';
const XCCONFIG = 'ReactNative.xcconfig';

const GOOD_FILES = {
  [PBXPROJ]: `// !$*UTF8*$!
{
	archiveVersion = 1;
	objects = {
		AA0000000000000000000001 /* Project object */ = {
			isa = PBXProject;
			targets = (
				AA0000000000000000000002 /* MyApp */,
			);
		};
		AA0000000000000000000002 /* MyApp */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = AA0000000000000000000003;
			buildPhases = (
				AA0000000000000000000005 /* Embed React Native Flavored Frameworks */,
			);
			name = MyApp;
		};
		AA0000000000000000000003 = {
			isa = XCConfigurationList;
			buildConfigurations = (
				AA0000000000000000000004 /* Debug */,
			);
		};
		AA0000000000000000000004 /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				REACT_NATIVE_PATH = "../node_modules/react-native";
				"RN_SPM_REACT_FRAMEWORK[sdk=iphonesimulator*]" = "$(SRCROOT)/build/xcframeworks/React.framework";
				OTHER_LDFLAGS = (
					"$(inherited)",
					"$(RN_SPM_REACT_BINARY)",
				);
			};
			name = Debug;
		};
		AA0000000000000000000005 /* Embed React Native Flavored Frameworks */ = {
			isa = PBXShellScriptBuildPhase;
			inputPaths = (
				"$(RN_SPM_REACT_FRAMEWORK)",
			);
			outputPaths = (
				"$(TARGET_BUILD_DIR)/$(FRAMEWORKS_FOLDER_PATH)/React.framework",
			);
			shellPath = /bin/bash;
			shellScript = "set -euo pipefail\\n/usr/bin/rsync -a \\"$SOURCE/\\" \\"$DESTINATION/\\" 2>/dev/null\\n";
		};
	};
	rootObject = AA0000000000000000000001 /* Project object */;
}
`,
  [MARKER]: `${JSON.stringify(
    {
      rootUuid: 'AA0000000000000000000001',
      linkedFrameworks: [{id: 'react', frameworkName: 'React'}],
      configCommand: ['node', 'autolinking-config.js'],
      scheme: {file: 'MyApp.xcscheme', created: false},
    },
    null,
    2,
  )}\n`,
  [SCHEME]: `<?xml version="1.0" encoding="UTF-8"?>
<Scheme version = "1.7">
   <BuildAction>
      <PreActions>
         <ExecutionAction>
            <ActionContent
               title = "Sync SPM Autolinking"
               scriptText = "set -euo pipefail&#10;&#10;# Resolve node.&#10;NODE_BINARY=&quot;$(command -v node 2&gt;/dev/null)&quot;&#10;"
               shellToInvoke = "/bin/bash">
            </ActionContent>
         </ExecutionAction>
      </PreActions>
   </BuildAction>
</Scheme>
`,
  [AUTOLINKED]: `// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Autolinked",
    platforms: [.iOS("16.4")],
    products: [
        .library(name: "Autolinked", targets: ["AutolinkedAggregate"]),
    ],
    dependencies: [
        .package(name: "AcmeWidgets", path: "libs/AcmeWidgets"),
        .package(path: "../ios"),
    ],
    targets: [
        .target(
            name: "AutolinkedAggregate",
            dependencies: [.product(name: "AcmeWidgets", package: "AcmeWidgets"), .product(name: "ReactAppHeaders", package: "ios"), .target(name: "AutolinkedHelper")],
            path: "AutolinkedAggregate"
        ),
        .target(name: "AutolinkedHelper", path: "AutolinkedHelper"),
    ]
)
`,
  [XCFRAMEWORKS]: `// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ReactNative",
    products: [
        .library(name: "ReactNativeHeaders", targets: ["ReactNativeHeaders"]),
    ],
    targets: [
        .binaryTarget(name: "ReactNativeHeaders", path: "ReactNativeHeaders.xcframework"),
    ]
)
`,
  [CODEGEN]: `// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "React-GeneratedCode",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "ReactAppHeaders", targets: ["ReactAppHeaders"]),
    ],
    targets: [
        .target(name: "ReactAppHeaders", path: "ReactAppHeaders"),
    ]
)
`,
  [SCAFFOLDED]: `// swift-tools-version: 6.0
// AUTO-SCAFFOLDED by react-native spm scaffold — safe to edit & commit via patch-package.
import PackageDescription

let package = Package(
    name: "AcmeWidgets",
    platforms: [.iOS("16.4")],
    products: [
        .library(name: "AcmeWidgets", targets: ["AcmeWidgets"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
    ],
    targets: [
        .target(
            name: "AcmeWidgets",
            dependencies: [.product(name: "ReactNativeHeaders", package: "ReactNative")],
            path: "."
        ),
    ]
)
`,
};

/** `from` must occur in the file, so an edit can never silently miss. */
function edit(file, from, to) {
  const original = GOOD_FILES[file];
  if (!original.includes(from)) {
    throw new Error(`${file} does not contain ${JSON.stringify(from)}`);
  }
  return {[file]: original.replace(from, to)};
}

describe('checkSpmInvariants', () => {
  let root;

  beforeEach(() => {
    root = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'spm-invariants-')),
    );
  });

  afterEach(() => fs.rmSync(root, {recursive: true, force: true}));

  // Lays out GOOD_FILES (with `overrides`; null deletes a file) and runs the
  // checker. The scaffolded manifest is reached the way the tooling links it:
  // through the build/generated/autolinking/libs/ alias of the library.
  function check(overrides = {}, options = {}) {
    const appRoot = path.join(root, 'ios');
    const files = {...GOOD_FILES, ...overrides};
    for (const [file, contents] of Object.entries(files)) {
      if (contents == null) {
        continue;
      }
      const filePath = path.join(appRoot, file);
      fs.mkdirSync(path.dirname(filePath), {recursive: true});
      fs.writeFileSync(filePath, contents);
    }
    const libs = path.join(appRoot, 'build/generated/autolinking/libs');
    fs.mkdirSync(libs, {recursive: true});
    fs.symlinkSync(
      path.join(root, 'node_modules', 'react-native-acme-widgets'),
      path.join(libs, 'AcmeWidgets'),
    );
    return checkSpmInvariants({
      appRoot,
      xcodeprojPath: path.join(appRoot, 'MyApp.xcodeproj'),
      expectedDeploymentTarget: '16.4',
      forbiddenPaths: [root, '/Users/someone'],
      ...options,
    });
  }

  function violation(rule, file) {
    return expect.objectContaining({rule, file, detail: expect.any(String)});
  }

  it('reports nothing for a well-formed injected project', () => {
    expect(check()).toEqual([]);
  });

  describe('R1: no machine paths in committed outputs', () => {
    it('reports a build setting with an absolute value', () => {
      expect(
        check(
          edit(
            PBXPROJ,
            'REACT_NATIVE_PATH = "../node_modules/react-native";',
            'HERMES_CLI_PATH = "/opt/hermes-compiler/hermesc/osx-bin/hermesc";',
          ),
        ),
      ).toEqual([violation('machine-path', PBXPROJ)]);
    });

    it('reports an absolute entry of an array build setting', () => {
      expect(
        check(edit(PBXPROJ, '"$(RN_SPM_REACT_BINARY)",', '/opt/React,')),
      ).toEqual([violation('machine-path', PBXPROJ)]);
    });

    it('reports the temp root inside a relative-looking value', () => {
      expect(
        check(
          edit(
            PBXPROJ,
            '"../node_modules/react-native"',
            `"$(SRCROOT)${root}/node_modules/react-native"`,
          ),
        ),
      ).toEqual([violation('machine-path', PBXPROJ)]);
    });

    it('reports a home directory baked into a scheme pre-action', () => {
      expect(
        check(
          edit(
            SCHEME,
            '# Resolve node.&#10;',
            'RN_DIR=&quot;/Users/someone/app/node_modules/react-native&quot;&#10;',
          ),
        ),
      ).toEqual([violation('machine-path', SCHEME)]);
    });

    it('reports an absolute path in pbxproj script text that is not an allowlisted system tool', () => {
      expect(
        check(edit(PBXPROJ, '/usr/bin/rsync', '/opt/homebrew/bin/rsync')),
      ).toEqual([violation('machine-path', PBXPROJ)]);
    });

    it('allows the system tools React Native pins by absolute path', () => {
      expect(
        check(edit(PBXPROJ, '2>/dev/null', '&& /usr/bin/codesign --verify')),
      ).toEqual([]);
    });

    it('reports an absolute path recorded in the marker', () => {
      expect(check(edit(MARKER, '"node",', '"/usr/local/bin/node",'))).toEqual([
        violation('machine-path', MARKER),
      ]);
    });

    it('reports an absolute value in an xcconfig the tool writes', () => {
      expect(
        check({[XCCONFIG]: 'REACT_NATIVE_PATH = /opt/react-native\n'}),
      ).toEqual([violation('machine-path', XCCONFIG)]);
    });

    it('reports a missing pbxproj', () => {
      expect(check({[PBXPROJ]: null})).toEqual(
        expect.arrayContaining([violation('machine-path', PBXPROJ)]),
      );
    });

    it('reports a missing marker', () => {
      expect(check({[MARKER]: null})).toEqual(
        expect.arrayContaining([violation('machine-path', MARKER)]),
      );
    });
  });

  describe('R2: the scheme pre-action keeps its line breaks', () => {
    it('reports a script written with raw line breaks, which XML reads as spaces', () => {
      expect(
        check(
          edit(
            SCHEME,
            'set -euo pipefail&#10;&#10;# Resolve node.&#10;',
            'set -euo pipefail\n\n# Resolve node.\n',
          ),
        ),
      ).toEqual([violation('scheme-script', SCHEME)]);
    });

    it('reports a script whose body after the first line is all comment', () => {
      expect(
        check(
          edit(
            SCHEME,
            'NODE_BINARY=&quot;$(command -v node 2&gt;/dev/null)&quot;&#10;',
            '# NODE_BINARY=&quot;$(command -v node)&quot;&#10;',
          ),
        ),
      ).toEqual([violation('scheme-script', SCHEME)]);
    });

    it('reports a scheme that is not well-formed XML', () => {
      expect(check(edit(SCHEME, '</Scheme>', ''))).toEqual([
        violation('scheme-script', SCHEME),
      ]);
    });

    it('ignores a pre-action that React Native did not add', () => {
      expect(
        check(
          edit(
            SCHEME,
            '</PreActions>',
            `   <ExecutionAction>
            <ActionContent title = "Say hi" scriptText = "echo hi">
            </ActionContent>
         </ExecutionAction>
      </PreActions>`,
          ),
        ),
      ).toEqual([]);
    });

    it('reports a project with no scheme carrying the sync pre-action', () => {
      expect(check({[SCHEME]: null})).toEqual([
        violation('scheme-script', 'MyApp.xcodeproj/xcshareddata/xcschemes'),
      ]);
    });
  });

  describe('R3: Package.swift names are unique and resolve', () => {
    it('reports a duplicated target name', () => {
      expect(
        check(
          edit(
            AUTOLINKED,
            '.target(name: "AutolinkedHelper", path: "AutolinkedHelper"),',
            '.target(name: "AutolinkedHelper", path: "AutolinkedHelper"),\n        .target(name: "AutolinkedHelper", path: "Other"),',
          ),
        ),
      ).toEqual([violation('package-names', AUTOLINKED)]);
    });

    it('reports target names that differ only in case', () => {
      expect(
        check(
          edit(
            AUTOLINKED,
            '.target(name: "AutolinkedHelper", path: "AutolinkedHelper"),',
            '.target(name: "AutolinkedHelper", path: "AutolinkedHelper"),\n        .target(name: "autolinkedhelper", path: "Other"),',
          ),
        ),
      ).toEqual([violation('package-names', AUTOLINKED)]);
    });

    it('reports product names that differ only in case', () => {
      expect(
        check(
          edit(
            XCFRAMEWORKS,
            '.library(name: "ReactNativeHeaders", targets: ["ReactNativeHeaders"]),',
            '.library(name: "ReactNativeHeaders", targets: ["ReactNativeHeaders"]),\n        .library(name: "reactnativeheaders", targets: ["ReactNativeHeaders"]),',
          ),
        ),
      ).toEqual([violation('package-names', XCFRAMEWORKS)]);
    });

    it('reports a target name that is not a C99 identifier', () => {
      expect(
        check(
          edit(
            SCAFFOLDED,
            '.target(\n            name: "AcmeWidgets",',
            '.target(\n            name: "acme-widgets",',
          ),
        ),
      ).toEqual([
        expect.objectContaining({
          rule: 'package-names',
          file: SCAFFOLDED,
          detail: expect.stringContaining('not a C99 identifier'),
        }),
        expect.objectContaining({
          rule: 'package-names',
          file: SCAFFOLDED,
          detail: expect.stringContaining('lists target "AcmeWidgets"'),
        }),
      ]);
    });

    it('reports a product name that is not a C99 identifier', () => {
      expect(
        check(
          edit(
            SCAFFOLDED,
            '.library(name: "AcmeWidgets",',
            '.library(name: "Acme Widgets",',
          ),
        ),
      ).toEqual([
        violation('package-names', AUTOLINKED),
        violation('package-names', SCAFFOLDED),
      ]);
    });

    it('reports a target dependency on a target the package does not declare', () => {
      expect(
        check(
          edit(
            AUTOLINKED,
            '.target(name: "AutolinkedHelper")]',
            '.target(name: "AutolinkedMissing")]',
          ),
        ),
      ).toEqual([violation('package-names', AUTOLINKED)]);
    });

    it('reports a product from a package the manifest does not depend on', () => {
      expect(
        check(
          edit(
            AUTOLINKED,
            'package: "AcmeWidgets")',
            'package: "AcmeWidgetsPackage")',
          ),
        ),
      ).toEqual([violation('package-names', AUTOLINKED)]);
    });

    it('reports a product that its path package does not declare', () => {
      expect(
        check(
          edit(
            AUTOLINKED,
            '.product(name: "AcmeWidgets", package: "AcmeWidgets")',
            '.product(name: "AcmeWidgetsKit", package: "AcmeWidgets")',
          ),
        ),
      ).toEqual([violation('package-names', AUTOLINKED)]);
    });

    it('resolves a scaffolded manifest path package from its libs/ alias', () => {
      expect(
        check(
          edit(
            SCAFFOLDED,
            '.product(name: "ReactNativeHeaders", package: "ReactNative")',
            '.product(name: "ReactNativeDependenciesHeaders", package: "ReactNative")',
          ),
        ),
      ).toEqual([violation('package-names', SCAFFOLDED)]);
    });

    it('reports a path package that has no Package.swift', () => {
      expect(
        check(
          edit(
            AUTOLINKED,
            '.package(path: "../ios"),',
            '.package(name: "ios", path: "../nowhere"),',
          ),
        ),
      ).toEqual([violation('package-names', AUTOLINKED)]);
    });

    it('reports a product that lists a target the package does not declare', () => {
      expect(
        check(
          edit(
            XCFRAMEWORKS,
            'targets: ["ReactNativeHeaders"]',
            'targets: ["ReactNativeHeaders", "ReactNativeMissing"]',
          ),
        ),
      ).toEqual([violation('package-names', XCFRAMEWORKS)]);
    });

    it('resolves a package by the last component of its url', () => {
      expect(
        check(
          edit(
            SCAFFOLDED,
            '.package(name: "ReactNative", path: "../../../../xcframeworks"),',
            '.package(url: "https://github.com/acme/ReactNative.git", exact: "0.90.0"),',
          ),
        ),
      ).toEqual([]);
    });

    it('reports a missing generated manifest', () => {
      expect(check({[XCFRAMEWORKS]: null})).toEqual([
        violation('package-names', XCFRAMEWORKS),
        violation('package-names', SCAFFOLDED),
      ]);
    });
  });

  describe('R4: generated manifests declare the app deployment target', () => {
    it('reports a generated manifest with a different floor', () => {
      expect(check(edit(AUTOLINKED, '.iOS("16.4")', '.iOS("15.1")'))).toEqual([
        violation('deployment-target', AUTOLINKED),
      ]);
    });

    it('reports a scaffolded manifest with a different floor', () => {
      expect(check(edit(SCAFFOLDED, '.iOS("16.4")', '.iOS(.v16)'))).toEqual([
        violation('deployment-target', SCAFFOLDED),
      ]);
    });

    it('reports a required manifest it did not check', () => {
      const unmarked = edit(
        SCAFFOLDED,
        '// AUTO-SCAFFOLDED by react-native spm scaffold — safe to edit & commit via patch-package.\n',
        '',
      );
      expect(check(unmarked, {requiredManifests: [SCAFFOLDED]})).toEqual([
        violation('deployment-target', SCAFFOLDED),
      ]);
    });

    it('reports a required manifest that declares no floor', () => {
      expect(
        check(edit(SCAFFOLDED, '    platforms: [.iOS("16.4")],\n', ''), {
          requiredManifests: [SCAFFOLDED],
        }),
      ).toEqual([violation('deployment-target', SCAFFOLDED)]);
    });

    it('treats a trailing .0 as the same version', () => {
      expect(check({}, {expectedDeploymentTarget: '16.4.0'})).toEqual([]);
    });

    it('reports an autolinked manifest that declares no floor', () => {
      expect(
        check(edit(AUTOLINKED, '    platforms: [.iOS("16.4")],\n', '')),
      ).toEqual([violation('deployment-target', AUTOLINKED)]);
    });

    it('reports a missing autolinked manifest', () => {
      expect(check({[AUTOLINKED]: null})).toEqual(
        expect.arrayContaining([violation('deployment-target', AUTOLINKED)]),
      );
    });

    it('reports a codegen manifest whose floor is above the app', () => {
      expect(check(edit(CODEGEN, '.iOS(.v15)', '.iOS(.v17)'))).toEqual([
        violation('deployment-target', CODEGEN),
      ]);
    });

    it('accepts a codegen manifest whose floor is below the app', () => {
      expect(check()).toEqual([]);
    });

    it('accepts a codegen manifest whose floor equals the app', () => {
      expect(check(edit(CODEGEN, '.iOS(.v15)', '.iOS(.v16_4)'))).toEqual([]);
    });

    it('compares codegen floors by component, not as text', () => {
      expect(check(edit(CODEGEN, '.iOS(.v15)', '.iOS("16.10")'))).toEqual([
        violation('deployment-target', CODEGEN),
      ]);
    });

    it('reports a codegen manifest that declares no floor', () => {
      expect(
        check(edit(CODEGEN, '    platforms: [.iOS(.v15)],\n', '')),
      ).toEqual([violation('deployment-target', CODEGEN)]);
    });

    it('reports a codegen manifest whose floor does not parse', () => {
      expect(check(edit(CODEGEN, '.iOS(.v15)', '.iOS(someFloor)'))).toEqual([
        violation('deployment-target', CODEGEN),
      ]);
    });
  });

  describe('R5: the pbxproj is well-formed and agrees with the marker', () => {
    it('reports unbalanced delimiters', () => {
      expect(
        check(edit(PBXPROJ, '\trootObject', '\t};\n\trootObject')),
      ).toEqual([violation('pbxproj-integrity', PBXPROJ)]);
    });

    it('reports a reference to an object that is not defined', () => {
      expect(
        check(
          edit(
            PBXPROJ,
            'AA0000000000000000000005 /* Embed React Native Flavored Frameworks */,',
            'AA0000000000000000000005 /* Embed React Native Flavored Frameworks */,\n\t\t\t\tAA00000000000000000000FF /* Sync SPM Autolinking */,',
          ),
        ),
      ).toEqual([violation('pbxproj-integrity', PBXPROJ)]);
    });

    it('ignores object ids that only appear inside strings and comments', () => {
      expect(
        check(
          edit(
            PBXPROJ,
            'name = MyApp;',
            'name = MyApp; /* BB0000000000000000000001 */\n\t\t\tcomment = "BB0000000000000000000002";',
          ),
        ),
      ).toEqual([]);
    });

    it('reports a framework the marker records but the pbxproj does not embed', () => {
      expect(
        check(
          edit(
            MARKER,
            '{\n      "id": "react",\n      "frameworkName": "React"\n    }',
            '{\n      "id": "react",\n      "frameworkName": "React"\n    },\n    {\n      "id": "AcmeHostKit",\n      "frameworkName": "AcmeHostKit"\n    }',
          ),
        ),
      ).toEqual([violation('pbxproj-integrity', MARKER)]);
    });

    it('reports a framework the pbxproj embeds under an id the marker does not record', () => {
      expect(
        check(edit(MARKER, '"id": "react"', '"id": "react-core"')),
      ).toEqual([violation('pbxproj-integrity', MARKER)]);
    });

    it('reports a missing marker', () => {
      expect(check({[MARKER]: null})).toEqual(
        expect.arrayContaining([violation('pbxproj-integrity', MARKER)]),
      );
    });
  });
});
