/**
 * @file Cisco configuration grammar - Fixed Dictionary Integration
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

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
    $._line_content
  ],

  extras: $ => [
    $._whitespace,
    $._console_prompt,
    $._field_separator
  ],

  conflicts: $ => [
    [$.show_version_block],
    [$.show_inventory_block],
    [$.show_ip_int_brief_block],
    [$.show_ip_interface_block],
    [$.show_ip_int_brief_block, $.show_ip_interface_block],
    [$.show_environment_block],
    [$.show_cdp_neighbors_block],
    [$.show_mac_address_table_block],
    [$.show_ip_arp_block],
    [$.show_ip_route_block],
    [$.show_ip_bgp_summary_block],
    [$.show_ip_ospf_neighbor_block],
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
    [$.show_interface_status_block],
    [$.show_interfaces_block],
    [$.failover_line],
    [$.crypto_ipsec_sa_entry],
    [$.ikev1_sa_entry],
    [$.vpn_session_entry],
    [$.etherchannel_entry],
    [$.spanning_tree_entry],
    [$.standby_entry],
    [$.interface_status_entry],
    [$.ping_block],
    [$.interface_metrics_line],
    [$.input_rate_line],
    [$.output_rate_line],
    [$.input_counters],
    [$.input_errors],
    [$.output_counters],
    [$.output_errors],
    [$.interface_queues_line],
    [$.interface_timestamp_line],
    [$.traceroute_block],
    [$.dir_block],
    [$.acl_rule],
    [$._acl_addr_spec_source],
    [$._acl_addr_spec_dest],
    [$.bgp_summary_entry],
    [$.bgp_neighbor_block],
    [$.bgp_summary_entry, $.ospf_neighbor_entry],
    [$.arp_entry, $.routing_entry],
    [$.text_line, $.cdp_neighbor_entry],
    [$.text_line, $.ospf_neighbor_entry],
    [$.text_line, $.arp_entry],
    [$.text_line, $.routing_entry],
    [$.text_line, $.mac_entry],
    [$.text_line, $.ip_int_brief_entry],
    [$.text_line, $.inventory_name_line],
    [$.text_line, $.inventory_pid_line],
    [$.text_line, $.software_info],
    [$.text_line, $.hardware_info],
    [$.text_line, $.failover_interface_line],
    [$.text_line, $.vpn_session_entry],
    [$.text_line, $.ikev1_sa_entry],
    [$.text_line, $.crypto_pkts_line],
    [$.text_line, $.interface_status_entry],
    [$.interface_standby],
    [$.interface_standby, $.command],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.comment,
      $.banner,
      prec(150, $.show_command),
      $.diagnostic_command,
      $.system_config,
      $.vlan_block,
      $.line_block,
      $.qos_block,
      $.acl_block,
      $.bgp_block,
      $.ospf_block,
      $.interface_block,
      prec.dynamic(-200, $.command),
      $._newline
    ),

    comment: $ => token(prec(20, seq('!', /[^\n]*/, /\r?\n/))),

    banner: $ => seq(
      token(prec(10, /banner\s+\S+/)),
      field('delimiter', $._banner_delimiter),
      field('content', repeat($._banner_content)),
      $._banner_delimiter,
      $._newline
    ),

    _banner_content: $ => /[^ \t\n\r\^#%&*]+|[ \t\n\r]|\^[A-BDE-Z0-9]/,
    _banner_delimiter: $ => /[\^]C|[#%^&*]|\^/,

    ...common,
    ...config,
    ...operational
  }
});
