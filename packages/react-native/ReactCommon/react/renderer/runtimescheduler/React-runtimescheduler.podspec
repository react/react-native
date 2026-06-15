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

header_search_paths = []

if ENV['USE_FRAMEWORKS']
  header_search_paths << "\"$(PODS_TARGET_SRCROOT)/../../..\"" # this is needed to allow the RuntimeScheduler access its own files
end

Pod::Spec.new do |s|
  s.name                   = "React-runtimescheduler"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = podspec_sources("**/*.{cpp,h}", "**/*.h")
  s.header_dir             = "react/renderer/runtimescheduler"
  # The umbrella is vended top-level as <React/RuntimeScheduler.h> via the
  # "Umbrella" subspec below, so exclude it from the main (react/...) mapping.
  s.exclude_files          = ["tests", "React"]
  # POC (public C++ API surface reduction): RuntimeScheduler exposes a single
  # public umbrella header, vended top-level as <React/RuntimeScheduler.h>.
  # Including any other module header directly is gated by an opt-in guard that is inert unless
  # REACT_RUNTIMESCHEDULER_ENFORCE_UMBRELLA is defined. CocoaPods exposes the
  # whole header_dir, so the individual headers remain includable here; the guard
  # macro is the only way to enforce "umbrella only" in the pods build.
  #
  # To enable enforcement: add REACT_RUNTIMESCHEDULER_BUILDING=1 to this pod's own
  # compilation via the GCC_PREPROCESSOR_DEFINITIONS line below, and propagate
  # REACT_RUNTIMESCHEDULER_ENFORCE_UMBRELLA to consumers. NOTE: enforcing on
  # consumers needs `user_target_xcconfig`, which CocoaPods discourages (xcconfig
  # collisions), and it breaks consumers that still include the headers directly.
  s.pod_target_xcconfig    = {
    "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
    # "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) REACT_RUNTIMESCHEDULER_BUILDING=1",
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' ')}

  resolve_use_frameworks(s, header_mappings_dir: "../../..", module_name: "React_runtimescheduler")

  add_dependency(s, "React-runtimeexecutor", :additional_framework_paths => ["platform/ios"])
  s.dependency "React-callinvoker"
  s.dependency "React-cxxreact"
  s.dependency "React-rendererdebug"
  s.dependency "React-utils"
  s.dependency "React-featureflags"
  s.dependency "React-timing"
  s.dependency "React-jsi"
  s.dependency "React-performancetimeline"
  s.dependency "React-rendererconsistency"
  add_dependency(s, "React-debug")
  add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  # POC: vend the umbrella under the shared top-level `React/` prefix, i.e.
  # `#include <React/RuntimeScheduler.h>`. header_mappings_dir = "React" maps the
  # physical react/renderer/runtimescheduler/React/RuntimeScheduler.h to a
  # leaf-level RuntimeScheduler.h, and header_dir = "React" places it under React/.
  #
  # NOTE (untested): CocoaPods cannot be run in the internal build, so the exact
  # header_dir / header_mappings_dir interaction needs validation with `pod install`.
  # NOTE (macOS): under use_frameworks!, this pod's Headers would contain both
  # `React/` (umbrella) and `react/...` (interface headers); on a case-insensitive
  # filesystem those fold to one directory. They do not overwrite (different
  # depths), but this is a known fragility tracked in
  # __docs__/RuntimeSchedulerUmbrellaPOC.fb.md.
  s.subspec "Umbrella" do |ss|
    ss.source_files        = "React/*.h"
    ss.header_dir          = "React"
    ss.header_mappings_dir = "React"
  end
end
