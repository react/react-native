# RNTester visual tests

Visual tests capture screenshots of RNTester examples in CI and compare them with the screenshots of the same tests on `main`. They catch rendering changes, particularly in text layout, that functional E2E tests don't.

Each test is a [Maestro](https://maestro.dev) flow in `flows/`. Maestro only opens the example and takes the screenshot - comparison happens afterwards in CI, so a flow never decides whether it passed.

## How it runs in CI

1. Test All builds RNTester Release for Android and iOS. Once a build is ready, the `test_visual_android_rntester` and `test_visual_ios_rntester` jobs (`.github/workflows/visual-capture-rntester.yml`) run every flow in this directory on one canonical device per platform: an API 35 Pixel 7 emulator and an iPhone 17 Pro simulator on iOS 26.2. They upload the screenshots and a manifest of the device environment as `visual-capture-android` and `visual-capture-ios` artifacts.
2. When Test All completes, Visual Compare RNTester (`.github/workflows/visual-compare-rntester.yml`) compares the screenshots with the baseline and reports a `Visual regression (android)` and `Visual regression (ios)` check and a `Visual regression approval` gate, plus a single PR comment with the expected, captured and diff images for anything that changed.
3. On pushes to `main`, the captures become the baseline for that commit.

The baseline for a PR is the one for the commit it's based on, or the nearest earlier commit on `main` that has one. Baselines are keyed by device environment too (OS image, screen size, density, font scale, locale and so on), so a change to the CI device starts a fresh baseline rather than failing every PR.

## Adding a test

1. Pick or add an RNTester example, and give its root view a `testID`. Keep the example's content fixed: no dates, random values, network images or animations that are still running when the screenshot is taken.
2. Add a flow to `flows/`. File names must be unique, and each `takeScreenshot` path becomes the test ID, so make it descriptive:

   ```yaml
   appId: ${APP_ID}
   ---
   - runFlow:
       file: ../helpers/open-example.yml
       env:
         EXAMPLE_URL: rntester://example/TextExample/textWidthMode
   - extendedWaitUntil:
       visible:
         id: 'text-width-mode-example'
       timeout: 15000
   - takeScreenshot:
       path: ${VISUAL_OUTPUT_DIR}/text/width-mode/default
       cropOn:
         id: 'text-width-mode-example'
   ```

   `open-example.yml` deep-links to `rntester://example/<module>/<example>`. Wait for something that's only visible once the example has rendered, and crop to the example's `testID` so that the status bar and surrounding UI aren't part of the screenshot.

3. Open a PR. The new test has no baseline yet, so the report lists it as new, and like any other difference it needs a maintainer's approval (see below). Once the PR lands, `main` is captured with it and later PRs are compared against that.

To try a flow locally, build and install RNTester Release on a simulator or emulator and run it with Maestro:

```sh
maestro test \
  -e APP_ID=com.meta.RNTester.localDevelopment \
  -e VISUAL_OUTPUT_DIR=/tmp/visual \
  packages/rn-tester/visual-tests/flows/text-width-mode.yml
```

Use `com.facebook.react.uiapp` as the `APP_ID` on Android. Local screenshots are only useful for checking the flow and the crop - they won't match CI's pixel for pixel unless you use the same device and OS image.

## When a check fails

Open the PR comment or the check run and compare the expected, captured and diff images.

- If the change is unintended, fix it and push.
- If it's intended, a maintainer applies the `visual-change-approved` label. The approval covers the exact set of differences in the report: if a later push changes them, the label is removed and the PR needs a new review. The baseline itself only changes once the PR lands and `main` is captured again.

## Tolerances

Comparison is strict by default: any changed pixel is a difference. If a test is genuinely nondeterministic, loosen it for that test in `config.json`, keyed by test ID, and say why in the PR:

```json
{
  "defaults": {"threshold": 0, "includeAA": true, "maxDiffPixels": 0},
  "tests": {
    "text/width-mode/default": {"maxDiffPixels": 20}
  }
}
```

`threshold` is pixelmatch's per-pixel color distance from 0 to 1, `includeAA` counts anti-aliased pixels, and `maxDiffPixels` and `maxDiffRatio` set how many changed pixels (or what share of the image) can pass. Prefer making the example deterministic over adding a tolerance.
