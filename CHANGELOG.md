# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Monorepo Architecture**: Created `cisco-config/` package for high-performance static configuration parsing.
- **Command Tree Architecture (CTA)**: Rebuilt the operational grammar to mirror Cisco CLI's hierarchical structure (Branch & Leaf pattern).
- **Language Injections**: Automated delegation of `show running-config` blocks to the configuration parser via `queries/injections.scm`.
- **Structured Operational Support**: Added detailed parsing for `show interface status` and `show interfaces` with full counter mapping.
- **Tooling**: Introduced `scripts/trace_analyzer.js` and `scripts/safe-run.js` for enhanced debugging and robust testing.
- **MCP Integration**: Added Model Context Protocol SDK for extended agentic capabilities.
- **Modular External Scanner**: Refactored `scanner.c` into a modular architecture (`src/scanner/*.h`) for improved maintainability and logical isolation of networking, prompts, and output states.
- **Dual-Entry Symbol Management**: Implemented dynamic prefixing for external scanner symbols, resolving linker conflicts in the dual-parser monorepo structure.
- Strong keyword tokens with high precedence (100) and common CLI abbreviations.
- Structured output parsing for `show ip interface brief`.
- Renamed internal `interface_status_entry` to `interface_status_detail` for better naming consistency.
- New test suite for operational interface commands and statistics.

### Changed
- **Grammar Bifurcation**: Refactored `grammar.js` to focus on interactive executive sessions, offloading backup-style configs to the new package.
- **External Scanner**: Refactored `scanner.c` to prioritize Output State Machine (Semaforo) at the Beginning of Line (BOL).
- **Primitive Consolidation**: Moved shared base rules to `rules/common/primitives.js`.
- **Test Infrastructure**: Standardized test execution with split scripts for operational and configuration modes.
- **Scanner Architecture**: Migrated from a monolithic `scanner.c` to a header-based modular design.
- **Corpus Migration**: Reorganized 15+ corpus files to align with the new dual-parser structure.
- Fixed prompt detection in the scanner to ensure reliable output sentinel emission (`OUTPUT_START`, `OUTPUT_END`).
- Improved `CONTRIBUTING_GRAMMAR.md` with detailed CTA implementation guidelines and examples.
- Applied negative dynamic precedence to fallback `command` rule to resolve ambiguity with structured tables.

### Fixed
- **Go Bindings**: Added missing CGO directives to include `parser.c` and `scanner.c`, resolving "undefined reference" errors during link-time.
- Fixed parser failure at EOF due to missing empty prompt handling.
- Resolved "Tug-of-War" conflicts between interface names and generic command triggers.
- **MSVC Compatibility**: Suppressed `_CRT_SECURE_NO_WARNINGS` and fixed `getenv` safety warnings in the external scanner.
- **Token Alignment**: Fixed index mismatch in `cisco-config/grammar.js` that caused erroneous IP/Subnet mask parsing.

## [0.1.0] - 2026-04-13

### Added

- **Language Bindings**: Full support for 11 languages (Node.js, Python, Rust, Go, Java, C#, Swift, Ruby, PHP, Perl, C/C++).
- **Core Grammar**: Initial support for Cisco IOS, XE, XR, NX-OS, and ASA configuration dialects. The complete list of supported commands is available in the [COMMAND_DICTIONARY.md](COMMAND_DICTIONARY.md) file.
- **Operational Data**: Extensive support for "show" commands including HSRP, Spanning-tree, IP SSH, NTP, and SNMP-server.
- **Diagnostics**: Support for `ping`, `traceroute`, and `dir` command outputs.
- **Infrastructure**: Advanced external scanner with multi-space tabular separation and automated console prompt filtering.
- **Developer Experience**:
  - Metadata synchronization script `npm run sync-metadata`.
  - Syntax Highlighting, Folding, and Indentation queries for IDE integration.
  - Universal Makefile for shared library compilation.
  - TypeScript integration with `.d.ts` definition files.
  - Detailed grammar contribution guide (`CONTRIBUTING_GRAMMAR.md`).

### Fixed

- Improved line termination handling in configuration blocks by removing mandatory trailing spaces.
- Enhanced stability for complex tabular diagnostic output extraction.

---
*Development started on 2026-04-09. This version (0.1.0) consolidates all initial work into the first public release.*
