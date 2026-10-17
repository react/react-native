/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {
  MANIFEST_VERSION,
  PLATFORMS,
  SHA_PATTERN,
  TEST_ID_PATTERN,
  sha256,
} = require('./manifest');
const {readPngDimensions} = require('./png');
const fs = require('fs');
const path = require('path');

const LIMITS = {
  maxImages: 200,
  maxImageBytes: 5 * 1024 * 1024,
  maxTotalBytes: 100 * 1024 * 1024,
  maxDimension: 4096,
  maxManifestBytes: 1024 * 1024,
};

const ENVIRONMENT_KEY_PATTERN = /^(android|ios)-[a-z0-9.-]{1,120}-[0-9a-f]{8}$/;

/**
 * Validates a capture artifact produced by untrusted pull request code. The
 * artifact is data only: nothing in it is executed, and every path is checked
 * before it is read. Returns the parsed manifest, or throws an Error listing
 * every problem found.
 */
function validateCapture(captureDir, limits = LIMITS) {
  const errors = [];
  const manifestPath = path.join(captureDir, 'manifest.json');
  const manifestStat = lstatOrNull(manifestPath);
  if (manifestStat == null || !manifestStat.isFile()) {
    throw new Error('manifest.json is missing or not a regular file');
  }
  if (manifestStat.size > limits.maxManifestBytes) {
    throw new Error(
      `manifest.json is larger than ${limits.maxManifestBytes} bytes`,
    );
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`manifest.json is not valid JSON: ${error.message}`);
  }

  if (manifest?.version !== MANIFEST_VERSION) {
    errors.push(`Unsupported manifest version: ${String(manifest?.version)}`);
  }
  if (!PLATFORMS.includes(manifest?.platform)) {
    errors.push(`Unknown platform: ${String(manifest?.platform)}`);
  }
  if (
    typeof manifest?.environmentKey !== 'string' ||
    !ENVIRONMENT_KEY_PATTERN.test(manifest.environmentKey) ||
    !manifest.environmentKey.startsWith(`${manifest.platform}-`)
  ) {
    errors.push(`Invalid environment key: ${String(manifest?.environmentKey)}`);
  }
  for (const field of ['testedSha', 'baseSha', 'headSha']) {
    if (!SHA_PATTERN.test(String(manifest?.git?.[field]))) {
      errors.push(`Invalid git.${field}`);
    }
  }

  const images = Array.isArray(manifest?.images) ? manifest.images : null;
  if (images == null) {
    errors.push('images must be an array');
  } else if (images.length > limits.maxImages) {
    errors.push(`Too many images: ${images.length} > ${limits.maxImages}`);
  } else {
    const seen = new Set();
    let totalBytes = 0;
    for (const image of images) {
      const id = String(image?.id);
      if (!TEST_ID_PATTERN.test(id)) {
        errors.push(`Invalid test ID: ${JSON.stringify(image?.id)}`);
        continue;
      }
      if (seen.has(id)) {
        errors.push(`Duplicate test ID: ${id}`);
        continue;
      }
      seen.add(id);
      // The path is derived from the validated ID, never taken from the
      // manifest, so it cannot escape the capture directory.
      if (image.path !== `${id}.png`) {
        errors.push(`${id}: path must be ${id}.png`);
        continue;
      }
      const imagePath = path.join(captureDir, ...id.split('/')) + '.png';
      const stat = lstatOrNull(imagePath);
      if (stat == null || !stat.isFile()) {
        errors.push(`${id}: file is missing or not a regular file`);
        continue;
      }
      if (stat.size > limits.maxImageBytes) {
        errors.push(
          `${id}: ${stat.size} bytes exceeds ${limits.maxImageBytes}`,
        );
        continue;
      }
      totalBytes += stat.size;
      const buffer = fs.readFileSync(imagePath);
      const dimensions = readPngDimensions(buffer);
      if (dimensions == null) {
        errors.push(`${id}: not a PNG`);
        continue;
      }
      if (
        dimensions.width === 0 ||
        dimensions.height === 0 ||
        dimensions.width > limits.maxDimension ||
        dimensions.height > limits.maxDimension
      ) {
        errors.push(
          `${id}: ${dimensions.width}x${dimensions.height} is outside 1-${limits.maxDimension} px`,
        );
        continue;
      }
      if (
        image.width !== dimensions.width ||
        image.height !== dimensions.height ||
        image.bytes !== stat.size ||
        image.sha256 !== sha256(buffer)
      ) {
        errors.push(`${id}: file does not match its manifest entry`);
      }
    }
    if (totalBytes > limits.maxTotalBytes) {
      errors.push(`Total size ${totalBytes} exceeds ${limits.maxTotalBytes}`);
    }
    const unlisted = listFiles(captureDir).filter(
      file => file !== 'manifest.json' && !seen.has(file.replace(/\.png$/, '')),
    );
    if (unlisted.length > 0) {
      errors.push(
        `Files not in the manifest: ${unlisted.slice(0, 10).join(', ')}`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid capture artifact:\n- ${errors.join('\n- ')}`);
  }
  return manifest;
}

function lstatOrNull(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch {
    return null;
  }
}

function listFiles(root) {
  const files = [];
  const visit = (directory, prefix) => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(path.join(directory, entry.name), relative);
      } else {
        files.push(relative);
      }
    }
  };
  visit(root, '');
  return files;
}

module.exports = {LIMITS, validateCapture};
