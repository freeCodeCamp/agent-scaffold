# Releasing

Release `@freecodecamp/agent-scaffold` to npm. [release-please](https://github.com/googleapis/release-please) automates the release. It derives the version and the changelog from Conventional Commits. To cut a release, merge the Release PR.

## Prerequisites

| Requirement                 | Detail                                                                                                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub App token            | The `fcc-ops` App opens the Release PR, so CI runs on it. Install the App on this repo. Set the variable `RELEASE_PLEASE_APP_CLIENT_ID` and the secret `RELEASE_PLEASE_APP_PRIVATE_KEY`.                                                 |
| npm Trusted Publisher       | Run `npm trust github @freecodecamp/agent-scaffold --repo freeCodeCamp/agent-scaffold --file release.yml --allow-publish`. A new configuration expires after 2 days without a publish. Create it on the day that you merge a Release PR. |
| No NPM_TOKEN                | The workflow uses OIDC. Provenance attestations are automatic. Do not store an npm token.                                                                                                                                                |
| Do not rename `release.yml` | The Trusted Publisher binding uses the workflow filename. A rename breaks publishing.                                                                                                                                                    |

## First publish

npm accepts a Trusted Publisher only for a package that is already on the registry.

1. On a clean checkout of the release commit, run `pnpm install --frozen-lockfile && pnpm build`.
1. Run `npm publish --access public --auth-type=web`. Use an account with write access to the `@freecodecamp` scope.
1. Create the tag `vX.Y.Z` and a GitHub Release on the release commit. release-please starts from that tag.
1. Set the Trusted Publisher for the package. See the prerequisites table.

## Cut a release

1. Land `feat:` and `fix:` commits on `main`.
1. release-please keeps a Release PR open. The PR is named `chore(main): release X.Y.Z`. It contains the version bump and the generated `CHANGELOG.md`.
1. Review the Release PR. Merge it.
1. On merge, release-please tags `vX.Y.Z` and creates the GitHub Release. The same workflow then runs the tests and publishes to npm.

| Commit type                                | Bump            | Example                    |
| ------------------------------------------ | --------------- | -------------------------- |
| `fix:`                                     | patch           | `0.8.0` → `0.8.1`          |
| `feat:`                                    | minor           | `0.8.1` → `0.9.0`          |
| `feat!:` / `BREAKING CHANGE:`              | minor (pre-1.0) | breaking stays a 0.x minor |
| `chore:` / `docs:` / `refactor:` / `test:` | none            | no release                 |

`bump-minor-pre-major: true` in [`../release-please-config.json`](../release-please-config.json) keeps a breaking change at minor before 1.0. To cut `1.0.0`, add a `Release-As: 1.0.0` footer to a commit.

## What `release.yml` does

Each job after release-please runs only when `release_created` is `'true'`. All jobs stay in one workflow, so no PAT is needed.

| Job            | Gate              | Action                                                                                                                        |
| -------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| release-please | always            | Maintains the Release PR. On merge: tags `vX.Y.Z`, creates the Release, sets `release_created`.                               |
| test           | `release_created` | Runs the reusable `test.yml`: lint, `pnpm vitest run`, and typecheck.                                                         |
| publish        | `release_created` | Runs `npm publish --provenance --access public --tag latest` through Trusted Publisher OIDC. It works only in GitHub Actions. |
