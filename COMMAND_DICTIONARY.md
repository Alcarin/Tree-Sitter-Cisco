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
            - [x] `[version <word>]` (Optional: 2c, 3)
            - [x] `<word>` (Community string)
    - [x] `enable traps`
- [x] `vlan`
    - [x] `<number>` (ID: 1-4094)
        - [x] `name`
            - [x] `<word>`
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
            - [x] `<number_list>` | `<vlan_range>`
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
    - [x] `[vrf <word>]` (Optional VRF)
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
        - [x] `[vrf <word>]` (Optional VRF)
        - [x] `router-id`
            - [x] `<ipv4_address>`
        - [x] `network`
            - [x] `<ipv4_address>`
                - [x] `<wildcard>`
                    - [x] `area`
                        - [x] `<number>`
        - [x] `area <number>`
            - [x] `stub` | `nssa` | `range`
            - [x] `interface <interface_name>` (XR-style nesting)
                - [x] `cost <number>`

---

## 📊 4. Operational (Show Commands)

These nodes capture command outputs and map them to structured data fields.

### 4.1 System & Hardware
- [x] `show version`
    - [x] Field: `version`
        - [x] `<text>` (Full version string, e.g., 15.1(4)M4)
    - [x] Field: `hostname`
        - [x] `<word>` (Device name from uptime line)
    - [x] Field: `uptime`
        - [x] `<uptime>` (Parsed years, months, weeks, days, hours, mins)
    - [x] Field: `hardware`
        - [x] `<text>` (Platform info, e.g., Cisco C1941)
    - [x] Field: `serial`
        - [x] `<word>` (Processor board ID)
    - [x] Field: `image_file`
        - [x] `<string>` (Path to bin file)
- [x] `show inventory`
    - [x] Field: `name`
        - [x] `<string>` (Entity name, e.g., "Chassis")
    - [x] Field: `description`
        - [x] `<string>` (Product description)
    - [x] Field: `pid`
        - [x] `<word>` (Product ID)
    - [x] Field: `vid`
        - [x] `<word>` (Version ID)
    - [x] Field: `sn`
        - [x] `<word>` (Serial Number)
- [x] `show clock`
    - [x] Field: `time`
        - [x] `<word>` (e.g., 12:34:56.789)
    - [x] Field: `timezone`
        - [x] `<word>` (e.g., UTC)
    - [x] Field: `day`
        - [x] `<word>` (e.g., Sun)
    - [x] Field: `month`
        - [x] `<word>` (e.g., Apr)
    - [x] Field: `day_of_month`
        - [x] `<number>`
    - [x] Field: `year`
        - [x] `<number>`
- [x] `show environment`
    - [x] Field: `sensor`
        - [x] `<text>` (e.g., Fan 1, Temperature)
    - [x] Field: `state`
        - [x] `<word>` (e.g., OK)
    - [x] Field: `value`
        - [x] `<text>` (e.g., 35C)

### 4.2 L2 & L3 Connectivity
- [x] `show cdp neighbors`
    - [x] Field: `neighbor_id`
        - [x] `<word>` (Neighbor hostname)
    - [x] Field: `local_interface`
        - [x] `<interface_name>`
    - [x] Field: `holdtime`
        - [x] `<number>`
    - [x] Field: `capabilities`
        - [x] `<text>` (Capability codes, e.g., R S I)
    - [x] Field: `platform`
        - [x] `<word>` (e.g., 2901)
    - [x] Field: `remote_interface`
        - [x] `<interface_name>`
- [x] `show mac address-table`
    - [x] Field: `vlan`
        - [x] `<number>` | `all`
    - [x] Field: `mac_address`
        - [x] `<mac_address>` (Dotted or Colon format)
    - [x] Field: `type`
        - [x] `DYNAMIC | STATIC`
    - [x] Field: `port`
        - [x] `<interface_name> | CPU | Drop`
- [x] `show arp`
    - [x] Field: `protocol`
        - [x] `Internet | AppleTalk | ...`
    - [x] Field: `ip_address`
        - [x] `<ipv4_address>`
    - [x] Field: `age`
        - [x] `<word>` (Number or '-')
    - [x] Field: `mac_address`
        - [x] `<mac_address>`
    - [x] Field: `type`
        - [x] `ARPA | SNAP | ...`
    - [x] Field: `interface`
        - [x] `<interface_name>`
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
- [x] `show ip interface <name>`
    - [x] Field: `interface`
        - [x] `<interface_name>`
    - [x] Field: `status`
        - [x] `up | down`
    - [x] Field: `protocol`
        - [x] `up | down`

### 4.3 Routing & BGP State
- [x] `show ip route [vrf <word>]`
    - [x] Field: `protocol`
        - [x] `<word>` (e.g., L, C, S, R, B)
    - [x] Field: `network`
        - [x] `<ipv4_address>`
    - [x] Field: `prefix`
        - [x] `<number>` (Mask length)
    - [x] Field: `distance`
        - [x] `<number>`
    - [x] Field: `metric`
        - [x] `<number>`
    - [x] Field: `nexthop_ip`
        - [x] `<ipv4_address>`
    - [x] Field: `nexthop_if`
        - [x] `<interface_name>`
- [x] `show ip bgp summary`
    - [x] Field: `neighbor`
        - [x] `<ipv4_address> | <ipv6_address>`
    - [x] Field: `version`
        - [x] `<number>`
    - [x] Field: `as`
        - [x] `<number>`
    - [x] Field: `msg_rcvd` | `msg_sent` | `tbl_ver` | `in_q` | `out_q`
        - [x] `<number>`
    - [x] Field: `up_down`
        - [x] `<word>` (e.g., 01:23:45)
    - [x] Field: `state_prefix`
        - [x] `<word>` (State name or prefix count)
- [x] `show ip ospf neighbor`
    - [x] Field: `neighbor_id`
        - [x] `<ipv4_address>`
    - [x] Field: `priority`
        - [x] `<number>`
    - [x] Field: `state`
        - [x] `<word>` (e.g., FULL/DR)
    - [x] Field: `dead_time`
        - [x] `<word>` (e.g., 00:00:35)
    - [x] Field: `address`
        - [x] `<ipv4_address>`
    - [x] Field: `interface`
        - [x] `<interface_name>`

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
