/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {summarize} = require('./compare');

// GitHub limits check run output text to 65535 characters and 50 images.
const MAX_TEXT_LENGTH = 60000;
const MAX_IMAGES = 50;

const STATUS_LABELS = {
  changed: 'Changed',
  'dimension-mismatch': 'Size changed',
  added: 'New',
  removed: 'Removed',
  unchanged: 'Unchanged',
};

// GitHub limits comment bodies to 65536 characters. Each changed test costs
// about 1 KB of Markdown, so later tests are listed by name only.
const MAX_COMMENT_TESTS = 20;

const COMMENT_MARKER = '<!-- rn-visual-regression-report -->';

function formatPercent(ratio) {
  return ratio == null ? '' : `${(ratio * 100).toFixed(3)}%`;
}

/** How a differing result changed, for example "9633 px (17.502%)". */
function describeChange(result) {
  if (result.status === 'dimension-mismatch') {
    return `${result.expectedSize.width}×${result.expectedSize.height} → ${result.capturedSize.width}×${result.capturedSize.height}`;
  }
  return result.diffPixels != null
    ? `${result.diffPixels} px (${formatPercent(result.diffRatio)})`
    : '';
}

function heading(result) {
  const change = describeChange(result);
  return `\`${result.id}\`: ${STATUS_LABELS[result.status]}${change ? `, ${change}` : ''}`;
}

/**
 * Renders one platform's comparison as GitHub check run output. `imageUrl`
 * maps (kind, test ID) to the public URL of an uploaded expected, captured
 * or diff image.
 */
function renderCheckOutput({
  platform,
  environmentKey,
  baseline,
  results,
  imageUrl,
  error,
}) {
  if (error != null) {
    return {
      title: `${platform}: ${error.title}`,
      summary: error.summary,
      text: '',
      images: [],
    };
  }

  const {counts, hasDifferences} = summarize(results);
  const differing = results.filter(result => result.status !== 'unchanged');
  const baselineLine =
    baseline.distance === 0
      ? `Compared with the baseline for base commit \`${baseline.sha.slice(0, 12)}\`.`
      : `No baseline was published for the base commit, so this compares with the nearest ancestor that has one, \`${baseline.sha.slice(0, 12)}\` (${baseline.distance} commit(s) earlier). Differences can come from commits in between.`;

  const summary = [
    hasDifferences
      ? `${differing.length} of ${results.length} visual test(s) differ.`
      : `All ${results.length} visual test(s) match.`,
    '',
    baselineLine,
    '',
    `Environment: \`${environmentKey}\``,
    '',
    Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => `${STATUS_LABELS[status]}: ${count}`)
      .join(' · '),
  ].join('\n');

  const sections = [];
  const images = [];
  for (const result of differing) {
    const row = [];
    const cell = kind => `<img src="${imageUrl(kind, result.id)}" width="300">`;
    if (result.expected != null) {
      row.push(['Expected', cell('expected')]);
    }
    if (result.captured != null) {
      row.push(['Captured', cell('captured')]);
    }
    if (result.hasDiffImage) {
      row.push(['Diff', cell('diff')]);
    }
    const details = describeChange(result);
    sections.push(
      [
        `### ${heading(result)}`,
        '',
        `| ${row.map(([label]) => label).join(' | ')} |`,
        `|${row.map(() => '---').join('|')}|`,
        `| ${row.map(([, html]) => html).join(' | ')} |`,
      ].join('\n'),
    );
    if (result.hasDiffImage && images.length < MAX_IMAGES) {
      images.push({
        alt: `${result.id} diff`,
        image_url: imageUrl('diff', result.id),
        caption: `${result.id}: ${details}`,
      });
    }
  }

  let text = sections.join('\n\n');
  if (text.length > MAX_TEXT_LENGTH) {
    text = `${text.slice(0, MAX_TEXT_LENGTH)}\n\n…truncated. See results.json for the full list.`;
  }

  return {
    title: hasDifferences
      ? `${platform}: ${differing.length} visual difference(s)`
      : `${platform}: no visual differences`,
    summary,
    text,
    images,
  };
}

/**
 * Renders the pull request comment for all platforms. Each changed test
 * shows its diff, with the expected and captured images in a collapsed
 * section. `platforms` carry the same fields as `renderCheckOutput` takes,
 * plus `checkUrl`, the platform's check run.
 */
function renderPullRequestComment({platforms, headSha, gateSummary}) {
  const differing = platforms.flatMap(platform =>
    platform.error != null
      ? []
      : platform.results
          .filter(result => result.status !== 'unchanged')
          .map(result => ({platform, result})),
  );
  const lines = [COMMENT_MARKER, '## Visual regression', ''];
  lines.push(
    differing.length > 0
      ? `**${differing.length} visual difference(s)** at \`${headSha.slice(0, 12)}\`. ${gateSummary}`
      : `No visual differences at \`${headSha.slice(0, 12)}\`.`,
    '',
  );
  for (const platform of platforms) {
    if (platform.error != null) {
      lines.push(
        `**${platform.platform}:** [${platform.error.title}](${platform.checkUrl})`,
        '',
      );
    }
  }

  for (const [index, {platform, result}] of differing.entries()) {
    if (index === MAX_COMMENT_TESTS) {
      lines.push(
        `${differing.length - index} more:`,
        '',
        ...differing
          .slice(index)
          .map(
            ({platform: more, result: rest}) =>
              `- ${more.platform} ${heading(rest)}, [check run](${more.checkUrl})`,
          ),
        '',
      );
      break;
    }
    const image = (kind, width) =>
      `<img src="${platform.imageUrl(kind, result.id)}" width="${width}" alt="${kind}">`;
    lines.push(`### ${platform.platform} ${heading(result)}`, '');
    if (result.hasDiffImage) {
      lines.push(image('diff', 360), '');
    }
    const panels = [];
    if (result.expected != null) {
      panels.push(['Expected', image('expected', 250)]);
    }
    if (result.captured != null) {
      panels.push(['Captured', image('captured', 250)]);
    }
    if (panels.length > 0) {
      lines.push(
        `<details${result.hasDiffImage ? '' : ' open'}><summary>${panels
          .map(([label]) => label)
          .join(' and ')}</summary>`,
        '',
        `| ${panels.map(([label]) => label).join(' | ')} |`,
        `|${panels.map(() => '---').join('|')}|`,
        `| ${panels.map(([, html]) => html).join(' | ')} |`,
        '',
        '</details>',
        '',
      );
    }
  }
  return lines.join('\n');
}

module.exports = {COMMENT_MARKER, renderCheckOutput, renderPullRequestComment};
