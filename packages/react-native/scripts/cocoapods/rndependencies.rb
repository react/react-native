# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
require 'net/http'
require 'rexml/document'

require_relative './utils.rb'

## There are two environment variables that is related to ReactNativeDependencies:
## - RCT_USE_RN_DEP: If set to 1, it will use the release tarball from Maven instead of building from source.
## - RCT_USE_LOCAL_RN_DEP: **TEST ONLY** If set, it will use a local tarball of ReactNativeDependencies if it exists.
## - RCT_DEPS_VERSION: **TEST ONLY** If set, it will override the version of ReactNativeDependencies to be used.

### Adds ReactNativeDependencies as a dependency to the given podspec if we're not
### building ReactNativeDependencies from source.
def add_rn_third_party_dependencies(s)
    current_pod_target_xcconfig = s.to_hash["pod_target_xcconfig"] || {}
    current_pod_target_xcconfig = current_pod_target_xcconfig.to_h unless current_pod_target_xcconfig.is_a?(Hash)

    if ReactNativeDependenciesUtils.build_react_native_deps_from_source()
        s.dependency "glog"
        s.dependency "boost"
        s.dependency "DoubleConversion"
        s.dependency "fast_float"
        s.dependency "fmt"
        s.dependency "RCT-Folly"
        s.dependency "SocketRocket"

        if ENV["RCT_NEW_ARCH_ENABLED"]
            s.dependency "RCT-Folly/Fabric"
        end

        header_search_paths = current_pod_target_xcconfig["HEADER_SEARCH_PATHS"] || []

        if header_search_paths.is_a?(String)
            header_search_paths = header_search_paths.split(" ")
        end

        header_search_paths << "$(PODS_ROOT)/glog"
        header_search_paths << "$(PODS_ROOT)/boost"
        header_search_paths << "$(PODS_ROOT)/DoubleConversion"
        header_search_paths << "$(PODS_ROOT)/fast_float/include"
        header_search_paths << "$(PODS_ROOT)/fmt/include"
        header_search_paths << "$(PODS_ROOT)/SocketRocket"
        header_search_paths << "$(PODS_ROOT)/RCT-Folly"

        current_pod_target_xcconfig["HEADER_SEARCH_PATHS"] = header_search_paths
    else
        s.dependency "ReactNativeDependencies"
        current_pod_target_xcconfig["HEADER_SEARCH_PATHS"] ||= [] << "$(PODS_ROOT)/ReactNativeDependencies"
    end

    s.pod_target_xcconfig = current_pod_target_xcconfig
end

class ReactNativeDependenciesUtils
    @@build_from_source = true
    @@react_native_path = ""
    @@react_native_version = ""
    @@use_nightly = false

    def self.build_react_native_deps_from_source()
        return @@build_from_source
    end

    def self.resolve_podspec_source()
        if ENV["RCT_USE_LOCAL_RN_DEP"]
            abort_if_use_local_rndeps_with_no_file()
            rndeps_log("Using local xcframework at #{ENV["RCT_USE_LOCAL_RN_DEP"]}")
            return {:http => ReactNativePodsUtils.local_file_uri(ENV["RCT_USE_LOCAL_RN_DEP"]) }
        end

        if ENV["RCT_USE_RN_DEP"] && ENV["RCT_USE_RN_DEP"] == "1"
            if @@use_nightly
                begin
                    return self.podspec_source_download_prebuilt_nightly_tarball(@@react_native_version)
                rescue => e
                    rndeps_log("Failed to download nightly tarball: #{e.message}", :error)
                    return
                end
            end

            begin
                return self.podspec_source_download_prebuild_release_tarball()
            rescue => e
                rndeps_log("Failed to download release tarball: #{e.message}", :error)
                return
            end
        end

    end

    ## Sets up wether react-native-dependencies should be built from source or not.
    ## If RCT_USE_RN_DEP is set to 1 and the artifacts exists on Maven, it will
    ## not build from source. Otherwise, it will build from source.
    def self.setup_react_native_dependencies(react_native_path, react_native_version)
        # We don't want setup to be called multiple times, so we check if the variables are already set.
        if @@react_native_version == ""
            rndeps_log("Setting up ReactNativeDependencies...")
            @@react_native_path = react_native_path
            @@react_native_version = ENV["RCT_DEPS_VERSION"] == nil ? react_native_version : ENV["RCT_DEPS_VERSION"]

            if @@react_native_version.include? 'nightly'
                @@use_nightly = true
                if ENV["RCT_DEPS_VERSION"] == "nightly"
                    @@react_native_version = ReactNativeDependenciesUtils.get_nightly_npm_version()
                    rndeps_log("Using nightly version from npm: #{@@react_native_version}")
                else
                    rndeps_log("Using nightly build #{@@react_native_version}")
                end
            end

            if ENV["RCT_USE_LOCAL_RN_DEP"]
              abort_if_use_local_rndeps_with_no_file()
            end

            artifacts_exists = ENV["RCT_USE_RN_DEP"] == "1" && (@@use_nightly ? nightly_artifact_exists(@@react_native_version) : release_artifact_exists(@@react_native_version))
            use_local_xcframework = ENV["RCT_USE_LOCAL_RN_DEP"] && File.exist?(ENV["RCT_USE_LOCAL_RN_DEP"])

            @@build_from_source = !use_local_xcframework && !artifacts_exists

            if @@build_from_source && ENV["RCT_USE_LOCAL_RN_DEP"] && !use_local_xcframework
                rndeps_log("No local xcframework found, reverting to building from source.")
            end
            if @@build_from_source && ENV["RCT_USE_PREBUILT_RNCORE"] && !artifacts_exists
                rndeps_log("No prebuilt artifacts found, reverting to building from source.")
            end
            rndeps_log("Building from source: #{@@build_from_source}")
            rndeps_log("Source: #{self.resolve_podspec_source()}")
        end
    end

    def self.abort_if_use_local_rndeps_with_no_file()
      if !File.exist?(ENV["RCT_USE_LOCAL_RN_DEP"])
        abort("RCT_USE_LOCAL_RN_DEP is set to #{ENV["RCT_USE_LOCAL_RN_DEP"]} but the file does not exist!")
      end
    end

    def self.podspec_source_download_prebuild_release_tarball()
        # Warn if @@react_native_path is not set
        if @@react_native_path == ""
            rndeps_log("react_native_path is not set", :error)
            return
        end

        # Warn if @@react_native_version is not set
        if @@react_native_version == ""
            rndeps_log("react_native_version is not set", :error)
            return
        end

        if @@build_from_source
            return
        end

        url = release_tarball_url(@@react_native_version, :debug)
        rndeps_log("Using tarball from URL: #{url}")
        download_stable_rndeps(@@react_native_path, @@react_native_version, :debug)
        download_stable_rndeps(@@react_native_path, @@react_native_version, :release)

        return {:http => url }
    end

    def self.release_tarball_url(version, build_type)
        ## You can use the `ENTERPRISE_REPOSITORY` ariable to customise the base url from which artifacts will be downloaded.
        ## The mirror's structure must be the same of the Maven repo the react-native core team publishes on Maven Central.
        maven_repo_url =
            ENV['ENTERPRISE_REPOSITORY'] != nil && ENV['ENTERPRISE_REPOSITORY'] != "" ?
            ENV['ENTERPRISE_REPOSITORY'] :
            "https://repo1.maven.org/maven2"
        group = "com/facebook/react"
        # Sample url from Maven:
        # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.79.0-rc.0/react-native-artifacts-0.79.0-rc.0-reactnative-dependencies-debug.tar.gz
        return "#{maven_repo_url}/#{group}/react-native-artifacts/#{version}/react-native-artifacts-#{version}-reactnative-dependencies-#{build_type.to_s}.tar.gz"
    end

    def self.nightly_tarball_url(version, build_type)
        artifact_coordinate = "react-native-artifacts"
        artifact_name = "reactnative-dependencies-#{build_type.to_s}.tar.gz"
        xml_url = "https://central.sonatype.com/repository/maven-snapshots/com/facebook/react/#{artifact_coordinate}/#{version}-SNAPSHOT/maven-metadata.xml"

        response = Net::HTTP.get_response(URI(xml_url))
        if response.is_a?(Net::HTTPSuccess)
          xml = REXML::Document.new(response.body)
          timestamp = xml.elements['metadata/versioning/snapshot/timestamp'].text
          build_number = xml.elements['metadata/versioning/snapshot/buildNumber'].text
          full_version = "#{version}-#{timestamp}-#{build_number}"

          final_url = "https://central.sonatype.com/repository/maven-snapshots/com/facebook/react/#{artifact_coordinate}/#{version}-SNAPSHOT/#{artifact_coordinate}-#{full_version}-#{artifact_name}"
          return final_url
        else
          return ""
        end
    end

    def self.download_nightly_rndeps(react_native_path, version, configuration)
        tarball_url = nightly_tarball_url(version, configuration)
        download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
    end

    def self.download_stable_rndeps(react_native_path, version, configuration)
        tarball_url = release_tarball_url(version, configuration)
        download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
    end

    def self.podspec_source_download_prebuilt_nightly_tarball(version)
        # Warn if @@react_native_path is not set
        if @@react_native_path == ""
            rndeps_log("react_native_path is not set", :error)
            return
        end

        # Warn if @@react_native_version is not set
        if @@react_native_version == ""
            rndeps_log("react_native_version is not set", :error)
            return
        end

        if @@build_from_source
            return
        end

        url = nightly_tarball_url(version, :debug)
        rndeps_log("Using tarball from URL: #{url}")
        download_nightly_rndeps(@@react_native_path, @@react_native_version, :debug)
        download_nightly_rndeps(@@react_native_path, @@react_native_version, :release)

        return {:http => url }
    end

    def self.download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
        filename = configuration == nil ?
            "reactnative-dependencies-#{version}.tar.gz" :
            "reactnative-dependencies-#{version}-#{configuration}.tar.gz"
        destination_path = "#{artifacts_dir()}/#{filename}"

        if File.exist?(destination_path)
          rndeps_log("Tarball #{filename} already exists in Pods. Skipping download.")
          return destination_path
        end

        `mkdir -p "#{artifacts_dir()}"`

        if ReactNativePodsUtils.skip_caches?
          rndeps_log("RCT_SKIP_CACHES is set. Downloading #{filename} directly (bypassing shared cache).")
          tmp_file = "#{artifacts_dir()}/reactnative-dependencies.download"
          `curl -A "react-native-#{version}" "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
          unless File.exist?(destination_path)
            abort("[ReactNativeDependencies] Failed to download #{filename} from #{tarball_url}. Aborting.")
          end
          return destination_path
        end

        cached_path = File.join(ReactNativePodsUtils.shared_cache_dir(), filename)
        if File.exist?(cached_path)
          rndeps_log("Verifying checksum for cached #{filename}...")
          if ReactNativePodsUtils.validate_tarball(cached_path, tarball_url)
            rndeps_log("Cache hit: copying #{filename} from shared cache (#{ReactNativePodsUtils.shared_cache_dir()})")
            FileUtils.cp(cached_path, destination_path)
          else
            rndeps_log("Shared cache file #{filename} failed SHA verification. Re-downloading.")
            File.delete(cached_path)
            tmp_file = "#{artifacts_dir()}/reactnative-dependencies.download"
            `curl -A "react-native-#{version}" "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
            unless File.exist?(destination_path)
              abort("[ReactNativeDependencies] Failed to download #{filename} from #{tarball_url}. Aborting.")
            end
            rndeps_log("Verifying checksum for downloaded #{filename}...")
            if ReactNativePodsUtils.validate_tarball(destination_path, tarball_url)
              FileUtils.cp(destination_path, cached_path)
              rndeps_log("Saved #{filename} to shared cache (#{ReactNativePodsUtils.shared_cache_dir()})")
            else
              File.delete(destination_path) if File.exist?(destination_path)
              abort("[ReactNativeDependencies] Downloaded file #{filename} failed SHA verification. Aborting.")
            end
          end
        else
          rndeps_log("Cache miss: downloading #{filename} from #{tarball_url}")
          # Download to a temporary file first so we don't cache incomplete downloads.
          tmp_file = "#{artifacts_dir()}/reactnative-dependencies.download"
          `curl -A "react-native-#{version}" "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
          unless File.exist?(destination_path)
            abort("[ReactNativeDependencies] Failed to download #{filename} from #{tarball_url}. Aborting.")
          end
          rndeps_log("Verifying checksum for downloaded #{filename}...")
          if ReactNativePodsUtils.validate_tarball(destination_path, tarball_url)
            # Save to shared cache for future use
            `mkdir -p "#{ReactNativePodsUtils.shared_cache_dir()}"`
            FileUtils.cp(destination_path, cached_path)
            rndeps_log("Saved #{filename} to shared cache (#{ReactNativePodsUtils.shared_cache_dir()})")
          else
            File.delete(destination_path) if File.exist?(destination_path)
            abort("[ReactNativeDependencies] Downloaded file #{filename} failed SHA verification. Aborting.")
          end
        end

        return destination_path
    end

    def self.release_artifact_exists(version)
        return artifact_exists(release_tarball_url(version, :debug))
    end

    def self.nightly_artifact_exists(version)
        return artifact_exists(nightly_tarball_url(version, :debug).gsub("\\", ""))
    end

    def self.artifacts_dir()
        return File.join(Pod::Config.instance.project_pods_root, "ReactNativeDependencies-artifacts")
    end

    # This function checks that ReactNativeDependencies artifact exists on the maven repo
    def self.artifact_exists(tarball_url)
        # -L is used to follow redirects, useful for the nightlies
        # I also needed to wrap the url in quotes to avoid escaping & and ?.
        return (`curl -o /dev/null --silent -Iw '%{http_code}' -L "#{tarball_url}"` == "200")
    end

    def self.rndeps_log(message, level = :info)
        if !Object.const_defined?("Pod::UI")
            return
        end
        case level
        when :info
            Pod::UI.puts '[ReactNativeDependencies] '.green + message
        when :error
            Pod::UI.puts '[ReactNativeDependencies] '.red + message
        else
            Pod::UI.puts '[ReactNativeDependencies] '.yellow + message
        end
    end

    def self.get_nightly_npm_version()
        uri = URI('https://registry.npmjs.org/react-native/nightly')
        response = Net::HTTP.get_response(uri)

        unless response.is_a?(Net::HTTPSuccess)
          raise "Couldn't get an answer from NPM: #{response.code} #{response.message}"
        end

        json = JSON.parse(response.body)
        latest_nightly = json['version']
        return latest_nightly
    end
end
