# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  source_files = ["*.{m,mm,cpp,h}", "platform/ios/**/*.{m,mm,cpp,h}"]
  header_search_paths = [
    "\"$(PODS_TARGET_SRCROOT)/../../../\"",
  ]

  s.name                   = "React-graphics"
  s.version                = version
  s.summary                = "Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources(source_files, ["*.h", "platform/ios/**/*.h"])
  s.header_dir             = "react/renderer/graphics"
  s.framework = "UIKit"

  if ENV['USE_FRAMEWORKS']
    header_search_paths = header_search_paths + ["\"$(PODS_TARGET_SRCROOT)/platform/ios\""]
  end

  resolve_use_frameworks(s, header_mappings_dir: "../../..", module_name: "React_graphics")

  s.pod_target_xcconfig  = { "USE_HEADERMAP" => "NO",
                             "HEADER_SEARCH_PATHS" => header_search_paths.join(" "),
                             "DEFINES_MODULE" => "YES",
                             "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard() }

  s.dependency "React-jsi"
  s.dependency "React-jsiexecutor"
  s.dependency "React-featureflags"
  s.dependency "React-utils"
  s.dependency "React-rendererdebug"

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)
end
