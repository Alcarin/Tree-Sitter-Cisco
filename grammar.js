/**
 * @file Cisco configuration grammar - High Precision Clean Version
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
    $._prompt_config
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
    [$.interface_standby]
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.comment,
      $.banner,
      prec(100, $.interface_block),
      prec(100, $.bgp_block),
      prec(100, $.ospf_block),
      prec(100, $.vlan_block),
      prec(100, $.line_block),
      prec(100, $.qos_block),
      prec(100, $.acl_block),
      prec(100, $.system_config),
      prec(100, $.show_command),
      prec(100, $.diagnostic_command),
      
      prec.dynamic(-10000, $.command),
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
