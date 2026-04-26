/**
 * @file Routing configuration rules (BGP, OSPF, EIGRP)
 */

module.exports = {
  // Local Keywords
  _kw_router: $ => token(prec(100, choice('router', 'Router'))),
  _kw_ospf: $ => token(prec(100, choice('ospf', 'OSPF'))),
  _kw_bgp: $ => token(prec(100, choice('bgp', 'BGP'))),
  _kw_eigrp: $ => token(prec(100, choice('eigrp', 'EIGRP'))),
  _kw_ip: $ => token(prec(100, /[Ii][Pp]/)),
  _kw_ipv6: $ => token(prec(100, /[Ii][Pp][Vv]6/)),

  // ── BGP ────────────────────────────────────────────────────────────────────
  bgp_block: $ => prec(200, seq(
    $._kw_router, $._kw_bgp, field('asn', $.number), $._newline,
    $._indent,
    repeat(choice(
      $.bgp_neighbor,
      $.bgp_network,
      $.bgp_address_family,
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent
  )),

  _kw_neighbor: $ => token(prec(100, /[Nn][Ee][Ii][Gg][Hh][Bb][Oo][Rr]/)),

  bgp_neighbor: $ => seq(
    $._kw_neighbor, 
    field('neighbor', choice(prec(300, $.ipv4_address), $.ipv6_address, $.word)),
    choice(
      seq('remote-as', field('remote_as', choice($.number, $.word))),
      seq('update-source', field('update_source', $.interface_name)),
      'activate',
      repeat1(field('option', $.word))
    ),
    $._newline
  ),

  bgp_network: $ => seq(
    'network', field('network', choice(prec(300, $.ipv4_address), $.ipv6_address)),
    optional(seq('mask', field('mask', choice(prec(300, $.subnet_mask), prec(300, $.ipv4_address))))),
    optional(seq('route-map', field('route_map', $.word))),
    $._newline
  ),

  bgp_address_family: $ => seq(
    'address-family', field('proto', choice('ipv4', 'ipv6', 'vpnv4', 'vpnv6', 'l2vpn')), 
    optional(field('subproto', choice('unicast', 'multicast', 'flowspec'))), 
    optional(seq('vrf', field('vrf', $.word))), $._newline,
    $._indent,
    repeat(choice(
      $.bgp_neighbor, 
      $.bgp_network, 
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent,
    optional(seq('exit-address-family', $._newline))
  ),

  // ── OSPF ───────────────────────────────────────────────────────────────────
  ospf_block: $ => prec(200, seq(
    $._kw_router, $._kw_ospf, field('process_id', $.number), optional(seq('vrf', field('vrf', $.word))), $._newline,
    $._indent,
    repeat(choice(
      $.ospf_network,
      $.ospf_area_block,
      $.ospf_interface_block,
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent
  )),

  ospf_network: $ => seq(
    'network', field('network', prec(300, $.ipv4_address)),
    field('wildcard', choice(prec(300, $.wildcard_mask), prec(300, $.subnet_mask), prec(300, $.ipv4_address))),
    'area',
    field('area', choice($.number, prec(300, $.ipv4_address))),
    $._newline
  ),

  ospf_area_block: $ => prec(200, seq(
    'area', field('area_id', choice($.number, prec(300, $.ipv4_address))),
    choice(
      seq(repeat1(field('option', $.word)), $._newline), // Single line
      seq($._newline, $._indent, repeat(choice($.ospf_interface_block, $.comment, $._newline, $.command)), $._dedent) // XR Block
    )
  )),

  ospf_interface_block: $ => prec(210, seq(
    choice('passive-interface', 'interface'), field('interface', $.interface_name),
    choice(
      $._newline, // Single line
      seq($._newline, $._indent, repeat(choice($.comment, $._newline, $.command)), $._dedent) // XR Block
    )
  )),

  // ── EIGRP ──────────────────────────────────────────────────────────────────
  eigrp_block: $ => prec(200, seq(
    $._kw_router, $._kw_eigrp, field('as_name', choice($.number, $.word)), $._newline,
    $._indent,
    repeat(choice(
      $.eigrp_network,
      $.eigrp_address_family,
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent
  )),

  eigrp_network: $ => seq(
    'network', field('network', prec(300, $.ipv4_address)),
    optional(field('wildcard', choice(prec(300, $.wildcard_mask), prec(300, $.subnet_mask), prec(300, $.ipv4_address)))),
    $._newline
  ),

  eigrp_address_family: $ => seq(
    'address-family', field('proto', choice('ipv4', 'ipv6')), optional(seq('vrf', field('vrf', $.word))), 
    optional(seq('autonomous-system', field('asn', $.number))), $._newline,
    $._indent,
    repeat(choice(
      $.eigrp_af_interface,
      $.eigrp_topology,
      $.eigrp_network,
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent,
    optional(seq('exit-address-family', $._newline))
  ),

  eigrp_af_interface: $ => seq(
    'af-interface', field('interface', choice($.interface_name, 'default')), $._newline,
    $._indent,
    repeat(choice(
      $.eigrp_af_interface_option,
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent,
    optional(seq('exit-af-interface', $._newline))
  ),

  eigrp_af_interface_option: $ => seq(
    choice('authentication', 'bandwidth-percent', 'hello-interval', 'hold-time', 'passive-interface', 'split-horizon', 'summary-address'),
    repeat(field('option', choice($.word, $.number, prec(300, $.ipv4_address), $.ipv6_address, $.punctuation))),
    $._newline
  ),

  eigrp_topology: $ => seq(
    'topology', field('name', choice('base', $.word)), $._newline,
    $._indent,
    repeat(choice(
      seq('variance', field('variance', $.number), $._newline),
      seq('maximum-paths', field('paths', $.number), $._newline),
      seq('redistribute', field('protocol', $.word), repeat(field('option', $.word)), $._newline),
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent,
    optional(seq('exit-af-topology', $._newline))
  ),

  // ── Static Routes ──────────────────────────────────────────────────────────
  static_route: $ => prec(100, seq(
    choice($._kw_ip, $._kw_ipv6), 'route',
    optional(seq('vrf', field('vrf', $.word))),
    field('destination', choice(prec(300, $.ipv4_address), $.ipv6_address)),
    optional(field('mask', choice(prec(300, $.subnet_mask), prec(300, $.ipv4_address)))),
    choice(
      seq(field('interface', $.interface_name), optional(field('next_hop', choice(prec(300, $.ipv4_address), $.ipv6_address)))),
      field('next_hop', choice(prec(300, $.ipv4_address), $.ipv6_address))
    ),
    optional(field('distance', $.number)),
    optional(seq('name', field('name', $.word))),
    optional(seq('tag', field('tag', $.number))),
    optional(seq('track', field('track', $.number))),
    optional(field('permanent', 'permanent')),
    $._newline
  ))
};
