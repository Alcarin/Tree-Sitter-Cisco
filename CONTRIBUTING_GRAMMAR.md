# Contributing to Tree-Sitter Cisco Grammar

This guide explains how to extend the Cisco CLI parser with new configuration and operational (show) commands while maintaining high performance, structural integrity, and avoiding regressions.

---

## 🏗️ Architectural Overview

The grammar is modularized in the `rules/` directory:
- `common.js`: Primitives (IPs, MACs, Words, Numbers, Newlines).
- `config.js`: Hierarchical configuration blocks (Global, Interface, Routing).
- `operational.js`: Diagnostic command outputs (Show commands).
- `grammar.js`: The main entry point and global conflict resolution.

---

## 🛠️ Adding New Configuration Commands

### 1. Scoped Blocks (Recommended)
Cisco CLI is hierarchical. When adding sub-commands (e.g., inside `router ospf`), do **not** add them to the global `_statement`. Instead, create a scoped choice:

```javascript
// In rules/config.js
_ospf_statement: $ => choice(
    $.network_config,
    $.router_id_config,
    // Add new OSPF-specific commands here
)
```

### 2. Keyword Anchoring
Always wrap command keywords in `prec(10, ...)` and use case-insensitive regex to ensure they win over the generic `word` rule:

```javascript
hostname: $ => seq(token(prec(10, /hostname/i)), field('name', $.word))
```

### 3. Handling Parameters
Use named fields (`field('name', ...)`) for all extracted values. This ensures the AST is usable by downstream tools like Ansible or Python scripts.

---

## 📊 Adding New Show Commands (Operational)

Show commands are the most difficult to parse due to tabular data and generic text. Follow the **Atomic Line Strategy**:

### 1. Define the Header
Add the command trigger to the `_statement` choices:
```javascript
show_new_command: $ => seq(token(prec(10, /show\s+new\s+command/i)), $._newline)
```

### 2. Atomic Line Extraction
To avoid "noise" and `ERROR` nodes from the generic `command` rule, use `prec.dynamic(100)` for structured lines:

```javascript
new_output_entry: $ => prec.dynamic(100, seq(
    field('id', $.number),
    field('status', $.word),
    $._newline
))
```

### 3. Use Tokens for Labels
If an output line has a fixed label (e.g., `Uptime is:`), wrap it in a `token(prec(100, ...))` to make it a "bulletproof" anchor.

---

## 🏗️ External Scanner Tools

The custom scanner in `src/scanner.c` provides specialized tokens to handle Cisco-specific text patterns that are difficult for standard regex:

### 1. Tabular Data (`_field_separator`)
Most `show` commands use tables where columns are separated by **two or more spaces**. 
- **Use**: Use `$._field_separator` between fields in tabular rules.
- **Why**: It prevents a single space (common in names like `Fast Ethernet`) from being mistaken for a field delimiter.

```javascript
ip_int_brief_entry: $ => seq(
    field('interface', $.interface_name),
    $._field_separator,
    field('ip', $.ipv4_address),
    // ...
)
```

### 2. Separator Lines (`_dashed_line`)
Used to identify lines like `-------` or `=======` often found in headers.
- **Use**: Match headers or decorative separators.

### 3. Automatic Log Cleaning (`_console_prompt`)
The scanner automatically detects and ignores:
- `--More--`
- `[confirm]`
- Common pagination prompts.
**Note**: You don't need to do anything; these are included in `extras` and will be silently ignored during parsing.

---

## ⚡ Performance & Efficiency Guidelines

### ⚠️ Avoid GLR State Explosion
Tree-sitter uses a GLR (Generalized LR) parser. If too many rules match the same text, it explores all paths, consuming CPU and RAM.
- **Rule of Thumb**: If you see "unnecessary conflicts" warnings during `generate`, try to make your rules more specific.
- **Negative Precedence**: Use `prec(-1, ...)` or `prec.dynamic(-10, ...)` for fallback rules (like the generic `command`) so they only match if everything else fails.

### 🧩 Use the External Scanner
The `src/scanner.c` handles `INDENT` and `DEDENT`. Never manually parse leading spaces for hierarchy; rely on the scanner to provide these tokens.

### 🧪 Regression Testing & Global Validation
Every new command **must** have a corresponding test case in `test/corpus/`. However, because this is a GLR parser, a change in one rule can cause unintended regressions in unrelated parts of the grammar.

1. **Add your test**: Place the CLI input and expected AST in a file within `test/corpus/`.
2. **Generate**: Run `tree-sitter generate` to apply your changes.
3. **Run GLOBAL Tests**: Do not just test your new file. Run the **entire** suite:
   ```bash
   tree-sitter test
   ```
4. **Fix Errors**: If existing tests fail (e.g., in `abbreviations.txt`), you may need to adjust precedences or add conflicts in `grammar.js`. Ensure `ERROR` nodes are absent from all tests.

---

## 📋 Checklist for New Contributions
- [ ] Is the command case-insensitive (`/regex/i`)?
- [ ] Does it use `field()` for all variable data?
- [ ] Does it end with `$._newline`?
- [ ] Is it placed in the correct scope (Global vs. Block)?
- [ ] Did you run `tree-sitter generate` and **verified that ALL tests pass** via `tree-sitter test`?
- [ ] Is the `COMMAND_DICTIONARY.md` updated with the new support status?
