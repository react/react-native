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
  header_search_paths = [
    "\"$(PODS_TARGET_SRCROOT)\"",
  ]

  s.name                   = "React-runtimeexecutor"
  s.module_name            = "React_runtimeexecutor"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources(["ReactCommon/*.{m,mm,cpp,h}", "platform/ios/**/*.{m,mm,cpp,h}"], ["ReactCommon/*.h", "platform/ios/**/*.h"])
  s.header_dir             = "ReactCommon"

  if ENV['USE_FRAMEWORKS']
    header_search_paths = header_search_paths + ["\"$(PODS_TARGET_SRCROOT)/platform/ios\""]
  end

  resolve_use_frameworks(s, header_mappings_dir: ".")

  s.pod_target_xcconfig    = { "USE_HEADERMAP" => "NO",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "HEADER_SEARCH_PATHS" => header_search_paths.join(' '),
                               "DEFINES_MODULE" => "YES" }

  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  s.dependency "React-jsi", version
  add_dependency(s, "React-featureflags")
  add_dependency(s, "React-debug")
  add_dependency(s, "React-utils", :additional_framework_paths => ["react/utils/platform/ios"])


  mark_as_react_native_build(s)
end
