# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "..", "package.json")))
version = package['version']

Pod::Spec.new do |s|
    s.name                   = "RCTDeprecation"
    s.version                = version
    s.author                 = "Meta Platforms, Inc. and its affiliates"
    s.license                = package["license"]
    s.homepage               = "https://reactnative.dev/"
    s.source                 = { :git => 'https://github.com/facebook/react-native.git', :tag => 'v#{version}' }
    s.summary                = "Macros for marking APIs as deprecated"
    s.source_files           = podspec_sources(["Exported/*.h", "RCTDeprecation.m"], "Exported/*.h")
    s.pod_target_xcconfig    = {
      "DEFINES_MODULE" => "YES",
      "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard()
    }
    s.compiler_flags         = "-Wnullable-to-nonnull-conversion -Wnullability-completeness"

    mark_as_react_native_build(s)
  end
