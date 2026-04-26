const primitives = require('./rules/common/primitives.js');
const common = require('./rules/common.js');
const operational = require('./rules/operational.js');

module.exports = grammar({
  name: 'cisco',

  extras: $ => [
    /[ \t]/,
    $._console_noise
  ],

  conflicts: $ => [
  ],

  externals: $ => [
    $._indent,             // 0
    $._dedent,             // 1
    $._newline_ext,        // 2
    $.output_content,      // 3
    $._prompt_exec,        // 4
    $._prompt_config_ext,  // 5
    $._error_marker,       // 6
    $._syslog_msg,         // 7
    $._console_noise,      // 8
    $._field_separator,    // 9
    $._dashed_line,        // 10
    $._banner_delimiter,   // 11
    $._banner_body,        // 12
    $._output_start,       // 13
    $._output_continue,    // 14
    $._output_end,         // 15
    $._output_none,        // 16
    $.subnet_mask,         // 17
    $.wildcard_mask,       // 18
    $.invalid_ip,          // 19
    $._banner_trigger,     // 20
  ],

  rules: {
    source_file: $ => repeat(choice(
      $.ios_exec_segment,
      $.ios_config_segment,
      $._syslog_msg,
      $.comment,
      $._newline
    )),

    // Il segmento EXEC è l'unico guardiano dei comandi operativi
    ios_exec_segment: $ => seq(
      $._prompt_exec,
      $._command_tree // Qui inizia la ramificazione vera
    ),

    ios_config_segment: $ => seq(
      $._prompt_config_ext,
      field('execution', choice($.command, $._newline)),
      optional(choice(
        seq($._output_start, field('output', $.output_content), $._output_end),
        $._output_none
      ))
    ),

    // --- AGGREGATORI DI OUTPUT (Usati dalle foglie dell'albero) ---

    ping_output: $ => repeat1(seq($._output_continue, choice($.ping_stream_line, $.ping_summary), $._newline)),

    ip_int_brief_output: $ => seq(
        seq($._output_continue, $.ip_int_brief_header, $._newline),
        repeat1(seq($._output_continue, $.ip_int_brief_entry, $._newline))
    ),

    version_output: $ => repeat1(seq($._output_continue, choice($.version_uptime_line, $.version_software_line, $.version_serial_line), $._newline)),

    inventory_output: $ => repeat1(seq($._output_continue, choice($.inventory_name_line, $.inventory_pid_line), $._newline)),

    interface_status_output: $ => seq(
        seq($._output_continue, $.interface_status_header, $._newline),
        repeat1(seq($._output_continue, $.interface_status_entry, $._newline))
    ),

    dir_output: $ => prec(1000, seq(
        seq(optional($._output_continue), $.dir_header, $._newline),
        repeat1(seq(optional($._output_continue), $.dir_entry, $._newline)),
        seq(optional($._output_continue), $.dir_summary, $._newline)
    )),

    traceroute_output: $ => repeat1(seq($._output_continue, $.traceroute_hop_line, $._newline)),

    diagnostic_output: $ => repeat1(seq($._output_continue, choice(prec(500, $.configuration_line), prec(1, $.generic_output_line)), $._newline)),

    _output_content: $ => repeat1(seq($._output_continue, $.generic_output_line, $._newline)),

    comment: $ => seq(token(seq('!', /[^\r\n]*/)), $._newline),

    generic_output_line: $ => token(prec(10, /[^\r\n]+/)),
    _newline: $ => choice('\n', '\r\n', $._newline_ext),

    ...primitives,
    ...common,
    ...operational,
  }
});
