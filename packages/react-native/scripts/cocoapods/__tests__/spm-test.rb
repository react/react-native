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
  InstallerStub = Struct.new(:pods_project)

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
end
