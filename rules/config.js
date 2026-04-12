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
  _kw_standby: $ => token(prec(10, /standby/i)),
  _kw_channel_group: $ => token(prec(10, /channel-group|chan-grp/i)),

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
    $._kw_line, field('type', alias(choice(/vty/i, /con/i, /console/i, /aux/i), $.word)), 
    field('start', $.number), optional(field('end', $.number)), $._newline,
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
    $.vtp_config,
    $.username_config,
    $.ntp_config,
    $.logging_config,
    $.snmp_config,
    $.ssh_config,
    $.aaa_config,
    $.boot_config,
    $.crypto_config,
    $.prefix_list,
    $.static_route,
    $.vrf_definition,
    $.vrf_definition_block,
    $.object_group_block
  ),

  object_group_block: $ => seq(
    /object-group/i, 
    choice(
      seq(/network/i, field('name', $.word)),
      seq(/service/i, field('name', $.word), optional(field('protocol', choice(alias(/tcp/i, $.word), alias(/udp/i, $.word), alias(/tcp-udp/i, $.word)))))
    ),
    $._newline,
    $._indent, repeat($._object_group_statement), $._dedent
  ),

  _object_group_statement: $ => choice(
    $.network_object,
    $.port_object,
    $.comment,
    $.command,
    $._newline
  ),

  network_object: $ => seq(
    /network-object/i,
    choice(
      field('host', seq(/host/i, $.ipv4_address)),
      seq(field('address', $.ipv4_address), field('mask', $.ipv4_address)),
      field('object', seq(/object/i, $.word))
    ),
    $._newline
  ),

  port_object: $ => seq(
    /port-object/i,
    field('operator', alias(choice(/eq/i, /gt/i, /lt/i, /neq/i, /range/i), $.word)),
    field('port', choice($.number, $.word)),
    optional(field('port_end', choice($.number, $.word))),
    $._newline
  ),

  vtp_config: $ => seq(
    /vtp/i,
    choice(
      seq(/domain/i, field('domain', $.word)),
      seq(/mode/i, field('mode', choice(/client/i, /server/i, /transparent/i, /off/i))),
      seq(/password/i, field('password', $.word)),
      seq(/version/i, field('version', $.number))
    ),
    $._newline
  ),

  // ... rest of support rules ...

  ntp_config: $ => seq(
    $._kw_ntp, 
    choice(
      seq(choice(/server/i, /peer/i), field('address', choice($.ipv4_address, $.word))),
      seq(/source/i, field('interface', choice($.interface_name, $.word))),
      seq(/master/i, optional(field('priority', $.number)))
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
      seq(/enable/i, /traps/i, optional(repeat($.word))),
      seq(/location/i, field('location', repeat1($.word))),
      seq(/contact/i, field('contact', repeat1($.word)))
    ),
    $._newline
  ),

  ssh_config: $ => seq(
    $._kw_ip, /ssh/i,
    choice(
      seq(/version/i, field('version', $.number)),
      seq(/authentication-retries/i, field('retries', $.number)),
      seq(/time-out/i, field('timeout', $.number))
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
    $.interface_spanning_tree,
    $.interface_standby,
    $.interface_channel_group,
    $.interface_vrf_forwarding,
    $.interface_helper_address,
    $.interface_nameif,
    $.interface_security_level,
    seq(optional(/no/i), $._kw_ip, /proxy-arp/i, $._newline),
    seq(/service-policy/i, choice(/input/i, /output/i), $.word, $._newline),
    $.comment,
    $.command,
    $._newline
  ),

  description_config: $ => seq($._kw_description, field('text', repeat1($.word)), $._newline),
  
  ip_address_config: $ => seq(
    $._kw_ip, $._kw_address, 
    field('address', $.ipv4_address), field('mask', $.ipv4_address), 
    optional(choice(
      field('secondary', $._kw_secondary),
      seq(/standby/i, field('standby', $.ipv4_address))
    )), 
    $._newline
  ),

  interface_nameif: $ => seq(/nameif/i, field('name', $.word), $._newline),
  interface_security_level: $ => seq(/security-level/i, field('level', $.number), $._newline),

  interface_vrf_forwarding: $ => seq($._kw_ip, /vrf/i, /forwarding/i, field('vrf', $.word), $._newline),
  interface_helper_address: $ => seq($._kw_ip, /helper-address/i, field('helper', $.ipv4_address), $._newline),

  ipv6_address_config: $ => prec(5, seq(
    $._kw_ipv6, $._kw_address, field('address', choice($.ipv6_address, $.word)), 
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
      $.switchport_trunk_allowed,
      $.switchport_trunk_native,
      $.switchport_trunk_encap,
      $.port_security_config,
      prec(-1, repeat1($.word))
    ),
    $._newline
  ),

  switchport_trunk_allowed: $ => seq(/trunk/i, /allowed/i, /vlan/i, field('vlan_list', choice($.word, $.vlan_range, $.number))),
  switchport_trunk_native: $ => seq(/trunk/i, /native/i, /vlan/i, field('vlan_id', $.number)),
  switchport_trunk_encap: $ => seq(/trunk/i, /encapsulation/i, field('encapsulation', choice(/dot1q/i, /isl/i, /negotiate/i))),

  port_security_config: $ => seq(
    $._kw_port_security,
    optional(choice(
      seq(/maximum/i, field('max', $.number)),
      seq(/violation/i, field('action', choice(/shutdown/i, /restrict/i, /protect/i))),
      seq(/mac-address/i, choice(/sticky/i, field('mac', $.mac_address)))
    ))
  ),

  switchport_mode: $ => choice(/access/i, /trunk/i, seq(/dynamic/i, /auto/i), seq(/dynamic/i, /desirable/i)),

  interface_spanning_tree: $ => seq(
    $._kw_spanning_tree,
    repeat1(choice($.word, $.number, $.vlan_range)),
    $._newline
  ),

  interface_standby: $ => seq(
    $._kw_standby,
    choice(
      seq(/version/i, field('version', choice('1', '2'))),
      seq(/delay/i, choice(seq(/minimum/i, $.number), seq(/reload/i, $.number))),
      /use-bia/i,
      seq(
        optional(field('group', $.number)),
        choice(
          seq(/ip/i, field('ip', $.ipv4_address), optional(field('secondary', $._kw_secondary))),
          seq(/ipv6/i, field('ipv6', choice($.ipv6_address, /autoconfig/i))),
          seq(/priority/i, field('priority', $.number)),
          seq(/preempt/i, optional(seq(/delay/i, /minimum/i, $.number))),
          seq(/timers/i, optional(/msec/i), field('hello', $.number), optional(/msec/i), field('hold', $.number)),
          seq(/track/i, field('object_id', $.number), optional(seq(/decrement/i, field('value', $.number))))
        )
      )
    ),
    $._newline
  ),

  interface_channel_group: $ => seq(
    $._kw_channel_group,
    field('channel', $.number),
    /mode/i,
    field('mode', choice(/active/i, /passive/i, /on/i, /desirable/i, /auto/i)),
    $._newline
  ),

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
    $.line_login,
    $.line_transport,
    $.line_password,
    $.line_exec_timeout,
    $.comment,
    $.command,
    $._newline
  ),

  line_login: $ => seq(/login/i, optional(field('method', alias(/local/i, $.word))), $._newline),
  line_password: $ => seq(
    /password/i, 
    optional(field('encryption_type', $.number)), 
    field('password', $.word), 
    $._newline
  ),
  line_exec_timeout: $ => seq(
    /exec-timeout/i, 
    field('minutes', $.number), 
    optional(field('seconds', $.number)), 
    $._newline
  ),
  line_transport: $ => seq(
    /transport/i, 
    field('direction', alias(choice(/input/i, /output/i), $.word)), 
    repeat1(field('protocol', alias(choice(/ssh/i, /telnet/i, /all/i, /none/i), $.word))), 
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
    optional(field('sequence', $.number)),
    field('action', $.acl_action),
    optional(field('protocol', choice(alias(token(prec(100, /tcp/i)), $.word), alias(token(prec(100, /udp/i)), $.word), alias(token(prec(100, /icmp/i)), $.word), alias(token(prec(100, /ip/i)), $.word), $.number))),
    $._acl_addr_spec_source,
    optional($._acl_addr_spec_dest),
    repeat(choice(
      field('log', alias(choice(token(prec(100, /log/i)), token(prec(100, /log-input/i))), $.word)),
      seq(token(prec(100, /time-range/i)), field('time_range', $.word)),
      $.word,
      $.number
    )),
    $._newline
  ),

  _acl_addr_spec_source: $ => choice(
    field('source_any', alias(token(prec(100, /any/i)), $.word)),
    seq(token(prec(100, /host/i)), field('source_host', $.ipv4_address)),
    seq(field('source_network', $.ipv4_address), field('source_wildcard', $.ipv4_address)),
    seq(token(prec(100, /object-group/i)), field('source_object_group', $.word))
  ),

  _acl_addr_spec_dest: $ => seq(
    choice(
      field('destination_any', alias(token(prec(100, /any/i)), $.word)),
      seq(token(prec(100, /host/i)), field('destination_host', $.ipv4_address)),
      seq(field('destination_network', $.ipv4_address), field('destination_wildcard', $.ipv4_address)),
      seq(token(prec(100, /object-group/i)), field('destination_object_group', $.word))
    ),
    optional(seq(
      field('destination_port_operator', alias(choice(
        token(prec(100, /eq/i)), 
        token(prec(100, /gt/i)), 
        token(prec(100, /lt/i)), 
        token(prec(100, /neq/i)), 
        token(prec(100, /range/i))
      ), $.word)),
      field('destination_port', choice($.number, $.word)),
      optional(field('destination_port_end', choice($.number, $.word)))
    ))
  ),

  acl_action: $ => choice(/permit|perm/i, /deny|den/i),

  // COMANDO GENERICO (Bassa priorità, fallback dinamico)
  command: $ => prec.dynamic(-10, prec(-1, seq(
    repeat1(choice($.word, $.number, $.ipv4_address, $.ipv6_address, $.interface_name, $.mac_address, $.vlan_range, $.punctuation)),
    $._newline
  )))
};
