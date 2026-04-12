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
    $.show_ip_interface_block
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
    token(prec(110, /[Pp]ing/i)),
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
    token(prec(110, /[Tt]raceroute/i)),
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
    token(prec(110, /[Dd]ir/i)),
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
    token(prec(110, /[Tt]erminal/i)),
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
    prec(100, seq(/[Ss]how/i, /[Vv]ersion/i)), $._newline,
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
    prec(100, seq(/[Ss]how/i, /[Ii]nventory/i)), $._newline,
    repeat(choice($.inventory_name_line, $.inventory_pid_line, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  inventory_name_line: $ => prec(100, seq(/NAME:/i, field('name', choice($.string, alias($.text_line, $.text))), /,/, /DESCR:/i, field('description', choice($.string, alias($.text_line, $.text))), $._newline)),
  inventory_pid_line: $ => prec(100, seq(/PID:/i, field('pid', $.word), /,/, /VID:/i, field('vid', $.word), /,/, /SN:/i, field('sn', $.word), $._newline)),

  // --- SHOW IP INTERFACE BRIEF ---
  show_ip_int_brief_block: $ => seq(
    prec(100, seq(/[Ss]how/i, /[Ii][Pp]/i, /[Ii]nterface/i, /[Bb]rief/i)), $._newline,
    repeat(choice($.ip_int_brief_header, $.ip_int_brief_entry, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),
  ip_int_brief_header: $ => prec(200, seq(/[Ii]nterface/i, /[Ii][Pp]-[Aa]ddress/i, /[Oo][Kk]\?/i, /[Mm]ethod/i, /[Ss]tatus/i, /[Pp]rotocol/i, $._newline)),
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
    prec(100, seq(/[Ss]how/i, /[Ii][Pp]/i, /[Ii]nterface/i, field('interface', $.interface_name))), $._newline,
    repeat(choice($.interface_status_entry, $._newline, prec.dynamic(-1000, alias($._line_content, $.unknown_line))))
  ),

  // --- SHOW CLOCK ---
  show_clock_block: $ => seq(
    prec(100, seq(/[Ss]how/i, /[Cc]lock/i)), $._newline,
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
    prec(100, seq(/[Ss]how/i, /[Ee]nvironment/i)), $._newline,
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
    prec(100, seq(/[Ss]how/i, /[Cc][Dd][Pp]/i, /[Nn]eighbors/i)), $._newline,
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
    prec(100, seq(/[Ss]how/i, /[Mm]ac/i, /[Aa]ddress-table/i)), $._newline,
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
    prec(100, seq(/[Ss]how/i, optional(/[Ii][Pp]/i), /[Aa]rp/i)), $._newline,
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
    prec(100, seq(/[Ss]how/i, /[Ii][Pp]/i, /[Rr]oute/i, optional(seq(/[Vv][Rr][Ff]/i, $.word)))), $._newline,
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
    prec(100, seq(/[Ss]how/i, /[Ii][Pp]/i, /[Bb][Gg][Pp]/i, /[Ss]ummary/i)), $._newline,
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
    prec(100, seq(/[Ss]how/i, /[Ii][Pp]/i, /[Oo][Ss][Pp][Ff]/i, /[Nn]eighbor/i)), $._newline,
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
  bgp_neighbor_block: $ => prec(100, seq(/[Bb][Gg][Pp]/i, /[Nn]eighbor/i, /[Ii][Ss]/i, field('neighbor', $.ipv4_address), /,/, /[Rr]emote/i, /[Aa][Ss]/i, field('remote_as', $.number), /.*/, $._newline))
};
