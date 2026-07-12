# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'open3'
require 'pathname'
require_relative './react_native_pods_utils/script_phases.rb'
require_relative './cocoapods/jsengine.rb'
require_relative './cocoapods/rndependencies.rb'
require_relative './cocoapods/rncore.rb'
require_relative './cocoapods/fabric.rb'
require_relative './cocoapods/codegen.rb'
require_relative './cocoapods/codegen_utils.rb'
require_relative './cocoapods/utils.rb'
require_relative './cocoapods/new_architecture.rb'
require_relative './cocoapods/local_podspec_patch.rb'
require_relative './cocoapods/runtime.rb'
require_relative './cocoapods/helpers.rb'
require_relative './cocoapods/privacy_manifest_utils.rb'
require_relative './cocoapods/spm.rb'
require_relative './cocoapods/rncore.rb'
# Importing to expose use_native_modules!
require_relative './cocoapods/autolinking.rb'

$CODEGEN_OUTPUT_DIR = 'build/generated/ios/ReactCodegen'
$APP_DEPENDENCY_PROVIDER_OUTPUT_DIR = 'build/generated/ios/ReactAppDependencyProvider'
$CODEGEN_COMPONENT_DIR = 'react/renderer/components'
$CODEGEN_MODULE_DIR = '.'

$START_TIME = Time.now.to_i

def min_ios_version_supported
  return Helpers::Constants.min_ios_version_supported
end

# This function returns the min supported OS versions supported by React Native
# By using this function, you won't have to manually change your Podfile
# when we change the minimum version supported by the framework.
def min_supported_versions
  return  { :ios => min_ios_version_supported }
end

# This function prepares the project for React Native, before processing
# all the target exposed by the framework.
def prepare_react_native_project!
  # Temporary solution to suppress duplicated GUID error & master specs repo warning.
  # Can be removed once we move to generate files outside pod install.
  install! 'cocoapods', :deterministic_uuids => false, :warn_for_unused_master_specs_repo => false

  ReactNativePodsUtils.create_xcode_env_if_missing
end

# Function that setup all the react native dependencies
# 
# Parameters
# - path: path to react_native installation.
# - fabric_enabled: whether fabric should be enabled or not.
# - new_arch_enabled: [DEPRECATED] whether the new architecture should be enabled or not.
# - :production [DEPRECATED] whether the dependencies must be installed to target a Debug or a Release build.
# - hermes_enabled: whether Hermes should be enabled or not.
# - app_path: path to the React Native app. Required by the New Architecture.
# - config_file_dir: directory of the `package.json` file, required by the New Architecture.
def use_react_native! (
  path: "../node_modules/react-native",
  fabric_enabled: false,
  new_arch_enabled: NewArchitectureHelper.new_arch_enabled,
  production: false, # deprecated
  hermes_enabled: true, # deprecated. Hermes is the default engine and JSC has been moved to community support
  app_path: '..',
  config_file_dir: '',
  privacy_file_aggregation_enabled: true
)
  error_if_try_to_use_jsc_from_core()
  warn_if_new_arch_disabled()

  react_native_path = Pod::Config.instance.installation_root.join(path)
  prefix = react_native_path.relative_path_from(Pod::Config.instance.installation_root)

  hermes_enabled= !use_third_party_jsc()
  # Set the app_path as env variable so the podspecs can access it.
  ENV['APP_PATH'] = app_path
  ENV['REACT_NATIVE_PATH'] = react_native_path.to_s

  # We set RCT_SKIP_CODEGEN to true, if the user wants to skip the running Codegen step from Cocoapods.
  # This is needed as part of our migration away from cocoapods
  ENV['RCT_SKIP_CODEGEN'] = ENV['RCT_SKIP_CODEGEN'] == '1' || ENV['RCT_IGNORE_PODS_DEPRECATION'] == '1' ? '1' : '0'

  # Use the React Native precompiled binaries by default.
  # Users can still turn them off and build from source by setting the environment variable to 0.
  ENV['RCT_USE_RN_DEP'] = ENV['RCT_USE_RN_DEP'] == '0' ? '0' : '1'
  ENV['RCT_USE_PREBUILT_RNCORE'] = ENV['RCT_USE_PREBUILT_RNCORE'] == '0' ? '0' : '1'
  # Make `REMOVE_LEGACY_ARCH` enabled by default. This will build React Native
  # excluding the legacy arch unless the user turns this flag off explicitly.
  ENV['RCT_REMOVE_LEGACY_ARCH'] = ENV['RCT_REMOVE_LEGACY_ARCH'] == '0' ? '0' : '1'

  ReactNativePodsUtils.check_minimum_required_xcode()

  # Enable Hermes V1 by default. Keep the env var setup for backward compatibility.
  ENV['RCT_HERMES_V1_ENABLED'] = '1'

  # Current target definition is provided by Cocoapods and it refers to the target
  # that has invoked the `use_react_native!` function.
  ReactNativePodsUtils.detect_use_frameworks(current_target_definition)

  CodegenUtils.clean_up_build_folder(react_native_path, $CODEGEN_OUTPUT_DIR)

  # We are relying on this flag also in third parties libraries to proper install dependencies.
  # Better to rely and enable this environment flag if the new architecture is turned on using flags.
  react_native_version = NewArchitectureHelper.extract_react_native_version(react_native_path)
  fabric_enabled = true

  ENV['RCT_FABRIC_ENABLED'] = "1"
  ENV['RCT_AGGREGATE_PRIVACY_FILES'] = privacy_file_aggregation_enabled ? "1" : "0"
  ENV["RCT_NEW_ARCH_ENABLED"] = "1"

  ReactNativePodsUtils.warn_if_not_on_arm64()

  # Update ReactNativeDependencies so that we can easily switch between source and prebuilt
  ReactNativeDependenciesUtils.setup_react_native_dependencies(prefix, react_native_version)

  # Update ReactNativeCoreUtils so that we can easily switch between source and prebuilt
  ReactNativeCoreUtils.setup_rncore(prefix, react_native_version)

  Pod::UI.puts "Configuring the target with the New Architecture\n"

  # The Pods which should be included in all projects
  pod 'FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector"
  pod 'RCTRequired', :path => "#{prefix}/Libraries/Required"
  pod 'RCTTypeSafety', :path => "#{prefix}/Libraries/TypeSafety", :modular_headers => true
  pod 'React', :path => "#{prefix}/"
  if !ReactNativeCoreUtils.build_rncore_from_source()
    pod 'React-Core-prebuilt', :podspec => "#{prefix}/React-Core-prebuilt.podspec", :modular_headers => true
  end
  pod 'React-Core', :path => "#{prefix}/"
  pod 'React-CoreModules', :path => "#{prefix}/React/CoreModules"
  pod 'React-RCTRuntime', :path => "#{prefix}/React/Runtime"
  pod 'React-RCTAppDelegate', :path => "#{prefix}/Libraries/AppDelegate"
  pod 'React-RCTActionSheet', :path => "#{prefix}/Libraries/ActionSheetIOS"
  pod 'React-RCTAnimation', :path => "#{prefix}/Libraries/NativeAnimation"
  pod 'React-RCTBlob', :path => "#{prefix}/Libraries/Blob"
  pod 'React-RCTImage', :path => "#{prefix}/Libraries/Image"
  pod 'React-RCTLinking', :path => "#{prefix}/Libraries/LinkingIOS"
  pod 'React-RCTNetwork', :path => "#{prefix}/Libraries/Network"
  pod 'React-RCTSettings', :path => "#{prefix}/Libraries/Settings"
  pod 'React-RCTText', :path => "#{prefix}/Libraries/Text"
  pod 'React-RCTVibration', :path => "#{prefix}/Libraries/Vibration"
  pod 'React-Core/RCTWebSocket', :path => "#{prefix}/"
  pod 'React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact"
  pod 'React-cxxstableapi', :path => "#{prefix}/ReactCommon/react/cxxstableapi"
  pod 'React-debug', :path => "#{prefix}/ReactCommon/react/debug"
  pod 'React-utils', :path => "#{prefix}/ReactCommon/react/utils"
  pod 'React-featureflags', :path => "#{prefix}/ReactCommon/react/featureflags"
  pod 'React-featureflagsnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/featureflags"
  pod 'React-microtasksnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/microtasks"
  pod 'React-idlecallbacksnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/idlecallbacks"
  pod 'React-intersectionobservernativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/intersectionobserver"
  pod 'React-mutationobservernativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/mutationobserver"
  pod 'React-viewtransitionnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/viewtransition"
  pod 'React-webperformancenativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/webperformance"
  pod 'React-domnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/dom"
  pod 'React-defaultsnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/defaults"
  pod 'React-Mapbuffer', :path => "#{prefix}/ReactCommon"
  pod 'React-bridging', :path => "#{prefix}/ReactCommon/react/bridging", :modular_headers => true
  pod 'React-jserrorhandler', :path => "#{prefix}/ReactCommon/jserrorhandler"
  pod 'RCTDeprecation', :path => "#{prefix}/ReactApple/Libraries/RCTFoundation/RCTDeprecation"
  pod 'React-RCTFBReactNativeSpec', :path => "#{prefix}/React"
  pod 'React-jsi', :path => "#{prefix}/ReactCommon/jsi"
  pod 'RCTSwiftUI', :path => "#{prefix}/ReactApple/RCTSwiftUI"
  pod 'RCTSwiftUIWrapper', :path => "#{prefix}/ReactApple/RCTSwiftUIWrapper"
  pod 'React-RCTAnimatedModuleProvider', :path => "#{prefix}/ReactApple/RCTAnimatedModuleProvider"

  if hermes_enabled
    setup_hermes!(:react_native_path => prefix)
  end

  pod 'React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor"
  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector-modern"
  pod 'React-jsitooling', :path => "#{prefix}/ReactCommon/jsitooling"
  pod 'React-jsinspectorcdp', :path => "#{prefix}/ReactCommon/jsinspector-modern/cdp"
  pod 'React-jsinspectornetwork', :path => "#{prefix}/ReactCommon/jsinspector-modern/network"
  pod 'React-jsinspectortracing', :path => "#{prefix}/ReactCommon/jsinspector-modern/tracing"

  pod 'React-callinvoker', :path => "#{prefix}/ReactCommon/callinvoker"
  pod 'React-networking', :path => "#{prefix}/ReactCommon/react/networking"
  pod 'React-performancecdpmetrics', :path => "#{prefix}/ReactCommon/react/performance/cdpmetrics"
  pod 'React-performancetimeline', :path => "#{prefix}/ReactCommon/react/performance/timeline"
  pod 'React-timing', :path => "#{prefix}/ReactCommon/react/timing"
  pod 'React-runtimeexecutor', :path => "#{prefix}/ReactCommon/runtimeexecutor"
  pod 'React-runtimescheduler', :path => "#{prefix}/ReactCommon/react/renderer/runtimescheduler"
  pod 'React-renderercss', :path => "#{prefix}/ReactCommon/react/renderer/css"
  pod 'React-rendererdebug', :path => "#{prefix}/ReactCommon/react/renderer/debug"
  pod 'React-rendererconsistency', :path => "#{prefix}/ReactCommon/react/renderer/consistency"
  pod 'React-perflogger', :path => "#{prefix}/ReactCommon/reactperflogger"
  pod 'React-oscompat', :path => "#{prefix}/ReactCommon/oscompat"
  pod 'React-logger', :path => "#{prefix}/ReactCommon/logger"
  pod 'ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon", :modular_headers => true
  pod 'React-NativeModulesApple', :path => "#{prefix}/ReactCommon/react/nativemodule/core/platform/ios", :modular_headers => true
  pod 'Yoga', :path => "#{prefix}/ReactCommon/yoga", :modular_headers => true
  setup_fabric!(:react_native_path => prefix)
  setup_bridgeless!(:react_native_path => prefix, :use_hermes => hermes_enabled)

  if ReactNativeDependenciesUtils.build_react_native_deps_from_source()
    pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
    pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
    pod 'boost', :podspec => "#{prefix}/third-party-podspecs/boost.podspec"
    pod 'fast_float', :podspec => "#{prefix}/third-party-podspecs/fast_float.podspec"
    pod 'fmt', :podspec => "#{prefix}/third-party-podspecs/fmt.podspec", :modular_headers => true
    pod 'RCT-Folly', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec", :modular_headers => true
    pod 'SocketRocket', "~> #{Helpers::Constants::socket_rocket_config[:version]}", :modular_headers => true
  else
    # Install prebuilt React Native Core and React Native Dependencies
    ReactNativeCoreUtils.rncore_log("Using React Native Core and React Native Dependencies prebuilt versions.")
    pod 'ReactNativeDependencies', :podspec => "#{prefix}/third-party-podspecs/ReactNativeDependencies.podspec", :modular_headers => true

    if !ReactNativeCoreUtils.build_rncore_from_source()
      pod 'React-Core-prebuilt', :podspec => "#{prefix}/React-Core-prebuilt.podspec", :modular_headers => true
    end
  end

  pod 'ReactCodegen', :path => $CODEGEN_OUTPUT_DIR, :modular_headers => true
  pod 'ReactAppDependencyProvider', :path => $APP_DEPENDENCY_PROVIDER_OUTPUT_DIR, :modular_headers => true
  # Not needed, but run_codegen expects this to be set.
  folly_config = get_folly_config()
  run_codegen!(
    app_path,
    config_file_dir,
    :new_arch_enabled => NewArchitectureHelper.new_arch_enabled,
    :disable_codegen => ENV['DISABLE_CODEGEN'] == '1',
    :react_native_path => prefix,
    :fabric_enabled => fabric_enabled,
    :hermes_enabled => hermes_enabled,
    :codegen_output_dir => $CODEGEN_OUTPUT_DIR,
    :package_json_file => File.join(__dir__, "..", "package.json"),
    :folly_version => folly_config[:version]
  )

  pods_to_update = LocalPodspecPatch.pods_to_update(:react_native_path => prefix)
  if !pods_to_update.empty?
    if Pod::Lockfile.public_instance_methods.include?(:detect_changes_with_podfile)
      Pod::Lockfile.prepend(LocalPodspecPatch)
    else
      Pod::UI.warn "Automatically updating #{pods_to_update.join(", ")} has failed, please run `pod update #{pods_to_update.join(" ")} --no-repo-update` manually to fix the issue."
    end
  end
end

# Getter to retrieve the folly flags in case contributors need to apply them manually.
#
# Returns: the folly compiler flags
def folly_flags()
  return NewArchitectureHelper.folly_compiler_flags
end

# Resolve the spec for use with the USE_FRAMEWORKS environment variable. To avoid each podspec
# to manually specify the header mappings and module name, we can use this helper function.
# This helper will also resolve header mappings if we're building from source. Precompiled
# React-Core will not generate frameworks since their podspec files only contains the
# header files and no source code - so header_mappings should be the same as for without USE_FRAMEWORKS
#
# Parameters:
# - s: the spec to modify
# - header_mappings_dir: the directory to map headers when building Pod header structure
# - module_name: the name of the module when exposed to swift
def resolve_use_frameworks(spec, header_mappings_dir: nil, module_name: nil)
  ReactNativePodsUtils.resolve_use_frameworks(spec, :header_mappings_dir => header_mappings_dir, :module_name => module_name)
end

# Add a dependency to a spec, making sure that the HEADER_SERACH_PATHS are set properly.
# This function automate the requirement to specify the HEADER_SEARCH_PATHS which was error prone
# and hard to pull out properly to begin with.
# Secondly, it prepares the podspec to work also with other platforms, because this function is
# able to generate search paths that are compatible with macOS and other platform if specified by
# the $RN_PLATFORMS variable.
# To generate Header Search Paths for multiple platforms, define in your Podfile or Ruby infra a
# $RN_PLATFORMS static variable with the list of supported platforms, for example:
# `$RN_PLATFORMS = ["iOS", "macOS"]`
#
# Parameters:
# - spec: the spec that needs to be modified
# - pod_name: the name of the dependency we had to add to the spec
# - additional_framework_paths: additional sub paths we had to add to the HEADER_SEARCH_PATH
# - framework_name: the name of the framework in case it is different from the pod_name
# - version: the version of the pod_name the spec needs to depend on
# - base_dir: Base directory from where we need to start looking. Defaults to PODS_CONFIGURATION_BUILD_DIR
def add_dependency(spec, pod_name, subspec: nil, additional_framework_paths: [], framework_name: nil, version: nil, base_dir: "PODS_CONFIGURATION_BUILD_DIR")
  fixed_framework_name = framework_name != nil ? framework_name : pod_name.gsub("-", "_") # frameworks can't have "-" in their name
  ReactNativePodsUtils.add_dependency(spec, pod_name, base_dir, fixed_framework_name, :additional_paths => additional_framework_paths, :version => version)
end

# This function generates an array of HEADER_SEARCH_PATH that can be added to the HEADER_SEARCH_PATH property when use_frameworks! is enabled
#
# Parameters:
# - pod_name: the name of the dependency we had to add to the spec
# - additional_framework_paths: additional sub paths we had to add to the HEADER_SEARCH_PATH
# - framework_name: the name of the framework in case it is different from the pod_name
# - base_dir: Base directory from where we need to start looking. Defaults to PODS_CONFIGURATION_BUILD_DIR
# - include_base_folder: whether the array must include the base import path or only the additional_framework_paths
def create_header_search_path_for_frameworks(pod_name, additional_framework_paths: [], framework_name: nil, base_dir: "PODS_CONFIGURATION_BUILD_DIR", include_base_folder: true)
  fixed_framework_name = framework_name != nil ? framework_name : pod_name.gsub("-", "_")
  return ReactNativePodsUtils.create_header_search_path_for_frameworks(base_dir, pod_name, fixed_framework_name, additional_framework_paths, include_base_folder)
end

# This function can be used by library developer to prepare their modules for the New Architecture.
# It passes the Folly Flags to the module, it configures the search path and installs some New Architecture specific dependencies.
#
# Parameters:
# - spec: The spec that has to be configured with the New Architecture code
# - new_arch_enabled: [DEPRECATED] Whether the module should install dependencies for the new architecture
def install_modules_dependencies(spec, new_arch_enabled: NewArchitectureHelper.new_arch_enabled)
  folly_config = get_folly_config()
  NewArchitectureHelper.install_modules_dependencies(spec, true, folly_config[:version])
end

# This function is used by podspecs that needs to use the prebuilt sources for React Native.
# It returns the sources to use for the podspec.
#
# Parameters:
# - original_sources: The original sources of the podspec
# - sources_for_prebuilds: The sources to use for prebuilt pods
#
# Returns: The sources to use for the podspec
def podspec_sources(original_sources, sources_for_prebuilds)
  if ReactNativeCoreUtils.build_rncore_from_source()
    return original_sources
  else
    return sources_for_prebuilds
  end
end


# This function can be used by library developer to declare a SwiftPackageManager dependency.
#
# Parameters:
# - spec: The spec the Swift Package Manager dependency has to be added to
# - url: The URL of the Swift Package Manager dependency
# - requirement: The version requirement of the Swift Package Manager dependency (eg. ` {kind: 'upToNextMajorVersion', minimumVersion: '5.9.1'},`)
# - products: The product/target of the Swift Package Manager dependency (eg. AlamofireDynamic)
def spm_dependency(spec, url:, requirement:, products:)
  SPM.dependency(spec, url: url, requirement: requirement, products: products)
end

# It returns the default flags.
# deprecated.
def get_default_flags()
  warn 'get_default_flags is deprecated. Please remove the keys from the `use_react_native!` function'
  warn 'if you are using the default already and pass the value you need in case you don\'t want the default'
  return ReactNativePodsUtils.get_default_flags()
end

# This method returns an hash with the folly version, folly git url and the folly compiler flags
# that can be used to configure libraries.
# In this way, we can update those values in react native, and all the libraries will benefit
# from it.
# @return an hash with the `:version`, `:git` and `:compiler_flags` fields.
def get_folly_config()
  return Helpers::Constants.folly_config
end

# This method returns an hash with the glog git url
# that can be used to configure libraries.
# @return an hash with the `:git` field.
def get_glog_config()
  return Helpers::Constants.glog_config
end

# This method returns an hash with the fast_float git url
# that can be used to configure libraries.
# @return an hash with the `:git` field.
def get_fast_float_config()
  return Helpers::Constants.fast_float_config
end

# This method returns an hash with the fmt git url
# that can be used to configure libraries.
# @return an hash with the `:git` field.
def get_fmt_config()
  return Helpers::Constants.fmt_config
end

# This method returns an hash with the double conversion git url
# that can be used to configure libraries.
# @return an hash with the `:git` field.
def get_double_conversion_config()
  return Helpers::Constants.double_conversion_config
end

# This method returns an hash with the double conversion git url
# that can be used to configure libraries.
# @return an hash with the `:git` field.
def get_boost_config()
  return Helpers::Constants.boost_config
end

# This method returns an hash with the socket rocket version
# @return an hash with the `:version` field.
def get_socket_rocket_config()
  return Helpers::Constants.socket_rocket_config
end

# This method can be used to set the glog config
# that can be used to configure libraries.
def set_folly_config(folly_config)
   Helpers::Constants.set_folly_config(folly_config)
end

# This method can be used to set the glog config
# that can be used to configure libraries.
def set_glog_config(glog_config)
   Helpers::Constants.set_glog_config(glog_config)
end

# This method can be used to set the fast_float config
# that can be used to configure libraries.
def set_fast_float_config(fast_float_config)
  Helpers::Constants.set_fast_float_config(fast_float_config)
end

# This method can be used to set the fmt config
# that can be used to configure libraries.
def set_fmt_config(fmt_config)
   Helpers::Constants.set_fmt_config(fmt_config)
end

# This method can be used to set the double conversion config
# that can be used to configure libraries.
def set_double_conversion_config(double_conversion_config)
   Helpers::Constants.set_double_conversion_config(double_conversion_config)
end

# This method can be used to set the boost config
# that can be used to configure libraries.
def set_boost_config(boost_config)
   Helpers::Constants.set_boost_config(boost_config)
end

# This method can be used to set the socket rocket config
# that can be used to configure libraries.
def set_socket_rocket_config(socket_rocket_config)
   Helpers::Constants.set_socket_rocket_config(socket_rocket_config)
end

def rct_cxx_language_standard()
  return Helpers::Constants.cxx_language_standard
end

def print_jsc_removal_message()
  puts ''
  puts '=============== JavaScriptCore is being moved ==============='.yellow
  puts 'JavaScriptCore has been removed from React Native. It can now be'.yellow
  puts 'installed from `@react-native-community/javascriptcore`'.yellow
  puts 'See: https://github.com/react-native-community/javascriptcore'.yellow
  puts '============================================================='.yellow
  puts ''
end

def print_cocoapods_deprecation_message()
  if ENV["RCT_IGNORE_PODS_DEPRECATION"] == "1"
    return
  end

  puts ''
  puts '==================== DEPRECATION NOTICE ====================='.yellow
  puts 'Calling `pod install` directly is deprecated in React Native'.yellow
  puts 'because we are moving away from Cocoapods toward alternative'.yellow
  puts 'solutions to build the project.'.yellow
  puts '* If you are using Expo, please run:'.yellow
  puts '`npx expo run:ios`'.yellow
  puts '* If you are using the Community CLI, please run:'.yellow
  puts '`yarn ios`'.yellow
  puts '============================================================='.yellow
  puts ''

end

def warn_if_new_arch_disabled
  if ENV["RCT_NEW_ARCH_ENABLED"] == "1" || ENV["RCT_NEW_ARCH_ENABLED"] == nil
    return
  end

  puts ''
  puts '====================== NEW ARCH ONLY ======================='.yellow
  puts 'WARNING: Calling pod install with `RCT_NEW_ARCH_ENABLED=0'.yellow
  puts 'is not supported anymore since React Native 0.82.'.yellow
  puts 'You can remove the ENV["RCT_NEW_ARCH_ENABLED"]=0 from your'.yellow
  puts 'Podfie, if you have it.'.yellow
  puts 'The application will run with the New Architecture enabled'.yellow
  puts 'by default.'.yellow
  puts '============================================================'.yellow
  puts ''

end

def error_if_try_to_use_jsc_from_core()
  explicitly_not_use_hermes = ENV['USE_HERMES'] != nil && ENV['USE_HERMES'] == '0'
  not_use_3rd_party_jsc = ENV['USE_THIRD_PARTY_JSC'] == nil || ENV['USE_THIRD_PARTY_JSC'] == '0'
  if (explicitly_not_use_hermes && not_use_3rd_party_jsc)
    message = "Hermes is the default engine and JSC has been moved to community support.\n" +
    "Please remove the USE_HERMES=0, as it is not supported anymore.\n" +
    "If you want to use JSC, you can install it from `@react-native-community/javascriptcore`.\n" +
    "See: https://github.com/react-native-community/javascriptcore"
    puts message.red
    exit()
  end
end

# Function that executes after React Native has been installed to configure some flags and build settings.
#
# Parameters
# - installer: the Cocoapod object that allows to customize the project.
# - react_native_path: path to React Native.
# - mac_catalyst_enabled: whether we are running the Pod on a Mac Catalyst project or not.
# - enable_hermes_profiler: whether the hermes profiler should be turned on in Release mode
def react_native_post_install(
  installer,
  react_native_path = "../node_modules/react-native",
  mac_catalyst_enabled: false,
  ccache_enabled: ENV['USE_CCACHE'] == '1'
)
  ReactNativePodsUtils.turn_off_resource_bundle_react_core(installer)

  ReactNativePodsUtils.apply_mac_catalyst_patches(installer) if mac_catalyst_enabled

  privacy_file_aggregation_enabled = ENV['RCT_AGGREGATE_PRIVACY_FILES'] == '1'

  if use_hermes()
    ReactNativePodsUtils.set_gcc_preprocessor_definition_for_React_hermes(installer)
  end
  ReactNativePodsUtils.set_gcc_preprocessor_definition_for_debugger(installer)

  ReactNativePodsUtils.fix_library_search_paths(installer)
  ReactNativePodsUtils.update_search_paths(installer)
  ReactNativePodsUtils.set_build_setting(installer, build_setting: "USE_HERMES", value: use_hermes())
  # Compute REACT_NATIVE_PATH relative to PODS_ROOT using real (physical)
  # paths, so the relative traversal is correct even when Pods/ is a symlink.
  pods_dir_real = Pathname.new(Pod::Config.instance.sandbox_root.to_s).realpath
  rn_absolute = File.expand_path(react_native_path, Pod::Config.instance.installation_root.to_s)
  rn_real = Pathname.new(rn_absolute).realpath
  rn_relative_to_pods = rn_real.relative_path_from(pods_dir_real)
  ReactNativePodsUtils.set_build_setting(installer, build_setting: "REACT_NATIVE_PATH", value: File.join("${PODS_ROOT}", rn_relative_to_pods.to_s))
  # Store the Podfile directory as a build setting so that shell scripts can
  # locate it without hardcoding an absolute path. Use Xcode variable
  # substitution per-project so the value persisted in project.pbxproj is
  # portable across machines: $(SRCROOT) is the Podfile dir for user projects
  # (also avoids the PODS_ROOT/.. traversal that breaks when Pods/ is a
  # symlink), and $(SRCROOT)/.. for the Pods project.
  installer.aggregate_targets.map(&:user_project).uniq(&:path).each do |user_project|
    user_project.build_configurations.each do |config|
      config.build_settings['PODFILE_DIR'] = '$(SRCROOT)'
    end
    user_project.save
  end
  installer.pods_project.build_configurations.each do |config|
    config.build_settings['PODFILE_DIR'] = '$(SRCROOT)/..'
  end
  installer.pods_project.save
  ReactNativePodsUtils.set_build_setting(installer, build_setting: "SWIFT_ACTIVE_COMPILATION_CONDITIONS", value: ['$(inherited)', 'DEBUG'], config_name: "Debug")

  if (ENV['RCT_REMOVE_LEGACY_ARCH'] == '1')
    ReactNativePodsUtils.add_compiler_flag_to_project(installer, "-DRCT_REMOVE_LEGACY_ARCH=1")
  else
    ReactNativePodsUtils.remove_compiler_flag_from_project(installer, "-DRCT_REMOVE_LEGACY_ARCH=1")
  end

  ReactNativePodsUtils.set_ccache_compiler_and_linker_build_settings(installer, react_native_path, ccache_enabled)
  ReactNativePodsUtils.updateOSDeploymentTarget(installer)
  ReactNativePodsUtils.set_dynamic_frameworks_flags(installer)
  ReactNativePodsUtils.add_ndebug_flag_to_pods_in_release(installer)

  if !ReactNativeCoreUtils.build_rncore_from_source()
    # In XCode 26 we need to revert the new setting SWIFT_ENABLE_EXPLICIT_MODULES when building
    # with precompiled binaries.
    ReactNativePodsUtils.set_build_setting(installer, build_setting: "SWIFT_ENABLE_EXPLICIT_MODULES", value: "NO")

    # Process the VFS overlay for prebuilt React Native Core - this is done as part of the post install so
    # that we can update paths based on the final location of the Pods installation.
    ReactNativeCoreUtils.process_vfs_overlay()

    # Configure xcconfig for prebuilt usage (VFS overlay, header paths, cleanup redundant paths)
    ReactNativeCoreUtils.configure_aggregate_xcconfig(installer)
  end

  SPM.apply_on_post_install(installer)

  if privacy_file_aggregation_enabled
    PrivacyManifestUtils.add_aggregated_privacy_manifest(installer)
  else
    PrivacyManifestUtils.add_privacy_manifest_if_needed(installer)
  end

  NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)
  NewArchitectureHelper.modify_flags_for_new_architecture(installer, NewArchitectureHelper.new_arch_enabled)
  NewArchitectureHelper.set_RCTNewArchEnabled_in_info_plist(installer, NewArchitectureHelper.new_arch_enabled)

  if !use_hermes() && !use_third_party_jsc()
    print_jsc_removal_message()
  end

  print_cocoapods_deprecation_message
  Pod::UI.puts "Pod install took #{Time.now.to_i - $START_TIME} [s] to run".green
end
