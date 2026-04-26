/**
 * @file Interface configuration rules — v3
 */

module.exports = {
  // Local Keywords (moved from common.js)
  _kw_interface: $ => token(prec(100, choice('interface', 'int', 'Interface'))),
  _kw_ip: $ => token(prec(100, /[Ii][Pp]/)),
  _kw_ipv6: $ => token(prec(100, /[Ii][Pp][Vv]6/)),
  _kw_description: $ => token(prec(100, /[Dd]escription/i)),

  interface_block: $ => seq(
    $._kw_interface, field('name', $.interface_name), $._newline,
    optional(seq(
      $._indent,
      repeat(choice(
        $.description_config,
        $.ip_address_config,
        $.ipv6_address_config,
        $.interface_shutdown,
        $.interface_vrf_forwarding,
        $.interface_helper_address,
        $.interface_standby,
        $.switchport_config,
        $.interface_speed,
        $.interface_duplex,
        $.interface_mtu,
        $.interface_bandwidth,
        $.interface_spanning_tree,
        $.interface_channel_group,
        $.interface_nameif,
        $.interface_security_level,
        $.interface_ip_generic,
        $.comment,
        $._newline,
        $.command
      )),
      $._dedent
    ))
  ),

  description_config: $ => seq(
    $._kw_description, optional(field('text', alias($._text_to_eol, $.text))), $._newline
  ),

  ip_address_config: $ => prec(200, seq(
    choice($._kw_ip, 'ipv4'), 
    alias(choice('address', 'addr'), 'address'), 
    choice(
      seq(field('address', prec(300, $.ipv4_address)), field('mask', choice(prec(300, $.subnet_mask), $.number))),
      field('type', $.word)
    ),
    repeat(choice(
      field('secondary', alias(choice('secondary', 'sec'), 'secondary')),
      seq(field('standby_kw', 'standby'), field('standby_ip', prec(300, $.ipv4_address))),
      field('option', choice($.word, $.number, prec(300, $.ipv4_address)))
    )),
    $._newline
  )),

  ipv6_address_config: $ => prec(200, seq(
    $._kw_ipv6, 
    alias(choice('address', 'addr'), 'address'), 
    choice(
      seq(field('address', $.ipv6_address), optional(seq('/', field('prefix', $.number)))),
      field('type', $.word)
    ),
    repeat(field('option', $.word)),
    $._newline
  )),

  interface_shutdown: $ => seq(
    optional(field('negated', alias('no', 'no'))), 'shutdown', $._newline
  ),

  interface_vrf_forwarding: $ => prec(210, seq(
    optional($._kw_ip), 'vrf', 'forwarding', field('vrf', $.word), $._newline
  )),

  interface_helper_address: $ => seq(
    $._kw_ip, 'helper-address', field('address', prec(300, $.ipv4_address)), $._newline
  ),

  interface_standby: $ => seq(
    'standby', field('group', $.number), 
    field('feature', choice('ip', 'ipv6', 'preempt', 'priority', 'timers', 'track', 'delay', 'version', 'use-bia', $.word)),
    repeat(field('option', choice($.word, $.number, prec(300, $.ipv4_address), $.punctuation))),
    $._newline
  ),

  switchport_config: $ => prec(100, seq(
    'switchport', 
    optional(choice(
      seq('mode', field('mode', $.word)),
      seq('access', 'vlan', field('vlan', $.number)),
      seq('trunk', choice(
        seq('encapsulation', field('encapsulation', $.word)),
        seq('allowed', 'vlan', field('allowed_vlans', alias(/[0-9, \-]+/, $.vlan_list))),
        seq('native', 'vlan', field('native_vlan', $.number))
      )),
      seq('port-security', optional(choice(
        seq('maximum', field('max_mac', $.number)),
        seq('violation', field('violation', $.word)),
        seq('mac-address', choice(
          seq(field('sticky', 'sticky'), optional(field('mac', choice($.mac_address, $.word)))),
          field('mac', choice($.mac_address, $.word))
        ))
      )))
    )),
    $._newline
  )),

  interface_speed: $ => seq('speed', field('speed', choice($.number, $.word)), $._newline),
  interface_duplex: $ => seq('duplex', field('duplex', $.word), $._newline),
  interface_mtu: $ => seq('mtu', field('mtu', $.number), $._newline),
  interface_bandwidth: $ => seq('bandwidth', field('bandwidth', $.number), $._newline),
  interface_spanning_tree: $ => seq('spanning-tree', repeat1(field('option', $.word)), $._newline),
  interface_channel_group: $ => seq('channel-group', field('group', $.number), 'mode', field('mode', $.word), $._newline),
  interface_nameif: $ => seq('nameif', field('name', $.word), $._newline),
  interface_security_level: $ => seq('security-level', field('level', $.number), $._newline),
  
  interface_ip_generic: $ => seq(
    $._kw_ip, 
    field('feature', choice('access-group', 'policy-map', 'inspect', 'auth-proxy', 'ips', 'flow', 'ospf', 'rip', 'igrp', 'eigrp', $.word)),
    repeat(field('option', choice($.word, $.number, prec(300, $.ipv4_address), $.punctuation))),
    $._newline
  )
};
