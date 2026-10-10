# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require "fileutils"
require "cocoapods"
require_relative "../spm.rb"

# These tests exercise the real `Pod::Project` UUID machinery (via the
# `xcodeproj`/`cocoapods` gems) because the bug they guard against is emergent
# from how `Pod::Project` hands out UUIDs, and cannot be observed against a mock.
class SPMTests < Test::Unit::TestCase
  PodSpecStub = Struct.new(:name)
  InstallerStub = Struct.new(:pods_project, :aggregate_targets) do
    def initialize(pods_project, aggregate_targets = [])
      super
    end
  end
  PodTargetStub = Struct.new(:name)
  AggregateTargetStub = Struct.new(:name, :pod_targets, :embed_frameworks_script_path) do
    def xcconfigs
      {}
    end
  end

  POD_NAME = "ReactNativeEnrichedMarkdown"
  TMP_DIR = File.join(Dir.tmpdir, "rn-spm-test")

  def setup
    FileUtils.rm_rf(TMP_DIR)
    FileUtils.mkdir_p(TMP_DIR)
  end

  def teardown
    FileUtils.rm_rf(TMP_DIR)
  end

  def build_project(num_pods)
    path = File.join(TMP_DIR, "Pods.xcodeproj")
    FileUtils.mkdir_p(path)
    project = Pod::Project.new(path)
    num_pods.times { |i| project.new_target(:static_library, "Pod#{i}", :ios) }
    project.new_target(:static_library, POD_NAME, :ios)
    project.save
    project
  end

  def inject_spm(project)
    manager = SPMManager.new
    manager.dependency(
      PodSpecStub.new(POD_NAME),
      url: "https://github.com/software-mansion-labs/RaTeX.git",
      requirement: { kind: "upToNextMajorVersion", minimumVersion: "0.1.0" },
      products: ["RaTeX"]
    )
    manager.apply_on_post_install(InstallerStub.new(project))
    project.save
  end

  # Simulates the state after an on-disk reload / incremental `pod install`:
  # existing objects keep their counter-based UUIDs, but the generator counters
  # reset to zero. This is what makes `Pod::Project#generate_uuid` hand back a
  # UUID (`<prefix>00000000`) that already belongs to the root object.
  def simulate_reload(project)
    project.instance_variable_set(:@generated_uuids, [])
    project.instance_variable_set(:@available_uuids, [])
  end

  EMBED_SCRIPT = <<~'SH'
    #!/bin/sh
    install_framework()
    {
      echo "$1"
    }
    if [[ "$CONFIGURATION" == "Debug" ]]; then
      install_framework "${PODS_XCFRAMEWORKS_BUILD_DIR}/hermes-engine/Pre-built/hermes.framework"
    fi
    if [ "${COCOAPODS_PARALLEL_CODE_SIGN}" == "true" ]; then
      wait
    fi
  SH

  def apply_with_embed_script(manager, project)
    script_path = File.join(TMP_DIR, "Pods-App-frameworks.sh")
    File.write(script_path, EMBED_SCRIPT) unless File.exist?(script_path)
    aggregate_target = AggregateTargetStub.new("Pods-App", [PodTargetStub.new(POD_NAME)], script_path)
    manager.apply_on_post_install(InstallerStub.new(project, [aggregate_target]))
    File.read(script_path)
  end

  def spm_manager(**embed_frameworks)
    manager = SPMManager.new
    manager.dependency(
      PodSpecStub.new(POD_NAME),
      url: "https://github.com/rive-app/rive-ios.git",
      requirement: { kind: "exactVersion", version: "6.26.0" },
      products: ["RiveRuntime"]
    )
    manager.dependency(
      PodSpecStub.new(POD_NAME),
      url: "https://github.com/getsentry/sentry-cocoa.git",
      requirement: { kind: "exactVersion", version: "9.29.2" },
      products: ["Sentry-Dynamic"],
      **embed_frameworks
    )
    manager
  end

  def assert_loadable_project(path)
    reopened = nil
    assert_nothing_raised("Pods project must reload cleanly after SPM injection") do
      reopened = Xcodeproj::Project.open(path)
    end
    root_uuid = reopened.root_object.uuid
    assert(
      reopened.objects_by_uuid[root_uuid].is_a?(Xcodeproj::Project::Object::PBXProject),
      "rootObject UUID must resolve to a PBXProject"
    )
    package_uuids = reopened.root_object.package_references.map(&:uuid)
    assert(
      package_uuids.none? { |uuid| uuid == root_uuid },
      "injected package reference must not collide with the root object UUID"
    )
    reopened
  end

  def test_spm_injection_on_freshly_generated_project_reloads_cleanly
    project = build_project(88)
    inject_spm(project)
    assert_loadable_project(project.path)
  end

  def test_spm_injection_after_project_reload_does_not_collide_with_root_object
    project = build_project(88)
    simulate_reload(project)
    inject_spm(project)
    assert_loadable_project(project.path)
  end

  def test_injected_uuids_are_unique_across_all_objects
    project = build_project(88)
    simulate_reload(project)
    inject_spm(project)
    reopened = assert_loadable_project(project.path)
    uuids = reopened.objects.map(&:uuid)
    assert_equal(uuids.length, uuids.uniq.length, "all object UUIDs must be unique")
  end

  def test_embeds_frameworks_of_swift_packages_before_the_code_sign_wait
    script = apply_with_embed_script(spm_manager(embed_frameworks: ["Sentry"]), build_project(1))
    calls = script.lines.grep(/^install_spm_framework "/).map(&:strip)
    assert_equal(['install_spm_framework "RiveRuntime"', 'install_spm_framework "Sentry"'], calls)
    assert_operator(script.index("install_spm_framework \"Sentry\""), :<, script.index("COCOAPODS_PARALLEL_CODE_SIGN"))
    assert_includes(script, '# https://github.com/getsentry/sentry-cocoa.git {kind: "exactVersion", version: "9.29.2"}')
  end

  def test_embed_frameworks_defaults_to_the_products
    script = apply_with_embed_script(spm_manager, build_project(1))
    assert_includes(script, 'install_spm_framework "Sentry-Dynamic"')
  end

  def test_embed_script_is_patched_once
    manager = spm_manager
    project = build_project(1)
    apply_with_embed_script(manager, project)
    script = apply_with_embed_script(manager, project)
    assert_equal(1, script.scan("install_spm_framework()").length)
    assert_equal(1, script.scan('install_spm_framework "RiveRuntime"').length)
  end

  def test_repeated_podspec_evaluation_records_a_dependency_once
    manager = spm_manager
    manager.dependency(
      PodSpecStub.new(POD_NAME),
      url: "https://github.com/rive-app/rive-ios.git",
      requirement: { kind: "exactVersion", version: "6.26.0" },
      products: ["RiveRuntime"]
    )
    script = apply_with_embed_script(manager, build_project(1))
    assert_equal(1, script.scan('install_spm_framework "RiveRuntime"').length)
    assert_equal(1, script.scan("# https://github.com/rive-app/rive-ios.git").length)
  end

  def test_signature_cleanup_is_added_only_to_pods_not_built_into_the_shared_products_dir
    project = build_project(0)
    project.new_target(:framework, "DynamicPod", :ios)
    project.save
    manager = SPMManager.new
    ["DynamicPod", POD_NAME].each do |pod_name|
      manager.dependency(
        PodSpecStub.new(pod_name),
        url: "https://github.com/rive-app/rive-ios.git",
        requirement: { kind: "exactVersion", version: "6.26.0" },
        products: ["RiveRuntime"]
      )
    end
    manager.apply_on_post_install(InstallerStub.new(project))
    phase_names = ->(name) { project.targets.find { |t| t.name == name }.shell_script_build_phases.map(&:name) }
    assert_equal([SPMManager::SIGNATURE_PHASE_NAME], phase_names.call("DynamicPod"))
    assert_empty(phase_names.call(POD_NAME))
    assert_loadable_project(project.path)
  end
end
