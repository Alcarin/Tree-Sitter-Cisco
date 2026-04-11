/**
 * @file Operational commands for Cisco grammar - Absolute Stabilization
 */

module.exports = {
  // KEYWORDS OPERATIVE
  _kw_uptime_is: $ => token(prec(100, /uptime is/i)),

  // --- HEADERS ---
  show_version: $ => seq(token(prec(10, /show\s+version/i)), $._newline),
  show_inventory: $ => seq(token(prec(10, /show\s+inventory/i)), $._newline),
  show_ip_interface_brief: $ => seq(token(prec(10, /show\s+ip\s+interface\s+brief/i)), $._newline),
  show_ip_route: $ => seq(token(prec(10, /show\s+ip\s+route(\s+vrf\s+\S+)?/i)), $._newline),
  show_mac_address_table: $ => seq(token(prec(10, /show\s+mac\s+address-table/i)), $._newline),
  show_ip_arp: $ => seq(token(prec(10, /show\s+ip\s+arp/i)), $._newline),
  show_ip_bgp_summary: $ => seq(token(prec(10, /show\s+ip\s+bgp\s+summary/i)), $._newline),
  show_ip_bgp_neighbors: $ => seq(token(prec(10, /show\s+ip\s+bgp\s+neighbors/i)), $._newline),
  generic_show_command: $ => seq(/show\s+/i, /[^\n\r]+/, $._newline),

  // --- SHOW VERSION CONTENTS ---
  software_info: $ => prec.dynamic(100, seq(
    token(prec(100, /Cisco\s+IOS\s+Software.*/i)), $._newline
  )),
  uptime_info: $ => prec.dynamic(100, seq(
    field('hostname', $.word), $._kw_uptime_is, field('uptime', $.uptime), $._newline
  )),
  processor_info: $ => prec.dynamic(100, seq(
    token(prec(100, /[Pp]rocessor\s+board\s+ID.*/i)), $._newline
  )),
  config_register: $ => prec.dynamic(100, seq(
    token(prec(100, /[Cc]onfiguration\s+register\s+is.*/i)), $._newline
  )),

  // --- SHOW INVENTORY CONTENTS ---
  inventory_entry: $ => prec.dynamic(100, seq(
    token(prec(100, /NAME:.*DESCR:.*/i)), $._newline,
    token(prec(100, /PID:.*VID:.*SN:.*/i)), $._newline
  )),

  // --- SHOW IP INTERFACE BRIEF CONTENTS ---
  ip_int_brief_entry: $ => prec.dynamic(100, seq(
    field('interface', $.interface_name),
    field('ip_address', choice($.ipv4_address, /unassigned/i)),
    field('ok', $.word),
    field('method', $.word),
    field('status', $.operational_status),
    field('protocol', $.operational_status),
    $._newline
  )),

  operational_status: $ => token(prec(10, choice(/up/i, /down/i, /administratively down/i, /deleted/i))),

  // --- SHOW INTERFACES CONTENTS ---
  interface_status_entry: $ => prec.dynamic(100, seq(
    field('interface', $.interface_name), /is/i, field('status', $.operational_status), /,\s+line\s+protocol\s+is/i, field('protocol', $.operational_status), $._newline
  )),

  // --- SHOW VLAN BRIEF CONTENTS ---
  vlan_brief_entry: $ => prec.dynamic(100, seq(
    field('id', $.number), field('name', $.word), field('status', $.word), field('ports', repeat1($.interface_name)), $._newline
  )),

  // --- SHOW IP ARP CONTENTS ---
  arp_entry: $ => prec.dynamic(100, seq(
    field('protocol', $.word), field('ip_address', $.ipv4_address), field('age', choice($.number, /-/)), field('mac_address', $.mac_address), field('type', $.word), optional(field('interface', $.interface_name)), $._newline
  )),

  // --- SHOW IP BGP SUMMARY CONTENTS ---
  bgp_summary_entry: $ => prec.dynamic(100, seq(
    field('neighbor', choice($.ipv4_address, $.ipv6_address)), field('version', $.number), field('remote_as', $.number), field('msg_rcvd', $.number), field('msg_sent', $.number), field('tbl_ver', $.number), field('in_q', $.number), field('out_q', $.number), field('up_down', $.word), field('state_pfx', $.word), $._newline
  )),

  // --- SHOW IP ROUTE CONTENTS ---
  subnet_header: $ => prec.dynamic(100, seq(
    field('network', $.ipv4_address), /\//i, field('prefix', $.number), /\s+is\s+subnetted.*/i, $._newline
  )),
  routing_entry: $ => prec.dynamic(100, seq(
    field('protocol', $.word), optional($.word), field('network', $.ipv4_address), optional(seq(/\//i, field('prefix', $.number))), /\[/i, field('distance', $.number), /\//i, field('metric', $.number), /\]\s+via\s+/i, field('nexthop', choice($.ipv4_address, $.interface_name)), /[^\n\r]*/, $._newline
  )),

  // --- SHOW MAC ADDRESS-TABLE CONTENTS ---
  mac_entry: $ => prec.dynamic(100, seq(
    optional(/\*/), field('vlan', choice($.number, /all/i, /-/)), field('mac_address', $.mac_address), field('type', $.word), field('ports', $.word), $._newline
  )),

  // --- SHOW IP OSPF NEIGHBOR CONTENTS ---
  ospf_neighbor_entry: $ => prec.dynamic(100, seq(
    field('neighbor_id', $.ipv4_address), field('priority', $.number), field('state', $.word), field('dead_time', /[^ \n]+/), field('address', $.ipv4_address), field('interface', $.interface_name), $._newline
  )),

  // --- SHOW IP BGP NEIGHBORS CONTENTS ---
  bgp_neighbor_block: $ => prec.dynamic(100, seq(
    /BGP\s+neighbor\s+is\s+/i, field('neighbor', $.ipv4_address), /,\s+remote\s+AS\s+/i, field('remote_as', $.number), /[^\n\r]*/, $._newline
  ))
};
