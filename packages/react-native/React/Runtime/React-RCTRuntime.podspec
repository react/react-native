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

new_arch_flags = ENV['RCT_NEW_ARCH_ENABLED'] == '1' ? ' -DRCT_NEW_ARCH_ENABLED=1' : ''

module_name = "RCTRuntime"
header_dir = "React"

Pod::Spec.new do |s|
  s.name                   = "React-RCTRuntime"
  s.version                = version
  s.summary                = "RCTRuntime for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources("*.{h,mm}", "*.h")
  s.compiler_flags         = new_arch_flags
  s.header_dir             = header_dir
  s.module_name          = module_name

  resolve_use_frameworks(s, header_mappings_dir: "./")

  s.pod_target_xcconfig    = {
    "OTHER_CFLAGS" => "$(inherited) " + new_arch_flags,
    "DEFINES_MODULE" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
  }.merge!(ENV['USE_FRAMEWORKS'] != nil ? {
    "PUBLIC_HEADERS_FOLDER_PATH" => "#{module_name}.framework/Headers/#{header_dir}"
  }: {})

  s.dependency "React-Core"
  s.dependency "React-jsi"
  add_dependency(s, "React-debug")
  add_dependency(s, "React-runtimeexecutor", :additional_framework_paths => ["platform/ios"])
  add_dependency(s, "React-jsitooling", :framework_name => "JSITooling")
  add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  add_dependency(s, "React-jsinspectorcdp", :framework_name => 'jsinspector_moderncdp')
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')

  add_dependency(s, "React-RuntimeCore")
  add_dependency(s, "React-RuntimeApple")
  add_dependency(s, "React-utils", :additional_framework_paths => ["react/utils/platform/ios"])

  if use_third_party_jsc()
    s.exclude_files = ["RCTHermesInstanceFactory.{mm,h}", "RCTJscInstanceFactory.{mm,h}"]
  else
    s.dependency "hermes-engine"
    add_dependency(s, "React-RuntimeHermes")
    s.exclude_files = "RCTJscInstanceFactory.{h,mm}"
  end

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  mark_as_react_native_build(s)
end
