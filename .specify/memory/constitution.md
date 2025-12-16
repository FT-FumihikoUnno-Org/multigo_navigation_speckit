<!--
Sync Impact Report:

- Version change: 1.0.0 → 1.1.0
- Modified principles: none
- Added sections:
    - Principle VI: Bilingual Documentation (English & Japanese)
- Removed sections: none
- Templates requiring updates:
    - ✅ .specify/templates/plan-template.md
    - ✅ .specify/templates/spec-template.md
    - ✅ .specify/templates/tasks-template.md
- Follow-up TODOs:
    - TODO(RATIFICATION_DATE): Confirm the original ratification date.
-->
# MultiGo Navigation SpecKit Constitution

## Core Principles

### I. ROS2-Native Development
All packages must be valid ROS2 packages, including `package.xml` and `CMakeLists.txt` or `setup.py`. Code should utilize ROS2 client libraries for communication, parameters, and lifecycle management.

### II. Clear Separation of Concerns
Each package should have a single, well-defined responsibility (e.g., perception, control, navigation). This promotes modularity, testability, and reuse.

### III. Configuration-Driven Behavior
Node behavior must be configurable at runtime via ROS2 parameters. Default parameters should be provided in a `config` directory within the package.

### IV. Composition via Launch Files
Complex applications should be built by composing nodes using ROS2 launch files. Launch files are the standard for running and integrating packages.

### V. Test-Driven Development (TDD)
All packages must include a `test` directory with unit and/or integration tests. New features or bug fixes must be accompanied by corresponding tests.

### VI. Bilingual Documentation (English & Japanese)
All user-facing documentation, including READMEs and specifications, must be available in both English and Japanese. This can be achieved by having both languages in a single file or by maintaining a pair of files (e.g., `README.md` and `README.jp.md`).

## Development Workflow

All code changes must be submitted via pull requests and require at least one approval from a designated reviewer. All tests must pass before a change is merged.

## Governance

This constitution is the supreme governing document for this project. All development practices, tools, and artifacts must comply with its principles. Amendments to this constitution require a proposal, review, and a documented migration plan if the changes are not backward-compatible.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): Confirm the original ratification date | **Last Amended**: 2025-12-16