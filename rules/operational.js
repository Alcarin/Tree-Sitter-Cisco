/**
 * @file Operational commands for Cisco grammar - Bulletproof Version
 */

module.exports = {
  // --- SHOW COMMAND DISPATCHER ---
  show_command: $ => choice(
    $.show_version_block,
    $.show_inventory_block,
    $.show_ip_int_brief_block,
    $.show_clock_block,
    $.show_environment_block,
    $.show_cdp_neighbors_block,
    $.show_mac_address_table_block,
    $.show_ip_arp_block,
    $.show_ip_route_block,
    $.show_ip_bgp_summary_block,
    $.show_ip_ospf_neighbor_block,
    $.show_ip_interface_block,
    // --- Security ASA/FTD (4.4) ---
    $.show_crypto_ipsec_sa_block,
    $.show_crypto_ikev1_sa_block,
    $.show_failover_block,
    $.show_vpn_sessiondb_block,
    // --- Service Provider (4.5) ---
    $.show_bgp_neighbors_block,
    $.show_mpls_ldp_neighbor_block,
    // --- Data Center (4.6) ---
    $.show_vpc_block,
    $.show_fex_block,
    // --- Advanced L2/L3 (4.7) ---
    $.show_etherchannel_summary_block,
    $.show_spanning_tree_block,
    $.show_standby_block
  ),

  // --- DIAGNOSTIC & UTILITY COMMANDS ---
  diagnostic_command: $ => choice(
    $.ping_block,
    $.traceroute_block,
    $.dir_block,
    $.terminal_command
  ),

  // --- PING ---
  ping_block: $ => seq(
    token(prec(110, seq(/[Pp]ing/i, optional(/[ \t]+/)))),
    optional(seq(token(prec(110, /[Vv][Rr][Ff]/i)), field('vrf', $.word))),
    optional(field('afi', choice(token(prec(110, /[Ii][Pp]/i)), token(prec(110, /[Ii][Pp][Vv]6/i))))),
    field('destination', choice($.ipv4_address, $.ipv6_address, $.word)),
    optional(seq(token(prec(110, /[Rr]epeat/i)), field('repeat', $.number))),
    optional(seq(token(prec(110, /[Tt]imeout/i)), field('timeout', $.number))),
    optional(seq(token(prec(110, /[Ss]ize/i)), field('size', $.number))),
    optional(seq(token(prec(110, /[Ss]ource/i)), field('source', choice($.interface_name, $.ipv4_address, $.ipv6_address, $.word)))),
    $._newline,
    repeat(choice(
        $.ping_stats_line,
        $.ping_stream_line,
        $._newline
    ))
  ),
  ping_stream_line: $ => seq(field('response_stream', alias(token(prec(110, /[.!/U/Q ]+/)), $.word)), $._newline),
  ping_stats_line: $ => seq(
    token(prec(110, /[Ss]uccess/i)), token(prec(110, /rate/i)), token(prec(110, /[Ii]s/i)), field('success_rate', $.number), token(prec(110, /percent/i)),
    '(', field('success_qty', $.number), '/', field('sent_qty', $.number), ')',
    optional(seq(
        ',', token(prec(110, /[Rr]ound-trip/i)), token(prec(110, /[Mm]in\/[Aa]vg\/[Mm]ax/i)), '=',
        field('rtt_min', $.number), '/', field('rtt_avg', $.number), '/', field('rtt_max', $.number), token(prec(110, /[Mm]s/i))
    )),
    $._newline
  ),

  // --- TRACEROUTE ---
  traceroute_block: $ => seq(
    token(prec(110, seq(/[Tt]raceroute/i, optional(/[ \t]+/)))),
    field('destination', choice($.ipv4_address, $.ipv6_address, $.word)),
    $._newline,
    repeat(choice(
        $.traceroute_hop_line,
        $._newline
    ))
  ),
  traceroute_hop_line: $ => seq(
    field('hop_number', $.number),
    field('hop_address', choice($.ipv4_address, $.ipv6_address, $.word)),
    repeat1(seq(field('rtt', $.number), token(prec(110, /[Mm]s/i)))),
    $._newline
  ),

  // --- DIR ---
  dir_block: $ => seq(
    token(prec(110, seq(/[Dd]ir/i, optional(/[ \t]+/)))),
    optional(field('filesystem', $.word)),
    $._newline,
    repeat(choice(
        $.dir_header,
        $.dir_entry,
        $.dir_summary,
        $._newline
    ))
  ),
  dir_header: $ => seq(token(prec(110, /[Dd]irectory/i)), /[Oo][Ff]/i, field('filesystem', $.word), optional(':'), $._newline),
  dir_entry: $ => seq(
    field('id', $.number),
    field('permissions', alias(token(prec(110, /[d\-rwx]{4,10}/)), $.word)),
    field('size', $.number),
    field('date_time', alias(repeat1($.word), $.text)),
    field('file_name', $.word),
    $._newline
  ),
  dir_summary: $ => seq(
    field('total_size', $.number), token(prec(110, /[Bb]ytes/i)), token(prec(110, /[Tt]otal/i)),
    '(', field('total_free', $.number), token(prec(110, /[Bb]ytes/i)), token(prec(110, /[Ff]ree/i)), ')',
    $._newline
  ),

  // --- TERMINAL ---
  terminal_command: $ => seq(
    token(prec(110, seq(/[Tt]erminal/i, optional(/[ \t]+/)))),
    choice(
        seq(token(prec(110, /[Ll]ength/i)), field('length', $.number)),
        seq(token(prec(110, /[Ww]idth/i)), field('width', $.number))
    ),
    $._newline
  ),

  // REGOLE DI SUPPORTO
  text_line: $ => prec.left(repeat1(choice($.word, $.number, $.punctuation, $.ipv4_address, $.interface_name, $.mac_address, $.ipv6_address))),
  _header_line: $ => seq(alias($.text_line, $.header), $._newline),

  // --- SHOW VERSION ---
  show_version_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Vv]ersion/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice(
      $.software_info,
      $.system_image,
      $.uptime_info,
      $.hardware_info,
      $.processor_info,
      $.config_register,
      $._newline,
      prec.dynamic(-1000, alias($._line_content, $.unknown_line))
    ))
  ),
  software_info: $ => prec(100, seq(/[Cc]isco/i, /[Ii][Oo][Ss]/i, /[Ss]oftware/i, optional(','), field('version', alias($.text_line, $.text)), $._newline)),
  system_image: $ => prec(100, seq(/[Ss]ystem/i, /[Ii]mage/i, /[Ff]ile/i, /[Ii][Ss]/i, field('image_file', $.string), $._newline)),
  uptime_info: $ => prec(100, seq(optional(field('hostname', $.word)), /[Uu]ptime/i, /[Ii][Ss]/i, field('uptime', $.uptime), $._newline)),
  hardware_info: $ => prec(100, seq(/[Cc]isco/i, field('hardware', alias($.text_line, $.text)), $._newline)),
  processor_info: $ => prec(100, seq(/[Pp]rocessor/i, /[Bb]oard/i, /ID/i, field('serial', $.word), $._newline)),
  config_register: $ => prec(100, seq(/[Cc]onfiguration/i, /register/i, /[Ii][Ss]/i, field('register', $.word), $._newline)),

  // --- SHOW INVENTORY ---
  show_inventory_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Ii]nventory/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice($.inventory_name_line, $.inventory_pid_line, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  inventory_name_line: $ => prec(100, seq(/NAME:/i, field('name', choice($.string, alias($.text_line, $.text))), /,/, /DESCR:/i, field('description', choice($.string, alias($.text_line, $.text))), $._newline)),
  inventory_pid_line: $ => prec(100, seq(/PID:/i, field('pid', $.word), /,/, /VID:/i, field('vid', $.word), /,/, /SN:/i, field('sn', $.word), $._newline)),

  // --- SHOW IP INTERFACE BRIEF ---
  show_ip_int_brief_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Ii][Pp]/i, /[ \t]+/i, /[Ii]nterface/i, /[ \t]+/i, /[Bb]rief/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice($.ip_int_brief_header, $.ip_int_brief_entry, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  ip_int_brief_header: $ => prec(200, seq(/[Ii]nterface/i, /[Ii][Pp]-[Aa]ddress/i, /[Oo][Kk]\?/i, /[Mm]method/i, /[Ss]tatus/i, /[Pp]rotocol/i, $._newline)),
  ip_int_brief_entry: $ => prec(100, seq(
    field('interface', $.interface_name),
    field('ip_address', choice($.ipv4_address, /[Uu]nassigned/i)),
    field('ok', $.word),
    field('method', $.word),
    field('status', alias(repeat1($.word), $.operational_status)),
    field('protocol', alias($.word, $.operational_status)),
    $._newline
  )),

  // --- SHOW IP INTERFACE ---
  show_ip_interface_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Ii][Pp]/i, /[ \t]+/i, /[Ii][Nn][Tt][Ee][Rr][Ff][Aa][Cc][Ee]/i, /[ \t]+/i))),
    field('interface', $.interface_name),
    optional(/[ \t]+/),
    $._newline,
    repeat(choice($.interface_status_entry, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),

  // --- SHOW CLOCK ---
  show_clock_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Cc]lock/i, optional(/[ \t]+/)))), $._newline,
    $.clock_info
  ),
  clock_info: $ => prec(100, seq(
    optional('*'),
    field('time', $.word),
    field('timezone', $.word),
    field('day', $.word),
    field('month', $.word),
    field('day_of_month', $.number),
    field('year', $.number),
    $._newline
  )),

  // --- SHOW ENVIRONMENT ---
  show_environment_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Ee]nvironment/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice($.environment_info, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  environment_info: $ => prec(100, seq(
    field('sensor', alias(repeat1(choice($.word, $.number)), $.text)),
    choice(
      seq(prec(20, /[Ii][Ss]/i), field('state', $.word)),
      seq(prec(20, /:/), field('value', alias($.text_line, $.text)))
    ),
    $._newline
  )),

  // --- SHOW CDP NEIGHBORS ---
  show_cdp_neighbors_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Cc][Dd][Pp]/i, /[ \t]+/i, /[Nn]eighbors/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        seq(/[Cc]apability/i, /[Cc]odes:/i, alias($.text_line, $.text), $._newline),
        $.cdp_header,
        $.cdp_neighbor_entry,
        $._newline,
        prec.dynamic(-1000, alias($._line_content, $.unknown_line))
    ))
  ),
  cdp_header: $ => prec(200, seq(/[Dd]evice/i, /ID/i, /[Ll]ocal/i, /[Ii]ntrfce/i, /[Hh]oldtme/i, /[Cc]apability/i, /[Pp]latform/i, /[Pp]ort/i, /ID/i, $._newline)),
  cdp_neighbor_entry: $ => prec(100, seq(
    field('neighbor_id', $.word),
    field('local_interface', $.interface_name),
    field('holdtime', $.number),
    field('capabilities', alias(repeat1($.word), $.text)),
    field('platform', $.word),
    field('remote_interface', $.interface_name),
    $._newline
  )),

  // --- SHOW MAC ADDRESS-TABLE ---
  show_mac_address_table_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Mm]ac/i, /[ \t]+/i, /[Aa]ddress-table/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        seq(optional(/[Vv]lan/i), /[Mm]ac/i, /[Aa]ddress/i, /[Tt]able/i, $._newline),
        $.mac_table_header,
        $.mac_entry,
        $._dashed_line,
        $._newline,
        prec.dynamic(-1000, alias($._line_content, $.unknown_line))
    ))
  ),
  mac_table_header: $ => prec(200, seq(optional(/[Vv]lan/i), optional(/ID/i), /[Mm]ac/i, /[Aa]ddress/i, /[Tt]ype/i, choice(/[Pp]orts/i, /[Pp]ort/i), $._newline)),
  mac_entry: $ => prec(100, seq(
    optional(/\*/),
    field('vlan', choice($.number, /[Aa]ll/i, /-/)),
    field('mac_address', $.mac_address),
    field('type', $.word),
    field('port', choice($.interface_name, /CPU/i, /[Dd]rop/i, /-/)),
    $._newline
  )),

  // --- SHOW IP ARP ---
  show_ip_arp_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, optional(seq(/[Ii][Pp]/i, /[ \t]+/i)), /[Aa]rp/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice($.arp_header, $.arp_entry, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  arp_header: $ => prec(200, seq(/[Pp]rotocol/i, /[Aa]ddress/i, /[Aa]ge/i, optional(seq(/\(/, /[Mm]in/i, /\)/)), /[Hh]ardware/i, /[Aa]ddr/i, /[Tt]ype/i, /[Ii]nterface/i, $._newline)),
  arp_entry: $ => prec(100, seq(
    field('protocol', $.word),
    field('ip_address', $.ipv4_address),
    field('age', $.word),
    field('mac_address', $.mac_address),
    field('type', $.word),
    field('interface', $.interface_name),
    $._newline
  )),

  // --- SHOW IP ROUTE ---
  show_ip_route_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Ii][Pp]/i, /[ \t]+/i, /[Rr]oute/i))),
    optional(seq(/[ \t]+/i, /[Vv][Rr][Ff]/i, /[ \t]+/i, $.word)),
    optional(/[ \t]+/),
    $._newline,
    repeat(choice($._routing_generic_line, $.subnet_header, $.routing_entry, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  _routing_generic_line: $ => prec(100, seq(choice(/Codes:/i, seq(/[Gg]ateway/i, /[Oo][Ff]/i, /[Ll]ast/i, /[Rr]esort/i, /[Ii][Ss]/i), /!/), optional(alias($.text_line, $.text)), $._newline)),
  subnet_header: $ => prec(100, seq(field('network', $.ipv4_address), /\//i, field('prefix', $.number), /[Ii][Ss]/i, /[Ss]ubnetted/i, optional(alias($.text_line, $.text)), $._newline)),
  routing_entry: $ => prec(100, seq(
    field('protocol', alias(/[LCSRODBP* ]{1,3}/, $.word)),
    field('network', $.ipv4_address),
    optional(seq(/\//i, field('prefix', $.number))),
    choice(
        seq(/\[/i, field('distance', $.number), /\//i, field('metric', $.number), /\]/, /[Vv]ia/i, field('nexthop_ip', $.ipv4_address), optional(seq(/,/, field('nexthop_if', $.interface_name)))),
        seq(/[Ii][Ss]/i, /[Dd]irectly/i, /[Cc]onnected/i, /,/, field('nexthop_if', $.interface_name))
    ),
    $._newline
  )),

  // --- SHOW IP BGP SUMMARY ---
  show_ip_bgp_summary_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Ii][Pp]/i, /[ \t]+/i, /[Bb][Gg][Pp]/i, /[ \t]+/i, /[Ss]ummary/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice($.bgp_summary_header, $.bgp_summary_entry, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  bgp_summary_header: $ => prec(200, seq(/[Nn]eighbor/i, /V/i, /AS/i, /[Mm]sg[Rr]cvd/i, /[Mm]sg[Ss]ent/i, /[Tt]bl[Vv]er/i, /[Ii]n[Qq]/i, /[Oo]ut[Qq]/i, /[Uu]p\/[Dd]own/i, /[Ss]tate\/[Pp]fx[Rr]cd/i, $._newline)),
  bgp_summary_entry: $ => prec(100, seq(
    field('neighbor', choice($.ipv4_address, $.ipv6_address)),
    field('version', $.number),
    field('as', $.number),
    field('msg_rcvd', $.number),
    field('msg_sent', $.number),
    field('tbl_ver', $.number),
    field('in_q', $.number),
    field('out_q', $.number),
    field('up_down', $.word),
    field('state_prefix', $.word),
    $._newline
  )),

  // --- SHOW IP OSPF NEIGHBOR ---
  show_ip_ospf_neighbor_block: $ => seq(
    token(prec(100, seq(/[Ss]how/i, /[ \t]+/i, /[Ii][Pp]/i, /[ \t]+/i, /[Oo][Ss][Pp][Ff]/i, /[ \t]+/i, /[Nn]eighbor/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice($.ospf_neighbor_header, $.ospf_neighbor_entry, $._dashed_line, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  ospf_neighbor_header: $ => prec(200, seq(/[Nn]eighbor/i, /ID/i, /[Pp]ri/i, /[Ss]tate/i, /[Dd]ead/i, /[Tt]ime/i, /[Aa]ddress/i, /[Ii]nterface/i, $._newline)),
  ospf_neighbor_entry: $ => prec(100, seq(
    field('neighbor_id', $.ipv4_address),
    field('priority', $.number),
    field('state', $.word),
    field('dead_time', $.word),
    field('address', $.ipv4_address),
    field('interface', $.interface_name),
    $._newline
  )),

  interface_status_entry: $ => prec(100, seq(field('interface', $.interface_name), /[Ii][Ss]/i, field('status', alias(repeat1($.word), $.operational_status)), /,/, /[Ll]ine/i, /[Pp]rotocol/i, /[Ii][Ss]/i, field('protocol', alias($.word, $.operational_status)), $._newline)),
  vlan_brief_entry: $ => prec(100, seq(field('id', $.number), field('name', $.word), field('status', $.word), field('ports', repeat1($.interface_name)), $._newline)),
  bgp_neighbor_block: $ => prec(100, seq(/[Bb][Gg][Pp]/i, /[Nn]eighbor/i, /[Ii][Ss]/i, field('neighbor', $.ipv4_address), /,/, /[Rr]emote/i, /[Aa][Ss]/i, field('remote_as', $.number), /.*/, $._newline)),

  // --- SECURITY ASA/FTD (4.4) ---

  // --- SHOW CRYPTO IPSEC SA ---
  show_crypto_ipsec_sa_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+[Cc]rypto\s+[Ii]psec\s+[Ss][Aa]/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        $.crypto_ipsec_sa_entry,
        $._newline
    ))
  ),
  crypto_ipsec_sa_entry: $ => seq(
    token(prec(120, /[Ii]nterface\s*:/i)), field('interface', choice($.interface_name, $.word)), $._newline,
    repeat(choice(
        $.crypto_map_line,
        $.crypto_ident_line,
        $.crypto_peer_line,
        $.crypto_pkts_line,
        $._newline
    ))
  ),
  crypto_map_line: $ => seq(
    token(prec(120, /[Cc]rypto\s+map\s+tag\s*:/i)), field('tag', $.word), ',',
    token(prec(120, /seq\s+num\s*:/i)), field('seq', $.number), ',',
    token(prec(120, /local\s+addr\s*:/i)), field('local_addr', $.ipv4_address),
    $._newline
  ),
  crypto_ident_line: $ => seq(
    field('side', choice(token(prec(120, /local/i)), token(prec(120, /remote/i)))),
    token(prec(120, /ident/i)), '(', token(prec(120, /addr\/mask\/prot\/port/i)), '):',
    '(', field('address', $.ipv4_address), '/', field('mask', choice($.ipv4_address, $.number)), '/', field('protocol', $.number), '/', field('port', $.number), ')',
    $._newline
  ),
  crypto_peer_line: $ => seq(
    token(prec(120, /current_peer\s*:/i)), field('peer', $.ipv4_address),
    optional(seq(token(prec(120, /port\s*:/i)), field('port', $.number))),
    $._newline
  ),
  crypto_pkts_line: $ => seq(
    choice(
        seq(token(prec(120, /#pkts\s+encaps\s*:/i)), field('encaps', $.number)),
        seq(token(prec(120, /#pkts\s+decaps\s*:/i)), field('decaps', $.number))
    ),
    repeat(seq(token(prec(130, ',')), choice($.word, $.number, $.punctuation, /#[a-z]+/i, /:[a-z]+/i))),
    $._newline
  ),

  // --- SHOW CRYPTO IKEV1 SA ---
  show_crypto_ikev1_sa_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+[Cc]rypto\s+[Ii]kev1\s+[Ss][Aa]/i, optional(/[Dd]etail/i), optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        $.ikev1_sa_header,
        $.ikev1_sa_entry,
        $._newline
    ))
  ),
  ikev1_sa_header: $ => prec(200, seq(token(prec(120, /IKEv1\s+SAs:/i)), $._newline, optional($._dashed_line))),
  ikev1_sa_entry: $ => seq(
    field('connection_id', $.number),
    field('ip_address', $.ipv4_address),
    field('state', $.word),
    field('role', choice(token(prec(120, /INITIATOR/i)), token(prec(120, /RESPONDER/i)))),
    $._newline
  ),

  // --- SHOW FAILOVER ---
  show_failover_block: $ => seq(
    token(prec(200, seq(/[Ss]how\s+[Ff]ailover/i, optional(/[ \t]+/)))),
    $._newline,
    repeat(choice(
        $.failover_line,
        $._newline
    ))
  ),
  failover_line: $ => prec(150, seq(
    token(prec(150, /[Ff]ailover/i)),
    choice(
        seq($._whitespace, field('status', alias(choice(/[Oo]n/i, /[Oo]ff/i), $.word))),
        seq($._whitespace, /[Uu]nit/i, $._whitespace, field('role', $.word))
    ),
    $._newline
  )),
  failover_interface_line: $ => seq(
    field('interface_label', alias(repeat1($.word), $.text)),
    ':',
    field('interface', choice($.interface_name, $.word)),
    field('status', alias(repeat1($.word), $.text)),
    $._newline
  ),

  // --- SHOW VPN-SESSIONDB ---
  show_vpn_sessiondb_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+[Vv]pn-sessiondb/i, optional(choice(/[Aa]nyconnect/i, /[Ll]2[Ll]/i)), optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        $.vpn_session_summary,
        $.vpn_session_entry,
        $._newline
    ))
  ),
  vpn_session_summary: $ => seq(token(prec(120, /Total\s+active\s+and\s+inactive\s*:/i)), field('total', $.number), $._newline),
  vpn_session_entry: $ => seq(
    token(prec(120, /Index\s*:/i)), field('index', $.number), ',',
    token(prec(120, /Username\s*:/i)), field('username', $.word), ',',
    token(prec(120, /Public\s+IP\s*:/i)), field('public_ip', $.ipv4_address),
    $._newline
  ),

  // --- SERVICE PROVIDER IOS-XR (4.5) ---

  // --- SHOW BGP NEIGHBORS ---
  show_bgp_neighbors_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+[Bb][Gg][Pp]\s+[Nn]eighbors/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        $.bgp_neighbor_summary_line,
        $._newline
    ))
  ),
  bgp_neighbor_summary_line: $ => seq(
    token(prec(120, /BGP\s+neighbor\s+is/i)), field('neighbor', choice($.ipv4_address, $.ipv6_address)), ',',
    token(prec(120, /remote\s+AS/i)), field('remote_as', $.number), ',',
    token(prec(120, /local\s+AS/i)), field('local_as', $.number),
    $._newline
  ),

  // --- SHOW MPLS LDP NEIGHBOR ---
  show_mpls_ldp_neighbor_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+[Mm][Pp][Ll][Ss]\s+[Ll][Dd][Pp]\s+[Nn]eighbor/i, optional(/[Bb]rief/i), optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        $.mpls_ldp_neighbor_line,
        $._newline
    ))
  ),
  mpls_ldp_neighbor_line: $ => seq(
    token(prec(120, /Peer\s+LDP\s+ID:/i)), field('peer_id', $.ipv4_address), ':', field('label_space', $.number), ';',
    token(prec(120, /Local\s+LDP\s+ID:/i)), field('local_id', $.ipv4_address), ':', field('local_label_space', $.number),
    $._newline
  ),

  // --- DATA CENTER NX-OS (4.6) ---

  // --- SHOW VPC ---
  show_vpc_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+vpc/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        $.vpc_summary_line,
        $.vpc_entry,
        $._dashed_line,
        $._newline
    ))
  ),
  vpc_summary_line: $ => seq(token(prec(120, /vPC\s+domain\s+id\s*:/i)), field('domain_id', $.number), optional($._whitespace), $._newline),
  vpc_entry: $ => seq(
    field('vpc_id', $.number),
    field('port', choice($.interface_name, $.word)),
    field('status', $.word),
    field('consistency', $.word),
    optional($._whitespace),
    $._newline
  ),

  // --- SHOW FEX ---
  show_fex_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+fex/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        $.fex_entry,
        $._newline
    ))
  ),
  fex_entry: $ => seq(
    field('fex_id', $.number),
    field('description', $.word),
    field('state', $.word),
    field('model', $.word),
    field('serial', $.word),
    $._newline
  ),

  // --- ADVANCED L2/L3 (4.7) ---
  show_etherchannel_summary_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+[Ee]therchannel\s+[Ss]ummary/i, optional(/[ \t]+/)))), $._newline,
    repeat(choice(
        $.etherchannel_header,
        $.etherchannel_entry,
        $._dashed_line,
        $._newline
    ))
  ),
  etherchannel_header: $ => prec(200, seq(token(prec(120, /Group/i)), /Port-channel/i, /Protocol/i, /Ports/i, $._newline)),
  etherchannel_entry: $ => seq(
    field('group', $.number),
    field('bundle_name', choice($.interface_name, $.word)),
    field('bundle_status', $.word),
    field('bundle_protocol', $.word),
    repeat1(seq(field('member_interface', choice($.interface_name, $.word)), '(', field('member_status', $.word), ')')),
    $._newline
  ),

  show_spanning_tree_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+[Ss]panning-tree/i, optional(/[ \t]+/)))),
    optional($.word),
    $._newline,
    repeat(choice(
        $.spanning_tree_vlan_header,
        $.spanning_tree_entry,
        $._dashed_line,
        $._newline
    ))
  ),
  spanning_tree_vlan_header: $ => seq(token(prec(120, /VLAN/i)), field('vlan_id', $.number), optional(alias($.text_line, $.text)), $._newline),
  spanning_tree_entry: $ => seq(
    field('interface', choice($.interface_name, $.word)),
    field('role', $.word),
    field('status', $.word),
    field('cost', $.number),
    field('port_priority', $.number),
    '.',
    field('port_id', $.number),
    field('type', optional($.word)),
    $._newline
  ),

  show_standby_block: $ => seq(
    token(prec(120, seq(/[Ss]how\s+[Ss]tandby/i, optional(/[ \t]+/)))),
    optional(token(prec(120, /[Bb]rief/i))),
    $._newline,
    repeat(choice(
        $.standby_header,
        $.standby_entry,
        $._newline
    ))
  ),
  standby_header: $ => prec(200, seq(token(prec(120, /Interface/i)), /Grp/i, /Prio/i, /P/i, /State/i, /Active/i, /Standby/i, /Virtual\s+IP/i, $._newline)),
  standby_entry: $ => seq(
    field('interface', choice($.interface_name, $.word)),
    field('group', $.number),
    field('priority', $.number),
    field('preempt', $.word),
    field('state', $.word),
    field('active_router', choice($.ipv4_address, $.word)),
    field('standby_router', choice($.ipv4_address, $.word)),
    field('virtual_ip', $.ipv4_address),
    $._newline
  )
};
