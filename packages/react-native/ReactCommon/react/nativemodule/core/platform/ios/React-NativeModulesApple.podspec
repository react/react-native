# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "..", "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
    s.name                   = "React-NativeModulesApple"
    s.module_name            = "React_NativeModulesApple"
    s.header_dir             = "ReactCommon" # Use global header_dir for all subspecs for use_frameworks! compatibility
    s.version                = version
    s.summary                = "-"
    s.homepage               = "https://reactnative.dev/"
    s.license                = package["license"]
    s.author                 = "Meta Platforms, Inc. and its affiliates"
    s.platforms              = min_supported_versions
    s.source                 = source
    s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-debug/React_featureflags.framework/Headers\"",
                                "USE_HEADERMAP" => "YES",
                                "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                                "GCC_WARN_PEDANTIC" => "YES" }

    resolve_use_frameworks(s, header_mappings_dir: './')

    s.source_files = podspec_sources("ReactCommon/**/*.{mm,cpp,h}", "ReactCommon/**/*.{h}")

    s.dependency "ReactCommon/turbomodule/core"
    s.dependency "React-bridging"
    s.dependency "React-callinvoker"
    s.dependency "React-Core"
    s.dependency "React-cxxreact"
    s.dependency "React-jsi"
    s.dependency "React-featureflags"
    add_dependency(s, "React-debug")
    add_dependency(s, "React-runtimeexecutor", :additional_framework_paths => ["platform/ios"])
    add_dependency(s, "React-featureflags")
    add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
    add_dependency(s, "React-jsinspectorcdp", :framework_name => 'jsinspector_moderncdp')

    depend_on_js_engine(s)
    add_rn_third_party_dependencies(s)
    add_rncore_dependency(s)
end
