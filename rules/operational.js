/**
 * @file Operational commands (show) for Cisco grammar
 */

module.exports = {
  // SHOW commands
  show_version: $ => seq(field('header', token(/show\s+version/)), $._newline, $.show_version_content),
  show_inventory: $ => seq(field('header', token(/show\s+inventory/)), $._newline, $.show_inventory_content),
  show_ip_int_brief: $ => seq(field('header', token(/show\s+ip\s+interface\s+brief/)), $._newline, $.show_ip_interface_brief_content),
  show_interfaces: $ => seq(field('header', token(/show\s+interfaces(\s+\S+)?/)), $._newline, $.show_interfaces_content),
  show_vlan_brief: $ => seq(field('header', token(/show\s+vlan\s+brief/)), $._newline, $.show_vlan_brief_content),
  show_ip_arp: $ => seq(field('header', token(/show\s+ip\s+arp/)), $._newline, $.show_ip_arp_content),
  show_ip_route: $ => seq(field('header', token(/show\s+ip\s+route(\s+vrf\s+\S+)?/)), $._newline, $.show_ip_route_content),
  show_mac_address_table: $ => seq(field('header', token(/show\s+mac\s+address-table/)), $._newline, $.show_mac_address_table_content),
  show_ip_ospf_neighbor: $ => seq(field('header', token(/show\s+ip\s+ospf\s+neighbor/)), $._newline, $.show_ip_ospf_neighbor_content),
  show_ip_bgp_summary: $ => seq(field('header', token(/show\s+ip\s+bgp\s+summary/)), $._newline, $.show_ip_bgp_summary_content),
  show_spanning_tree: $ => seq(field('header', token(/show\s+spanning-tree/)), $._newline, $.show_spanning_tree_content),

  // SHOW contents
  show_version_content: $ => prec.left(repeat1(choice(
    seq(/.*Software.*/, field('version', /[^,\n\r]+/), /.*/, $._newline),
    seq(/.*uptime is.*/, field('uptime', /.*/), $._newline),
    seq(/.*System image file is.*/, field('image', $.string), $._newline),
    seq(/.*Model number:.*/, field('model', $.word), $._newline),
    seq(/.*System serial number:.*/, field('serial', $.word), $._newline),
    seq(/[^S\n\s].*/, $._newline)
  ))),

  show_inventory_content: $ => prec.left(repeat1($.inventory_entry)),
  inventory_entry: $ => seq(
    'NAME:', field('name', $.string), ',', 'DESCR:', field('description', $.string), $._newline,
    'PID:', field('pid', $.word), ',', 'VID:', field('vid', $.word), ',', 'SN:', field('sn', $.word), $._newline
  ),

  show_ip_interface_brief_content: $ => prec.left(seq(
    repeat(choice(/Interface.*/, $._newline, $.comment)),
    repeat1($.ip_int_brief_entry)
  )),

  ip_int_brief_entry: $ => seq(
    field('interface', $.interface_name),
    field('ip_address', choice($.ipv4_address, 'unassigned')),
    field('ok', $.word),
    field('method', $.word),
    field('status', choice('up', 'down', 'administratively down')),
    field('protocol', choice('up', 'down')),
    $._newline
  ),

  show_interfaces_content: $ => prec.left(repeat1($.interface_status_entry)),

  interface_status_entry: $ => seq(
    field('interface', $.interface_name),
    'is',
    field('status', choice('up', 'down', 'administratively down')),
    ', line protocol is',
    field('protocol', choice('up', 'down')),
    $._newline,
    repeat(choice(
      seq(/.*Hardware is.*/, optional(seq(', address is', field('mac', $.mac_address))), /.*/, $._newline),
      seq(/.*MTU.*/, field('mtu', $.number), /.*BW.*/, field('bandwidth', $.number), /.*/, $._newline),
      seq(/.*duplex.*/, field('duplex', choice('Full-duplex', 'Half-duplex', 'Auto-duplex')), /.*/, field('speed', /[^,\n]+/), /.*/, $._newline),
      seq(/.*packets input.*/, field('input_packets', $.number), /.*bytes.*/, field('input_bytes', $.number), /.*/, $._newline),
      seq(/.*input errors.*/, field('input_errors', $.number), /.*CRC.*/, field('crc_errors', $.number), /.*/, $._newline),
      seq(/.*packets output.*/, field('output_packets', $.number), /.*bytes.*/, field('output_bytes', $.number), /.*/, $._newline),
      seq(/.*output errors.*/, field('output_errors', $.number), /.*collisions.*/, field('collisions', $.number), /.*/, $._newline),
      seq(/[^i\n\s].*/, $._newline)
    ))
  ),

  show_vlan_brief_content: $ => prec.left(seq(
    repeat(choice(/VLAN.*/, /----.*/, $._newline, $.comment)),
    repeat1($.vlan_brief_entry)
  )),

  vlan_brief_entry: $ => seq(
    field('id', $.number),
    field('name', $.word),
    field('status', $.word),
    field('ports', repeat($.interface_name)),
    $._newline
  ),

  show_ip_arp_content: $ => prec.left(seq(
    repeat(choice(/Protocol.*/, $._newline, $.comment)),
    repeat1($.arp_entry)
  )),

  arp_entry: $ => seq(
    field('protocol', $.word),
    field('address', $.ipv4_address),
    field('age', choice($.number, '-')),
    field('mac', $.mac_address),
    field('type', $.word),
    field('interface', $.interface_name),
    $._newline
  ),

  show_ip_bgp_summary_content: $ => prec.left(seq(
    repeat(choice(/.*BGP router identifier.*/, /.*Neighbor.*/, /.*/, $._newline, $.comment)),
    repeat1($.bgp_summary_entry)
  )),

  bgp_summary_entry: $ => seq(
    field('neighbor', choice($.ipv4_address, $.ipv6_address)),
    field('version', $.number),
    field('as', $.number),
    field('msg_rcvd', $.number),
    field('msg_sent', $.number),
    field('table_version', $.number),
    field('in_queue', $.number),
    field('out_queue', $.number),
    field('up_down', $.word),
    field('state_pfxrcd', $.word),
    $._newline
  ),

  show_spanning_tree_content: $ => prec.left(repeat1(choice(
    seq(/.*VLAN.*/, field('vlan', $.number), /.*/, $._newline),
    seq(/.*Root ID.*/, /Priority/, field('root_priority', $.number), /Address/, field('root_address', $.mac_address), /.*/, $._newline),
    seq(/.*Bridge ID.*/, /Priority/, field('bridge_priority', $.number), /Address/, field('bridge_address', $.mac_address), /.*/, $._newline),
    seq(field('port', $.interface_name), field('role', $.word), field('status', $.word), field('cost', $.number), /.*/, $._newline),
    seq(/[^V\n\s].*/, $._newline)
  ))),

  show_ip_route_content: $ => prec.left(seq(
    repeat(choice(/Codes:.*/, /Gateway of last resort is.*/, $._newline, $.comment)),
    repeat1($.routing_entry)
  )),

  routing_entry: $ => seq(
    field('protocol', $.word),
    field('prefix', $.ipv4_address),
    optional(seq('/', field('mask_length', $.number))),
    optional(seq('[', field('distance', $.number), '/', field('metric', $.number), ']')),
    'via',
    field('next_hop', choice($.ipv4_address, $.interface_name)),
    optional(seq(',', field('uptime', $.word))),
    optional(seq(',', field('interface', $.interface_name))),
    $._newline
  ),

  show_mac_address_table_content: $ => prec.left(seq(
    repeat(choice(/.*Mac Address Table.*/, /.*---.*/, /.*Vlan.*/, $._newline, $.comment)),
    repeat1($.mac_entry)
  )),

  mac_entry: $ => seq(
    field('vlan', choice($.number, 'All', '*')),
    field('mac', $.mac_address),
    field('type', choice('STATIC', 'DYNAMIC')),
    field('ports', choice($.interface_name, $.word)),
    $._newline
  ),

  show_ip_ospf_neighbor_content: $ => prec.left(seq(
    repeat(choice(/Neighbor ID.*/, /.*/, $._newline, $.comment)),
    repeat1($.ospf_neighbor_entry)
  )),

  ospf_neighbor_entry: $ => seq(
    field('neighbor_id', $.ipv4_address),
    field('priority', $.number),
    field('state', $.word),
    field('dead_time', /[^ \n]+/),
    field('address', $.ipv4_address),
    field('interface', $.interface_name),
    $._newline
  )
};
