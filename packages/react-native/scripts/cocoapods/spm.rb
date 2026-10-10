# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class SPMManager
  EMBED_FUNCTION = 'install_spm_framework'
  SIGNATURE_PHASE_NAME = '[RN] Remove duplicate Swift package xcframework signatures'

  # Embeds framework $1 from where Xcode builds binary targets (the shared products dir) and source packages
  # (PackageFrameworks, or UninstalledProducts when archiving); static frameworks are linked into their
  # consumer and a framework that is not found is skipped, so a misspelled name fails only at launch.
  EMBED_FUNCTION_SOURCE = <<~'SH'
    install_spm_framework()
    {
      local dir
      for dir in "${PODS_CONFIGURATION_BUILD_DIR}" "${PODS_CONFIGURATION_BUILD_DIR}/PackageFrameworks" "${OBJROOT}/UninstalledProducts/${PLATFORM_NAME}"; do
        if [ -d "$dir/$1.framework" ]; then
          if file -b "$dir/$1.framework/$1" | grep -q "dynamically linked"; then
            install_framework "$dir/$1.framework"
          fi
          return
        fi
      done
    }
  SH

  def initialize()
     @dependencies_by_pod = {}
  end

  def dependency(pod_spec, url:, requirement:,  products:, embed_frameworks: products)
    @dependencies_by_pod[pod_spec.name] ||= []
    dependency = { url: url, requirement: requirement, products: products, embed_frameworks: embed_frameworks }
    # CocoaPods can evaluate a podspec several times during one install.
    @dependencies_by_pod[pod_spec.name] << dependency unless @dependencies_by_pod[pod_spec.name].include?(dependency)
  end

  def apply_on_post_install(installer)
    project = installer.pods_project

    log 'Cleaning old SPM dependencies from Pods project'
    clean_spm_dependencies_from_target(project, @dependencies_by_pod)
    log 'Adding SPM dependencies to Pods project'
    flattened_pod_names = []
    @dependencies_by_pod.each do |pod_name, dependencies|
      target = project.targets.find { |t| t.name == pod_name}
      dependencies.each do |spm_spec|
        log "Adding SPM dependency on product #{spm_spec[:products]}"
        add_spm_to_target(
          project,
          target,
          spm_spec[:url],
          spm_spec[:requirement],
          spm_spec[:products]
        )
        if target.product_type == 'com.apple.product-type.library.static'
          # Xcode emits a package C-target's module map both into the shared
          # products dir and into this pod's CONFIGURATION_BUILD_DIR, and both
          # copies are unavoidably visible (the package swiftmodule serializes
          # the products-root path) — clang hard-errors with "redefinition of
          # module" on Xcode 26.3. Building the pod straight into the products
          # root makes both paths the same file, and puts the package
          # swiftmodule on the pod's default search path.
          log " Building #{pod_name} into the shared products dir to avoid duplicate module maps"
          target.build_configurations.each do |config|
            target.build_settings(config.name)['CONFIGURATION_BUILD_DIR'] = '${PODS_CONFIGURATION_BUILD_DIR}'
          end
          flattened_pod_names << pod_name unless flattened_pod_names.include?(pod_name)
        else
          log " Adding workaround for Swift package not found issue"
          target.build_configurations.each do |config|
            target.build_settings(config.name)['SWIFT_INCLUDE_PATHS'] ||= ['$(inherited)']
            search_path = '${SYMROOT}/${CONFIGURATION}${EFFECTIVE_PLATFORM_NAME}/'
            unless target.build_settings(config.name)['SWIFT_INCLUDE_PATHS'].include?(search_path)
              target.build_settings(config.name)['SWIFT_INCLUDE_PATHS'].push(search_path)
            end
          end
        end
      end
    end

    rewrite_aggregate_modulemap_references(installer, flattened_pod_names) unless flattened_pod_names.empty?

    unless @dependencies_by_pod.empty?
      log 'Embedding dynamic frameworks of Swift packages'
      add_embed_frameworks(installer)
      add_signature_cleanup(project, @dependencies_by_pod.keys - flattened_pod_names)

      log_warning "If you're using Xcode 15 or earlier you might need to close and reopen the Xcode workspace"
      unless ENV["USE_FRAMEWORKS"] == "dynamic"
        @dependencies_by_pod.each do |pod_name, dependencies|
          log_warning "Pod #{pod_name} is using swift package(s) #{dependencies.map{|i| i[:products]}.flatten.uniq.join(", ")} with static linking, this might cause linker errors. Consider using USE_FRAMEWORKS=dynamic, see https://github.com/facebook/react-native/pull/44627#issuecomment-2123119711 for more information"
        end
      end
    end
  end

  private

  # CocoaPods' "[CP] Embed Pods Frameworks" script only embeds the frameworks of pods, so without these
  # calls the app fails at launch with dyld "Library not loaded" for a Swift package framework.
  def add_embed_frameworks(installer)
    installer.aggregate_targets.each do |aggregate_target|
      pod_names = aggregate_target.pod_targets.map(&:name) & @dependencies_by_pod.keys
      script_path = aggregate_target.embed_frameworks_script_path
      next if pod_names.empty? || !File.exist?(script_path)

      script = File.read(script_path)
      next if script.include?("#{EMBED_FUNCTION}()")
      anchor = /^if \[ "\$\{COCOAPODS_PARALLEL_CODE_SIGN\}" == "true" \]; then$/
      unless script.match?(anchor)
        log_warning "Could not embed Swift package frameworks in #{script_path}, the app might fail to launch"
        next
      end

      dependencies = pod_names.flat_map { |pod_name| @dependencies_by_pod[pod_name] }
      frameworks = dependencies.flat_map { |d| d[:embed_frameworks] }.uniq
      # Listing the requirements makes a version change rewrite this script, an input of the embed phase,
      # so the phase runs again and copies the new frameworks.
      requirements = dependencies.map { |d| "# #{d[:url]} #{d[:requirement]}\n" }.uniq.join
      calls = frameworks.map { |framework| "#{EMBED_FUNCTION} \"#{framework}\"\n" }.join
      File.write(script_path, script.sub(anchor) { "#{EMBED_FUNCTION_SOURCE}#{requirements}#{calls}#{$&}" })
      log " Embedding #{frameworks.join(', ')} in #{aggregate_target.name}"
    end
  end

  # Xcode writes a binary target's xcframework signature both to the shared products dir and to the build dir
  # of the pod using it, and Xcode 26 archives fail on the duplicate ("couldn't be copied to Signatures because
  # an item with the same name already exists"), so the pod's copy is removed.
  def add_signature_cleanup(project, pod_names)
    pod_names.each do |pod_name|
      target = project.targets.find { |t| t.name == pod_name }
      next if target.nil? || target.shell_script_build_phases.any? { |phase| phase.name == SIGNATURE_PHASE_NAME }

      phase = new_object(project, Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
      phase.name = SIGNATURE_PHASE_NAME
      phase.shell_script = 'rm -f "${CONFIGURATION_BUILD_DIR}"/*.xcframework-*.signature'
      phase.always_out_of_date = '1'
      target.build_phases << phase
    end
  end

  # Flattening a pod's build dir moves its generated modulemap from
  # "<Pod>/<Pod>.modulemap" to "<Pod>.modulemap"; the aggregate xcconfigs
  # reference the old path via -fmodule-map-file. Must mutate the in-memory
  # Config attributes — later post_install steps (NewArchitectureHelper) re-save
  # the same Config objects and would clobber a plain file edit.
  def rewrite_aggregate_modulemap_references(installer, pod_names)
    installer.aggregate_targets.each do |aggregate_target|
      aggregate_target.xcconfigs.each do |config_name, config_file|
        %w[OTHER_CFLAGS OTHER_SWIFT_FLAGS].each do |key|
          value = config_file.attributes[key]
          next unless value

          updated_value = pod_names.reduce(value) do |acc, pod_name|
            acc.gsub(
              "${PODS_CONFIGURATION_BUILD_DIR}/#{pod_name}/#{pod_name}.modulemap",
              "${PODS_CONFIGURATION_BUILD_DIR}/#{pod_name}.modulemap"
            )
          end
          config_file.attributes[key] = updated_value if updated_value != value
        end

        config_file.save_as(aggregate_target.xcconfig_path(config_name))
      end
    end
  end

  # Creates a new object in the project with a UUID guaranteed not to collide
  # with any UUID already present in the project.
  #
  # `Pod::Project` overrides `generate_available_uuid_list` with a fast,
  # counter-based scheme (`<sha prefix><counter>0`) that deliberately skips
  # collision checks, on the assumption that the whole Pods project is generated
  # in a single pass. That assumption does not hold here: we run in a
  # `post_install` hook, and the generator's counter can be out of sync with the
  # UUIDs already assigned to existing objects (e.g. when the project has been
  # reloaded from disk during an incremental install, the counter restarts at 0
  # while the root object still occupies `<prefix>00000000`). Using `project.new`
  # directly can therefore hand back a UUID that is already in use and overwrite
  # an existing object (notably the root `PBXProject`), producing a Pods project
  # Xcode refuses to load. We keep the deterministic scheme but probe forward
  # until we find a UUID that is actually free.
  def new_object(project, klass)
    uuid = project.generate_uuid
    uuid = project.generate_uuid while project.objects_by_uuid.key?(uuid)
    object = klass.new(project, uuid)
    object.initialize_defaults
    object
  end

  def log(msg)
    ::Pod::UI.puts "[SPM] #{msg}"
  end

  def log_warning(msg)
    ::Pod::UI.puts "\n\n[SPM] WARNING!!! #{msg}\n\n"
  end

  def clean_spm_dependencies_from_target(project, new_targets)
    project.root_object.package_references.delete_if { |pkg|
      (pkg.class == Xcodeproj::Project::Object::XCRemoteSwiftPackageReference) ||
      (pkg.class == Xcodeproj::Project::Object::XCLocalSwiftPackageReference)
    }
  end

  def add_spm_to_target(project, target, url, requirement, products)
    # Determine if this is a local path or remote URL
    is_local_path = File.exist?(url)

    if is_local_path
      pkg_class = Xcodeproj::Project::Object::XCLocalSwiftPackageReference
      pkg = project.root_object.package_references.find { |p| p.class == pkg_class && p.relative_path == url }
      if !pkg
        pkg = new_object(project, pkg_class)
        pkg.relative_path = url
        log(" Adding local package to workspace: #{pkg.inspect}")
        project.root_object.package_references << pkg
      end
    else
      pkg_class = Xcodeproj::Project::Object::XCRemoteSwiftPackageReference
      pkg = project.root_object.package_references.find { |p| p.class == pkg_class && p.repositoryURL == url }
      if !pkg
        pkg = new_object(project, pkg_class)
        pkg.repositoryURL = url
        pkg.requirement = requirement
        log(" Adding remote package to workspace: #{pkg.inspect}")
        project.root_object.package_references << pkg
      end
    end

    ref_class = Xcodeproj::Project::Object::XCSwiftPackageProductDependency
    products.each do |product_name|
      ref = target.package_product_dependencies.find do |r|
        r.class == ref_class && r.package == pkg && r.product_name == product_name
      end
      next if ref

      log(" Adding product dependency #{product_name} to #{target.name}")
      ref = new_object(project, ref_class)
      ref.package = pkg
      ref.product_name = product_name
      target.package_product_dependencies << ref
    end
  end
end

SPM = SPMManager.new
