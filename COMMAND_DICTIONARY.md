# 🌲 Cisco CLI Command Tree & Support Matrix

This document maps the hierarchical structure of Cisco commands (IOS, XE, XR, NX-OS, ASA) and their support status in the Tree-Sitter parser.

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
  - [x] `master [<number>]`
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
  - [x] `location <string>`
  - [x] `contact <string>`
- [x] `vlan`
  - [x] `<number>` (ID: 1-4094)
    - [x] `name`
      - [x] `<word>`
- [x] `crypto`
  - [x] `key generate rsa`
    - [x] `general-keys`
      - [x] `modulus`
        - [x] `<number>` (Bits: 1024, 2048, 4096)
- [x] `ip ssh`
  - [x] `version <1|2>`
  - [x] `authentication-retries <number>`
  - [x] `time-out <number>`

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
    - [x] `encapsulation`
      - [x] `dot1q` | `isl` | `negotiate`
  - [x] `port-security`
    - [x] `maximum`
      - [x] `<number>`
    - [x] `violation`
      - [x] `shutdown` | `restrict` | `protect`
    - [x] `mac-address`
      - [x] `sticky` | `<mac_address>`
- [x] `spanning-tree`
  - [x] `vlan <number>`
    - [x] `priority <number>`
  - [x] `portfast` | `bpduguard enable`
  - [x] `mode` [pvst | rapid-pvst | mst]
- [x] `vtp`
  - [x] `domain <word>`
  - [x] `mode` [client | server | transparent | off]

### 2.3 Port-Channel (EtherChannel)

- [x] `interface Port-channel <number>`
- [x] `channel-group <number> mode` [active | passive | on | desirable | auto]

### 2.4 Layer 3 (IP & VRF)

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

### 2.4 HSRP (Hot Standby Router Protocol)

- [x] `standby`
  - [x] `version`
    - [x] `<1|2>`
  - [x] `delay`
    - [x] `minimum <sec>` | `reload <sec>`
  - [x] `use-bia`
  - [x] `group`
    - [x] `<number>`
      - [x] `ip`
        - [x] `<ipv4_address> [secondary]`
      - [x] `ipv6`
        - [x] `<ipv6_address> | autoconfig`
      - [x] `priority`
        - [x] `<number>`
      - [x] `preempt`
      - [x] `timers`
        - [x] `[msec] <hello> [msec] <hold>`
      - [x] `track`
        - [x] `<object_id> [decrement <value>]`

### 2.5 ASA Specific Interface Config

- [x] `nameif <word>` (Interface zone)
- [x] `security-level <number>` (0-100)
- [x] `ip address <ipv4> <mask> [standby <ipv4>]`

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
        - [x] `soft-reconfiguration inbound`
    - [x] `address-family`
      - [x] `ipv4` | `ipv6` | `vpnv4` | `vpnv6`
        - [x] `unicast` | `multicast`
          - [x] `network`
            - [x] `<ipv4_address> [mask <ipv4_address>]`
          - [x] `neighbor <addr> activate`

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
- [x] `show interface status`
  - [x] Field: `interface` | `name` | `status` | `vlan` | `duplex` | `speed` | `type`
- [x] `show interfaces [<interface>]`
  - [x] Field: `interface` (Optional filter)
  - [x] Field: `description`
  - [x] Field: `mtu` | `bw` | `delay`
  - [x] Field: `reliability` | `txload` | `rxload`
  - [x] Field: `rate_bits` | `rate_pkts` (Input/Output)
  - [x] Field: `packets` | `bytes` (Input/Output counters)
  - [x] Field: `errors` | `crc` | `frame` | `overrun` | `ignored` (Input errors)
  - [x] Field: `collisions` | `resets` (Output errors)
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

### 4.4 Security (ASA/FTD)

- [x] `show crypto ipsec sa`
  - [x] Field: `interface` | `local_addr` | `peer`
  - [x] Field: `encaps` | `decaps`
  - [x] Field: `address` | `mask` | `protocol` | `port` (Ident)
- [x] `show crypto ikev1 sa [detail]`
  - [x] Field: `connection_id` | `ip_address` | `state` | `role`
- [x] `show failover`
  - [x] Field: `status` (On/Off)
  - [x] Field: `role` (Active/Standby/Primary/Secondary)
  - [x] Field: `interface` | `status`
- [x] `show vpn-sessiondb [anyconnect | l2l]`
  - [x] Field: `username` | `index` | `public_ip` | `total`

### 4.5 Service Provider (IOS-XR)

- [x] `show bgp neighbors`
  - [x] Field: `neighbor` | `remote_as` | `local_as`
- [x] `show mpls ldp neighbor [brief]`
  - [x] Field: `peer_id` | `label_space` | `local_id` | `local_label_space`
- [ ] `show controllers [HundredGigabitEthernet <name>]`
  - [ ] Field: `interface` | `operational_state` | `mac_address`

### 4.6 Data Center (NX-OS)

- [x] `show vpc`
  - [x] Field: `domain_id` | `vpc_id` | `port` | `status` | `consistency`
- [x] `show fex`
  - [x] Field: `fex_id` | `description` | `state` | `model` | `serial`
- [ ] `show nve peers`
  - [ ] Field: `interface` | `peer_ip` | `state` | `uptime`
- [ ] `show nve vni`
  - [ ] Field: `vni` | `mcast_group` | `vni_state`

### 4.7 Advanced L2/L3 (IOS/XE)

- [x] `show etherchannel summary`
  - [x] Field: `group` | `bundle_name` | `bundle_status` | `bundle_protocol`
  - [x] Field: `member_interface` | `member_status`
- [x] `show spanning-tree`
  - [x] Field: `vlan_id` | `interface` | `role` | `status` | `cost` | `port_priority` | `port_id`
- [ ] `show vtp status`
  - [ ] Field: `version` | `domain` | `mode` | `max_vlans` | `existing_vlan_count` | `revision_number`
- [x] `show standby [brief]` (HSRP)
  - [x] Field: `interface` | `group` | `priority` | `preempt` | `state` | `active_router` | `standby_router` | `virtual_ip`
- [ ] `show vrrp [brief]`
  - [ ] Field: `interface` | `group` | `state` | `virtual_ip` | `master_router`

### 4.8 Infrastructure & Services (IOS/XE)

- [ ] `show logging`
  - [ ] Field: `facility` | `severity` | `mnemonic` | `message` | `timestamp`
- [ ] `show snmp community` | `show snmp group` | `show snmp user`
  - [ ] Field: `community_name` | `group_name` | `user_name` | `acl` | `storage_type`
- [ ] `show ip dhcp binding`
  - [ ] Field: `ip_address` | `mac_address` | `lease_expiration` | `type`
- [ ] `show ip nat translations`
  - [ ] Field: `protocol` | `inside_global_ip` | `inside_local_ip` | `outside_local_ip` | `outside_global_ip`

### 4.9 Security & Auth (IOS/XE)

- [ ] `show authentication sessions`
  - [ ] Field: `interface` | `mac_address` | `method` | `domain` | `status` | `session_id`
- [ ] `show dot1x all`
  - [ ] Field: `interface` | `pae` | `auth_status`
- [ ] `show ip access-lists`
  - [ ] Field: `acl_name` | `line_number` | `action` | `protocol` | `source` | `destination` | `matches`

### 4.10 SD-WAN & Advanced Routing (IOS/XE)

- [ ] `show sdwan bfd sessions`
  - [ ] Field: `system_ip` | `site_id` | `local_color` | `remote_color` | `state` | `uptime`
- [ ] `show ip eigrp topology`
  - [ ] Field: `as` | `id` | `network` | `mask` | `successors` | `fd`
- [ ] `show ip ospf database`
  - [ ] Field: `link_id` | `adv_router` | `age` | `seq_number` | `checksum`

---

## 🛡️ 5. Security & ACL

### 5.1 IP Access Lists

- [x] `ip access-list`
  - [x] `standard` | `extended`
    - [x] `<word>` (ACL Name)
      - [x] `permit` / `perm` | `deny` / `den`
        - [x] `<protocol>` (tcp, udp, icmp, ip)
        - [x] `any` | `host <ipv4>` | `<ipv4> <wildcard>`
        - [x] `[eq | range <port>]`

### 5.2 Object Groups (ASA)

- [x] `object-group network`
  - [x] `<name>`
    - [x] `network-object host <ipv4>`
    - [x] `network-object <ipv4> <mask>`
- [x] `object-group service`
  - [x] `<name> <protocol>`
    - [x] `port-object eq <port>`

### 5.3 Line Configuration

- [x] `line`
  - [x] `vty` | `con` | `console` | `aux`
    - [x] `<number>` (Start)
      - [x] `[<number>]` (End)
        - [x] `login` [local]
        - [x] `transport input` [ssh | telnet | all | none]
  - [x] `password`
    - [x] `[<number>]` (Encryption type)
    - [x] `<word>` (Password)
  - [x] `exec-timeout`
    - [x] `<number>` (Minutes)
    - [x] `[<number>]` (Seconds)

---

## 📋 6. Diagnostics & Utilities

- [x] `ping`
  - [x] `<ipv4_address> | <word>` (Destination)
  - [x] `source <interface> | <ipv4_address>`
  - [x] `vrf <word>`
  - [x] `repeat <number>` | `timeout <number>` | `size <number>`
  - [x] Field: `success_rate` | `success_qty` | `sent_qty`
  - [x] Field: `rtt_min` | `rtt_avg` | `rtt_max`
  - [x] Field: `response_stream` (e.g., !!!!!)
- [x] `traceroute`
  - [x] `<ipv4_address> | <word>`
  - [x] Field: `hop_number` | `hop_address` | `rtt`
- [x] `dir`
  - [x] `[<filesystem>]` (e.g., flash:, disk0:, nvram:)
  - [x] Field: `id` | `permissions` | `size` | `date_time` | `file_name`
  - [x] Field: `total_size` | `total_free`
- [x] `terminal length <number>`
- [x] `terminal width <number>`
