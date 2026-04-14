# AGENTS.md

## Purpose

This file defines how agents should operate in this repository.

The goal is simple: produce correct, minimal, verifiable work without drift.

## Instruction Precedence

Follow instructions in this order:

1. system or developer instructions
2. repository `AGENTS.md`
3. subdirectory `AGENTS.md`
4. task-specific notes inside the repository

If instructions conflict, follow the more specific instruction unless a higher-priority source overrides it.

## Core Principles

1. Correctness over speed.
2. Clarity over cleverness.
3. Small, reversible changes over broad rewrites.
4. Explicit assumptions over silent guessing.
5. Verification over confidence.
6. Consistency with the existing codebase over personal preference.

## Non-Negotiable Rules

- Think before coding. Do not just agree with the request by default.
- Always look for the simplest solution that fully solves the problem.
- Do not add speculative abstractions, configuration, or infrastructure.
- Keep changes tightly scoped to the requested task.
- Match existing patterns unless there is a clear reason not to.
- Surface assumptions, ambiguity, risks, and tradeoffs when they matter.
- Do not claim success based only on inspection.
- Verify with the strongest feasible checks before concluding.

## Default Workflow

1. Read the relevant files and identify the affected area.
2. Determine whether the task is trivial, moderate, or high-risk.
3. For non-trivial work, state a short plan before editing.
4. Implement the smallest change that solves the problem.
5. Run the strongest feasible verification.
6. Inspect the diff for unnecessary changes.
7. Report what changed, how it was verified, and what remains uncertain.

## Task Adherence

- Treat the user's requested task as the primary objective.
- Follow the latest user instruction when priorities change.
- Complete the requested task end to end when feasible.
- Do not substitute a different task unless the user agrees.
- Keep required work separate from optional suggestions.
- If blocked, state the blocker clearly and ask the smallest necessary question.

## Task Continuity

- After completing each meaningful task, explicitly record the next task, next recommended action, or open question so work is not lost between agents or sessions.
- If there is no obvious next task, record that the current task is complete and note any remaining risks, follow-ups, or monitoring needs.
- Do not end a task with only a summary of what was done; also leave a clear baton for what should happen next.

## When To Ask vs When To Decide

Ask before proceeding if ambiguity materially affects:

- architecture
- interfaces or data shape
- persistence
- security or privacy
- user-facing behavior
- migration or compatibility

Otherwise, choose the smallest reasonable interpretation, state it briefly, and proceed.

## Planning Rules

Planning is required for:

- multi-file changes
- architectural changes
- schema or interface changes
- tasks with hidden risk
- work likely to require more than one short edit

A good plan is short and concrete. Include:

- step
- affected area
- verification method

Do not produce ceremonial plans for trivial tasks.

## Scope Control

Do not:

- refactor unrelated code
- rename broad areas for taste alone
- add optional systems, flags, switches, or plugin patterns without a present need
- turn a focused task into repo-wide cleanup

Broaden scope only when:

- it is required for correctness
- it is required for verification
- your own change created a tightly related issue that must be resolved

If scope expands, say so explicitly.

## Implementation Rules

When editing existing code:

- preserve existing behavior unless the task requires changing it
- prefer existing local helpers and patterns over new abstractions
- remove only unused artifacts caused by your own change
- leave unrelated dead code, naming issues, and style cleanup alone unless asked

Use structured parsing and existing APIs when available instead of ad hoc string manipulation.

## Verification Rules

Verification is mandatory whenever feasible.

Preferred order:

1. automated tests
2. type-checking or static checks
3. linting or formatting checks where relevant
4. build or compile checks
5. targeted manual validation

For bug fixes:

1. reproduce the issue when feasible
2. create a failing test or documented failing case when feasible
3. implement the fix
4. verify the failure is resolved

If verification is not possible, state exactly what could not be verified and why.

## Git And GitHub Rules

Treat GitHub publication as an explicit part of the workflow when the task includes committing, pushing, opening a pull request, or otherwise publishing the work.

Rules:

- If the GitHub repository name is not known, ask for it before creating or configuring a remote.
- Confirm the target repository before the first push if there is any ambiguity about owner or repo name.
- Use the GitHub username `moleh1307` as the account identifier for GitHub operations. Do not substitute a personal full name when the GitHub username is required.
- Use the configured GitHub credential or SSH identity associated with this fingerprint when publishing: `SHA256:X35LG1Ly/9XMFegIwZwUKBIrKJHy14xW0sNSQswklSo`
- Before committing, inspect `git status` and make sure the commit scope matches the intended work.
- Do not include unrelated changes in a commit unless the user explicitly asks for that.
- Use clear, specific commit messages that describe the actual change.
- After completing the requested work, be prepared to stage, commit, and push the relevant changes to GitHub when the user asks or when repository workflow clearly requires it.
- If branch, remote, or authentication state blocks publishing, state the blocker clearly instead of guessing.

When publishing work:

1. verify the target remote and branch
2. review the diff being committed
3. stage the intended files
4. commit with a specific message
5. push to the correct GitHub remote
6. report the branch, commit, and any follow-up such as a pull request

## Memory Layer Policy

Use a shared memory layer for cross-agent continuity.

Before substantial work:

- read `memory/log.md`
- read the most relevant notes for the area you are touching
- read other agents' logs that are relevant to the current task or subsystem

After meaningful work:

- update `memory/log.md`
- update your own agent log
- record the next task, open question, or baton state

The memory layer should exist and remain organized for ongoing multi-agent work.

If used, the memory layer should separate:

- current state
- durable decisions
- architecture notes
- pitfalls
- worklog or handoff history

## Agent Logging Rules

Each agent must maintain its own log file and also contribute to the shared master log.

Required files:

- `memory/log.md` as the shared master log
- `memory/agents/<agent_name>_log.md` as the per-agent log

Rules:

- Create your agent log if it does not already exist.
- Read the shared master log before continuing substantial work.
- Read other agents' logs when they are relevant to the current task, affected files, or subsystem.
- Append concise entries instead of rewriting history.
- Use explicit dates and timestamps when practical.
- Record what you changed, why, verification status, blockers, and the next task.
- Keep logs factual and operational. Do not use them for long essays.
- Do not rely on chat history as the only source of project continuity.

Recommended per-entry fields:

- date or timestamp
- agent name
- task
- files touched
- actions taken
- verification
- blockers or risks
- next task

## Definition of Done

Before finishing, confirm that:

1. the requested change is implemented
2. the strongest feasible verification was run
3. the diff is scoped and free of unnecessary churn
4. assumptions and remaining risks are stated clearly
5. any required memory or handoff notes are updated

## What Good Work Looks Like

A high-quality agent contribution is:

- correct
- minimal
- easy to review
- easy to verify
- consistent with the repository
- explicit about uncertainty
- durable enough for the next agent to continue safely
