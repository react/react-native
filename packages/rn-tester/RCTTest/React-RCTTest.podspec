# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "react-native", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-RCTTest"
  s.version                = version
  s.summary                = "Tools for integration and snapshot testing."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.compiler_flags         = '-Wno-nullability-completeness'
  s.source                 = source
  s.source_files           = podspec_sources("**/*.{h,m,mm}", "**/*.h")
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.framework              = "XCTest"
  s.header_dir             = "RCTTest"
  s.pod_target_xcconfig    = {
                             "USE_HEADERMAP" => "YES",
                             "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                           }

  s.dependency "React-Core", version
  s.dependency "React-CoreModules", version
  s.dependency "ReactCommon/turbomodule/core", version
  s.dependency "React-NativeModulesApple", version
  s.dependency "React-jsi", version

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)
end
