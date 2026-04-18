/**
 * @file Configuration rules for Cisco grammar - Ultra Resilient Version
 */

module.exports = {
  // KEYWORDS
  _kw_interface: $ => choice('interface', 'int', 'Interface', 'Int'),
  _kw_router: $ => choice('router', 'Router'),
  _kw_bgp: $ => choice('bgp', 'BGP'),
  _kw_ospf: $ => choice('ospf', 'OSPF'),
  _kw_vlan: $ => choice('vlan', 'Vlan', 'VLAN'),
  _kw_line: $ => choice('line', 'Line'),
  _kw_ip: $ => choice('ip', 'IP'),
  _kw_ipv6: $ => choice('ipv6', 'IPv6'),
  _kw_hostname: $ => choice('hostname', 'host', 'Hostname'),
  _kw_username: $ => choice('username', 'user', 'Username'),
  _kw_description: $ => choice('description', 'desc', 'Description'),

  // BLOCCHI ULTRA-RESILIENTI
  interface_block: $ => prec(200, seq(
    $._kw_interface, 
    field('name', $.interface_name), 
    $._newline,
    optional(seq($._indent, repeat(choice($._interface_statement, $._newline)), optional($._dedent)))
  )),

  bgp_block: $ => prec(200, seq(
    $._kw_router, 
    $._kw_bgp, 
    field('as_number', $.number), 
    $._newline,
    optional(seq($._indent, repeat(choice($._bgp_statement, $._newline)), optional($._dedent)))
  )),

  ospf_block: $ => prec(200, seq(
    $._kw_router, 
    $._kw_ospf, 
    field('process_id', $.number), 
    optional(seq('vrf', field('vrf', $.word))), 
    $._newline,
    optional(seq($._indent, repeat(choice($._ospf_statement, $._newline)), optional($._dedent)))
  )),

  vlan_block: $ => prec(200, seq(
    $._kw_vlan, 
    field('id', $.number), 
    optional(field('name', $.word)), 
    $._newline,
    optional(seq($._indent, repeat(choice($._vlan_statement, $._newline)), optional($._dedent)))
  )),

  line_block: $ => prec(200, seq(
    $._kw_line, 
    field('type', alias(choice('vty', 'con', 'console', 'aux'), $.word)), 
    field('start', $.number), 
    optional(field('end', $.number)), 
    $._newline,
    optional(seq($._indent, repeat(choice($._line_statement, $._newline)), optional($._dedent)))
  )),

  qos_block: $ => prec(200, seq(
    choice(
      seq('class-map', optional(choice('match-all', 'match-any')), field('name', $.word)),
      seq('policy-map', field('name', $.word))
    ),
    $._newline,
    optional(seq($._indent, repeat(choice($._qos_statement, $._newline)), optional($._dedent)))
  )),

  acl_block: $ => prec(200, seq(
    $._kw_ip, 
    'access-list', 
    choice('standard', 'extended'), 
    field('name', $.word), 
    $._newline,
    optional(seq($._indent, repeat(choice($._acl_statement, $._newline)), optional($._dedent)))
  )),

  system_config: $ => choice(
    prec(100, seq($._kw_hostname, field('name', $.word), $._newline)),
    $.vrf_definition,
    $.static_route,
    $.username_config
  ),

  vrf_definition: $ => prec(100, seq(choice('vrf', seq($._kw_ip, 'vrf')), choice('definition', 'forwarding'), field('name', $.word), $._newline)),
  
  static_route: $ => prec(100, seq(
    $._kw_ip, 
    'route', 
    optional(seq('vrf', field('vrf', $.word))), 
    field('destination', $.ipv4_address), 
    field('mask', $.ipv4_address), 
    field('next_hop', choice($.ipv4_address, $.interface_name)), 
    optional(field('distance', $.number)), 
    $._newline
  )),

  username_config: $ => prec(100, seq($._kw_username, field('name', $.word), optional(seq('privilege', $.number)), optional(seq(choice('password', 'secret'), optional($.number), field('password', $.word))), $._newline)),

  _interface_statement: $ => choice($.description_config, $.ip_address_config, $.interface_standby, $.comment, $.command),
  description_config: $ => seq($._kw_description, field('text', repeat1($.word)), $._newline),
  ip_address_config: $ => seq($._kw_ip, 'address', field('address', $.ipv4_address), field('mask', $.ipv4_address), optional(choice(field('secondary', 'secondary'), seq('standby', field('standby', $.ipv4_address)))), $._newline),

  interface_standby: $ => seq('standby', optional(field('group', $.number)), choice(seq('ip', field('ip', $.ipv4_address)), seq('priority', field('priority', $.number)), 'preempt'), $._newline),

  _bgp_statement: $ => choice($.comment, $.command),
  _ospf_statement: $ => choice($.comment, $.command),
  _vlan_statement: $ => choice($.comment, $.command),
  _line_statement: $ => choice($.comment, $.command),
  _qos_statement: $ => choice($.comment, $.command),
  _acl_statement: $ => choice($.acl_rule, $.comment, $.command),
  acl_rule: $ => seq(optional($.number), field('action', $.acl_action), optional($.word), $._acl_addr_spec_source, optional($._acl_addr_spec_dest), repeat($.word), $._newline),
  _acl_addr_spec_source: $ => choice(field('source_any', 'any'), seq('host', field('source_host', $.ipv4_address)), seq(field('source_network', $.ipv4_address), field('source_wildcard', $.ipv4_address))),
  _acl_addr_spec_dest: $ => choice(field('destination_any', 'any'), seq('host', field('destination_host', $.ipv4_address)), seq(field('destination_network', $.ipv4_address), field('destination_wildcard', $.ipv4_address))),
  acl_action: $ => choice('permit', 'perm', 'deny', 'den')
};
