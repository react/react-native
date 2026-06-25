/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*::
export type PodSpecConfiguration = Readonly<{
  name: string,
  headerPatterns: Array<string>,
  headerDir?: string,
  excludePatterns?: Array<string>,
  subSpecs?: ReadonlyArray<PodSpecConfiguration>,
  preservePaths?: Array<string>,
} | {disabled: true}>;
*/

const PodspecExceptions /*: {[key: string]: PodSpecConfiguration} */ = {
  'ReactCommon/jsi/React-jsi.podspec': {
    name: 'React-jsi',
    headerPatterns: ['**/*.h'],
    headerDir: 'jsi',
    excludePatterns: ['**/test/*'],
  },
  'ReactCommon/hermes/React-hermes.podspec': {
    name: 'React-hermes',
    headerPatterns: [
      'executor/*.h',
      'inspector-modern/chrome/*.h',
      'executor/HermesExecutorFactory.h',
    ],
    headerDir: 'reacthermes',
  },
  'ReactCommon/React-Fabric.podspec': {
    name: 'React-Fabric',
    headerPatterns: [],
    headerDir: '',
    subSpecs: [
      {
        name: 'animated',
        headerPatterns: ['react/renderer/animated/**/*.h'],
        excludePatterns: ['react/renderer/animated/tests'],
        headerDir: 'react/renderer/animated',
      },

      {
        name: 'animations',
        headerPatterns: ['react/renderer/animations/**/*.h'],
        excludePatterns: ['react/renderer/animations/tests'],
        headerDir: 'react/renderer/animations',
      },

      {
        name: 'animationbackend',
        headerPatterns: ['react/renderer/animationbackend/**/*.h'],
        headerDir: 'react/renderer/animationbackend',
      },

      {
        name: 'attributedstring',
        headerPatterns: ['react/renderer/attributedstring/**/*.h'],
        excludePatterns: ['react/renderer/attributedstring/tests'],
        headerDir: 'react/renderer/attributedstring',
      },

      {
        name: 'bridging',
        headerPatterns: ['react/renderer/bridging/**/*.h'],
        excludePatterns: ['react/renderer/bridging/tests'],
        headerDir: 'react/renderer/bridging',
      },

      {
        name: 'core',
        headerPatterns: ['react/renderer/core/**/*.h'],
        excludePatterns: ['react/renderer/core/tests'],
        headerDir: 'react/renderer/core',
      },

      {
        name: 'componentregistry',
        headerPatterns: ['react/renderer/componentregistry/*.h'],
        headerDir: 'react/renderer/componentregistry',
      },

      {
        name: 'componentregistrynative',
        headerPatterns: ['react/renderer/componentregistry/native/**/*.h'],
        headerDir: 'react/renderer/componentregistry/native',
      },

      {
        name: 'components',
        headerPatterns: [],
        headerDir: '',
        subSpecs: [
          {
            name: 'root',
            headerPatterns: ['react/renderer/components/root/**/*.h'],
            excludePatterns: ['react/renderer/components/root/tests'],
            headerDir: 'react/renderer/components/root',
          },
          {
            name: 'view',
            headerPatterns: [
              'react/renderer/components/view/*.h',
              'react/renderer/components/view/platform/cxx/**/*.h',
            ],
            headerDir: 'react/renderer/components/view',
          },

          {
            name: 'scrollview',
            headerPatterns: ['react/renderer/components/scrollview/**/*.h'],
            headerDir: 'react/renderer/components/scrollview',
            excludePatterns: [
              'react/renderer/components/scrollview/tests',
              'react/renderer/components/scrollview/platform/android',
            ],
          },

          {
            name: 'legacyviewmanagerinterop',
            headerPatterns: [
              'react/renderer/components/legacyviewmanagerinterop/**/*.h',
            ],
            excludePatterns: [
              'react/renderer/components/legacyviewmanagerinterop/tests',
            ],
            headerDir: 'react/renderer/components/legacyviewmanagerinterop',
          },
        ],
      },

      {
        name: 'dom',
        headerPatterns: ['react/renderer/dom/**/*.h'],
        excludePatterns: ['react/renderer/dom/tests'],
        headerDir: 'react/renderer/dom',
      },

      {
        name: 'scheduler',
        headerPatterns: ['react/renderer/scheduler/**/*.h'],
        headerDir: 'react/renderer/scheduler',
      },

      {
        name: 'imagemanager',
        headerPatterns: ['react/renderer/imagemanager/*.h'],
        headerDir: 'react/renderer/imagemanager',
      },

      {
        name: 'mounting',
        headerPatterns: ['react/renderer/mounting/**/*.h'],
        excludePatterns: ['react/renderer/mounting/tests'],
        headerDir: 'react/renderer/mounting',
      },

      {
        name: 'observers',
        headerPatterns: [],
        subSpecs: [
          {
            name: 'events',
            headerPatterns: ['react/renderer/observers/events/**/*.h'],
            excludePatterns: ['react/renderer/observers/events/tests'],
            headerDir: 'react/renderer/observers/events',
          },
        ],
      },

      {
        name: 'templateprocessor',
        headerPatterns: ['react/renderer/templateprocessor/**/*.h'],
        excludePatterns: ['react/renderer/templateprocessor/tests'],
        headerDir: 'react/renderer/templateprocessor',
      },

      {
        name: 'telemetry',
        headerPatterns: ['react/renderer/telemetry/**/*.h'],
        excludePatterns: ['react/renderer/telemetry/tests'],
        headerDir: 'react/renderer/telemetry',
      },

      {
        name: 'consistency',
        headerPatterns: ['react/renderer/consistency/**/*.h'],
        headerDir: 'react/renderer/consistency',
      },

      {
        name: 'uimanager',
        subSpecs: [
          {
            name: 'consistency',
            headerPatterns: ['react/renderer/uimanager/consistency/*.h'],
            headerDir: 'react/renderer/uimanager/consistency',
          },
        ],

        headerPatterns: ['react/renderer/uimanager/*.h'],
        headerDir: 'react/renderer/uimanager',
      },

      {
        name: 'leakchecker',
        headerPatterns: ['react/renderer/leakchecker/**/*.h'],
        excludePatterns: ['react/renderer/leakchecker/tests'],
        headerDir: 'react/renderer/leakchecker',
      },

      {
        name: 'viewtransition',
        headerPatterns: ['react/renderer/viewtransition/**/*.h'],
        headerDir: 'react/renderer/viewtransition',
      },
    ],
  },
  // Yoga should preserve its directory structure
  'ReactCommon/yoga/Yoga.podspec': {
    name: 'Yoga',
    headerPatterns: ['yoga/**/*.h'],
    headerDir: 'yoga',
    preservePaths: ['yoga/**/*.h'],
  },

  // ReactCommon.podspec has multiple subspecs with different header_dir values
  // that the generic parser cannot handle (it only extracts the first header_dir).
  'ReactCommon/ReactCommon.podspec': {
    name: 'ReactCommon',
    headerPatterns: [],
    headerDir: 'ReactCommon',
    subSpecs: [
      {
        name: 'bridging',
        headerPatterns: ['react/bridging/**/*.h'],
        excludePatterns: ['react/bridging/tests/**'],
        headerDir: 'react/bridging',
      },
      {
        name: 'core',
        headerPatterns: ['react/nativemodule/core/ReactCommon/**/*.h'],
        headerDir: 'ReactCommon',
      },
    ],
  },

  // these podspecs set `header_dir` via Ruby variables, which the generic
  // podspec parser cannot infer. Add explicit exceptions so headers are emitted under
  // the expected `jsinspector-modern/...` include paths.
  'React/Runtime/React-RCTRuntime.podspec': {
    name: 'React-RCTRuntime',
    headerPatterns: ['*.h'],
    headerDir: 'React',
  },

  'ReactCommon/jsinspector-modern/React-jsinspector.podspec': {
    name: 'React-jsinspector',
    headerPatterns: ['*.h'],
    headerDir: 'jsinspector-modern',
  },
  'ReactCommon/jsinspector-modern/cdp/React-jsinspectorcdp.podspec': {
    name: 'React-jsinspectorcdp',
    headerPatterns: ['*.h'],
    headerDir: 'jsinspector-modern/cdp',
  },
  'ReactCommon/jsinspector-modern/network/React-jsinspectornetwork.podspec': {
    name: 'React-jsinspectornetwork',
    headerPatterns: ['*.h'],
    headerDir: 'jsinspector-modern/network',
  },
  'ReactCommon/jsinspector-modern/tracing/React-jsinspectortracing.podspec': {
    name: 'React-jsinspectortracing',
    headerPatterns: ['*.h'],
    headerDir: 'jsinspector-modern/tracing',
  },
  'React/React-RCTFabric.podspec': {
    name: 'React-RCTFabric',
    headerPatterns: ['Fabric/**/*.h'],
    headerDir: 'React',
  },

  'React/React-RCTFBReactNativeSpec.podspec': {
    name: 'React-RCTFBReactNativeSpec',
    headerPatterns: ['FBReactNativeSpec/**/*.h'],
    headerDir: 'FBReactNativeSpec',
    excludePatterns: ['FBReactNativeSpec/react/renderer/components/**'],
    subSpecs: [
      {
        name: 'components',
        headerPatterns: [
          'FBReactNativeSpec/react/renderer/components/FBReactNativeSpec/**/*.h',
        ],
        headerDir: 'react/renderer/components/FBReactNativeSpec',
      },
    ],
  },
  'ReactCommon/React-FabricComponents.podspec': {
    name: 'React-FabricComponents',
    headerPatterns: [],
    headerDir: '',
    subSpecs: [
      {
        name: 'components',
        headerPatterns: [],
        headerDir: '',
        subSpecs: [
          {
            name: 'inputaccessory',
            headerPatterns: ['react/renderer/components/inputaccessory/**/*.h'],
            excludePatterns: ['react/renderer/components/inputaccessory/tests'],
            headerDir: 'react/renderer/components/inputaccessory',
          },

          {
            name: 'modal',
            headerPatterns: ['react/renderer/components/modal/*.h'],
            excludePatterns: ['react/renderer/components/modal/tests'],
            headerDir: 'react/renderer/components/modal',
          },

          {
            name: 'safeareaview',
            headerPatterns: ['react/renderer/components/safeareaview/**/*.h'],
            excludePatterns: ['react/renderer/components/safeareaview/tests'],
            headerDir: 'react/renderer/components/safeareaview',
          },

          {
            name: 'scrollview',
            headerPatterns: [
              'react/renderer/components/scrollview/*.h',
              'react/renderer/components/scrollview/platform/cxx/**/*.h',
            ],
            excludePatterns: ['react/renderer/components/scrollview/tests'],
            headerDir: 'react/renderer/components/scrollview',
          },

          {
            name: 'text',
            headerPatterns: [
              'react/renderer/components/text/*.h',
              'react/renderer/components/text/platform/cxx/**/*.h',
            ],
            headerDir: 'react/renderer/components/text',
          },

          {
            name: 'iostextinput',
            headerPatterns: [
              'react/renderer/components/textinput/*.h',
              'react/renderer/components/textinput/platform/ios/**/*.h',
            ],
            headerDir: 'react/renderer/components/iostextinput',
          },

          {
            name: 'switch',
            headerPatterns: [
              'react/renderer/components/switch/iosswitch/**/*.h',
            ],
            excludePatterns: [
              'react/renderer/components/switch/iosswitch/**/MacOS*.{m,mm,cpp,h}',
            ],
            headerDir: 'react/renderer/components/switch/',
          },

          {
            name: 'textinput',
            headerPatterns: ['react/renderer/components/textinput/**/*.h'],
            headerDir: 'react/renderer/components/textinput',
          },

          {
            name: 'unimplementedview',
            headerPatterns: [
              'react/renderer/components/unimplementedview/**/*.h',
            ],
            excludePatterns: [
              'react/renderer/components/unimplementedview/tests',
            ],
            headerDir: 'react/renderer/components/unimplementedview',
          },

          {
            name: 'virtualview',
            headerPatterns: [
              'react/renderer/components/virtualview/**/*.{m,mm,cpp,h}',
            ],
            excludePatterns: ['react/renderer/components/virtualview/tests'],
            headerDir: 'react/renderer/components/virtualview',
          },

          {
            name: 'virtualviewexperimental',
            headerPatterns: [
              'react/renderer/components/virtualviewexperimental/**/*.h',
            ],
            excludePatterns: [
              'react/renderer/components/virtualviewexperimental/tests',
            ],
            headerDir: 'react/renderer/components/virtualviewexperimental',
          },

          {
            name: 'rncore',
            headerPatterns: ['react/renderer/components/rncore/**/*.h'],
            headerDir: 'react/renderer/components/rncore',
          },
        ],
      },
      {
        name: 'textlayoutmanager',

        headerPatterns: [
          'react/renderer/textlayoutmanager/platform/ios/**/*.h',
          'react/renderer/textlayoutmanager/*.h',
        ],
        excludePatterns: [
          'react/renderer/textlayoutmanager/tests',
          'react/renderer/textlayoutmanager/platform/android',
          'react/renderer/textlayoutmanager/platform/cxx',
        ],
        headerDir: 'react/renderer/textlayoutmanager',
      },
    ],
  },
  'React-Core.podspec': {
    name: 'React-Core',
    headerPatterns: [],
    headerDir: 'React',
    subSpecs: [
      {
        name: 'Default',
        headerPatterns: ['React/**/*.h'],
        excludePatterns: [
          'React/CoreModules/**/*',
          'React/DevSupport/**/*',
          'React/Fabric/**/*',
          'React/FBReactNativeSpec/**/*',
          'React/Tests/**/*',
          'React/Inspector/**/*',
          'React/Runtime/**/*',
          'React/CxxBridge/JSCExecutorFactory.h',
        ],
      },
      {
        name: 'DevSupport',
        headerPatterns: ['React/DevSupport/*.h', 'React/Inspector/*.h'],
      },
      {name: 'RCTWebSocket', headerPatterns: ['Libraries/WebSocket/*.h']},
      {
        name: 'CoreModulesHeaders',
        headerPatterns: ['React/CoreModules/**/*.h'],
      },
      {
        name: 'RCTActionSheetHeaders',
        headerPatterns: ['Libraries/ActionSheetIOS/*.h'],
      },
      {
        name: 'RCTAnimationHeaders',
        headerPatterns: ['Libraries/NativeAnimation/{Drivers/*,Nodes/*,*}.h'],
      },
      {
        name: 'RCTBlobHeaders',
        headerPatterns: [
          'Libraries/Blob/{RCTBlobManager,RCTFileReaderModule}.h',
        ],
      },
      {name: 'RCTImageHeaders', headerPatterns: ['Libraries/Image/*.h']},
      {
        name: 'RCTLinkingHeaders',
        headerPatterns: ['Libraries/LinkingIOS/*.h'],
      },
      {name: 'RCTNetworkHeaders', headerPatterns: ['Libraries/Network/*.h']},
      {
        name: 'RCTPushNotificationHeaders',
        headerPatterns: ['Libraries/PushNotificationIOS/*.h'],
      },
      {
        name: 'RCTSettingsHeaders',
        headerPatterns: ['Libraries/Settings/*.h'],
      },
      {name: 'RCTTextHeaders', headerPatterns: ['Libraries/Text/**/*.h']},
      {
        name: 'RCTVibrationHeaders',
        headerPatterns: ['Libraries/Vibration/*.h'],
      },
    ],
  },
  'React.podspec': {disabled: true},
  'Libraries/PushNotificationIOS/React-RCTPushNotification.podspec': {
    disabled: true,
  },
};

module.exports = {PodspecExceptions};
