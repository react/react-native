# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'

require_relative "./utils.rb"
require_relative "./helpers.rb"
require_relative "./jsengine.rb"
require_relative "./rndependencies.rb"
require_relative "./rncore.rb"


class NewArchitectureHelper
    @@NewArchWarningEmitted = false # Used not to spam warnings to the user.

    def self.set_clang_cxx_language_standard_if_needed(installer)
        cxxBuildsettingsName = "CLANG_CXX_LANGUAGE_STANDARD"
        projects = installer.aggregate_targets
            .map{ |t| t.user_project }
            .uniq{ |p| p.path }

        projects.each do |project|
            Pod::UI.puts("Setting #{cxxBuildsettingsName} to #{ Helpers::Constants::cxx_language_standard } on #{ project.path }")

            project.build_configurations.each do |config|
                config.build_settings[cxxBuildsettingsName] = Helpers::Constants::cxx_language_standard
            end

            project.save()
        end

        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            target_installation_result.native_target.build_configurations.each do |config|
                config.build_settings[cxxBuildsettingsName] = Helpers::Constants::cxx_language_standard
            end
        end

        # Override targets that would set spec.xcconfig to define c++ version
        installer.aggregate_targets.each do |aggregate_target|
            aggregate_target.xcconfigs.each do |config_name, config_file|
                config_file.attributes[cxxBuildsettingsName] = Helpers::Constants::cxx_language_standard
            end
        end
    end

    def self.computeFlags(is_new_arch_enabled)
        new_arch_flag = is_new_arch_enabled ? "-DRCT_NEW_ARCH_ENABLED=1 " : ""
        return " #{new_arch_flag}"
    end

    def self.modify_flags_for_new_architecture(installer, is_new_arch_enabled)
        # Add flags to Target pods xcconfig
        installer.aggregate_targets.each do |aggregate_target|
            aggregate_target.xcconfigs.each do |config_name, config_file|
                ReactNativePodsUtils.add_flag_to_map_with_inheritance(config_file.attributes, "OTHER_CPLUSPLUSFLAGS", self.computeFlags(is_new_arch_enabled))

                xcconfig_path = aggregate_target.xcconfig_path(config_name)
                config_file.save_as(xcconfig_path)
            end
        end

        # Add flags to Target pods xcconfig
        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            # The React-Core pod may have a suffix added by Cocoapods, so we test whether 'React-Core' is a substring, and do not require exact match
            if pod_name.include? 'React-Core'
                target_installation_result.native_target.build_configurations.each do |config|
                    ReactNativePodsUtils.add_flag_to_map_with_inheritance(config.build_settings, "OTHER_CPLUSPLUSFLAGS", self.computeFlags(is_new_arch_enabled))
                end
            end
        end
    end

    def self.install_modules_dependencies(spec, new_arch_enabled, folly_version = Helpers::Constants.folly_config[:version])
        # Pod::Specification does not have getters so, we have to read
        # the existing values from a hash representation of the object.
        hash = spec.to_hash

        compiler_flags = hash["compiler_flags"] ? hash["compiler_flags"] : ""
        current_config = hash["pod_target_xcconfig"] != nil ? hash["pod_target_xcconfig"] : {}
        current_headers = current_config["HEADER_SEARCH_PATHS"] != nil ? current_config["HEADER_SEARCH_PATHS"] : ""

        header_search_paths = ["\"$(PODS_ROOT)/Headers/Private/Yoga\""]
        if ENV['USE_FRAMEWORKS']
            ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-graphics", "React_graphics", ["react/renderer/graphics/platform/ios"])
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-Fabric", "React_Fabric", ["react/renderer/components/view/platform/cxx"]))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-FabricImage", "React_FabricImage", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "ReactCommon", "ReactCommon", ["react/nativemodule/core"]))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-runtimeexecutor", "React_runtimeexecutor", ["platform/ios"]))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-NativeModulesApple", "React_NativeModulesApple", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-RCTFabric", "RCTFabric", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-utils", "React_utils", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-featureflags", "React_featureflags", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-debug", "React_debug", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-ImageManager", "React_ImageManager", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-rendererdebug", "React_rendererdebug", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-renderercss", "React_renderercss", []))
                .each { |search_path|
                    header_search_paths << "\"#{search_path}\""
                }
        end
        header_search_paths_string = header_search_paths.join(" ")
        spec.compiler_flags = compiler_flags.empty? ? self.computeFlags(new_arch_enabled).strip! : "#{compiler_flags} #{self.computeFlags(new_arch_enabled)}"
        current_config["HEADER_SEARCH_PATHS"] = current_headers.empty? ?
            header_search_paths_string :
            "#{current_headers} #{header_search_paths_string}"
        current_config["CLANG_CXX_LANGUAGE_STANDARD"] = Helpers::Constants::cxx_language_standard


        spec.dependency "React-Core"


        ReactNativePodsUtils.add_flag_to_map_with_inheritance(current_config, "OTHER_CPLUSPLUSFLAGS", self.computeFlags(new_arch_enabled))
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(current_config, "OTHER_SWIFT_FLAGS", new_arch_enabled ? " -DRCT_NEW_ARCH_ENABLED" : "")

        spec.dependency "React-RCTFabric" # This is for Fabric Component
        spec.dependency "ReactCodegen"

        spec.dependency "RCTRequired"
        spec.dependency "RCTTypeSafety"
        spec.dependency "React-bridging"
        spec.dependency "ReactCommon/turbomodule/core"
        spec.dependency "React-NativeModulesApple"
        spec.dependency "Yoga"
        spec.dependency "React-Fabric"
        spec.dependency "React-graphics"
        spec.dependency "React-utils"
        spec.dependency "React-featureflags"
        spec.dependency "React-debug"
        spec.dependency "React-ImageManager"
        spec.dependency "React-rendererdebug"
        spec.dependency 'React-jsi'
        spec.dependency 'React-renderercss'

        depend_on_js_engine(spec)
        add_rn_third_party_dependencies(spec)

        spec.pod_target_xcconfig = current_config

        # add_rncore_dependency must be called after setting pod_target_xcconfig
        # because it reads and modifies the xcconfig. If called before, its changes
        # would be overwritten by the assignment above.
        add_rncore_dependency(spec)
    end

    def self.extract_react_native_version(react_native_path, file_manager: File, json_parser: JSON)
        package_json_file = File.join(react_native_path, "package.json")
        if !file_manager.exist?(package_json_file)
            raise "Couldn't find the React Native package.json file at #{package_json_file}"
        end
        package = json_parser.parse(file_manager.read(package_json_file))
        return package["version"]
    end

    # Deprecated method. This has been restored because some libraries (e.g. react-native-exit-app) still use it.
    def self.folly_compiler_flags
      folly_config = Helpers::Constants.folly_config
      return folly_config[:compiler_flags]
    end

    def self.new_arch_enabled
        return true
    end

    def self.set_RCTNewArchEnabled_in_info_plist(installer, new_arch_enabled)
        projectPaths = installer.aggregate_targets
            .map{ |t| t.user_project }
            .uniq{ |p| p.path }
            .map{ |p| p.path }
        excluded_info_plist = ["/Pods", "Tests", "metainternal", ".bundle", "build/", "DerivedData/", ".xcframework", ".framework", "watchkitapp", "today-extention"]
        projectPaths.each do |projectPath|
            projectFolderPath = File.dirname(projectPath)
            infoPlistFiles = `find #{projectFolderPath} -name "Info.plist"`
            infoPlistFiles = infoPlistFiles.split("\n").map { |f| f.strip }

            infoPlistFiles.each do |infoPlistFile|
                # If infoPlistFile contains Pods or tests, skip it
                should_skip = false
                excluded_info_plist.each do |excluded|
                    if infoPlistFile.include? excluded
                        should_skip = true
                    end
                end
                next if should_skip

                # Read the file as a plist
                begin
                    info_plist = Xcodeproj::Plist.read_from_path(infoPlistFile)
                rescue StandardError => e
                    Pod::UI.warn("Failed to read Info.plist at #{infoPlistFile}: #{e.message}")
                    next
                end
                # Check if it contains the RCTNewArchEnabled key
                if info_plist["RCTNewArchEnabled"] and info_plist["RCTNewArchEnabled"] == new_arch_enabled
                    next
                end

                # Add the key and value to the plist
                info_plist["RCTNewArchEnabled"] = new_arch_enabled ? true : false
                Xcodeproj::Plist.write_to_path(info_plist, infoPlistFile)
            end
        end
    end
end
