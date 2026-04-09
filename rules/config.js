/**
 * @file Configuration rules for Cisco grammar
 */

module.exports = {
  vlan_block: $ => prec.left(1, seq(
    $.vlan_definition,
    repeat(choice($._newline, $.comment)),
    $.indented_command,
    repeat(choice($.indented_command, $.comment, $._newline)),
    optional(seq('!', $._newline))
  )),

  line_block: $ => prec.left(1, seq(
    seq('line', field('type', choice('vty', 'con', 'aux')), repeat1($.number), $._newline),
    repeat(choice($._newline, $.comment)),
    $.indented_command,
    repeat(choice($.indented_command, $.comment, $._newline)),
    optional(seq('!', $._newline))
  )),

  qos_block: $ => prec.left(1, seq(
    choice(
      seq('class-map', optional(choice('match-all', 'match-any')), field('name', $.word)),
      seq('policy-map', field('name', $.word))
    ),
    $._newline,
    repeat(choice($._newline, $.comment)),
    $.indented_command,
    repeat(choice($.indented_command, $.comment, $._newline)),
    optional(seq('!', $._newline))
  )),

  acl_block: $ => prec.left(1, seq(
    $.acl_definition,
    repeat(choice($._newline, $.comment)),
    $.indented_command,
    repeat(choice($.indented_command, $.comment, $._newline)),
    optional(seq('!', $._newline))
  )),

  acl_definition: $ => seq(
    'ip', 'access-list',
    choice('standard', 'extended'),
    field('name', $.word),
    $._newline
  ),

  crypto_config: $ => seq('crypto', /.*/, $._newline),
  system_config: $ => seq(
    choice('hostname', 'service', 'enable', 'username', 'ip domain-name'),
    /.*/,
    $._newline
  ),

  block: $ => prec.left(seq(
    $.command,
    repeat(choice($._newline, $.comment)),
    $.indented_command,
    repeat(choice($.indented_command, $.comment, $._newline)),
    optional(seq('!', $._newline))
  )),

  indented_command: $ => seq(
    /[ \t]+/,
    choice(
      $.ip_address_assignment,
      $.ipv6_address_assignment,
      $.acl_rule,
      $.bgp_neighbor,
      $.bgp_network,
      $.ospf_network,
      $.ospf_area,
      $.address_family,
      $.service_policy,
      $.block,
      $.command
    )
  ),

  service_policy: $ => seq('service-policy', choice('input', 'output'), field('name', $.word), $._newline),

  ntp_config: $ => seq('ntp', choice(
    seq('server', field('address', choice($.ipv4_address, $.word))),
    seq('peer', field('address', choice($.ipv4_address, $.word))),
    seq('source', field('interface', $.interface_name)),
    seq('access-group', optional(choice('ipv4', 'ipv6')), choice('peer', 'serve', 'serve-only', 'query-only'), field('acl', $.word))
  ), $._newline),

  logging_config: $ => seq('logging', choice(
    field('host', $.ipv4_address),
    seq('source-interface', field('interface', $.interface_name)),
    seq('trap', field('severity', $.word)),
    seq('facility', field('facility', $.word)),
    seq('buffered', optional(field('size', $.number)))
  ), $._newline),

  snmp_config: $ => seq('snmp-server', choice(
    seq('community', field('name', $.word), optional(choice('RO', 'RW')), optional(field('acl', $.word))),
    seq('host', field('address', $.ipv4_address), optional('version'), optional($.word), field('community', $.word)),
    seq('contact', field('text', /.*/)),
    seq('location', field('text', /.*/))
  ), $._newline),

  vlan_definition: $ => seq('vlan', field('id', $.number), $._newline),
  vrf_definition: $ => seq(choice('vrf', 'ip vrf'), choice('definition', 'forwarding'), field('name', $.word), $._newline),

  bgp_neighbor: $ => seq('neighbor', field('address', choice($.ipv4_address, $.ipv6_address, $.word)), choice(
    seq('remote-as', field('remote_as', $.number)),
    seq('description', choice(field('description', $.string), field('description_word', $.word))),
    seq('update-source', field('interface', $.interface_name)),
    seq('soft-reconfiguration', 'inbound'),
    'next-hop-self',
    'activate',
    seq('route-map', field('route_map', $.word), choice('in', 'out'))
  ), $._newline),

  bgp_network: $ => seq('network', field('address', $.ipv4_address), optional(seq('mask', field('mask', $.ipv4_address))), optional(seq('route-map', field('route_map', $.word))), $._newline),

  address_family: $ => seq('address-family', field('afi', choice('ipv4', 'ipv6', 'vpnv4', 'vpnv6', 'l2vpn')), optional(field('safi', choice('unicast', 'multicast', 'vpls', 'evpn'))), optional(seq('vrf', field('vrf', $.word))), $._newline),

  ospf_network: $ => seq('network', field('address', $.ipv4_address), field('wildcard', $.ipv4_address), 'area', field('area', choice($.number, $.ipv4_address)), $._newline),

  ospf_area: $ => seq('area', field('area', choice($.number, $.ipv4_address)), choice(
    seq('range', field('address', $.ipv4_address), field('mask', $.ipv4_address)),
    seq('authentication', optional('message-digest')),
    seq('stub', optional('no-summary')),
    seq('nssa', optional('no-summary'))
  ), $._newline),

  static_route: $ => seq('ip', 'route', optional(seq('vrf', field('vrf', $.word))), field('destination', $.ipv4_address), field('mask', $.ipv4_address), field('next_hop', choice($.ipv4_address, $.interface_name)), optional(field('distance', $.number)), optional(seq('tag', field('tag', $.number))), optional(field('permanent', 'permanent')), optional(seq('name', field('name', $.word))), optional(seq('track', field('track', $.number))), $._newline),

  ip_address_assignment: $ => seq(choice('ip', 'ipv4'), choice('address', 'addr'), field('address', $.ipv4_address), field('mask', $.ipv4_address), optional(field('secondary', choice('secondary', 'sec'))), $._newline),

  ipv6_address_assignment: $ => seq('ipv6', choice('address', 'addr'), field('address', $.ipv6_address), optional(field('secondary', choice('secondary', 'sec'))), $._newline),

  acl_rule: $ => seq(choice('permit', 'perm', 'deny', 'den'), $._line_content, $._newline),

  command: $ => seq($._line_content, $._newline),

  _line_content: $ => repeat1(choice($.ipv6_address, $.ipv4_address, $.interface_name, $.mac_address, $.vlan_range, $.number, $.word, $.string, $.punctuation, $.operator))
};
