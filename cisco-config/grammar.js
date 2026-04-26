const primitives = require('../rules/common/primitives.js');
const common = require('../rules/common.js');
const xeConfig = require('./rules/config.js');
const interfaces = require('./rules/interfaces.js');
const routing = require('./rules/routing.js');
const security = require('./rules/security.js');
const system = require('./rules/system.js');
const qos = require('./rules/qos.js');
const vlan = require('./rules/vlan.js');

module.exports = grammar({
  name: 'cisco_config',

  extras: $ => [
    /[ \t]/,
    $._console_noise
  ],

  conflicts: $ => [
    [$.command, $.ipv4_address],
    [$.ipv4_address, $.word],
    [$.ipv4_address, $.number],
    [$.subnet_mask, $.ipv4_address],
    [$.command, $.network_object],
    [$.wildcard_mask, $.word],
    [$.wildcard_mask, $.ipv4_address],
    [$.command, $.port_object],
    [$.subnet_mask, $.word],
    [$.aaa_config],
  ],

  externals: $ => [
    $._indent,             // 0
    $._dedent,             // 1
    $._newline_ext,        // 2
    $._output_content_ext, // 3
    $._prompt_exec,        // 4
    $._prompt_config_ext,  // 5
    $._error_marker,       // 6
    $._syslog_msg,         // 7
    $._console_noise,      // 8
    $._field_separator,    // 9
    $._dashed_line,        // 10
    $._banner_delimiter,   // 11
    $._banner_body,        // 12
    $._output_start_ext,   // 13
    $._output_continue_ext,// 14
    $._output_end_ext,     // 15
    $._output_none_ext,    // 16
    $.subnet_mask,         // 17
    $.wildcard_mask,       // 18
    $.invalid_ip,          // 19
    $._banner_trigger,     // 20
  ],

  rules: {
    // --- ENTRY POINT: DEEP CONFIG ---
    config_file: $ => repeat(choice(
      $._config_statement,
      $.comment,
      $._newline
    )),

    // Cisco comment (!)
    comment: $ => seq(token(prec(50, seq('!', /[^\r\n]*/))), $._newline),

    // --- INTERNAL RULES ---
    generic_output_line: $ => token(prec(1, /[^\r\n]+/)),
    _newline: $ => choice('\n', '\r\n', $._newline_ext),

    // --- INCLUSIONE REGOLE MODULARI ---
    ...primitives,
    ...common,
    ...xeConfig,
    ...interfaces,
    ...routing,
    ...security,
    ...system,
    ...qos,
    ...vlan
  }
});
