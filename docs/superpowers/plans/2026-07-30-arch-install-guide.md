# Interactive Arch Install Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a Vietnamese, interactive, step-by-step Arch Linux reinstall guide to the existing Vibe Workspace HTML guide.

**Architecture:** Extend the established static guide rather than creating a new visual system. A new `arch-install.html` page owns the installation content; shared CSS owns checklist presentation; shared JavaScript owns progress persistence, copy buttons, backup gating, reset, and search integration.

**Tech Stack:** Semantic HTML, shared CSS, vanilla JavaScript, localStorage, Node built-in test runner, Bash static checks.

---

### Task 1: Test checklist state and page contract

**Files:**
- Create: `tests/guide-checklist.test.js`
- Create: `tests/guide-arch-install.test.sh`
- Modify: `guide/assets/app.js`

- [x] Write Node tests requiring `calculateProgress`, `readChecklist`, and `writeChecklist` from `guide/assets/app.js`.
- [x] Write shell assertions for nine stages, unique task IDs, backup gate, progress, copy controls, official links, navigation, and index card.
- [x] Run `node --test tests/guide-checklist.test.js` and `bash tests/guide-arch-install.test.sh`; confirm both fail because the behavior and page do not exist.
- [x] Add the minimal pure checklist utilities and CommonJS export while preserving browser startup.
- [x] Run the Node tests and confirm they pass.

### Task 2: Build the interactive guide

**Files:**
- Create: `guide/arch-install.html`
- Modify: `guide/assets/style.css`
- Modify: `guide/assets/app.js`

- [x] Create nine semantic stages covering preflight, backup, ISO, firmware, live network, archinstall, reboot, dotfiles restore, and Qtile verification.
- [x] Add explicit full-disk warnings, copyable commands, official Arch references, and a backup prerequisite before the destructive stage.
- [x] Add checklist progress, persisted checkbox state, copy feedback, reset confirmation, and current-page search.
- [x] Add responsive, print, focus-visible, disabled, complete, and reduced-motion styles in the incumbent paper/manual visual language.
- [x] Run both guide test suites and fix failures without weakening assertions.

### Task 3: Navigation, documentation, and visual verification

**Files:**
- Modify: `guide/assets/app.js`
- Modify: `guide/index.html`
- Modify: `guide/README.md`

- [x] Register `08 · Cài Arch mới` in the shared sidebar.
- [x] Add an Arch installation card to the guide index and document the new page and interaction conventions.
- [x] Validate HTML structure, JavaScript syntax, all local links, desktop layout, mobile layout, keyboard controls, copy feedback, progress persistence, backup gating, reset, dark theme, and print mode.
- [x] Run the Impeccable mechanical detector once on all changed guide targets and address material findings.
- [x] Run all existing repository tests, `git diff --check`, and review the final diff.
