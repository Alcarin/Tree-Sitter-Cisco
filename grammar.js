/**
 * @file Cisco configuration grammar - Ultimate Context-Switching Architecture
 */

const common = require('./rules/common');
const config = require('./rules/config');
const operational = require('./rules/operational');

module.exports = grammar({
  name: 'cisco',

  externals: $ => [
    $._indent,
    $._dedent,
    $._newline,
    $._field_separator,
    $._dashed_line,
    $._console_prompt,
    $._whitespace,
    $._line_content,
    $._prompt_exec,
    $._prompt_config,
    $._signal_ios_config,
    $._signal_ios_exec,
    $._signal_interface_start,
    $._signal_router_start,
    $._signal_vlan_start
  ],

  extras: $ => [
    $._whitespace,
    $._field_separator
  ],

  conflicts: $ => [
    [$.show_version_block],
    [$.show_inventory_block],
    [$.show_ip_int_brief_block],
    [$.show_ip_interface_block],
    [$.show_clock_block],
    [$.show_environment_block],
    [$.show_cdp_neighbors_block],
    [$.show_mac_address_table_block],
    [$.show_ip_arp_block],
    [$.show_ip_route_block],
    [$.show_ip_bgp_summary_block],
    [$.show_ip_ospf_neighbor_block],
    [$.show_interfaces_block],
    [$.show_interface_status_block],
    [$.acl_rule],
    [$._acl_addr_spec_source],
    [$._acl_addr_spec_dest],
    [$.ping_block],
    [$.traceroute_block],
    [$.dir_block],
    [$.show_crypto_ipsec_sa_block],
    [$.show_crypto_ikev1_sa_block],
    [$.show_failover_block],
    [$.show_vpn_sessiondb_block],
    [$.show_bgp_neighbors_block],
    [$.show_mpls_ldp_neighbor_block],
    [$.show_vpc_block],
    [$.show_fex_block],
    [$.show_etherchannel_summary_block],
    [$.show_spanning_tree_block],
    [$.show_standby_block],
    [$.crypto_ipsec_sa_entry],
    [$.interface_standby],
    [$._exec_statement, $.show_command],
    [$.ios_config_segment],
    [$.ios_exec_segment]
  ],

  rules: {
    source_file: $ => repeat($._context_block),

    _context_block: $ => choice(
      $.ios_config_segment,
      $.ios_exec_segment,
      $._newline
    ),

    // Iniziamo il segmento con il segnale e permettiamo transizioni basate su prompt
    ios_config_segment: $ => prec.left(20, seq(
      $._signal_ios_config,
      repeat1($._config_statement)
    )),

    _config_statement: $ => choice(
      $.comment,
      $.banner,
      $.interface_block,
      $.bgp_block,
      $.ospf_block,
      $.vlan_block,
      $.line_block,
      $.qos_block,
      $.acl_block,
      $.system_config,
      $._prompt_config, // Prompt nudo (es. fine configurazione)
      prec.dynamic(-5000, $.command),
      $._newline
    ),

    ios_exec_segment: $ => prec.left(20, seq(
      $._signal_ios_exec,
      repeat1($._exec_statement)
    )),

    _exec_statement: $ => choice(
      $.comment,
      $._prompt_exec,
      $._prompt_config,
      $.show_command,
      $.diagnostic_command,
      prec.dynamic(-5000, $.command),
      $._newline
    ),

    comment: $ => token(prec(100, seq('!', /[^\n]*/, /\r?\n/))),

    banner: $ => seq(
      token(prec(10, /banner\s+\S+/)),
      field('delimiter', $._banner_delimiter),
      field('content', repeat($._banner_content)),
      $._banner_delimiter,
      $._newline
    ),

    _banner_content: $ => /[^ \t\n\r\^#%&*]+|[ \t\n\r]|\^[A-BDE-Z0-9]/,
    _banner_delimiter: $ => /[\^]C|[#%^&*]|\^/,

    command: $ => seq(
      repeat1(choice($.word, $.number, $.punctuation, $.ipv4_address, $.interface_name)),
      $._newline
    ),

    ...common,
    ...config,
    ...operational
  }
});
