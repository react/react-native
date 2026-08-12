# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

header_search_paths = [
  "\"$(PODS_ROOT)/Headers/Private/React-Core\"",
]

create_header_search_path_for_frameworks("ReactCommon-Samples").each { |search_path| header_search_paths << "\"#{search_path}\""}

Pod::Spec.new do |s|
  s.name                   = "ReactCommon-Samples"
  s.module_name            = "ReactCommon_Samples"
  s.header_dir             = "ReactCommon"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => header_search_paths,
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "GCC_WARN_PEDANTIC" => "YES" }
  s.framework = "UIKit"

  if ENV['USE_FRAMEWORKS']
    # Do not use resolve_use_frameworks here - since we're including source files.
    # Then it is not needed.
    s.header_mappings_dir     = './'
  end



  s.source_files = "ReactCommon/**/*.{cpp,h}",
        "platform/ios/**/*.{mm,cpp,h}"

  s.dependency "React-Core"
  s.dependency "React-cxxreact"
  s.dependency "React-jsi"
  s.dependency "RCTTypeSafety"
  add_dependency(s, "React-RCTFBReactNativeSpec")
  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core", :additional_framework_paths => ["react/nativemodule/core"])
  add_dependency(s, "React-NativeModulesApple")

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  mark_as_react_native_build(s)
end
