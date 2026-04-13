# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- (New features and commands under development)

### Fixed

- **Go Bindings**: Added missing CGO directives to include `parser.c` and `scanner.c`, resolving "undefined reference" errors during link-time.

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
