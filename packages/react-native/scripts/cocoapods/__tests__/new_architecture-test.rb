# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../helpers.rb"
require_relative "../new_architecture.rb"
require_relative "./test_utils/InstallerMock.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/SpecMock.rb"
require_relative "./test_utils/FileMock.rb"

## Monkey patching to reset properly static props of the Helper.
class NewArchitectureHelper
    def self.reset
        @@NewArchWarningEmitted = false
    end
end

class NewArchitectureTests < Test::Unit::TestCase
    def teardown
        Pod::UI.reset()
        FileMock.reset()
        ENV["RCT_NEW_ARCH_ENABLED"] = nil
        NewArchitectureHelper.reset()
    end

    # ============================= #
    # Test - Set Clang Cxx Lang Std #
    # ============================= #

    def test_setClangCxxLanguageStandardIfNeeded_whenReactCoreIsPresent
        installer = prepare_mocked_installer_with_react_core
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal("c++20", installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"])
        assert_equal("c++20", installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"])
        assert_equal(["Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path.xcproj", "Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path2.xcproj"], Pod::UI.collected_messages)
    end

    def test_setClangCxxLanguageStandardIfNeeded_whenThereAreDifferentValuesForLanguageStandard_takesTheFirstValue
        installer = prepare_mocked_installer_with_react_core_and_different_language_standards
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal("c++20", installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"])
        assert_equal("c++20", installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"])
        assert_equal(["Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path.xcproj", "Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path2.xcproj"], Pod::UI.collected_messages)
    end

    # =================== #
    # Test - Modify Flags #
    # =================== #
    def test_modifyFlagsForNewArch_whenOnOldArch_doNothing
        # Arrange
        first_xcconfig = prepare_xcconfig("First")
        second_xcconfig = prepare_xcconfig("Second")
        react_core_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        react_core_release_config = prepare_CXX_Flags_build_configuration("Release")
        yoga_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        yoga_release_config = prepare_CXX_Flags_build_configuration("Release")

        installer = prepare_installer_for_cpp_flags(
            [ first_xcconfig, second_xcconfig ],
            {
                "React-Core" => [ react_core_debug_config, react_core_release_config ],
                "Yoga" => [ yoga_debug_config, yoga_release_config ],
            }
        )
        # Act
        NewArchitectureHelper.modify_flags_for_new_architecture(installer, false)

        # Assert
        assert_equal("$(inherited) ", first_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"])
        assert_equal(["a/path/First.xcconfig"], first_xcconfig.save_as_invocation)
        assert_equal("$(inherited) ", second_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"])
        assert_equal(["a/path/Second.xcconfig"], second_xcconfig.save_as_invocation)
        assert_equal("$(inherited) ", react_core_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited) ", react_core_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited)", yoga_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited)", yoga_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
    end

    def test_modifyFlagsForNewArch_whenOnNewArchAndIsRelease_updateFlags
        # Arrange
        first_xcconfig = prepare_xcconfig("First")
        second_xcconfig = prepare_xcconfig("Second")
        react_core_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        react_core_release_config = prepare_CXX_Flags_build_configuration("Release")
        yoga_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        yoga_release_config = prepare_CXX_Flags_build_configuration("Release")

        installer = prepare_installer_for_cpp_flags(
            [ first_xcconfig, second_xcconfig ],
            {
                "React-Core" => [ react_core_debug_config, react_core_release_config ],
                "Yoga" => [ yoga_debug_config, yoga_release_config ],
            }
        )
        # Act
        NewArchitectureHelper.modify_flags_for_new_architecture(installer, true)

        # Assert
        assert_equal("$(inherited) -DRCT_NEW_ARCH_ENABLED=1 ", first_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"])
        assert_nil(first_xcconfig.attributes["OTHER_CFLAGS"])
        assert_equal(["a/path/First.xcconfig"], first_xcconfig.save_as_invocation)
        assert_equal("$(inherited) -DRCT_NEW_ARCH_ENABLED=1 ", second_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"])
        assert_nil(second_xcconfig.attributes["OTHER_CFLAGS"])
        assert_equal(["a/path/Second.xcconfig"], second_xcconfig.save_as_invocation)
        assert_equal("$(inherited) -DRCT_NEW_ARCH_ENABLED=1 ", react_core_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_nil(react_core_debug_config.build_settings["OTHER_CFLAGS"])
        assert_equal("$(inherited) -DRCT_NEW_ARCH_ENABLED=1 ", react_core_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_nil(react_core_release_config.build_settings["OTHER_CFLAGS"])
        assert_equal("$(inherited)", yoga_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_nil(yoga_debug_config.build_settings["OTHER_CFLAGS"])
        assert_equal("$(inherited)", yoga_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_nil(yoga_release_config.build_settings["OTHER_CFLAGS"])
    end

    # =================================== #
    # Test - install Modules Dependencies #
    # =================================== #
    def test_installModulesDependencies_whenNewArchEnabledAndNewArchAndNoSearchPathsNorCompilerFlagsArePresent_itInstallDependencies
        #  Arrange
        spec = SpecMock.new

        # Act
        ENV["RCT_NEW_ARCH_ENABLED"] = "1"
        NewArchitectureHelper.install_modules_dependencies(spec, true, '2024.10.14.00')

        # Assert
        assert_equal("-DRCT_NEW_ARCH_ENABLED=1", spec.compiler_flags)
        assert_equal(
            [
                "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
                "$(PODS_ROOT)/glog",
                "$(PODS_ROOT)/boost",
                "$(PODS_ROOT)/DoubleConversion",
                "$(PODS_ROOT)/fast_float/include",
                "$(PODS_ROOT)/fmt/include",
                "$(PODS_ROOT)/SocketRocket",
                "$(PODS_ROOT)/RCT-Folly"
            ],
            spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"]
        )
        assert_equal("c++20", spec.pod_target_xcconfig["CLANG_CXX_LANGUAGE_STANDARD"])
        assert_equal("$(inherited) -DRCT_NEW_ARCH_ENABLED=1 ", spec.pod_target_xcconfig["OTHER_CPLUSPLUSFLAGS"])
        assert_equal(
            [
                { :dependency_name => "React-Core" },
                { :dependency_name => "React-RCTFabric" },
                { :dependency_name => "ReactCodegen" },
                { :dependency_name => "RCTRequired" },
                { :dependency_name => "RCTTypeSafety" },
                { :dependency_name => "React-bridging" },
                { :dependency_name => "ReactCommon/turbomodule/core" },
                { :dependency_name => "React-NativeModulesApple" },
                { :dependency_name => "Yoga" },
                { :dependency_name => "React-Fabric" },
                { :dependency_name => "React-graphics" },
                { :dependency_name => "React-utils" },
                { :dependency_name => "React-featureflags" },
                { :dependency_name => "React-debug" },
                { :dependency_name => "React-ImageManager" },
                { :dependency_name => "React-rendererdebug" },
                { :dependency_name => "React-jsi" },
                { :dependency_name => "React-renderercss" },
                { :dependency_name => "hermes-engine" },
                { :dependency_name => "glog" },
                { :dependency_name => "boost" },
                { :dependency_name => "DoubleConversion" },
                { :dependency_name => "fast_float" },
                { :dependency_name => "fmt" },
                { :dependency_name => "RCT-Folly" },
                { :dependency_name => "SocketRocket" },
                { :dependency_name => "RCT-Folly/Fabric" },
            ],
            spec.dependencies
        )
    end

    def test_installModulesDependencies_whenNewArchDisabledAndSearchPathsAndCompilerFlagsArePresent_itInstallDependenciesAndPreserveOtherSettings
        #  Arrange
        spec = SpecMock.new
        spec.compiler_flags = ''
        other_flags_arr = ["\"$(ReactNativeDependencies)/boost\"", "\"${PODS_CONFIGURATION_BUILD_DIR}/ReactCodegen/ReactCodegen.framework/Headers\""]
        spec.pod_target_xcconfig = {
            "HEADER_SEARCH_PATHS" => other_flags_arr.join(" ")
        }

        # Act
        ENV["RCT_NEW_ARCH_ENABLED"] = nil
        NewArchitectureHelper.install_modules_dependencies(spec, false, '2024.10.14.00')

        # Assert
        assert_equal("#{NewArchitectureHelper.folly_compiler_flags}", Helpers::Constants.folly_config[:compiler_flags])
        assert_equal([*other_flags_arr, '"$(PODS_ROOT)/Headers/Private/Yoga"', '$(PODS_ROOT)/glog', '$(PODS_ROOT)/boost', '$(PODS_ROOT)/DoubleConversion', '$(PODS_ROOT)/fast_float/include', '$(PODS_ROOT)/fmt/include', '$(PODS_ROOT)/SocketRocket', '$(PODS_ROOT)/RCT-Folly'], spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"])
        assert_equal("c++20", spec.pod_target_xcconfig["CLANG_CXX_LANGUAGE_STANDARD"])
        assert_equal(
            [
                { :dependency_name => "React-Core" },
                { :dependency_name => "React-RCTFabric" },
                { :dependency_name => "ReactCodegen" },
                { :dependency_name => "RCTRequired" },
                { :dependency_name => "RCTTypeSafety" },
                { :dependency_name => "React-bridging" },
                { :dependency_name => "ReactCommon/turbomodule/core" },
                { :dependency_name => "React-NativeModulesApple" },
                { :dependency_name => "Yoga" },
                { :dependency_name => "React-Fabric" },
                { :dependency_name => "React-graphics" },
                { :dependency_name => "React-utils" },
                { :dependency_name => "React-featureflags" },
                { :dependency_name => "React-debug" },
                { :dependency_name => "React-ImageManager" },
                { :dependency_name => "React-rendererdebug" },
                { :dependency_name => "React-jsi" },
                { :dependency_name => "React-renderercss" },
                { :dependency_name => "hermes-engine" },
                { :dependency_name => "glog" },
                { :dependency_name => "boost" },
                { :dependency_name => "DoubleConversion" },
                { :dependency_name => "fast_float" },
                { :dependency_name => "fmt" },
                { :dependency_name => "RCT-Folly" },
                { :dependency_name => "SocketRocket" },
            ],
            spec.dependencies
        )
    end

    # =================================== #
    # Test - Extract React Native Version #
    # =================================== #
    def test_extractReactNativeVersion_whenFileDoesNotExists_raiseError()
        react_native_path = './node_modules/react-native/'

        exception = assert_raise(RuntimeError) do
            NewArchitectureHelper.extract_react_native_version(react_native_path, :file_manager => FileMock)
        end

        assert_equal("Couldn't find the React Native package.json file at ./node_modules/react-native/package.json", exception.message)
    end

    def test_extractReactNativeVersion_whenFileExists_returnTheRightVersion()
        react_native_path = "./node_modules/react-native/"
        full_path = File.join(react_native_path, "package.json")
        json = "{\"version\": \"1.2.3-prerelease.4\"}"
        FileMock.mocked_existing_files([full_path])
        FileMock.files_to_read({
            full_path => json
        })

        version = NewArchitectureHelper.extract_react_native_version(react_native_path, :file_manager => FileMock)

        assert_equal("1.2.3-prerelease.4", version)
    end

    # =============================== #
    # Test - New Architecture Enabled #
    # =============================== #
    def test_newArchEnabled_whenRCTNewArchEnabledIsSetTo1_returnTrue
        ENV["RCT_NEW_ARCH_ENABLED"] = "1"
        is_enabled = NewArchitectureHelper.new_arch_enabled
        assert_true(is_enabled)
    end

    def test_newArchEnabled_whenRCTNewArchEnabledIsNotSet_returnTrue
        ENV["RCT_NEW_ARCH_ENABLED"] = nil
        is_enabled = NewArchitectureHelper.new_arch_enabled
        assert_true(is_enabled)
    end


end

# ================ #
# Test - Utilities #
# ================ #
def prepare_mocked_installer_with_react_core
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                ),
                TargetMock.new(
                    "React-Core",
                    [
                        BuildConfigurationMock.new("Debug", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
                        BuildConfigurationMock.new("Release", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end

def prepare_mocked_installer_with_react_core_and_different_language_standards
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                ),
                TargetMock.new(
                    "React-Core",
                    [
                        BuildConfigurationMock.new("Debug", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
                        BuildConfigurationMock.new("Release", { "CLANG_CXX_LANGUAGE_STANDARD" => "new" }),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end

def prepare_mocked_installer_without_react_core
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end

def prepare_xcconfig(name)
    return XCConfigMock.new(name, :attributes => {"OTHER_CPLUSPLUSFLAGS" => "$(inherited)"})
end

def prepare_CXX_Flags_build_configuration(name)
    return BuildConfigurationMock.new(name, {
        "OTHER_CPLUSPLUSFLAGS" => "$(inherited)"
    })
end

def prepare_pod_target_installation_results_mock(name, configs)
    target = TargetMock.new(name, configs)
    return TargetInstallationResultMock.new(target, target)
end

def prepare_installer_for_cpp_flags(xcconfigs, build_configs)
    xcconfigs_map = {}
    xcconfigs.each do |config|
        xcconfigs_map[config.name.to_s] = config
    end

    pod_target_installation_results_map = {}
    user_build_configuration_map = {}
    build_configs.each do |name, build_configs|
        pod_target_installation_results_map[name.to_s] = prepare_pod_target_installation_results_mock(
            name.to_s, build_configs
        )
        build_configs.each do |config|
            user_build_configuration_map[config.name] = config
        end
    end

    return InstallerMock.new(
        PodsProjectMock.new,
        [
            AggregatedProjectMock.new(:xcconfigs => xcconfigs_map, :base_path => "a/path/", :user_build_configurations => user_build_configuration_map)
        ],
        :pod_target_installation_results => pod_target_installation_results_map
    )
end
