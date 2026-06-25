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

new_arch_flags = ENV['RCT_NEW_ARCH_ENABLED'] == '1' ? ' -DRCT_NEW_ARCH_ENABLED=1' : ''

header_search_paths = [
  "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"",
  "\"$(PODS_ROOT)/Headers/Private/React-Core\"",
  "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
  "\"$(PODS_ROOT)/Headers/Public/ReactCodegen\"",
]

if ENV['USE_FRAMEWORKS']
  create_header_search_path_for_frameworks("React-RCTFabric", :framework_name => "RCTFabric")
    .each { |search_path| header_search_paths << "\"#{search_path}\""}
end

module_name = "RCTFabric"
header_dir = "React"

Pod::Spec.new do |s|
  s.name                   = "React-RCTFabric"
  s.version                = version
  s.summary                = "RCTFabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources("Fabric/**/*.{c,h,m,mm,S,cpp}", "Fabric/**/*.{h}")
  s.exclude_files          = "**/tests/*",
                             "**/android/*",
  s.compiler_flags         = new_arch_flags
  s.header_dir             = header_dir
  s.module_name            = module_name
  s.weak_framework         = "JavaScriptCore"
  s.framework              = "MobileCoreServices"
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => header_search_paths,
    "OTHER_CFLAGS" => "$(inherited) " + new_arch_flags,
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
  }.merge!(ENV['USE_FRAMEWORKS'] != nil ? {
    "PUBLIC_HEADERS_FOLDER_PATH" => "#{module_name}.framework/Headers/#{header_dir}"
  }: {})

  s.dependency "React-Core"
  s.dependency "React-RCTImage"
  s.dependency "Yoga"
  s.dependency "React-RCTText"
  s.dependency "React-jsi"
  s.dependency "RCTSwiftUIWrapper"

  add_dependency(s, "React-FabricImage")
  add_dependency(s, "React-Fabric", :additional_framework_paths => [
    "react/renderer/components/scrollview/platform/cxx",
    "react/renderer/components/scrollview/platform/ios",
    "react/renderer/components/legacyviewmanagerinterop/platform/ios",
    "react/renderer/components/view/platform/cxx",
    "react/renderer/imagemanager/platform/ios",
  ])
  add_dependency(s, "React-FabricComponents", :additional_framework_paths => [
    "react/renderer/textlayoutmanager/platform/ios",
    "react/renderer/components/scrollview/platform/cxx",
    "react/renderer/components/scrollview/platform/ios",
    "react/renderer/components/text/platform/cxx",
    "react/renderer/components/textinput/platform/ios",
    "react/renderer/components/switch/iosswitch",
  ]);

  add_dependency(s, "React-graphics", :additional_framework_paths => ["react/renderer/graphics/platform/ios"])
  add_dependency(s, "React-ImageManager")
  add_dependency(s, "React-featureflags")
  add_dependency(s, "React-debug")
  add_dependency(s, "React-utils", :additional_framework_paths => ["react/utils/platform/ios"])
  add_dependency(s, "React-performancetimeline")
  add_dependency(s, "React-rendererdebug")
  add_dependency(s, "React-rendererconsistency")
  add_dependency(s, "React-runtimeexecutor", :additional_framework_paths => ["platform/ios"])
  add_dependency(s, "React-runtimescheduler")
  add_dependency(s, "React-RCTAnimation", :framework_name => 'RCTAnimation')
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "React-jsinspectorcdp", :framework_name => 'jsinspector_moderncdp')
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')
  add_dependency(s, "React-performancecdpmetrics", :framework_name => 'React_performancecdpmetrics')
  add_dependency(s, "React-networking", :framework_name => 'React_networking')
  add_dependency(s, "React-renderercss")
  add_dependency(s, "React-RCTFBReactNativeSpec")

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = podspec_sources("Tests/**/*.{mm}", "")
    test_spec.framework = "XCTest"
  end
end
