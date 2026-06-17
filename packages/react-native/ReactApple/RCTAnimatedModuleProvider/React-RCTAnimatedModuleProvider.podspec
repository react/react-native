# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we're presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

is_new_arch_enabled = ENV["RCT_NEW_ARCH_ENABLED"] != "0"
new_arch_enabled_flag = (is_new_arch_enabled ? " -DRCT_NEW_ARCH_ENABLED=1" : "")
other_cflags = "$(inherited) " + new_arch_enabled_flag + " " + js_engine_flags()

header_search_paths = [
  "$(PODS_TARGET_SRCROOT)/../../ReactCommon",
  "$(PODS_ROOT)/Headers/Private/React-Core",
  "$(PODS_ROOT)/Headers/Private/Yoga",
  "$(PODS_ROOT)/Headers/Public/ReactCommon",
]

Pod::Spec.new do |s|
  s.name                   = "React-RCTAnimatedModuleProvider"
  s.version                = version
  s.summary                = "Provides the C++ Native Animated TurboModule to React Native apps."
  s.homepage               = "https://reactnative.dev/"
  s.documentation_url      = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources("*.{m,mm,h}", "*.h")
  s.public_header_files    = "*.h"
  s.module_name            = "RCTAnimatedModuleProvider"
  s.header_dir             = "RCTAnimatedModuleProvider"

  s.compiler_flags = other_cflags
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => header_search_paths,
    "OTHER_CPLUSPLUSFLAGS" => other_cflags,
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    "DEFINES_MODULE" => "YES"
  }

  s.dependency "React-Core"
  s.dependency "React-featureflags"
  s.dependency "React-Fabric/animated"
  s.dependency "Yoga"

  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core", :additional_framework_paths => ["react/nativemodule/core"])

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)
end
