# Contributing to Tree-Sitter Cisco Grammar

This document defines the strict architectural and procedural standards required to extend the `Tree-Sitter-Cisco` parser. Adhering to these guidelines is mandatory to prevent **LR State Explosions**, **GLR Backtracking Failures**, and the **"Tug-of-War"** between structured commands and generic output.

---

## 🏗️ Architecture Overview (Monorepo)

The project is structured as a monorepo containing two distinct parsers to eliminate structural ambiguity between interactive sessions and static configuration files:

1. **Root Parser (SSH/Operational Mode)**:
    * **Scope**: Default mode for SSH logs, CLI captures, and interactive troubleshooting.
    * **Paradigm**: Hierarchical Transaction (`Prompt -> Command Tree -> Sentinel -> Output`).
    * **Entry Point**: `source_file`.
2. **`cisco-config/` Parser (Deep Config Mode)**:
    * **Scope**: Optimized for raw configuration backups (`.cfg`) and `show running-config` dumps.
    * **Paradigm**: Pure hierarchy based on indentation, ignoring prompt tokens for maximum performance.
    * **Entry Point**: `config_file`.

---

## 🎯 The Command Tree Architecture (CTA)

To ensure deterministic parsing and prevent the parser from "guessing" between similar strings, we replicate the Cisco CLI's internal tree (the `?` help system).

### 1. The Dispatching Pattern (Hierarchical Public Trees)

Never define a command as a single flat sequence. Use a dispatching logic where each word narrows the search space. To ensure the AST is semantically queryable and supports rich highlighting, **all command branches and leaves must be public rules**.

*   **Branch**: A public rule (`..._command`) containing a keyword followed by a `choice` of sub-commands.
*   **Leaf**: The final specialized rule that handles a specific command and its structured output.
*   **Keywords**: Use `kw_<name>` (public) for command keywords to allow precise highlighting and AST filtering.

```javascript
// Hierarchical structure in rules/operational.js

show_command: $ => seq(
  $.kw_show,               // Public keyword for highlighting
  choice(
    $.show_ip_command,     // Nested branch
    $.show_version_command // Terminal leaf
  )
),

show_ip_command: $ => seq(
  $.kw_ip,
  choice(
    $.show_ip_interface_command,
    $.generic_show_ip_command // Fallback for unmapped 'show ip ...'
  )
)
```

This structure produces a "Queryable Path" in the AST:
`(show_command (show_ip_command (show_ip_interface_command ...)))`

*   **Implementation**: Use the **Nested Optional Prefix (NOP)** regex pattern. This covers all valid prefixes in a single deterministic rule.
*   **Public Access**: Keywords must be public rules (e.g., `kw_show`) so they can be targeted by `highlights.scm` and external API queries.
*   **Pattern**: For a word like `show` with a minimum of `sh`, use `/sh(ow?)?/i`.
*   **Plurals**: For `interface/interfaces`, use `/int(erface)?s?/i`.

```javascript
// Correct implementation in rules/operational.js
kw_show: $ => token(prec(100, /sh(ow?)?/i)),      // Matches: sh, sho, show
kw_brief: $ => token(prec(100, /bri?(ef)?/i)),   // Matches: br, bri, brief
kw_interface: $ => token(prec(100, /int(erface)?s?/i)), // Matches: int, interface, interfaces
```

---

## 🎯 The Goal: Semantic Richness (High Precision Architecture)

The value of this parser lies in the **granularity** of its AST. We do not want an "approximate" tree; we want a structured representation of device state.

* **Structure over Opacity**: Avoid using `generic_output_line` for data that has a predictable format (e.g., IP tables, version details). Use fields (`field()`) and specific sub-rules.
* **The Bulldozer is a Safety Net**: The `_output_content` fallback exists only to prevent parser failure on unmapped output. As soon as an output format is identified, it should be promoted to a **Typed Segment**.
* **Automation-Ready**: Every field added to the AST (e.g., `interface` in `ip_int_brief_entry`) directly increases the utility of the parser for automation tools.

---

## 🔄 Integration via Injections

The Operational parser does not parse complex configuration hierarchies directly. Instead, when a command like `show running-config` is encountered:

1. The output block is captured as a semi-structured block.
2. A **Language Injection** (defined in `queries/injections.scm`) delegates the internal parsing of that block to the `cisco-config` grammar.

---

## 🛠️ The Golden Rules: Performance & Determinism

### 1. Tight Coupling (Typed Segments)

To prevent Tree-sitter from falling back to generic output, you **MUST** use **Typed Segments**. Every major command is a unique sequence.

```javascript
// Example in grammar.js
show_ip_int_brief_segment: $ => seq(
  $._prompt_exec,                          // 1. Precise Prompt
  field('execution', $.show_command),      // 2. Precise Command (via Tree)
  $._newline,                              // 3. Mandatory Newline
  seq($._output_start,                     // 4. Scanner opens "the tap"
      field('output', $.ip_int_brief_out), // 5. Structured Table
      $._output_end)                       // 6. Scanner closes at next Prompt
)
```

### 2. Output State Machine (BOL Priority)

The C external scanner manages the `in_output` state with **absolute priority at the beginning of a line (BOL)**.

* **Sentinels** (`OUTPUT_START`, `CONTINUE`, `END`) are emitted **before** consuming spaces or identifying IPv4 addresses.
* `_output_continue`: **Mandatory** at the start of every structured output line. The scanner only emits this if it **DOES NOT** see a prompt.

### 3. Forced Greediness

Always use `repeat1(seq($._output_continue, $.rule))` for tabular data. By making `_output_continue` a required prefix, the parser is physically unable to reduce the command until a prompt appears.

### 4. Negative Dynamic Precedence

The fallback `command` rule MUST use `prec.dynamic(-110)`. This ensures that if a line *could* be a structured entry (like a table row), the structured rule wins.

---

## 📊 Adding Operational Commands (Step-by-Step)

### 1. Map the CLI Path

Identify where the command sits in the Cisco `?` tree. If you are adding `show ip interface brief`, you need to ensure `show`, `ip`, and `interface` branches exist.

### 2. Define the Keywords

Add public keywords in `rules/operational.js` (e.g., `kw_show`) using the NOP pattern and `prec(100)`.

### 3. Build the Hierarchy

Create the necessary nested `_command` rules to replicate the CLI tree. Ensure every level is public.

### 4. Implement the Leaf Node

The leaf node should handle the specific command syntax, any optional parameters, and the output block.

```javascript
show_ip_interface_brief_command: $ => seq(
  field('execution', seq($.kw_brief, optional($._output_modifier))),
  $._newline,
  seq($._output_start, field('output', $.ip_int_brief_output), $._output_end)
)
```

### 5. Update Queries

Always update `queries/highlights.scm` to include your new `kw_...` nodes and `queries/injections.scm` if the command output requires config-mode parsing (like `show running-config`).

```javascript
ip_int_brief_entry: $ => seq(
  field('interface', $.interface_name),
  $._field_separator,
  field('address', $.ipv4_address),
  // ...
)
```

---

## 🏗️ External Scanner Tools (`src/scanner.c`)

The C scanner is the **Arbitrator** of the grammar.

* **Zero-Length Decision**: Sentinels must call `lexer->mark_end(lexer)` immediately to avoid consuming characters needed by grammar rules (like interface names).
* **Deterministic Identity**: The `in_output` state MUST be serialized/deserialized to support incremental parsing.

---

## 📋 Development Methodology & Checklist

1. **Define Intent**: Is it an operational command or a configuration statement?
2. **Verify Contract**: Ensure `externals` in `grammar.js` exactly match `TokenType` in `scanner.c`.
3. **Test for Greediness**: Run `tree-sitter parse --debug`. If a command reduces before the next prompt, you are missing `_output_continue`.
4. **Performance Check**: `tree-sitter generate` should take < 5s. Longer times indicate an LR state explosion (usually caused by missing `prec` or ambiguous `choice` blocks).
5. **Validation**: A change is only complete when:
    * `tree-sitter parse` yields **zero** `ERROR` nodes.
    * `CHANGELOG.md` is updated in the `[Unreleased]` section (English).
