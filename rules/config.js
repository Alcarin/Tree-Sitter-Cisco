/**
 * @file Configuration rules for Cisco grammar - Full Abbreviations Support
 */

module.exports = {
  // KEYWORDS ATOMICHE (Supportano abbreviazioni e case-insensitivity)
  _kw_interface: $ => token(prec(10, /interface|int/i)),
  _kw_router: $ => token(prec(10, /router/i)),
  _kw_bgp: $ => token(prec(10, /bgp/i)),
  _kw_ospf: $ => token(prec(10, /ospf/i)),
  _kw_vlan: $ => token(prec(10, /vlan/i)),
  _kw_line: $ => token(prec(10, /line/i)),
  _kw_ip: $ => token(prec(10, /ip/i)),
  _kw_ipv6: $ => token(prec(10, /ipv6/i)),
  _kw_hostname: $ => token(prec(10, /hostname|host/i)),
  _kw_username: $ => token(prec(10, /username|user/i)),
  _kw_description: $ => token(prec(10, /description|desc/i)),
  _kw_address: $ => token(prec(10, /address|addr/i)),
  _kw_switchport: $ => token(prec(10, /switchport|sw/i)),
  _kw_spanning_tree: $ => token(prec(10, /spanning-tree|span/i)),
  _kw_neighbor: $ => token(prec(10, /neighbor|neigh/i)),
  _kw_network: $ => token(prec(10, /network|net/i)),
  _kw_ntp: $ => token(prec(10, /ntp/i)),
  _kw_logging: $ => token(prec(10, /logging|log/i)),
  _kw_snmp: $ => token(prec(10, /snmp-server/i)),
  _kw_aaa: $ => token(prec(10, /aaa/i)),
  _kw_boot: $ => token(prec(10, /boot/i)),
  _kw_crypto: $ => token(prec(10, /crypto/i)),
  _kw_port_security: $ => token(prec(10, /port-security|port-sec/i)),
  _kw_secondary: $ => token(prec(10, /secondary|sec/i)),
  _kw_shutdown: $ => token(prec(10, /shutdown|shut/i)),

  // BLOCCHI CON SCOPED STATEMENTS
  interface_block: $ => seq(
    $._kw_interface, field('name', $.interface_name), $._newline,
    $._indent, repeat($._interface_statement), $._dedent
  ),

  vrf_definition_block: $ => seq(
    /vrf/i, /definition/i, field('name', $.word), $._newline,
    $._indent, repeat($._vrf_statement), $._dedent
  ),

  bgp_block: $ => seq(
    $._kw_router, $._kw_bgp, field('as_number', $.number), $._newline,
    $._indent, repeat($._bgp_statement), $._dedent
  ),

  ospf_block: $ => seq(
    $._kw_router, $._kw_ospf, field('process_id', $.number), optional(seq(/vrf/i, field('vrf', $.word))), $._newline,
    $._indent, repeat($._ospf_statement), $._dedent
  ),

  vlan_block: $ => seq(
    $._kw_vlan, field('id', $.number), $._newline,
    optional(seq($._indent, repeat($._vlan_statement), $._dedent))
  ),

  line_block: $ => seq(
    $._kw_line, field('type', choice(/vty/i, /con/i, /aux/i)), repeat1($.number), $._newline,
    $._indent, repeat($._line_statement), $._dedent
  ),

  qos_block: $ => seq(
    choice(
      seq(/class-map/i, optional(choice(/match-all/i, /match-any/i)), field('name', $.word)),
      seq(/policy-map/i, field('name', $.word))
    ),
    $._newline,
    $._indent, repeat($._qos_statement), $._dedent
  ),

  acl_block: $ => seq(
    $._kw_ip, /access-list/i, choice(/standard/i, /extended/i), field('name', $.word), $._newline,
    $._indent, repeat($._acl_statement), $._dedent
  ),

  // REGOLE DI SUPPORTO E CONFIGURAZIONE GLOBALE (Capitolo 1)
  system_config: $ => choice(
    seq($._kw_hostname, field('name', $.word), $._newline),
    seq(/service/i, $.word, $._newline),
    seq(/enable/i, /secret/i, $.number, field('password', $.word), $._newline),
    seq($._kw_ip, /domain-name/i, field('domain', $.word), $._newline),
    $.username_config,
    $.ntp_config,
    $.logging_config,
    $.snmp_config,
    $.aaa_config,
    $.boot_config,
    $.crypto_config,
    $.prefix_list,
    $.static_route,
    $.vrf_definition,
    $.vrf_definition_block
  ),

  ntp_config: $ => seq(
    $._kw_ntp, 
    choice(
      seq(choice(/server/i, /peer/i), field('address', choice($.ipv4_address, $.word))),
      seq(/source/i, field('interface', choice($.interface_name, $.word)))
    ),
    $._newline
  ),

  logging_config: $ => seq(
    $._kw_logging, 
    choice(
      seq(/host/i, field('host', $.ipv4_address)),
      seq(/source-interface/i, field('interface', $.interface_name)),
      seq(/trap/i, field('severity', choice($.word, $.number)))
    ),
    $._newline
  ),

  snmp_config: $ => seq(
    $._kw_snmp,
    choice(
      seq(/community/i, field('name', $.word), optional(choice(/RO/i, /RW/i))),
      seq(/host/i, field('address', $.ipv4_address), optional(seq(/version/i, $.word)), field('community', $.word)),
      seq(/enable/i, /traps/i, optional(repeat($.word)))
    ),
    $._newline
  ),
  aaa_config: $ => seq(
    $._kw_aaa, 
    choice(
      /new-model/i, 
      seq(
        /authentication/i, 
        choice(/login/i, /enable/i),
        choice(/default/i, field('list_name', $.word)),
        repeat1(choice(/local/i, /enable/i, /line/i, seq(/group/i, field('group_name', $.word))))
      )
    ),
    $._newline
  ),

  boot_config: $ => seq(
    $._kw_boot, /system/i, choice(/flash/i, /tftp/i, /ftp/i), field('path', $.word),
    $._newline
  ),

  crypto_config: $ => seq(
    $._kw_crypto, /key/i, /generate/i, /rsa/i, optional(/general-keys/i),
    optional(seq(/modulus/i, field('bits', $.number))),
    $._newline
  ),

  username_config: $ => seq(
    $._kw_username, field('name', $.word),
    optional(seq(/privilege/i, field('level', $.number))),
    optional(seq(choice(/password/i, /secret/i), optional($.number), field('password', $.word))),
    optional(seq($._kw_description, field('description', $.word))),
    $._newline
  ),

  vrf_definition: $ => seq(
    choice(/vrf/i, seq($._kw_ip, /vrf/i)), 
    choice(/definition/i, /forwarding/i), 
    field('name', $.word), 
    $._newline
  ),

  vlan_definition: $ => seq($._kw_vlan, field('id', $.number), $._newline),

  static_route: $ => seq(
    $._kw_ip, /route/i, optional(seq(/vrf/i, field('vrf', $.word))), 
    field('destination', $.ipv4_address), field('mask', $.ipv4_address), 
    field('next_hop', choice($.ipv4_address, $.interface_name)),
    optional(field('distance', $.number)),
    $._newline
  ),

  prefix_list: $ => seq(
    $._kw_ip, /prefix-list/i, field('name', $.word),
    optional(seq(/seq/i, field('sequence', $.number))),
    field('action', $.acl_action),
    field('prefix', $.ipv4_address), '/', field('length', $.number),
    optional(seq(/ge/i, field('ge', $.number))),
    optional(seq(/le/i, field('le', $.number))),
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
    seq($._kw_ip, /vrf/i, /forwarding/i, field('vrf', $.word), $._newline),
    seq($._kw_ip, /helper-address/i, field('helper', $.ipv4_address), $._newline),
    seq(optional(/no/i), $._kw_ip, /proxy-arp/i, $._newline),
    seq(/service-policy/i, choice(/input/i, /output/i), $.word, $._newline),
    seq($._kw_spanning_tree, repeat1($.word), $._newline),
    $.comment,
    $.command,
    $._newline
  ),

  description_config: $ => seq($._kw_description, field('text', $.word), $._newline),
  
  ip_address_config: $ => seq(
    $._kw_ip, $._kw_address, 
    field('address', $.ipv4_address), field('mask', $.ipv4_address), 
    optional($._kw_secondary), $._newline
  ),

  ipv6_address_config: $ => prec(5, seq(
    $._kw_ipv6, $._kw_address, field('address', $.ipv6_address), 
    optional(choice(/link-local/i, /anycast/i)),
    $._newline
  )),

  interface_shutdown: $ => seq(optional(/no/i), $._kw_shutdown, $._newline),
  interface_speed: $ => seq(/speed/i, field('value', choice(/auto/i, $.number)), $._newline),
  interface_duplex: $ => seq(/duplex/i, field('value', choice(/auto/i, /full/i, /half/i)), $._newline),
  interface_mtu: $ => seq(/mtu/i, field('value', $.number), $._newline),
  interface_bandwidth: $ => seq(/bandwidth/i, field('value', $.number), $._newline),

  switchport_config: $ => seq(
    $._kw_switchport, 
    choice(
      seq(/mode/i, field('mode', $.switchport_mode)),
      seq(/access/i, /vlan/i, field('vlan_id', $.number)),
      seq(/trunk/i, /allowed/i, /vlan/i, field('vlan_list', choice($.word, $.vlan_range))),
      seq(/trunk/i, /native/i, /vlan/i, field('vlan_id', $.number)),
      $.port_security_config,
      prec(-1, repeat1($.word))
    ),
    $._newline
  ),

  port_security_config: $ => seq(
    $._kw_port_security,
    optional(choice(
      seq(/maximum/i, field('max', $.number)),
      seq(/violation/i, field('action', choice(/shutdown/i, /restrict/i, /protect/i))),
      seq(/mac-address/i, choice(/sticky/i, field('mac', $.mac_address)))
    ))
  ),

  switchport_mode: $ => choice(/access/i, /trunk/i, seq(/dynamic/i, /auto/i), seq(/dynamic/i, /desirable/i)),

  _bgp_statement: $ => choice(
    $.bgp_router_id,
    $.bgp_neighbor,
    $.bgp_address_family,
    $.bgp_network,
    seq(/exit-address-family/i, $._newline),
    $.comment,
    $.command,
    $._newline
  ),

  bgp_router_id: $ => seq(/router-id/i, field('router_id', $.ipv4_address), $._newline),

  bgp_neighbor: $ => seq(
    $._kw_neighbor, 
    field('address', choice($.ipv4_address, $.word)),
    choice(
      seq(/remote-as/i, field('remote_as', $.number)),
      seq($._kw_description, field('description', $.word)),
      seq(/update-source/i, field('interface', $.interface_name)),
      /activate/i,
      seq(/soft-reconfiguration/i, /inbound/i)
    ),
    $._newline
  ),

  bgp_address_family: $ => seq(
    /address-family/i, 
    field('afi', choice(/ipv4/i, /ipv6/i, /vpnv4/i, /vpnv6/i)),
    optional(field('safi', choice(/unicast/i, /multicast/i))),
    $._newline,
    $._indent, repeat($._bgp_af_statement), $._dedent
  ),

  _bgp_af_statement: $ => choice(
    $.bgp_network,
    $.bgp_neighbor,
    seq(/exit-address-family/i, $._newline),
    $.comment,
    $.command,
    $._newline
  ),

  bgp_network: $ => seq(
    $._kw_network, 
    field('address', $.ipv4_address), 
    optional(seq(/mask/i, field('mask', $.ipv4_address))),
    $._newline
  ),

  _ospf_statement: $ => choice(
    $.ospf_router_id,
    $.ospf_network,
    $.ospf_area,
    $.ospf_area_block,
    $.comment,
    $.command,
    $._newline
  ),

  ospf_router_id: $ => seq(/router-id/i, field('router_id', $.ipv4_address), $._newline),

  ospf_network: $ => seq(
    $._kw_network, 
    field('address', $.ipv4_address), field('wildcard', $.wildcard), 
    /area/i, field('area', $.number), $._newline
  ),

  ospf_area: $ => seq(
    /area/i, field('area', $.number),
    optional(choice(
      /stub/i,
      seq(/nssa/i, optional(/no-summary/i)),
      seq(/range/i, $.ipv4_address, $.ipv4_address)
    )),
    $._newline
  ),

  ospf_area_block: $ => seq(
    /area/i, field('area', $.number), $._newline,
    $._indent, repeat($._ospf_area_statement), $._dedent
  ),

  _ospf_area_statement: $ => choice(
    $.ospf_interface_block,
    $.comment,
    $.command,
    $._newline
  ),

  ospf_interface_block: $ => seq(
    $._kw_interface, field('name', $.interface_name), $._newline,
    $._indent, repeat($._ospf_int_statement), $._dedent
  ),

  _ospf_int_statement: $ => choice(
    seq(/cost/i, field('cost', $.number), $._newline),
    $.comment,
    $.command,
    $._newline
  ),


  _vlan_statement: $ => choice(
    seq(/name/i, $.word, $._newline),
    $.comment,
    $.command,
    $._newline
  ),

  _vrf_statement: $ => choice(
    $.vrf_rd,
    $.vrf_address_family,
    $.vrf_exit_address_family,
    $.comment,
    $.command,
    $._newline
  ),

  vrf_rd: $ => seq(/rd/i, field('rd', $.word), $._newline),
  vrf_address_family: $ => seq(/address-family/i, choice(/ipv4/i, /ipv6/i), $._newline),
  vrf_exit_address_family: $ => seq(/exit-address-family/i, $._newline),

  _line_statement: $ => choice(
    seq(/login/i, optional(/local/i), $._newline),
    seq(/transport/i, choice(/input/i, /output/i), repeat1($.word), $._newline),
    $.comment,
    $.command,
    $._newline
  ),

  _qos_statement: $ => choice(
    seq(/match/i, repeat1($.word), $._newline),
    seq(/class/i, $.word, $._newline),
    seq(/priority/i, choice(/percent/i, $.number), optional($.number), $._newline),
    seq(/fair-queue/i, $._newline),
    $.comment,
    $.command,
    $._newline
  ),

  _acl_statement: $ => choice(
    $.acl_rule,
    $.comment,
    $.command,
    $._newline
  ),

  acl_rule: $ => seq(
    field('action', $.acl_action), 
    repeat1(choice($.word, $.number, $.ipv4_address, $.ipv6_address, $.vlan_range)), 
    $._newline
  ),

  acl_action: $ => choice(/permit|perm/i, /deny|den/i),

  // COMANDO GENERICO (Bassa priorità, fallback dinamico)
  command: $ => prec.dynamic(-10, prec(-1, seq(
    repeat1(choice($.word, $.number, $.ipv4_address, $.ipv6_address, $.interface_name, $.mac_address, $.vlan_range, $.punctuation)),
    $._newline
  )))
};
