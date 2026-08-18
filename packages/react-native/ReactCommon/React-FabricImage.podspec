# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

react_native_path = ".."

header_search_path = [
  "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"",
  "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
]

if ENV['USE_FRAMEWORKS']
  header_search_path = header_search_path + [
    "\"$(PODS_TARGET_SRCROOT)\"",
    "\"$(PODS_TARGET_SRCROOT)/react/renderer/textlayoutmanager/platform/ios\"",
    "\"$(PODS_TARGET_SRCROOT)/react/renderer/components/text/platform/cxx\"",
    "\"$(PODS_TARGET_SRCROOT)/react/renderer/components/textinput/platform/ios\"",
    # "\"$(PODS_CONFIGURATION_BUILD_DIR)/ReactCodegen/ReactCodegen.framework/Headers\"",
  ]
end

Pod::Spec.new do |s|
  s.name                   = "React-FabricImage"
  s.version                = version
  s.summary                = "Image Component for Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files         = podspec_sources("react/renderer/components/image/**/*.{m,mm,cpp,h}", "react/renderer/components/image/**/*.h")
  s.exclude_files        = "react/renderer/components/image/tests"
  s.header_dir           = "react/renderer/components/image"
  s.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                            "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                            "HEADER_SEARCH_PATHS" => header_search_path.join(" ")
                          }

  resolve_use_frameworks(s, header_mappings_dir: './', module_name: "React_FabricImage")

  s.dependency "React-jsiexecutor", version
  s.dependency "RCTRequired", version
  s.dependency "RCTTypeSafety", version
  s.dependency "React-jsi"
  s.dependency "React-logger"
  s.dependency "React-featureflags"
  s.dependency "React-utils"
  s.dependency "Yoga"

  add_dependency(s, "React-ImageManager", :additional_framework_paths => [
    "react/renderer/components/view/platform/cxx",
    "react/renderer/imagemanager/platform/ios",
  ])
  add_dependency(s, "ReactCommon", :subspec => "turbomodule/core")
  add_dependency(s, "React-graphics", :additional_framework_paths => ["react/renderer/graphics/platform/ios"])
  add_dependency(s, "React-Fabric", :additional_framework_paths => [
    "react/renderer/components/view/platform/cxx",
    "react/renderer/imagemanager/platform/ios"
  ])
  add_dependency(s, "React-rendererdebug")

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  mark_as_react_native_build(s)
end
