# scripts/releases-ci

CI-only release scripts — intended to run from a CI workflow (GitHub Actions).

## Commands

For information on command arguments, run `node <command> --help`.

### `prepare-package-for-release`

Prepares files within the `react-native` package and template for the target release version. Writes a new commit and tag, which will trigger `publish-npm.js` in a new workflow.

### `publish-npm`

Prepares release artifacts and publishes the `react-native` package to npm.

### `cleanup-maven-staging-repositories`

Drops Sonatype staging repositories that exactly match the description in
`ORG_GRADLE_PROJECT_SONATYPE_REPOSITORY_DESCRIPTION`, along with any associated
unpublished Central Portal deployments.

### `publish-updated-packages`

Publishes all updated packages (excluding `react-native`) to npm. Triggered when a commit on a release branch contains `#publish-packages-to-npm`.
