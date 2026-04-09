/**
 * @file Cisco configuration grammar for tree-sitter
 * @author Alcarin
 * @license ISC
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const common = require('./rules/common');
const config = require('./rules/config');
const operational = require('./rules/operational');

module.exports = grammar({
  name: 'cisco',

  extras: $ => [
    /[\t ]+/,
  ],

  conflicts: $ => [
    // Conflitti critici per la distinzione tra statement e blocchi
    [$._statement, $.vlan_block],
    [$._statement, $.line_block],
    [$._statement, $.qos_block],
    [$._statement, $.acl_block],
    [$._statement, $.block],
    
    // Conflitti tra comandi singoli e l'inizio di un blocco
    [$.command, $.block],
    [$.command, $.indented_command],
    [$.block, $.indented_command],
    
    // Conflitto greedy sulla riga
    [$._line_content]
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.comment,
      $.banner,
      $.show_version,
      $.show_inventory,
      $.show_ip_int_brief,
      $.show_interfaces,
      $.show_vlan_brief,
      $.show_ip_arp,
      $.show_ip_route,
      $.show_mac_address_table,
      $.show_ip_ospf_neighbor,
      $.show_ip_bgp_summary,
      $.show_spanning_tree,
      $.static_route,
      $.ntp_config,
      $.logging_config,
      $.snmp_config,
      $.vlan_definition,
      $.vrf_definition,
      $.vlan_block,
      $.line_block,
      $.qos_block,
      $.acl_block,
      $.crypto_config,
      $.system_config,
      $.block,
      $.command,
      $._newline
    ),

    comment: $ => seq('!', /.*/, $._newline),

    banner: $ => seq(
      /banner\s+\S+/,
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
