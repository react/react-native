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

header_search_paths = []

if ENV['USE_FRAMEWORKS']
  header_search_paths << "\"$(PODS_TARGET_SRCROOT)/../../..\"" # this is needed to allow the RuntimeScheduler access its own files
end

Pod::Spec.new do |s|
  s.name                   = "React-runtimescheduler"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources("**/*.{cpp,h}", "**/*.h")
  s.header_dir             = "react/renderer/runtimescheduler"
  s.exclude_files          = "tests"
  s.pod_target_xcconfig    = {
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' ')}

  resolve_use_frameworks(s, header_mappings_dir: "../../..", module_name: "React_runtimescheduler")

  add_dependency(s, "React-runtimeexecutor", :additional_framework_paths => ["platform/ios"])
  s.dependency "React-callinvoker"
  s.dependency "React-cxxreact"
  s.dependency "React-rendererdebug"
  s.dependency "React-utils"
  s.dependency "React-featureflags"
  s.dependency "React-timing"
  s.dependency "React-jserrorhandler"
  s.dependency "React-jsi"
  s.dependency "React-performancetimeline"
  s.dependency "React-rendererconsistency"
  add_dependency(s, "React-debug")
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)
end
