/**
 * @file Configuration rules for Cisco grammar - Refined Switchport
 */

module.exports = {
  // KEYWORDS ATOMICHE (Proteggono da ambiguità con 'word')
  _kw_interface: $ => token(prec(10, 'interface')),
  _kw_router: $ => token(prec(10, 'router')),
  _kw_bgp: $ => token(prec(10, 'bgp')),
  _kw_ospf: $ => token(prec(10, 'ospf')),
  _kw_vlan: $ => token(prec(10, 'vlan')),
  _kw_line: $ => token(prec(10, 'line')),
  _kw_ip: $ => token(prec(10, 'ip')),
  _kw_hostname: $ => token(prec(10, 'hostname')),
  _kw_username: $ => token(prec(10, 'username')),
  _kw_description: $ => token(prec(10, 'description')),
  _kw_address: $ => token(prec(10, 'address')),
  _kw_switchport: $ => token(prec(10, 'switchport')),
  _kw_spanning_tree: $ => token(prec(10, 'spanning-tree')),
  _kw_neighbor: $ => token(prec(10, 'neighbor')),
  _kw_network: $ => token(prec(10, 'network')),
  _kw_ntp: $ => token(prec(10, 'ntp')),
  _kw_logging: $ => token(prec(10, 'logging')),
  _kw_snmp: $ => token(prec(10, 'snmp-server')),
  _kw_aaa: $ => token(prec(10, 'aaa')),
  _kw_boot: $ => token(prec(10, 'boot')),
  _kw_crypto: $ => token(prec(10, 'crypto')),
  _kw_ipv6: $ => token(prec(10, 'ipv6')),

  // BLOCCHI CON SCOPED STATEMENTS
  interface_block: $ => seq(
    $._kw_interface, field('name', $.interface_name), $._newline,
    $._indent, repeat($._interface_statement), $._dedent
  ),

  bgp_block: $ => seq(
    $._kw_router, $._kw_bgp, field('as_number', $.number), $._newline,
    $._indent, repeat($._bgp_statement), $._dedent
  ),

  ospf_block: $ => seq(
    $._kw_router, $._kw_ospf, field('process_id', $.number), optional(seq('vrf', field('vrf', $.word))), $._newline,
    $._indent, repeat($._ospf_statement), $._dedent
  ),

  vlan_block: $ => seq(
    $._kw_vlan, field('id', $.number), $._newline,
    $._indent, repeat($._vlan_statement), $._dedent
  ),

  line_block: $ => seq(
    $._kw_line, field('type', choice('vty', 'con', 'aux')), repeat1($.number), $._newline,
    $._indent, repeat($._line_statement), $._dedent
  ),

  qos_block: $ => seq(
    choice(
      seq('class-map', optional(choice('match-all', 'match-any')), field('name', $.word)),
      seq('policy-map', field('name', $.word))
    ),
    $._newline,
    $._indent, repeat($._qos_statement), $._dedent
  ),

  acl_block: $ => seq(
    $._kw_ip, 'access-list', choice('standard', 'extended'), field('name', $.word), $._newline,
    $._indent, repeat($._acl_statement), $._dedent
  ),

  // REGOLE DI SUPPORTO E CONFIGURAZIONE GLOBALE (Capitolo 1)
  system_config: $ => choice(
    seq($._kw_hostname, field('name', $.word), $._newline),
    seq('service', $.word, $._newline),
    seq('enable', 'secret', $.number, field('password', $.word), $._newline),
    seq($._kw_ip, 'domain-name', field('domain', $.word), $._newline),
    $.username_config,
    $.ntp_config,
    $.logging_config,
    $.snmp_config,
    $.aaa_config,
    $.boot_config,
    $.crypto_config
  ),

  ntp_config: $ => seq(
    $._kw_ntp, 
    choice(
      seq(choice('server', 'peer'), field('address', choice($.ipv4_address, $.word))),
      seq('source', field('interface', $.interface_name))
    ),
    $._newline
  ),

  logging_config: $ => seq(
    $._kw_logging, 
    choice(
      seq('host', field('host', $.ipv4_address)),
      seq('source-interface', field('interface', $.interface_name)),
      seq('trap', field('severity', choice($.word, $.number)))
    ),
    $._newline
  ),

  snmp_config: $ => seq(
    $._kw_snmp, 
    choice(
      seq('community', field('name', $.word), optional(choice('RO', 'RW'))),
      seq('host', field('address', $.ipv4_address), field('community', $.word))
    ),
    $._newline
  ),

  aaa_config: $ => seq(
    $._kw_aaa, choice('new-model', seq('authentication', $.word, $.word, repeat($.word))),
    $._newline
  ),

  boot_config: $ => seq(
    $._kw_boot, 'system', choice('flash', 'tftp', 'ftp'), field('path', $.word),
    $._newline
  ),

  crypto_config: $ => seq(
    $._kw_crypto, 'key', 'generate', 'rsa', optional('general-keys'),
    optional(seq('modulus', field('bits', $.number))),
    $._newline
  ),

  username_config: $ => seq(
    $._kw_username, field('name', $.word),
    optional(seq('privilege', $.number)),
    optional(choice('password', 'secret')),
    optional($.number),
    field('password', $.word),
    $._newline
  ),

  vrf_definition: $ => seq(
    choice('vrf', seq($._kw_ip, 'vrf')), 
    choice('definition', 'forwarding'), 
    field('name', $.word), 
    $._newline
  ),

  static_route: $ => seq(
    $._kw_ip, 'route', optional(seq('vrf', field('vrf', $.word))), 
    field('destination', $.ipv4_address), field('mask', $.ipv4_address), 
    field('next_hop', choice($.ipv4_address, $.interface_name)),
    $._newline
  ),

  // DEFINIZIONI DEGLI SCOPED STATEMENTS
  _interface_statement: $ => choice(
    $.description_config,
    $.ip_address_config,
    $.ipv6_address_config,
    $.interface_shutdown,
    $.interface_speed,
    $.interface_duplex,
    $.interface_mtu,
    $.interface_bandwidth,
    $.switchport_config,
    seq('service-policy', choice('input', 'output'), $.word, $._newline),
    seq($._kw_spanning_tree, repeat1($.word), $._newline),
    $.comment,
    $._newline
  ),

  description_config: $ => seq($._kw_description, field('text', $.word), $._newline),
  
  ip_address_config: $ => seq(
    $._kw_ip, $._kw_address, 
    field('address', $.ipv4_address), field('mask', $.ipv4_address), 
    optional('secondary'), $._newline
  ),

  ipv6_address_config: $ => prec(5, seq(
    $._kw_ipv6, $._kw_address, field('address', $.ipv6_address), $._newline
  )),

  interface_shutdown: $ => seq(optional('no'), 'shutdown', $._newline),
  interface_speed: $ => seq('speed', field('value', choice('auto', $.number)), $._newline),
  interface_duplex: $ => seq('duplex', field('value', choice('auto', 'full', 'half')), $._newline),
  interface_mtu: $ => seq('mtu', field('value', $.number), $._newline),
  interface_bandwidth: $ => seq('bandwidth', field('value', $.number), $._newline),

  switchport_config: $ => seq(
    $._kw_switchport, 
    choice(
      seq('mode', field('mode', $.switchport_mode)),
      seq('access', 'vlan', field('vlan_id', $.number)),
      seq('trunk', 'allowed', 'vlan', field('vlan_list', $.word)),
      seq('trunk', 'native', 'vlan', field('vlan_id', $.number)),
      prec(-1, repeat1($.word))
    ),
    $._newline
  ),

  switchport_mode: $ => choice('access', 'trunk', seq('dynamic', 'auto'), seq('dynamic', 'desirable')),

  _bgp_statement: $ => choice(
    seq('router-id', field('router_id', $.ipv4_address), $._newline),
    seq($._kw_neighbor, $.ipv4_address, 'remote-as', $.number, $._newline),
    seq($._kw_neighbor, $.ipv4_address, $._kw_description, $.word, $._newline),
    seq('address-family', $.word, optional($.word), $._newline),
    seq($._kw_network, $.ipv4_address, 'mask', $.ipv4_address, $._newline),
    seq($._kw_neighbor, $.ipv4_address, 'activate', $._newline),
    seq($._kw_neighbor, $.ipv4_address, 'soft-reconfiguration', 'inbound', $._newline),
    seq('exit-address-family', $._newline),
    $.comment,
    $._newline
  ),

  _ospf_statement: $ => choice(
    $.ospf_router_id,
    $.ospf_network,
    seq('area', field('area', $.number), repeat($.word), $._newline),
    $.comment,
    $._newline
  ),

  ospf_router_id: $ => seq('router-id', field('router_id', $.ipv4_address), $._newline),

  ospf_network: $ => seq(
    $._kw_network, 
    field('address', $.ipv4_address), field('wildcard', $.wildcard), 
    'area', field('area', $.number), $._newline
  ),

  _vlan_statement: $ => choice(
    seq('name', $.word, $._newline),
    $.comment,
    $._newline
  ),

  _line_statement: $ => choice(
    seq('login', optional('local'), $._newline),
    seq('transport', choice('input', 'output'), repeat1($.word), $._newline),
    $.comment,
    $._newline
  ),

  _qos_statement: $ => choice(
    seq('match', repeat1($.word), $._newline),
    seq('class', $.word, $._newline),
    seq('priority', choice('percent', $.number), optional($.number), $._newline),
    seq('fair-queue', $._newline),
    $.comment,
    $._newline
  ),

  _acl_statement: $ => choice(
    $.acl_rule,
    $.comment,
    $._newline
  ),

  acl_rule: $ => seq(
    field('action', $.acl_action), 
    repeat1(choice($.word, $.number, $.ipv4_address, $.ipv6_address)), 
    $._newline
  ),

  acl_action: $ => choice('permit', 'deny'),

  // COMANDO GENERICO (Bassa priorità, fallback dinamico)
  command: $ => prec.dynamic(-10, prec(-1, seq(
    repeat1(choice($.word, $.number, $.ipv4_address, $.interface_name, $.mac_address, $.punctuation)),
    $._newline
  )))
};
