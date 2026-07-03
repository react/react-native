# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require "json"
require_relative "../codegen_utils.rb"
require_relative "../helpers.rb"
require_relative "./test_utils/FileMock.rb"
require_relative "./test_utils/DirMock.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/PathnameMock.rb"
require_relative "./test_utils/FinderMock.rb"
require_relative "./test_utils/CodegenUtilsMock.rb"
require_relative "./test_utils/CodegenScriptPhaseExtractorMock.rb"
require_relative "./test_utils/FileUtilsMock.rb"

# mocking the min_supported_versions function
# as it is not possible to require the original react_native_pod
# without incurring in circular deps
# TODO: move `min_ios_version_supported` to utils.rb
def min_ios_version_supported
    return '15.1'
end

def min_supported_versions
  return  { :ios => min_ios_version_supported }
end

class CodegenUtilsTests < Test::Unit::TestCase
    :base_path

    def setup
        CodegenUtils.set_react_codegen_discovery_done(false)
        Pod::Config.reset()
        @base_path = "~/app/ios"
        Pathname.pwd!(@base_path)
        Pod::Config.instance.installation_root.relative_path_from = @base_path
    end

    def teardown
        FileUtils::FileUtilsStorage.reset()
        Finder.reset()
        Pathname.reset()
        Pod::UI.reset()
        Pod::Executable.reset()
        FileMock.reset()
        DirMock.reset()
    end

    # ================================ #
    # Test - UseReactCodegenDiscovery! #
    # ================================ #

    def testUseReactCodegenDiscovery_whenCodegenDisabled_doNothing
        # Arrange

        # Act
        CodegenUtils.new().use_react_native_codegen_discovery!(true, nil, file_manager: FileMock)

        # Assert
        assert_false(CodegenUtils.react_codegen_discovery_done())
        assert_equal([], Pod::UI.collected_messages)
        assert_equal([], Pod::UI.collected_warns)
    end

    def testUseReactCodegenDiscovery_whenDiscoveryDone_doNothing
        # Arrange
        CodegenUtils.set_react_codegen_discovery_done(true)

        # Act
        CodegenUtils.new().use_react_native_codegen_discovery!(false, nil, file_manager: FileMock, logger: Pod::UI)

        # Assert
        assert_true(CodegenUtils.react_codegen_discovery_done())
        assert_equal(["Skipping use_react_native_codegen_discovery."], Pod::UI.collected_messages)
        assert_equal([], Pod::UI.collected_warns)
    end

    def testUseReactCodegenDiscovery_whenAppPathUndefined_abort
        # Arrange

        # Act
        assert_raises(){
            CodegenUtils.new().use_react_native_codegen_discovery!(false, nil, file_manager: FileMock, logger: Pod::UI)
        }

        # Assert
        assert_false(CodegenUtils.react_codegen_discovery_done())
        assert_equal([], Pod::UI.collected_messages)
        assert_equal([
            'Error: app_path is required for use_react_native_codegen_discovery.',
            'If you are calling use_react_native_codegen_discovery! in your Podfile, please remove the call and pass `app_path` and/or `config_file_dir` to `use_react_native!`.'
        ], Pod::UI.collected_warns)
    end

    # =========================== #
    # Test - CleanUpCodegenFolder #
    # =========================== #

    def testCleanUpCodegenFolder_whenCleanupDone_doNothing
        # Arrange
        CodegenUtils.set_cleanup_done(true)
        codegen_dir = "build/generated/ios"
        rn_path = '../node_modules/react-native'

        # Act
        CodegenUtils.clean_up_build_folder(rn_path, codegen_dir, dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal(0, FileUtils::FileUtilsStorage.rmrf_invocation_count)
        assert_equal([], FileUtils::FileUtilsStorage.rmrf_paths)
        assert_equal(true, CodegenUtils.cleanup_done())
    end

    def testCleanUpCodegenFolder_whenFolderDoesNotExists_markAsCleanupDone
        # Arrange
        CodegenUtils.set_cleanup_done(false)
        codegen_dir = "build/generated/ios"
        rn_path = '../node_modules/react-native'

        # Act
        CodegenUtils.clean_up_build_folder(rn_path, codegen_dir, dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal(0, FileUtils::FileUtilsStorage.rmrf_invocation_count)
        assert_equal([], FileUtils::FileUtilsStorage.rmrf_paths)
        assert_equal([], DirMock.glob_invocation)
        assert_equal(true, CodegenUtils.cleanup_done())
    end

    def testCleanUpCodegenFolder_whenFolderExists_deleteItAndSetCleanupDone
        # Arrange
        CodegenUtils.set_cleanup_done(false)
        codegen_dir = "build/generated/ios"
        codegen_path = "#{@base_path}/#{codegen_dir}"
        globs = [
            codegen_path
        ]
        rn_path = '../node_modules/react-native'

        DirMock.mocked_existing_dirs(codegen_path)
        DirMock.mocked_existing_globs(globs, "#{codegen_path}/*")

        original_define_singleton_method = CodegenUtils.method(:assert_codegen_folder_is_empty)
        CodegenUtils.define_singleton_method(:assert_codegen_folder_is_empty) do |*args, **kwargs|
            # no-op
        end

        # Act
        CodegenUtils.clean_up_build_folder(rn_path, codegen_dir, dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal([codegen_path], DirMock.exist_invocation_params)
        assert_equal(3, FileUtils::FileUtilsStorage.rmrf_invocation_count)
        assert_equal([
            *globs,
            "#{rn_path}/React/Fabric/RCTThirdPartyFabricComponentsProvider.h",
            "#{rn_path}/React/Fabric/RCTThirdPartyFabricComponentsProvider.mm",
        ], FileUtils::FileUtilsStorage.rmrf_paths)
        assert_equal(true, CodegenUtils.cleanup_done())
    ensure
        # Restore original method so other tests are not affected
        CodegenUtils.define_singleton_method(:assert_codegen_folder_is_empty, original_define_singleton_method)
    end

    # ===================================== #
    # Test - Assert Codegen Folder Is Empty #
    # ===================================== #

    def test_assertCodegenFolderIsEmpty_whenItDoesNotExists_doesNotAbort
        # Arrange
        codegen_dir = "build/generated/ios"
        codegen_path = "#{@base_path}/./#{codegen_dir}"

        # Act
        CodegenUtils.assert_codegen_folder_is_empty(codegen_path, dir_manager: DirMock)

        # Assert
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_assertCodegenFolderIsEmpty_whenItExistsAndIsEmpty_doesNotAbort
        # Arrange
        codegen_dir = "build/generated/ios"
        codegen_path = "#{@base_path}/./#{codegen_dir}"
        DirMock.mocked_existing_dirs(codegen_path)
        DirMock.mocked_existing_globs([], "#{codegen_path}/*")

        # Act
        CodegenUtils.assert_codegen_folder_is_empty(codegen_path, dir_manager: DirMock)

        # Assert
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_assertCodegenFolderIsEmpty_whenItIsNotEmpty_itAborts
        # Arrange
        codegen_dir = "build/generated/ios"
        codegen_path = "#{@base_path}/./#{codegen_dir}"
        DirMock.mocked_existing_dirs(codegen_path)
        DirMock.mocked_existing_globs(["#{codegen_path}/MyModuleSpecs/MyModule.mm",], "#{codegen_path}/*")

        # Act
        assert_raises() {
            CodegenUtils.assert_codegen_folder_is_empty(codegen_path, dir_manager: DirMock)
        }

        # Assert
        assert_equal([
            "Unable to remove the content of ~/app/ios/./build/generated/ios folder. Please run rm -rf ~/app/ios/./build/generated/ios and try again."
        ], Pod::UI.collected_warns)
    end

    private

    def get_podspec_no_fabric_no_script
        spec = {
          'name' => "ReactCodegen",
          'version' => "99.98.97",
          'summary' => 'Temp pod for generated files for React Native',
          'homepage' => 'https://facebook.com/',
          'license' => 'Unlicense',
          'authors' => 'Facebook',
          'compiler_flags'  => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -Wno-comma -Wno-shorten-64-to-32 -Wno-documentation -Wno-nullability-completeness -std=c++20",
          'source' => { :git => '' },
          'header_mappings_dir' => './',
          'platforms' => {
            :ios => '15.1',
          },
          'source_files' => "**/*.{h,mm,cpp}",
          'exclude_files' => "RCTAppDependencyProvider.{h,mm}",
          'pod_target_xcconfig' => {
            "FRAMEWORK_SEARCH_PATHS" => [],
            "HEADER_SEARCH_PATHS" =>
            [
                "\"$(PODS_ROOT)/boost\"",
                "\"$(PODS_ROOT)/RCT-Folly\"",
                "\"$(PODS_ROOT)/DoubleConversion\"",
                "\"$(PODS_ROOT)/fast_float/include\"",
                "\"$(PODS_ROOT)/fmt/include\"",
                "\"${PODS_ROOT}/Headers/Public/ReactCodegen/react/renderer/components\"",
                "\"$(PODS_ROOT)/Headers/Private/React-Fabric\"",
                "\"$(PODS_ROOT)/Headers/Private/React-RCTFabric\"",
                "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
                "\"$(PODS_TARGET_SRCROOT)\"",
            ].join(' '),
            'OTHER_CPLUSPLUSFLAGS' => [
                '$(inherited)',
                '-DFOLLY_NO_CONFIG',
                '-DFOLLY_MOBILE=1',
                '-DFOLLY_USE_LIBCPP=1',
                '-DFOLLY_CFG_NO_COROUTINES=1',
                '-DFOLLY_HAVE_CLOCK_GETTIME=1',
                '-Wno-comma',
                '-Wno-shorten-64-to-32',
                '-Wno-documentation'
            ].join(' ')
          },
          'dependencies': {
            "DoubleConversion": [],
            "RCT-Folly": [],
            "RCTRequired": [],
            "RCTTypeSafety": [],
            "React-Core": [],
            "React-jsi": [],
            "React-jsiexecutor": [],
            "React-bridging": [],
            "ReactCommon/turbomodule/core": [],
            "hermes-engine": [],
            "React-NativeModulesApple": [],
            'React-RCTAppDelegate': [],
            "glog": [],
          }
        }
    end

    def get_podspec_fabric_and_script_phases(script_phases)
        specs = get_podspec_no_fabric_no_script()

        specs[:dependencies].merge!({
            'React-graphics': [],
            'React-Fabric': [],
            'React-FabricImage': [],
            'React-utils': [],
            'React-featureflags': [],
            'React-debug': [],
            'React-rendererdebug': [],
        })

        specs[:'script_phases'] = script_phases

        return specs
    end

    def get_podspec_when_use_frameworks
        specs = get_podspec_no_fabric_no_script()

        specs["pod_target_xcconfig"]["FRAMEWORK_SEARCH_PATHS"].concat([])
        specs["pod_target_xcconfig"]["HEADER_SEARCH_PATHS"].concat(" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-FabricImage/React_FabricImage.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-NativeModulesApple/React_NativeModulesApple.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererdebug/React_rendererdebug.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-utils/React_utils.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-featureflags/React_featureflags.framework/Headers\"")

        specs[:dependencies].merge!({
            'React-graphics': [],
            'React-Fabric': [],
            'React-FabricImage': [],
            'React-utils': [],
            'React-featureflags': [],
            'React-debug': [],
            'React-rendererdebug': [],
        })

        return specs
    end
end
