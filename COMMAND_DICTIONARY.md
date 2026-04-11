# 🌲 Cisco CLI Command Tree & Support Matrix

This document maps the hierarchical structure of Cisco commands (IOS, XE, XR, NX-OS, ASA) and their support status in the Tree-Sitter parser. It uses standard Markdown nesting (4 spaces) for maximum compatibility.

**Legend:**
- `[x]` Supported & Verified (tested and passing)
- `[/]` Partially Supported (implemented but needs refinement)
- `[ ]` Not yet supported (handled as a generic `command` node)
- `<type>` Placeholder for the expected value type

---

## 🏗️ 1. Global Configuration

### 1.1 System & Identity
- [x] `hostname` / `host`
    - [x] `<word>` (Host name)
- [x] `service`
    - [x] `password-encryption` | `timestamps` | `<word>`
- [x] `enable`
    - [x] `secret`
        - [x] `<number>` (Encryption type: 0, 5, 8, 9)
            - [x] `<word>` (Password hash)
- [x] `ip domain-name`
    - [x] `<word>` (FQDN)
- [x] `boot system`
    - [x] `flash` | `tftp` | `ftp`
        - [x] `<word>` (Image path)

### 1.2 Access & AAA
- [x] `username` / `user`
    - [x] `<word>` (Username)
        - [x] `privilege`
            - [x] `<number>` (0-15)
        - [x] `secret` | `password`
            - [x] `[<number>]` (Optional: Hash type)
            - [x] `<word>` (Password)
        - [x] `description`
            - [x] `<word>`
- [x] `aaa new-model`
- [x] `aaa authentication`
    - [x] `login` | `enable`
        - [x] `default` | `<word>` (List name)
            - [x] `group <name>` | `local` | `enable` | `line`

### 1.3 Infrastructure Services
- [x] `ntp`
    - [x] `server` | `peer`
        - [x] `<ipv4_address>` | `<word>`
    - [x] `source`
        - [x] `<interface_name>`
- [x] `logging` / `log`
    - [x] `host`
        - [x] `<ipv4_address>` (Syslog host)
    - [x] `source-interface`
        - [x] `<interface_name>`
    - [x] `trap`
        - [x] `<word>` | `<number>` (Severity level)
- [x] `snmp-server`
    - [x] `community`
        - [x] `<word>` (Community name)
            - [x] `[RO | RW]` (Optional)
    - [x] `host`
        - [x] `<ipv4_address>`
            - [x] `<word>` (Community string)
- [x] `crypto`
    - [x] `key generate rsa`
        - [x] `general-keys`
            - [x] `modulus`
                - [x] `<number>` (Bits: 1024, 2048, 4096)

---

## 🔌 2. Interface Configuration

### 2.1 Base Parameters
- [x] `interface` / `int`
    - [x] `<interface_name>`
        - [x] `description` / `desc`
            - [x] `<word_sequence>` (Free text)
        - [x] `shutdown` | `no shutdown`
        - [x] `speed`
            - [x] `auto` | `<number>`
        - [x] `duplex`
            - [x] `auto` | `full` | `half`
        - [x] `mtu`
            - [x] `<number>`
        - [x] `bandwidth`
            - [x] `<number>`

### 2.2 Layer 2 (Switching)
- [x] `switchport` / `sw`
    - [x] `mode`
        - [x] `access` | `trunk` | `dynamic auto` | `dynamic desirable`
    - [x] `access vlan`
        - [x] `<number>` (1-4094)
    - [x] `trunk`
        - [x] `allowed vlan`
            - [x] `<number_list>`
        - [x] `native vlan`
            - [x] `<number>`
    - [x] `port-security`
        - [x] `maximum`
            - [x] `<number>`
        - [x] `violation`
            - [x] `shutdown` | `restrict` | `protect`
        - [x] `mac-address`
            - [x] `sticky` | `<mac_address>`

### 2.3 Layer 3 (IP & VRF)
- [x] `ip`
    - [x] `address` / `addr`
        - [x] `<ipv4_address>` (IP)
            - [x] `<ipv4_address>` (Mask)
                - [x] `[secondary | sec]` (Optional)
    - [x] `vrf forwarding`
        - [x] `<word>` (VRF name)
    - [x] `helper-address`
        - [x] `<ipv4_address>`
    - [x] `proxy-arp` | `no ip proxy-arp`
- [x] `vrf definition`
    - [x] `<word>` (VRF name)
        - [x] `rd <word>`
        - [x] `address-family`
            - [x] `ipv4` | `ipv6`
- [x] `ipv6 address`
    - [x] `<ipv6_address>/<number>`

---

## 3. Routing & Filtering

### 3.1 Static Routes & Prefix Lists
- [x] `ip route`
    - [x] `<ipv4_address>` (Dest)
        - [x] `<ipv4_address>` (Mask)
            - [x] `<ipv4_address>` | `<interface_name>` (Next-hop)
                - [x] `[<number>]` (Distance)
- [x] `ip prefix-list`
    - [x] `<word>` (Name)
        - [x] `seq`
            - [x] `<number>`
                - [x] `permit` | `deny`
                    - [x] `<ipv4_address>/<number>`
                        - [x] `[ge <number>] [le <number>]`

### 3.2 Dynamic Routing (BGP/OSPF)
- [x] `router bgp`
    - [x] `<number>` (AS)
        - [x] `router-id`
            - [x] `<ipv4_address>`
        - [x] `neighbor`
            - [x] `<ipv4_address>` | `<word>`
                - [x] `remote-as`
                - [x] `description`
                - [x] `activate`
                - [x] `update-source`
        - [x] `address-family`
            - [x] `ipv4` | `ipv6` | `vpnv4` | `vpnv6`
                - [x] `unicast` | `multicast`
- [x] `router ospf`
    - [x] `<number>` (Process ID)
        - [x] `router-id`
            - [x] `<ipv4_address>`
        - [x] `network`
            - [x] `<ipv4_address>`
                - [x] `<wildcard>`
                    - [x] `area`
                        - [x] `<number>`
        - [x] `area <number>`
            - [x] `stub` | `nssa` | `range`

---

## 📊 4. Operational (Show Commands)

These nodes capture command outputs and map them to structured data fields.

### 4.1 System & Hardware
- [x] `show version`
    - [x] Field: `version`
        - [x] `<word>` (e.g., 15.2(4)M6a)
    - [x] Field: `uptime`
        - [x] `<word_sequence>` (e.g., 1 week, 3 days)
    - [ ] Field: `hardware`
        - [ ] `<word>` (e.g., CISCO2901/K9)
    - [x] Field: `serial`
        - [x] `<word_list>` (e.g., FTX12345678)
    - [ ] Field: `image_file`
        - [ ] `<word>` (e.g., flash0:c2900.bin)
- [x] `show inventory`
    - [x] Field: `name`
        - [x] `<word>` (e.g., Chassis)
    - [ ] Field: `description`
        - [ ] `<word_sequence>`
    - [x] Field: `pid`
        - [x] `<word>` (Product ID)
    - [ ] Field: `vid`
        - [ ] `<word>` (Version ID)
    - [x] Field: `sn`
        - [x] `<word>` (Serial Number)
- [ ] `show clock`
    - [ ] Field: `time`
        - [ ] `<time_format>`
    - [ ] Field: `timezone`
        - [ ] `<word>`
    - [ ] Field: `day`
        - [ ] `<word>`
    - [ ] Field: `month`
        - [ ] `<word>`
    - [ ] Field: `year`
        - [ ] `<number>`
- [ ] `show environment`
    - [ ] `power` | `temperature`
        - [ ] Field: `sensor`, `state`, `value`

### 4.2 L2 & L3 Connectivity
- [ ] `show cdp neighbors`
    - [ ] `detail`
        - [ ] Field: `neighbor_id`
            - [ ] `<word>` (Hostname)
        - [ ] Field: `local_interface`
            - [ ] `<interface_name>`
        - [ ] Field: `remote_interface`
            - [ ] `<interface_name>`
        - [ ] Field: `platform`
            - [ ] `<word>`
        - [ ] Field: `capabilities`
            - [ ] `<word_list>`
- [ ] `show mac address-table`
    - [ ] Field: `vlan`
        - [ ] `<number>`
    - [ ] Field: `mac_address`
        - [ ] `<mac_address>`
    - [ ] Field: `type`
        - [ ] `STATIC | DYNAMIC`
    - [ ] Field: `port`
        - [ ] `<interface_name>`
- [ ] `show arp`
    - [ ] Field: `protocol`
        - [ ] `Internet | AppleTalk | ...`
    - [ ] Field: `address`
        - [ ] `<ipv4_address>`
    - [ ] Field: `age`
        - [ ] `<number>`
    - [ ] Field: `mac`
        - [ ] `<mac_address>`
    - [ ] Field: `type`
        - [ ] `ARPA | SNAP | ...`
    - [ ] Field: `interface`
        - [ ] `<interface_name>`
- [x] `show ip interface brief`
    - [x] Field: `interface`
        - [x] `<interface_name>`
    - [x] Field: `ip_address`
        - [x] `<ipv4_address> | unassigned`
    - [x] Field: `ok`
        - [x] `YES | NO`
    - [x] Field: `method`
        - [x] `manual | DHCP | NVRAM | unset`
    - [x] Field: `status`
        - [x] `up | down | administratively down`
    - [x] Field: `protocol`
        - [x] `up | down`

### 4.3 Routing & BGP State
- [/] `show ip route`
    - [ ] Field: `protocol`
        - [ ] `L | C | S | R | B | D | O` (Route codes)
    - [ ] Field: `network`
        - [ ] `<ipv4_address>`
    - [ ] Field: `mask`
        - [ ] `<ipv4_address> | /<number>`
    - [ ] Field: `nexthop_ip`
        - [ ] `<ipv4_address>`
    - [ ] Field: `nexthop_if`
        - [ ] `<interface_name>`
- [/] `show ip bgp summary`
    - [ ] Field: `neighbor`
        - [ ] `<ipv4_address>`
    - [ ] Field: `as`
        - [ ] `<number>`
    - [ ] Field: `up_down`
        - [ ] `<word>` (Uptime/Downtime)
    - [ ] Field: `state_prefix`
        - [ ] `<word> | <number>` (State or Prefix count)
- [/] `show ip ospf neighbor`
    - [ ] Field: `neighbor_id`
        - [ ] `<ipv4_address>` (Router ID)
    - [ ] Field: `priority`
        - [ ] `<number>`
    - [ ] Field: `state`
        - [ ] `FULL/DR | FULL/BDR | 2WAY/DROTHER | ...`
    - [ ] Field: `address`
        - [ ] `<ipv4_address>`
    - [ ] Field: `interface`
        - [ ] `<interface_name>`

---

## 🛡️ 5. Security & ACL
- [x] `ip access-list`
    - [x] `standard` | `extended`
        - [x] `<word>` (ACL Name)
            - [x] `permit` / `perm` | `deny` / `den`
                - [x] `<protocol>` (tcp, udp, icmp, ip)
                - [x] `any` | `host <ipv4>`
                - [x] `[eq | range <port>]`
- [x] `line`
    - [x] `vty` | `con` | `aux`
        - [x] `<number>` (Start)
            - [x] `[<number>]` (End)
                - [x] `login` [local]
                - [x] `transport input` [ssh | telnet | all]
