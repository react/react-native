# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-jsiexecutor"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources("jsireact/*.{cpp,h}", "jsireact/*.h")
  s.pod_target_xcconfig    = { "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/..\"" }
  s.header_dir             = "jsireact"

  s.dependency "React-cxxreact"
  s.dependency "React-jserrorhandler"
  s.dependency "React-jsi"
  s.dependency "React-jsitooling"
  s.dependency "React-perflogger"
  add_dependency(s, "React-debug")
  add_dependency(s, "React-runtimeexecutor", :additional_framework_paths => ["platform/ios"])
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "React-jsinspectorcdp", :framework_name => 'jsinspector_moderncdp')
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')
  add_dependency(s, "React-utils", :additional_framework_paths => ["react/utils/platform/ios"])
  add_dependency(s, "React-jsitooling", :framework_name => "JSITooling")
  if use_hermes()
    s.dependency 'hermes-engine'
  end

  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)
end
