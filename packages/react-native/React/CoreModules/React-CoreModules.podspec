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
  "\"$(PODS_TARGET_SRCROOT)/React/CoreModules\"",
  "\"${PODS_ROOT}/Headers/Public/ReactCodegen/react/renderer/components\"",
]

Pod::Spec.new do |s|
  s.name                   = "React-CoreModules"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.compiler_flags         = '-Wno-nullability-completeness'
  s.source                 = source

  s.source_files           = podspec_sources("**/*.{c,m,mm,cpp}", "**/*.h")

  s.ios.exclude_files      = "PlatformStubs/**/*"
  exclude_files            = ["RCTStatusBarManager.mm"]
  s.macos.exclude_files    = exclude_files
  s.visionos.exclude_files = exclude_files
  s.tvos.exclude_files     = exclude_files

  s.header_dir             = "CoreModules"
  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                               "HEADER_SEARCH_PATHS" => header_search_paths.join(" ")
                             }
  s.framework = "UIKit"
  s.dependency "RCTTypeSafety", version
  s.dependency "React-Core/CoreModulesHeaders", version
  s.dependency "React-RCTImage", version
  s.dependency "React-jsi", version
  add_dependency(s, "React-featureflags")
  s.dependency 'React-RCTBlob'
  add_dependency(s, "React-debug")
  add_dependency(s, "React-runtimeexecutor", :additional_framework_paths => ["platform/ios"])
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "React-jsinspectorcdp", :framework_name => 'jsinspector_moderncdp')
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')

  add_dependency(s, "React-RCTFBReactNativeSpec")
  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core", :additional_framework_paths => ["react/nativemodule/core"])
  add_dependency(s, "React-NativeModulesApple")
  add_dependency(s, "React-utils", :additional_framework_paths => ["react/utils/platform/ios"])

  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)
end
