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

header_search_paths = [
  "\"${PODS_ROOT}/Headers/Public/ReactCodegen/react/renderer/components\"",
]


Pod::Spec.new do |s|
  s.name                   = "React-RCTImage"
  s.version                = version
  s.summary                = "A React component for displaying different types of images."
  s.homepage               = "https://reactnative.dev/"
  s.documentation_url      = "https://reactnative.dev/docs/image"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.compiler_flags         = '-Wno-nullability-completeness'
  s.source                 = source
  s.source_files           = podspec_sources("*.{m,mm}", "**/*.h")
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.header_dir             = "RCTImage"
  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "HEADER_SEARCH_PATHS" => header_search_paths.join(' '),
                               "DEFINES_MODULE" => "YES"
                             }
  s.framework              = ["Accelerate", "UIKit", "QuartzCore", "ImageIO", "CoreGraphics"]

  s.dependency "RCTTypeSafety"
  s.dependency "React-jsi"
  s.dependency "React-Core/RCTImageHeaders"
  s.dependency "React-RCTNetwork"

  add_dependency(s, "React-RCTFBReactNativeSpec")
  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core", :additional_framework_paths => ["react/nativemodule/core"])
  add_dependency(s, "React-NativeModulesApple")

  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  mark_as_react_native_build(s)
end
