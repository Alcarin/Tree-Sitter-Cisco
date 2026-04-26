# tree-sitter-cisco

A high-performance, incremental Tree-sitter parser for Cisco network configurations and operational state data.

## 🚀 Overview

`tree-sitter-cisco` is designed to transform unstructured Cisco CLI data into structured, queryable Abstract Syntax Trees (AST). Unlike traditional regex-based scrapers, this parser understands the hierarchical nature of network configurations and the tabular structure of diagnostic "show" commands.

### Key Targets

- **Configuration Parsing**: Full support for hierarchical blocks (Interfaces, BGP, OSPF, ACLs, QoS, etc.).
- **Operational Data Parsing**: Granular mapping of `show` command outputs into record-based data nodes.
- **Multi-OS Support**: Optimized for **IOS, IOS-XE, IOS-XR, NX-OS**, and **ASA**.

### Parsing Modes

The parser supports two distinct entry points optimized for different use cases:
1. **Operational/Log Mode (`source_file`)**: The default mode. Best for SSH logs, terminal sessions, and syslog data. Handles interactive prompts and operational noise.
2. **Deep Config Mode (`config_file`)**: Optimized for static backup files (`.cfg`). Extremely fast and ignores all interactive prompt tokens for maximum precision.

---

## ✨ Features

- **Incremental Parsing**: Ideal for real-time configuration editors or massive log analysis.
- **Robustness**: Handles common CLI abbreviations (e.g., `int` vs `interface`) and complex unquoted strings.
- **Modular Architecture**: Built with a highly modular JavaScript grammar for easy extension to new OS variants.

---

## 🛠 Supported Structures

### Configuration Blocks

- **Networking**: IPv4/IPv6 Addressing, Static Routes, VRFs.
- **Routing Protocols**: BGP (including Address Families), OSPF.
- **Security**: Access Control Lists (Standard/Extended), Crypto-configs.
- **Services**: NTP, SNMP, Logging, VLANs.
- **Management**: Line (VTY/Console) configurations, AAA, Banner parsing.

### Operational Commands (`show`)

- `show version`, `show inventory`
- `show ip interface brief`, `show interfaces`
- `show ip route`, `show ip arp`, `show mac address-table`
- `show ip ospf neighbor`, `show ip bgp summary`
- `show spanning-tree`, `show vlan brief`
- `ping`, `traceroute`, `dir`

---

## 🏗 Project Structure

The grammar is divided into logical modules for better maintainability:

```text
├── rules/
│   ├── common.js       # Base primitives (IPs, MACs, Interface names)
│   ├── config.js       # Hierarchical configuration blocks
│   └── operational.js  # Diagnostic "show" command logic
├── grammar.js          # Entry point and global conflict resolution
├── src/scanner.c       # Custom C scanner for indent tracking and tabular data
└── test/corpus/        # Extensive test suites for each OS variant
```

---

*Developed with ❤️ for the Network Automation community.*
