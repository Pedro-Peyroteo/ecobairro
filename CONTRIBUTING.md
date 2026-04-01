# Contributing

## Purpose

This document defines the basic workflow, quality expectations, and collaboration rules for this repository.

The goal is to keep the project consistent, reviewable, and safe to evolve.

---

## Repository Workflow

- `main` is the protected branch
- no one pushes directly to `main`
- all changes go through pull requests
- pull requests are merged using **Squash**
- feature branches should be short-lived

### Branch naming

Use one of the following prefixes:

- `feat/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for internal restructuring
- `test/` for test-related work
- `chore/` for maintenance and tooling

### Examples

- `feat/report-submission`
- `fix/map-filter-state`
- `docs/domain-map`
- `chore/ci-setup`

---

## Pull Requests

### Before opening a PR

Make sure your branch:

- is up to date with `main`
- builds successfully
- passes relevant tests
- does not include unrelated changes

### PR rules

- every change must be submitted through a pull request
- at least **1 approval** is required
- all review conversations must be resolved
- stale approvals are dismissed automatically when new commits are pushed
- code owner review is required when applicable

### PR title style

Use a short, descriptive title because it becomes the squash commit message.

Examples:

- `feat(api): add report submission flow`
- `fix(web): correct map filter reset`
- `docs(architecture): define domain ownership`

### PR description should include

- what changed
- why it changed
- important implementation notes
- screenshots if UI changed
- known limitations or follow-ups

---

## Commit Guidelines

Prefer small, focused commits.

Recommended format:

- `feat: add telemetry ingestion endpoint`
- `fix: prevent duplicate report submission`
- `docs: add system scope and goals`
- `refactor: isolate report validation service`

Do not mix unrelated concerns in the same commit.

---

## Coding Expectations

### General

- keep code simple and readable
- prefer explicit naming over cleverness
- avoid large unreviewable pull requests
- keep business logic close to the module that owns it

### Shared code

- only place code in shared packages if it is truly shared
- do not move domain logic into shared packages unnecessarily

### Documentation

Update documentation when changing:

- architecture
- service responsibilities
- major workflows
- shared contracts
- repository structure

If a change affects architecture significantly, add or update an ADR.

---

## Architecture-Sensitive Changes

These changes require extra care:

- new app or service
- changes to repo structure
- changes to shared contracts
- changes to database ownership
- queue / worker model changes
- infrastructure / CI / deployment changes

For these changes:

- document the reasoning
- call out trade-offs in the PR
- update architecture docs when needed

---

## Security Basics

- never commit real secrets
- never commit `.env` files with real values
- use `.env.example` for documented variables only
- report exposed secrets immediately and rotate them

---

## Code Owners

Some folders may require review from designated maintainers through `CODEOWNERS`.

---

## Definition of Done

A change is considered done when:

- code is implemented
- relevant tests pass
- documentation is updated if needed
- PR is reviewed
- conversations are resolved
- the change is merged through squash merge
