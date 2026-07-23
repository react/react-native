#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Bundles packager image assets into a compiled asset catalog (RNAssets.bundle)
# inside the app, where the native image loader resolves them by name. Sourced
# by react-native-xcode.sh.
#
# The feature is opt-in via the RCTUseAssetCatalog key in the app's Info.plist,
# which is the same key the native image loader reads, so bundling and runtime
# cannot disagree on where image assets live. The catalog is fully owned by
# these functions (staged in derived files, compiled with actool into the app's
# resources next to the js bundle), so the app's Xcode project needs no
# changes. Apps that have not migrated are unaffected.
#
# After changing the RCTUseAssetCatalog key, do a clean build: incremental
# builds do not remove image assets a previous build placed in the app with the
# other setting (they are unused but add dead weight).

# Prints the directory the bundler should emit image assets into (via
# --asset-catalog-dest), or nothing if the app has not opted into the asset
# catalog with the RCTUseAssetCatalog Info.plist key.
asset_catalog_staging_dir() {
  [[ "$BUNDLE_PLATFORM" == "ios" && -n "$PRODUCT_SETTINGS_PATH" ]] || return 0

  local use_asset_catalog
  use_asset_catalog="$(/usr/libexec/PlistBuddy -c 'Print :RCTUseAssetCatalog' "$PRODUCT_SETTINGS_PATH" 2>/dev/null || true)"
  # Accept the value forms NSBundle's boolValue treats as true, so this check
  # cannot disagree with the native runtime check.
  case "$(echo "$use_asset_catalog" | tr '[:upper:]' '[:lower:]')" in
    true | yes | 1) ;;
    *) return 0 ;;
  esac

  local staging_dir="${DERIVED_FILE_DIR:-$(mktemp -d)}/rn-assets"
  rm -rf "$staging_dir"
  mkdir -p "$staging_dir/RNAssets.xcassets"
  printf '%s\n' "$staging_dir"
}

# Compiles the staging catalog ($1, as returned by asset_catalog_staging_dir)
# into RNAssets.bundle inside the app. The compiled Assets.car resolves the
# right scale by name at runtime, see
# https://developer.apple.com/documentation/xcode/managing-assets-with-asset-catalogs
asset_catalog_compile() {
  local staging_dir="$1"
  local rn_assets_bundle="$DEST/RNAssets.bundle"
  # Always remove first so a stale bundle from a previous build does not ship
  # when the app opts out or has no image assets.
  rm -rf "$rn_assets_bundle"
  [[ -n "$staging_dir" ]] || return 0
  if [[ -z "$(find "$staging_dir/RNAssets.xcassets" -maxdepth 1 -name '*.imageset' -print -quit)" ]]; then
    return 0
  fi

  mkdir -p "$rn_assets_bundle"
  local actool_args=("--platform" "${PLATFORM_NAME:-iphoneos}")
  # These are always iOS-family image assets (this runs only for BUNDLE_PLATFORM
  # "ios", which includes Mac Catalyst), so the deployment target must be an iOS
  # version. On Catalyst the platform is macosx but MACOSX_DEPLOYMENT_TARGET is a
  # macOS version (e.g. 10.15); passing that as the target makes actool silently
  # emit loose files instead of a compiled Assets.car, so it must not be used.
  actool_args+=("--minimum-deployment-target" "${IPHONEOS_DEPLOYMENT_TARGET:-15.1}")
  case "${TARGETED_DEVICE_FAMILY:-1}" in *1*) actool_args+=("--target-device" "iphone") ;; esac
  case "${TARGETED_DEVICE_FAMILY:-1}" in *2*) actool_args+=("--target-device" "ipad") ;; esac
  if [[ "${IS_MACCATALYST:-NO}" == "YES" ]]; then
    actool_args+=("--ui-framework-family" "uikit")
  fi

  # Surface actool diagnostics in the build log: without these flags actool
  # suppresses them entirely, and it exits 0 even when it drops an imageset.
  local actool_output
  actool_output="$(xcrun actool "$staging_dir/RNAssets.xcassets" \
    --compile "$rn_assets_bundle" \
    --output-format human-readable-text \
    --errors --warnings --notices \
    "${actool_args[@]}" 2>&1)" || true
  echo "$actool_output"
  if [[ ! -f "$rn_assets_bundle/Assets.car" ]]; then
    echo "error: failed to compile image assets into RNAssets.bundle. See actool output above." >&2
    exit 2
  fi

  cat > "$rn_assets_bundle/Info.plist" <<'RN_ASSETS_PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>org.reactjs.RNAssets</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>RNAssets</string>
  <key>CFBundlePackageType</key>
  <string>BNDL</string>
</dict>
</plist>
RN_ASSETS_PLIST
}
