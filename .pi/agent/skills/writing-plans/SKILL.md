---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. Always writes Spec-Driven Multi-Agent plans with parallel BE/FE lanes and fixed pi-subagents model routing.
---

# Writing Plans (Spec-Driven Multi-Agent, Parallel-First)

## Overview

Write comprehensive implementation plans for **spec-driven, multi-agent execution** that **run independent work in parallel** instead of one slow sequential agent chain.

Assume implementers are skilled but have **zero prior context** for this codebase and only see their own task brief. The plan must carry everything: files, interfaces, tests, commands, **lane (BE/FE/shared)**, **wave (parallel group)**, and **which subagent + model** owns each step.

**Announce at start:** "I'm using the writing-plans skill (spec-driven multi-agent, parallel-first) to create the implementation plan."

**This local skill overrides the Superpowers default.** Do not ask the user to restate agent/model or parallelism preferences — use the rules below unless they explicitly override for this plan.

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

**Context:** Worktrees for parallel writers are declared in the plan (`worktree: true`) and created at execution time — not while writing the plan.

---

## Spec-Driven Multi-Agent Defaults (always apply)

### Binding authority

1. **Spec** (design doc) is the source of truth for *what* and *why*.
2. **Plan** is the executable argument of the spec — *how*, task-by-task, **wave-by-wave**.
3. Executors must not re-brainstorm scope. Gaps → record a ruling or stop on irreversible risk.

### Default execution stack

| Role | pi-subagents agent | Model | Thinking | Notes |
|------|--------------------|-------|----------|-------|
| Parent orchestrator | *(main session)* | `xai/grok-4.5` | medium | Owns ledger, **parallel dispatch**, merge/handoff; does not bulk-implement |
| Recon / codebase map | `scout` | `alibaba-plan/deepseek-v4-flash-0731` | medium | Read-only; may run **parallel scouts** for BE vs FE trees |
| External facts / docs | `researcher` | `alibaba-plan/deepseek-v4-flash-0731` | medium | Only when tasks need web/docs evidence |
| Implementer (per task) | `worker` | `alibaba-plan/deepseek-v4-flash-0731` | medium | Fresh context per task; edits + tests |
| Task / final reviewer | `reviewer` | `xai/grok-4.5` | medium | Fresh context; may run **parallel** per lane or angle |
| Hard judgment call | `oracle` | `openai-codex/gpt-5.6-sol` | medium | No edits; only when decision is risky |
| Generic delegate | `delegate` | `xai/grok-4.5` | medium | Rare; prefer named roles above |

Keep this table in every plan header (copy as-is). If `settings.json` → `subagents.agentOverrides` differs, **settings win** — note the delta in the plan header.

---

## Parallel-first planning (mandatory)

**Default is parallel, not sequential.** Sequential “Task 1 → Task 2 → Task 3” is a **plan smell** unless a real data/interface dependency forces it.

### Goals

- Finish faster by running **many workers at once** when tasks do not share write sets.
- Prefer **BE lane ∥ FE lane** (and other independent lanes: mobile, infra, docs-tests) over a single queue.
- Parent orchestrates waves; never make the user wait on a full serial agent pipeline.

### How to decompose for speed

1. **Lock shared contracts early (Wave 0 or Wave 1 shared):** API types, routes, events, schema, DTOs, feature flags — small, explicit, testable.
2. **Split lanes** after contracts exist:
   - **BE** — services, DB, API handlers, server tests
   - **FE** — UI, client state, hooks, component tests
   - **Shared / glue** — only when both lanes must touch the same files (avoid; prefer adapters)
3. **Assign every task:**
   - `Lane:` `BE` | `FE` | `shared` | `infra` | `docs`
   - `Wave:` integer — tasks with the **same wave** run **concurrently**
   - `Depends on:` task ids that must complete before this wave starts
   - `Parallel group:` short name (e.g. `be-api`, `fe-pages`) for `runs.all` keys
4. **File disjointness:** tasks in the same wave **must not write the same files**. If they would, split further, move one to a later wave, or mark `shared` serial.
5. **Parallel writers → `worktree: true`** on each concurrent implementer task so pi-subagents isolation applies; parent merges handoff patches after the wave.
6. **Reviews parallelize too:** after a wave of N implementers, dispatch N fresh reviewers (or 1 reviewer per lane) via `runs.all`, not one-by-one unless a reviewer must see the full merged tree.
7. **Integration wave last:** thin glue + e2e only after BE/FE lane waves land.

### Required orchestration shape

```text
Wave 0 (optional): scout BE ∥ scout FE  (and/or researcher)
Wave 1: shared contracts (serial if single file set; else parallel disjoint contract tasks)
Wave 2..K: BE tasks ∥ FE tasks  (workers in parallel; worktree: true)
         → reviewers in parallel per completed task/lane
Wave final: integration/e2e (serial or small parallel) → parallel final reviewers
```

Use pi-subagents style dispatch in the plan’s execution notes:

```text
runs.all([ be-task-a, be-task-b, fe-task-c, fe-task-d ])  # same wave
# then
runs.all([ review-a, review-b, review-c, review-d ])
```

### Anti-patterns (do not write plans like this)

- One long chain: worker₁ → reviewer₁ → worker₂ → reviewer₂ → … with no waves
- FE blocked on full BE completion when only a DTO/OpenAPI contract was required
- Multiple workers editing the same file in one wave without worktrees/merge plan
- “Then do the frontend” as a single mega-task after all backend tasks

### When sequential is required

Only for true dependencies: migration before code that needs columns; package bootstrap before imports; shared type file that cannot be split. Document **why** in `Depends on`.

### Required execution skill after plan approval

- **Default:** `subagent-driven-development` via `pi-subagents`, honoring **waves + `runs.all`**
- Fallback only if user explicitly refuses subagents: `executing-plans` inline (still follow wave order; parallel becomes best-effort in one session)
- Do **not** ask “subagent vs inline” as an open question — **recommend parallel Subagent-Driven**

### Dispatch rules (write into the plan)

- One **fresh** `worker` per task (`context: "fresh"`)
- Same-wave implementers: **start together** (`runs.all` / parallel subagents)
- Same-wave implementers that write code: **`worktree: true`** unless the plan proves a single-writer wave
- One **fresh** `reviewer` per completed task (or per lane bundle); **parallelize reviews**
- Final broad review: parallel angles (correctness / tests / simplicity / BE-FE contract)
- Parent keeps a ledger of waves, handoff manifests, and rulings
- Workers never inherit full parent chat — only task brief + spec path + interfaces + contract artifacts

---

## Scope Check

If the spec covers multiple independent subsystems, prefer **one plan with multiple lanes/waves**, or separate plans per subsystem if release trains differ. Each plan must produce working, testable software.

## File Structure

Before tasks, map files to create/modify and each file’s responsibility.

- Clear boundaries and interfaces (**contracts first**)
- Prefer smaller focused files so BE/FE waves stay file-disjoint
- Files that change together live together **within a lane**
- Follow existing codebase patterns

Also produce a short **Lane map**:

| Lane | Directories / packages | Notes |
|------|------------------------|-------|
| BE | `…` | |
| FE | `…` | |
| shared | `…` | keep minimal |

## Task Right-Sizing

A task is the smallest unit with its own test cycle and a meaningful fresh-reviewer gate **that can sit in a parallel wave**. Prefer more small parallel tasks over fewer large serial ones.

## Bite-Sized Step Granularity

**Each step is one action (2–5 minutes):**

- Write the failing test
- Run it (expect fail)
- Minimal implementation
- Run tests (expect pass)
- Commit

---

## Plan Document Header (required)

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (via pi-subagents) with **parallel waves** (`runs.all`). Fallback only if user opts out:
> superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence]

**Architecture:** [2–3 sentences]

**Tech Stack:** [Key technologies]

**Spec:** [path to design/spec — binding authority]

**Execution mode:** Spec-Driven Multi-Agent · **Parallel-first** (BE ∥ FE when applicable)

### Agent / model matrix

| Role | Agent | Model | Thinking |
|------|-------|-------|----------|
| Orchestrator | main session | xai/grok-4.5 | medium |
| Recon | scout | alibaba-plan/deepseek-v4-flash-0731 | medium |
| Research | researcher | alibaba-plan/deepseek-v4-flash-0731 | medium |
| Implementer | worker | alibaba-plan/deepseek-v4-flash-0731 | medium |
| Reviewer | reviewer | xai/grok-4.5 | medium |
| Oracle | oracle | openai-codex/gpt-5.6-sol | medium |

### Lane map

| Lane | Paths | Parallel with |
|------|-------|----------------|
| BE | … | FE |
| FE | … | BE |
| shared | … | — (early wave) |

### Parallel waves

| Wave | Mode | Tasks (ids) | Worktrees | Gate before next wave |
|------|------|-------------|-----------|------------------------|
| 0 | parallel | T0a scout-BE, T0b scout-FE | no | recon notes |
| 1 | serial/parallel | T1 contracts | no | types/API committed |
| 2 | **parallel** | T2 BE…, T3 FE… | **yes** | per-task tests + reviews |
| 3 | parallel/serial | T4 integration | no | e2e green |
| final | parallel reviews | correctness, tests, simplicity | no | ship summary |

### Orchestration

1. Dispatch **whole waves** with parallel workers — do **not** serialize independent BE/FE work
2. After each implementation wave: **parallel** fresh reviewers
3. Merge worktree handoffs at wave boundaries; fix conflicts in a dedicated glue task if needed
4. Parent synthesizes residual risks; no silent scope expansion

## Global Constraints

[Copy project-wide requirements from the spec verbatim — versions, naming, platforms, out-of-scope.]

---
```

---

## Task Structure (required)

Every task includes **Agent routing + lane/wave** so executors never guess models or order.

````markdown
### Task N: [Component Name]

**Lane:** BE | FE | shared | infra  
**Wave:** 2  
**Parallel group:** `be-api`  
**Depends on:** Task 1  
**Owner agent:** `worker`  
**Owner model:** `alibaba-plan/deepseek-v4-flash-0731` (thinking: medium)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `xai/grok-4.5` (thinking: medium)  
**Context:** fresh for owner and reviewer  
**Worktree:** true   # true when this task runs in parallel with other writers

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `exact/path/to/file.test.ts`

**File lock (parallel safety):**
- Exclusive write set: [list paths] — no other task in this wave may touch these

**Interfaces:**
- Consumes: [exact signatures / contract artifacts from earlier waves]
- Produces: [exact names/types later tasks rely on]

**Acceptance (from spec):**
- [bullet criteria the reviewer must check]

**Spec anchors:**
- Section/heading in the spec this task implements

- [ ] **Step 1: Write the failing test**

```ts
// full test code — no placeholders
```

- [ ] **Step 2: Run test to verify it fails**

Run: `exact command`  
Expected: FAIL with …

- [ ] **Step 3: Write minimal implementation**

```ts
// full code
```

- [ ] **Step 4: Run test to verify it passes**

Run: `exact command`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add …
git commit -m "…"
```
````

### Special task types

- **Recon (Wave 0):** Owner `scout`. Prefer **parallel** scout-BE ∥ scout-FE. No commit.
- **Contract (early wave):** Small shared types/API; unlocks BE ∥ FE. Prefer minimal surface.
- **Research:** Owner `researcher`. Cite sources; no code edits unless required.
- **Decision gate:** Owner `oracle` only for risky calls; parent records ruling before the next wave.
- **Integration:** After parallel lanes; owns e2e and cross-lane wiring only.

---

## No Placeholders

Plan failures — never write:

- TBD / TODO / "implement later" / "fill in"
- "Add appropriate error handling" without code
- "Write tests" without actual tests
- "Similar to Task N"
- Steps without exact commands or code
- Types/functions not defined in any task
- Missing agent/model, lane, or wave on a task
- A fully serial task list when BE/FE could have been parallel

---

## Self-Review

After the full plan:

1. **Spec coverage** — each spec requirement → a task  
2. **Placeholder scan**  
3. **Type/interface consistency** across tasks and waves  
4. **Agent routing** — every task has owner + reviewer (+ models)  
5. **Parallelism** — independent BE/FE work shares a wave; no false serial chain  
6. **File disjointness** — same-wave write sets do not overlap  
7. **Worktrees** — parallel writers mark `worktree: true`  
8. **Executable alone** — a fresh worker with only the task + spec + contracts could succeed  

Fix inline; no second review ceremony.

---

## Execution Handoff

After saving the plan:

1. Tell the user the path: `docs/superpowers/plans/<filename>.md`
2. **Default offer (do not make them invent the prompt):**

> Plan saved. Default execution is **Spec-Driven Multi-Agent · Parallel-first**  
> (BE ∥ FE waves via `subagent-driven-development` + pi-subagents `runs.all`, matrix in plan).  
> Say **execute** / **go** to start, **inline** to run without subagents, or request plan edits.

3. On **execute/go** (or equivalent):
   - **REQUIRED SUB-SKILL:** `subagent-driven-development`
   - Dispatch **by wave** with parallel workers/reviewers; do not re-ask model choices
   - Do **not** fall back to serial one-task-at-a-time unless a dependency requires it
4. On **inline** only:
   - **REQUIRED SUB-SKILL:** `executing-plans`
   - Still respect wave order; parallelize only when safe in-process

Do **not** require the user to type “write a parallel BE/FE plan with worker/reviewer models …” — that is already this skill’s job.
