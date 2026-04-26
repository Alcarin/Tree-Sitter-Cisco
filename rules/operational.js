/**
 * @file Operational commands - Real Hierarchical Command Tree (Tight Coupling)
 */

module.exports = {
  // --- KEYWORDS (NOP Pattern) ---
  kw_show: $ => token(prec(100, /sh(ow?)?/i)),
  kw_ip: $ => token(prec(100, /ip/i)),
  kw_interface: $ => token(prec(100, /int(erface)?s?/i)),
  kw_brief: $ => token(prec(100, /bri?(ef)?/i)),
  kw_version: $ => token(prec(100, /v(er(sion)?)?/i)),
  kw_inventory: $ => token(prec(100, /inv(entory)?/i)),
  kw_status: $ => token(prec(100, /stat(us)?/i)),
  kw_run: $ => token(prec(100, /run(ning-config)?/i)),
  kw_ping: $ => token(prec(100, /p(ing)?/i)),
  kw_traceroute: $ => token(prec(100, /tr(ace(route)?)?/i)),
  kw_dir: $ => token(prec(100, /dir/i)),
  kw_configure: $ => token(prec(100, /conf(igure)?/i)),
  kw_terminal: $ => token(prec(100, /t(erminal)?/i)),

  // --- THE TREE ROOT ---
  _command_tree: $ => choice(
    $.show_command,
    $.ping_command,
    $.traceroute_command,
    $.dir_command,
    $.configure_terminal_command,
    $.generic_exec_command
  ),

  // --- BRANCH: SHOW ---
  show_command: $ => seq(
    $.kw_show,
    choice(
      $.show_ip_command,
      $.show_interface_command,
      $.show_version_command,
      $.show_inventory_command,
      $.show_running_config_command,
      $.generic_show_command
    )
  ),

  show_ip_command: $ => seq(
    $.kw_ip,
    choice(
      $.show_ip_interface_command,
      $.generic_show_ip_command
    )
  ),

  show_interface_command: $ => seq(
    $.kw_interface,
    choice(
      $.show_interface_status_command,
      $.show_interfaces_stats_command
    )
  ),

  show_ip_interface_command: $ => seq(
    $.kw_interface,
    choice(
      $.show_ip_interface_brief_command,
      $.show_interfaces_stats_command
    )
  ),

  // --- LEAF NODES (Command + Mandatory Output where appropriate) ---

  show_ip_interface_brief_command: $ => seq(
    field('execution', seq($.kw_brief, optional($._output_modifier))),
    $._newline,
    seq($._output_start, field('output', $.ip_int_brief_output), $._output_end)
  ),

  show_version_command: $ => seq(
    field('execution', seq($.kw_version, optional($._output_modifier))),
    $._newline,
    seq($._output_start, field('output', $.version_output), $._output_end)
  ),

  show_inventory_command: $ => seq(
    field('execution', seq($.kw_inventory, optional($._output_modifier))),
    $._newline,
    seq($._output_start, field('output', $.inventory_output), $._output_end)
  ),

  show_interface_status_command: $ => seq(
    field('execution', seq($.kw_status, optional($._output_modifier))),
    $._newline,
    seq($._output_start, field('output', $.interface_status_output), $._output_end)
  ),

  show_interfaces_stats_command: $ => seq(
    field('execution', seq(optional(field('interface', $.interface_name)), optional($._output_modifier))),
    $._newline,
    seq($._output_start, field('output', $.output_content), $._output_end)
  ),

  show_running_config_command: $ => seq(
    field('execution', seq($.kw_run, optional($._output_modifier))),
    $._newline,
    seq($._output_start, field('output', $.output_content), $._output_end)
  ),

  ping_command: $ => seq(
    field('execution', seq($.kw_ping, field('destination', prec(300, $.ipv4_address)))),
    $._newline,
    seq($._output_start, field('output', $.ping_output), $._output_end)
  ),

  traceroute_command: $ => seq(
    field('execution', seq($.kw_traceroute, field('destination', choice(prec(300, $.ipv4_address), $.word)))),
    $._newline,
    seq($._output_start, field('output', $.traceroute_output), $._output_end)
  ),

  dir_command: $ => prec(1000, seq(
    field('execution', seq($.kw_dir, optional(field('path', choice($._ios_path, $.word))))),
    $._newline,
    seq($._output_start, field('output', $.dir_output), $._output_end)
  )),

  // ── Configure Terminal ──────────────────────────────────────────────────────
  configure_terminal_command: $ => prec(1000, seq(
    field('execution', seq($.kw_configure, $.kw_terminal)),
    $._newline,
    optional(seq(
      field('output', alias($.generic_output_line, $.diagnostic_output)),
      $._newline
    ))
  )),

  generic_show_command: $ => seq(
    field('execution', $.generic_output_line),
    $._newline,
    optional(choice(
        seq($._output_start, field('output', $.diagnostic_output), $._output_end),
        $._output_none
    ))
  ),

  generic_show_ip_command: $ => seq(
    field('execution', $.generic_output_line),
    $._newline,
    optional(choice(
        seq($._output_start, field('output', $.diagnostic_output), $._output_end),
        $._output_none
    ))
  ),

  generic_exec_command: $ => seq(
    field('execution', choice($.command, $._newline)),
    optional(choice(
      seq($._output_start, field('output', $.diagnostic_output), $._output_end),
      $._output_none
    ))
  ),

  _output_modifier: $ => seq('|', $.generic_output_line),

  // --- OUTPUT ELEMENTS (Real Data) ---

  ip_int_brief_header: $ => token(prec(300, seq(
    /Interface/, /[ \t]+/, /IP-Address/, /[ \t]+/, /OK\?/,
    /[ \t]+/, /Method/, /[ \t]+/, /Status/, /[ \t]+/, /Protocol/
  ))),

  ip_int_brief_entry: $ => prec.dynamic(2000, seq(
    field('interface', $.interface_name),
    field('address', choice(prec(300, $.ipv4_address), alias('unassigned', $.word), $.word)),
    field('ok', choice(alias('YES', $.word), alias('NO', $.word), $.word)),
    field('method', choice(alias('NVRAM', $.word), alias('manual', $.word), alias('DHCP', $.word), alias('unset', $.word), $.word)),
    field('status', $.operational_status),
    field('protocol', $.operational_status)
  )),

  interface_status_header: $ => token(prec(300, seq(
    /Port/, /[ \t]+/, /Name/, /[ \t]+/, /Status/, /[ \t]+/, /Vlan/, /[ \t]+/, /Duplex/, /[ \t]+/, /Speed/, /[ \t]+/, /Type/
  ))),

  interface_status_entry: $ => prec.dynamic(2000, seq(
    field('port', $.interface_name),
    field('name', choice($.word, /[ \t]{2,}/)),
    field('status', $.word),
    field('vlan', $.word),
    field('duplex', $.word),
    field('speed', $.word),
    field('type', $.generic_output_line)
  )),

  operational_status: $ => choice(
    'up', 'down', 
    seq(/[Aa][Dd][Mm][Ii][Nn][Ii][Ss][Tt][Rr][Aa][Tt][Ii][Vv][Ee][Ll][Yy]/, optional(/[ \t]+/), /[Dd][Oo][Ww][Nn]/),
    'unset', 'deleted', $.word
  ),

  ping_stream_line: $ => prec(1000, field('response_stream', token(prec(1000, /[!\.UQM&?]+/)))),

  ping_summary: $ => prec(1000, seq(
    token(prec(100, /[Ss][Uu][Cc][Cc][Ee][Ss][Ss]/)), 
    token(prec(100, /[Rr][Aa][Tt][Ee]/)), 
    token(prec(100, /[Ii][Ss]/)), 
    field('success_rate', $.number), 
    token(prec(100, /[Pp][Ee][Rr][Cc][Ee][Nn][Tt]/)),
    '(', field('success_qty', $.number), '/', field('sent_qty', $.number), ')',
    optional(seq(',', 'round-trip', 'min/avg/max', '=', field('rtt_min', $.number), '/', field('rtt_avg', $.number), '/', field('rtt_max', $.number), 'ms'))
  )),

  traceroute_hop_line: $ => prec(1000, seq(
    field('hop_number', $.number),
    choice(
      seq(
        field('hop_address', choice(prec(300, $.ipv4_address), $.word)),
        repeat1(choice(
          seq(field('rtt', $.number), field('unit', choice(/m?sec/i, /ms/i))),
          field('timeout', alias('*', $.punctuation))
        ))
      ),
      repeat1(field('timeout', alias('*', $.punctuation)))
    )
  )),

  dir_header: $ => prec(1000, seq(
    'Directory', 'of', 
    field('filesystem', alias($._text_to_eol, $.text))
  )),
  dir_entry: $ => prec(1000, seq(
    field('id', alias(/[0-9]+/, $.number)),
    field('permissions', $.word),
    field('size', alias(/[0-9]+/, $.number)),
    field('file_info', alias($._text_to_eol, $.text))
  )),
  dir_summary: $ => prec(1000, seq(
    field('total_size', alias(/[0-9]+/, $.number)), 'bytes', 'total',
    optional(seq(
      '(', field('total_free', alias(/[0-9]+/, $.number)), 'bytes', 'free', ')'
    ))
  )),

  inventory_name_line: $ => prec(1000, seq(
    'NAME:', field('name', alias($._string, $.text)), ',', 
    'DESCR:', field('descr', alias($._string, $.text))
  )),
  inventory_pid_line: $ => prec(1000, seq(
    'PID:', field('pid', $.word), ',', 
    'VID:', field('vid', $.word), ',', 
    'SN:', field('sn', $.word)
  )),

  _string: $ => token(seq('"', /[^"]*/, '"')),

  configuration_line: $ => prec(200, $.generic_output_line),

  version_uptime_line: $ => prec(1000, seq(
    optional(seq(field('hostname', $.word))),
    'uptime', 'is', field('uptime', alias($.generic_output_line, $.text))
  )),
  version_software_line: $ => prec(1000, seq(
    choice('Cisco', alias(/Cisco.*Software, /i, $.word)), 
    optional('Version'),
    field('version', choice($.word, $.number)), 
    optional($.generic_output_line)
  )),
  version_serial_line: $ => prec(1000, seq('Processor', 'board', 'ID', field('serial', $.word), optional($.generic_output_line))),
};
