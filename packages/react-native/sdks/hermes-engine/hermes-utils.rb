# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'digest'

HERMES_GITHUB_URL = "https://github.com/facebook/hermes.git"
ENV_BUILD_FROM_SOURCE = "RCT_BUILD_HERMES_FROM_SOURCE"

module HermesEngineSourceType
    LOCAL_PREBUILT_TARBALL = :local_prebuilt_tarball
    DOWNLOAD_PREBUILD_RELEASE_TARBALL = :download_prebuild_release_tarball
    BUILD_FROM_GITHUB_COMMIT = :build_from_github_commit
    BUILD_FROM_GITHUB_TAG = :build_from_github_tag
    BUILD_FROM_GITHUB_STABLE_BRANCH = :build_from_github_stable_branch
    BUILD_FROM_LOCAL_SOURCE_DIR = :build_from_local_source_dir

    def HermesEngineSourceType.isPrebuilt(source_type)
        return source_type == LOCAL_PREBUILT_TARBALL || source_type == DOWNLOAD_PREBUILD_RELEASE_TARBALL
    end

    def HermesEngineSourceType.isFromSource(source_type)
        return source_type == BUILD_FROM_GITHUB_COMMIT || source_type == BUILD_FROM_GITHUB_TAG || source_type == BUILD_FROM_GITHUB_STABLE_BRANCH || source_type == BUILD_FROM_LOCAL_SOURCE_DIR
    end
end

# Computes the hermes-engine.podspec's source type.
# - To use a specific tarball, install the dependencies with:
# `HERMES_ENGINE_TARBALL_PATH=<path_to_tarball> bundle exec pod install`
# - To force a build from source, install the dependencies with:
# `RCT_BUILD_HERMES_FROM_SOURCE=true bundle exec pod install`
# If none of the two are provided, Cocoapods will check whether there is a
# release tarball for the current version on Maven. If not, it will fall back
# to building from the stable Hermes branch.
#
# Parameters:
# - version: current version of the pod
# - react_native_path: path to react native
#

# Returns: hermes-engine source type
def hermes_source_type(version, react_native_path)
    if override_hermes_dir_envvar_defined()
        return HermesEngineSourceType::BUILD_FROM_LOCAL_SOURCE_DIR
    end

    if hermes_engine_tarball_envvar_defined()
        return HermesEngineSourceType::LOCAL_PREBUILT_TARBALL
    end

    if hermes_commit_envvar_defined()
        return HermesEngineSourceType::BUILD_FROM_GITHUB_COMMIT
    end

    if force_build_from_tag(react_native_path)
        return HermesEngineSourceType::BUILD_FROM_GITHUB_TAG
    end

    if force_build_from_stable_branch(react_native_path)
        return HermesEngineSourceType::BUILD_FROM_GITHUB_STABLE_BRANCH
    end

    if release_artifact_exists(version)
        return HermesEngineSourceType::DOWNLOAD_PREBUILD_RELEASE_TARBALL
    end

    return HermesEngineSourceType::BUILD_FROM_GITHUB_STABLE_BRANCH
end

def override_hermes_dir_envvar_defined()
    return ENV.has_key?('REACT_NATIVE_OVERRIDE_HERMES_DIR')
end

def hermes_engine_tarball_envvar_defined()
    return ENV.has_key?('HERMES_ENGINE_TARBALL_PATH')
end

def hermes_commit_envvar_defined()
    return ENV.has_key?('HERMES_COMMIT')
end

def force_build_from_tag(react_native_path)
    return ENV[ENV_BUILD_FROM_SOURCE] === 'true' && File.exist?(hermestag_file(react_native_path))
end

def force_build_from_stable_branch(react_native_path)
    return ENV[ENV_BUILD_FROM_SOURCE] === 'true' && !File.exist?(hermestag_file(react_native_path))
end

def release_artifact_exists(version)
    return hermes_artifact_exists(release_tarball_url(version, :debug))
end

def podspec_source(source_type, version, react_native_path)
    case source_type
    when HermesEngineSourceType::BUILD_FROM_LOCAL_SOURCE_DIR
        return podspec_source_build_from_local_source_dir(react_native_path)
    when HermesEngineSourceType::LOCAL_PREBUILT_TARBALL
        return podspec_source_local_prebuilt_tarball()
    when HermesEngineSourceType::BUILD_FROM_GITHUB_COMMIT
        return podspec_source_build_from_github_commit()
    when HermesEngineSourceType::BUILD_FROM_GITHUB_TAG
        return podspec_source_build_from_github_tag(react_native_path)
    when HermesEngineSourceType::BUILD_FROM_GITHUB_STABLE_BRANCH
        return podspec_source_build_from_github_stable_branch()
    when HermesEngineSourceType::DOWNLOAD_PREBUILD_RELEASE_TARBALL
        return podspec_source_download_prebuild_release_tarball(react_native_path, version)
    else
        abort "[Hermes] Unsupported or invalid source type provided: #{source_type}"
    end
end

def podspec_source_build_from_local_source_dir(react_native_path)
    source_dir_path = ENV['REACT_NATIVE_OVERRIDE_HERMES_DIR']
    if Dir.exist?(source_dir_path)
        hermes_log("Using source code from local path: #{source_dir_path}")
        tarball_dir_path = artifacts_dir()
        FileUtils.mkdir_p(tarball_dir_path) unless Dir.exist?(tarball_dir_path)
        tarball_path = File.join(tarball_dir_path, "hermes-engine-from-local-source-dir.tar.gz")
        exclude_paths = [
            "__tests__",
            "./external/flowtest",
            "./external/esprima/test_fixtures"
        ]
        .map {|path| "--exclude=#{path}"}
        .join(' ')
        tar_command = "tar #{exclude_paths} -czvf #{tarball_path} -C #{source_dir_path} . 2> /dev/null"
        success = system(tar_command)
        if !success
            abort "Failed to create a tarball with the contents of \"#{source_dir_path}\""
        end
        return {:http => "file://#{tarball_path}"}
    else
        abort <<-EOS
        [Hermes] REACT_NATIVE_OVERRIDE_HERMES_DIR is set, but points to a non-existing directory: \"#{source_dir_path}\"
        If you don't want to use local source, run `unset REACT_NATIVE_OVERRIDE_HERMES_DIR`
        EOS
    end
end

def podspec_source_local_prebuilt_tarball()
    tarball_path = ENV['HERMES_ENGINE_TARBALL_PATH']
    if File.exist?(tarball_path)
        hermes_log("Using pre-built binary from local path defined by HERMES_ENGINE_TARBALL_PATH envvar: #{tarball_path}")
        return {:http => "file://#{tarball_path}"}
    end
    abort <<-EOS
    [Hermes] HERMES_ENGINE_TARBALL_PATH is set, but points to a non-existing file: \"#{tarball_path}\"
    If you don't want to use tarball, run `unset HERMES_ENGINE_TARBALL_PATH`
    EOS
end

def podspec_source_build_from_github_commit()
    commit = ENV['HERMES_COMMIT']
    hermes_log("Using commit defined by HERMES_COMMIT envvar: #{commit}")
    return {:git => HERMES_GITHUB_URL, :commit => commit}
end

def podspec_source_build_from_github_tag(react_native_path)
    tag = File.read(hermestag_file(react_native_path)).strip

    hermes_log("Using tag defined in sdks/.hermesv1version: #{tag}")
    return {:git => HERMES_GITHUB_URL, :tag => tag}
end

HERMES_STABLE_BRANCH = "250829098.0.0-stable"

def podspec_source_build_from_github_stable_branch()
    hermes_log("Using the latest commit from #{HERMES_STABLE_BRANCH}.")
    return {:git => HERMES_GITHUB_URL, :commit => `git ls-remote #{HERMES_GITHUB_URL} #{HERMES_STABLE_BRANCH} | cut -f 1`.strip}
end

def podspec_source_download_prebuild_release_tarball(react_native_path, version)
    url = release_tarball_url(version, :debug)
    hermes_log("Using release tarball from URL: #{url}")
    download_stable_hermes(react_native_path, version, :debug)
    download_stable_hermes(react_native_path, version, :release)
    return {:http => url}
end

# HELPERS

def artifacts_dir()
    return File.join(Pod::Config.instance.project_pods_root, "hermes-engine-artifacts")
end

def hermestag_file(react_native_path)
    return File.join(react_native_path, "sdks", ".hermesv1version")
end

def release_tarball_url(version, build_type)
    ## You can use the `ENTERPRISE_REPOSITORY` variable to customise the base url from which artifacts will be downloaded.
    ## The mirror's structure must be the same of the Maven repo the react-native core team publishes on Maven Central.
    maven_repo_url =
        ENV['ENTERPRISE_REPOSITORY'] != nil && ENV['ENTERPRISE_REPOSITORY'] != "" ?
        ENV['ENTERPRISE_REPOSITORY'] :
        "https://repo1.maven.org/maven2"

    namespace = "com/facebook/hermes"
    # Sample url from Maven:
    # https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/0.14.0/hermes-ios-0.14.0-hermes-ios-debug.tar.gz
    return "#{maven_repo_url}/#{namespace}/hermes-ios/#{version}/hermes-ios-#{version}-hermes-ios-#{build_type.to_s}.tar.gz"
end

def download_stable_hermes(react_native_path, version, configuration)
    tarball_url = release_tarball_url(version, configuration)
    download_hermes_tarball(react_native_path, tarball_url, version, configuration)
end

def shared_cache_dir()
    return File.join(Dir.home, "Library", "Caches", "ReactNative")
end

def fetch_maven_sha1(tarball_url)
    sha1 = `curl -sL "#{tarball_url}.sha1"`.strip
    return sha1.downcase if $?.success? && sha1.match?(/\A[a-fA-F0-9]{40}\z/)
    nil
end

def skip_caches?
    ENV['RCT_SKIP_CACHES'] == '1'
end

def validate_hermes_tarball(path, tarball_url)
    expected_sha1 = fetch_maven_sha1(tarball_url)
    basename = File.basename(path)
    if expected_sha1.nil?
      hermes_log("SHA1 not available from Maven for #{basename}. Skipping validation.", :info)
      return true
    end
    actual_sha1 = Digest::SHA1.file(path).hexdigest
    if actual_sha1 == expected_sha1
      hermes_log("SHA1 verified for #{basename}", :info)
      return true
    end
    hermes_log("SHA1 mismatch for #{basename}: expected #{expected_sha1}, got #{actual_sha1}", :error)
    return false
end

def download_hermes_tarball(react_native_path, tarball_url, version, configuration)
    filename = configuration == nil ?
        "hermes-ios-#{version}.tar.gz" :
        "hermes-ios-#{version}-#{configuration}.tar.gz"
    destination_path = "#{artifacts_dir()}/#{filename}"

    if File.exist?(destination_path)
      hermes_log("Tarball #{filename} already exists in Pods. Skipping download.", :info)
      return destination_path
    end

    `mkdir -p "#{artifacts_dir()}"`

    if skip_caches?
      hermes_log("RCT_SKIP_CACHES is set. Downloading #{filename} directly (bypassing shared cache).", :info)
      tmp_file = "#{artifacts_dir()}/hermes-ios.download"
      `curl -A "react-native-#{version}" "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
      unless File.exist?(destination_path)
        abort("[Hermes] Failed to download #{filename} from #{tarball_url}. Aborting.")
      end
      return destination_path
    end

    cached_path = File.join(shared_cache_dir(), filename)
    if File.exist?(cached_path)
      hermes_log("Verifying checksum for cached #{filename}...", :info)
      if validate_hermes_tarball(cached_path, tarball_url)
        hermes_log("Cache hit: copying #{filename} from shared cache (#{shared_cache_dir()})", :info)
        FileUtils.cp(cached_path, destination_path)
      else
        hermes_log("Shared cache file #{filename} failed SHA verification. Re-downloading.", :info)
        File.delete(cached_path)
        tmp_file = "#{artifacts_dir()}/hermes-ios.download"
        `curl -A "react-native-#{version}" "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
        unless File.exist?(destination_path)
          abort("[Hermes] Failed to download #{filename} from #{tarball_url}. Aborting.")
        end
        hermes_log("Verifying checksum for downloaded #{filename}...", :info)
        if validate_hermes_tarball(destination_path, tarball_url)
          FileUtils.cp(destination_path, cached_path)
          hermes_log("Saved #{filename} to shared cache (#{shared_cache_dir()})", :info)
        else
          File.delete(destination_path) if File.exist?(destination_path)
          abort("[Hermes] Downloaded file #{filename} failed SHA verification. Aborting.")
        end
      end
    else
      hermes_log("Cache miss: downloading #{filename} from #{tarball_url}", :info)
      # Download to a temporary file first so we don't cache incomplete downloads.
      tmp_file = "#{artifacts_dir()}/hermes-ios.download"
      `curl -A "react-native-#{version}" "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
      unless File.exist?(destination_path)
        abort("[Hermes] Failed to download #{filename} from #{tarball_url}. Aborting.")
      end
      hermes_log("Verifying checksum for downloaded #{filename}...", :info)
      if validate_hermes_tarball(destination_path, tarball_url)
        # Save to shared cache for future use
        `mkdir -p "#{shared_cache_dir()}"`
        FileUtils.cp(destination_path, cached_path)
        hermes_log("Saved #{filename} to shared cache (#{shared_cache_dir()})", :info)
      else
        File.delete(destination_path) if File.exist?(destination_path)
        abort("[Hermes] Downloaded file #{filename} failed SHA verification. Aborting.")
      end
    end

    return destination_path
end

def resolve_url_redirects(url)
    return (`curl -Ls -o /dev/null -w %{url_effective} \"#{url}\"`)
end

# This function checks that Hermes artifact exists.
# As of now it should check it on the Maven repo.
#
# Parameters
# - version: the version of React Native
# - build_type: debug or release
def hermes_artifact_exists(tarball_url)
    # -L is used to follow redirects, useful for the nightlies
    # I also needed to wrap the url in quotes to avoid escaping & and ?.
    return (`curl -o /dev/null --silent -Iw '%{http_code}' -L "#{tarball_url}"` == "200")
end

def hermes_log(message, level = :warning)
    if !Object.const_defined?("Pod::UI")
        return
    end
    hermes_log_messgae = '[Hermes] ' + message
    case level
    when :info
        Pod::UI.puts hermes_log_messgae.green
    when :error
        Pod::UI.puts hermes_log_messgae.red
    else
        Pod::UI.puts hermes_log_messgae.yellow
    end
end
