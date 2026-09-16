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
  s.name                   = "React-jsi"
  s.version                = version
  s.summary                = "JavaScript Interface layer for React Native"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source

  s.header_dir    = "jsi"
  s.pod_target_xcconfig    = {
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    "DEFINES_MODULE" => "YES"
  }

  s.source_files  = podspec_sources("**/*.{cpp,h}", "**/*.h")
  files_to_exclude = [
                      "jsi/jsilib-posix.cpp",
                      "jsi/jsilib-windows.cpp",
                      "**/test/*"
                     ]
  if use_hermes()
    # JSI is a part of hermes-engine. Including them also in react-native will violate the One Definition Rulle.
    files_to_exclude += [ "jsi/jsi.cpp" ]
    s.dependency "hermes-engine"
  end
  s.exclude_files = files_to_exclude

  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  mark_as_react_native_build(s)
end
