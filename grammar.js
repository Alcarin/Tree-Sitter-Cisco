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
    $._whitespace
  ],

  extras: $ => [
    $._whitespace,
    $._console_prompt
  ],

  conflicts: $ => [
    [$.bgp_summary_entry],
    [$.generic_show_command],
    [$.bgp_neighbor_block],
    [$.command, $.ip_int_brief_entry],
    [$.command, $.routing_entry],
    [$.command, $.software_info],
    [$.command, $.uptime_info],
    [$.command, $.processor_info],
    [$.command, $.config_register],
    [$.command, $.mac_entry],
    [$.command, $.arp_entry, $.routing_entry],
    [$.command, $.vlan_brief_entry],
    [$.command, $.bgp_summary_entry, $.ospf_neighbor_entry]
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.comment,
      $.banner,
      prec(100, $.show_version),
      prec(100, $.show_inventory),
      prec(100, $.show_ip_interface_brief),
      prec(100, $.show_ip_route),
      prec(100, $.show_mac_address_table),
      prec(100, $.show_ip_arp),
      prec(100, $.show_ip_bgp_summary),
      prec(100, $.show_ip_bgp_neighbors),
      prec(100, $.software_info),
      prec(100, $.uptime_info),
      prec(100, $.processor_info),
      prec(100, $.config_register),
      prec(100, $.inventory_entry),
      prec(100, $.ip_int_brief_entry),
      prec(100, $.interface_status_entry),
      prec(100, $.vlan_brief_entry),
      prec(100, $.arp_entry),
      prec(100, $.bgp_summary_entry),
      prec(100, $.routing_entry),
      prec(100, $.subnet_header),
      prec(100, $.mac_entry),
      prec(100, $.ospf_neighbor_entry),
      prec(100, $.bgp_neighbor_block),
      $.vlan_block,
      $.line_block,
      $.qos_block,
      $.acl_block,
      $.bgp_block,
      $.ospf_block,
      $.interface_block,
      $.system_config,
      $.command,
      $._newline
    ),

    comment: $ => token(prec(20, seq('!', /.*/, /\r?\n/))),

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
