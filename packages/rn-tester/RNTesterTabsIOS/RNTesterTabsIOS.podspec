# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "../" "package.json")))

Pod::Spec.new do |s|
  s.name            = "RNTesterTabsIOS"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = "RNTester's native tab bar"
  s.homepage        = "https://github.com/react/react-native"
  s.license         = "MIT"
  s.platforms       = min_supported_versions
  s.author          = "Meta Platforms, Inc. and its affiliates"
  s.source          = { :git => "https://github.com/react/react-native.git", :tag => "#{s.version}" }
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => "\"${PODS_CONFIGURATION_BUILD_DIR}/ReactCodegen/ReactCodegen.framework/Headers\"",
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
  }

  s.source_files    = "ios/**/*.{h,mm}"
  s.requires_arc    = true

  install_modules_dependencies(s)
end
