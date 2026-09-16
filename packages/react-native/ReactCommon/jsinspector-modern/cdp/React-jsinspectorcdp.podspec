# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "package.json")))
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
  header_search_paths << "\"$(PODS_TARGET_SRCROOT)/../..\""
end

header_dir = 'jsinspector-modern/cdp'
module_name = "jsinspector_moderncdp"

Pod::Spec.new do |s|
  s.name                   = "React-jsinspectorcdp"
  s.version                = version
  s.summary                = "Common helper functions for working with CDP messages in jsinspector-modern"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources("*.{cpp,h}", "*.h")
  s.header_dir             = header_dir
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' '),
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    "DEFINES_MODULE" => "YES"}

  resolve_use_frameworks(s, header_mappings_dir: "../..", module_name: module_name)

  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  s.dependency "React-cxxstableapi"

  mark_as_react_native_build(s)
end
