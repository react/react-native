# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../../..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-RuntimeCore"
  s.version                = version
  s.summary                = "The React Native Runtime."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources(["*.{cpp,h}", "nativeviewconfig/*.{cpp,h}"], ["*.h", "nativeviewconfig/*.h"])
  s.exclude_files          = "iostests/*", "tests/**/*.{cpp,h}"
  s.header_dir             = "react/runtime"
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\" \"${PODS_TARGET_SRCROOT}/../..\"",
                                "USE_HEADERMAP" => "YES",
                                "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                                "GCC_WARN_PEDANTIC" => "YES" }

  resolve_use_frameworks(s, header_mappings_dir: "../..", module_name: "React_RuntimeCore")

  s.dependency "React-jsiexecutor"
  s.dependency "React-cxxreact"
  add_dependency(s, "React-runtimeexecutor", :additional_framework_paths => ["platform/ios"])
  s.dependency "React-jsi"
  s.dependency "React-jserrorhandler"
  s.dependency "React-performancetimeline"
  s.dependency "React-runtimescheduler"
  s.dependency "React-utils"
  s.dependency "React-featureflags"

  add_dependency(s, "React-Fabric")

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  s.dependency "React-jsinspector"
  s.dependency "React-cxxstableapi"
  add_dependency(s, "React-jsitooling", :framework_name => "JSITooling")

  mark_as_react_native_build(s)
end
