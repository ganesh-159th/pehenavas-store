# Contributing to Pehenavas Store

Thanks for taking the time to contribute! 🎉 This guide will help you get set up and explain the conventions we use so everyone stays on the same page.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Local Setup](#local-setup)
- [Branch Naming](#branch-naming)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs & Feature Requests](#reporting-bugs--feature-requests)

## Code of Conduct

Be respectful, constructive, and inclusive. Harassment, discrimination, and
personal attacks are not tolerated. Focus on the code, not the person.

## Getting Started

1. **Fork** the repository and **clone** your fork locally.
2. Create a **feature branch** (see [Branch Naming](#branch-naming)).
3. Make your changes, add tests where appropriate.
4. Open a **pull request** back to `main`.

## Local Setup

Follow the full instructions in [LOCAL_SETUP.md](./LOCAL_SETUP.md). The short version:

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the backend server (Express + Firebase)
npm run server

# 3. Start the frontend (in a second terminal)
npm run dev
```

Open **http://localhost:3000/** in your browser.

> 💡 Prefer Docker? Run `docker compose up --build` instead — see
> [LOCAL_SETUP.md](./LOCAL_SETUP.md) for details.

### Environment Variables

Copy `.env.example` to `.env` and fill in the values you need:

```bash
cp .env.example .env
```

At minimum, the server needs `FIREBASE_SERVICE_ACCOUNT_B64` (the base64 of the
Firebase Admin SDK JSON). `VITE_*` variables are used at build time; see the
[README](./README.md) for the full list.

## Branch Naming

Use descriptive, kebab-case branch names prefixed by their purpose:

| Prefix | Use for                     | Example                          |
|--------|-----------------------------|----------------------------------|
| `feat/` | New features or modules     | `feat/add-wishlist-export`       |
| `fix/`  | Bug fixes                   | `fix/cart-price-calculation`     |
| `docs/` | Documentation only changes  | `docs/update-readme`             |
| `refactor/` | Code refactoring       | `refactor/split-checkout-forms`  |
| `test/` | Adding/fixing tests         | `test/cover-payment-verification` |
| `chore/`| Tooling, deps, CI           | `chore/upgrade-cypress`          |
| `perf/` | Performance improvements    | `perf/lazy-load-product-images`  |

Example: `git checkout -b feat/add-wishlist-export`

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/). This keeps
the history readable and can auto-generate changelogs.

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat` — a new feature
- `fix` — a bug fix
- `docs` — documentation only
- `style` — formatting, whitespace (no code change)
- `refactor` — refactoring (no behavior change)
- `perf` — performance improvement
- `test` — adding/fixing tests
- `chore` — build tooling, dependencies, CI

**Examples:**

```
feat: add size picker to wishlist modal
fix(cart): correct subtotal when quantity reaches zero
docs: clarify production env var requirements
chore(ci): cache the Cypress binary across runs
```

Keep the subject line under 50 characters, use the imperative mood ("add",
"fix", not "added"/"fixes"), and don't end it with a period.

## Pull Request Process

1. Pull request titles should follow the same conventional-commit style, e.g.
   `feat: add wishlist export`.
2. Reference the issue your PR closes, e.g. `Closes #26`.
3. Fill out the [PR template](./.github/PULL_REQUEST_TEMPLATE.md) — include a
   short summary, what changed, how it was tested, and a screenshot/video if it
   touches the UI.
4. Make sure CI passes. This includes lint, build, unit tests with the
   coverage threshold, and E2E tests.
5. Keep PRs small and focused. One logical change per PR makes review faster.


## Reporting Bugs & Feature Requests

Please use the issue templates — they help us get the context we need to act
quickly:

- **Bug report** → [Bug report template](./.github/ISSUE_TEMPLATE/bug_report.yml)
- **Feature request** → [Feature request template](./.github/ISSUE_TEMPLATE/feature_request.yml)

When reporting a bug, include steps to reproduce, expected vs. actual behavior,
screenshots, and your environment (browser/OS, commit hash if possible).
