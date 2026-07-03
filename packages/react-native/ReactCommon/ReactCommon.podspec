# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "ReactCommon"
  s.module_name            = "ReactCommon"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.header_dir             = "ReactCommon" # Use global header_dir for all subspecs for use_frameworks! compatibility
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\"",
                               "USE_HEADERMAP" => "YES",
                               "DEFINES_MODULE" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "GCC_WARN_PEDANTIC" => "YES" }

  resolve_use_frameworks(s, header_mappings_dir: './')

  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  # TODO (T48588859): Restructure this target to align with dir structure: "react/nativemodule/..."
  # Note: Update this only when ready to minimize breaking changes.
  s.subspec "turbomodule" do |ss|
    ss.dependency "React-callinvoker", version
    ss.dependency "React-perflogger", version
    ss.dependency "React-jsi", version
    ss.dependency "React-logger", version
    if use_hermes()
      ss.dependency "hermes-engine"
    end

    ss.subspec "core" do |sss|
      sss.source_files = podspec_sources("react/nativemodule/core/ReactCommon/**/*.{cpp,h}", "react/nativemodule/core/ReactCommon/**/*.h")
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-debug/React_debug.framework/Headers\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-debug/React_featureflags.framework/Headers\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-utils/React_utils.framework/Headers\"" }
      sss.dependency "React-bridging"
      sss.dependency "React-cxxreact", version
      sss.dependency "React-debug", version
      sss.dependency "React-featureflags", version
      sss.dependency "React-utils", version
    end
  end
end
