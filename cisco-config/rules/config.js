/**
 * @file Unified configuration rules aggregator
 *
 * RECENT CHANGES:
 *  - line_block: converted from $._whitespace to _indent/_dedent
 *  - _kw_ipv6: removed redefinition (canonical in common.js)
 *  - _line_statement: removed $._whitespace, now uses block's _indent/_dedent
 */

const interfaces = require('./interfaces');
const routing    = require('./routing');
const system     = require('./system');
const security   = require('./security');
const vlan       = require('./vlan');
const qos        = require('./qos');

module.exports = {
  ...interfaces,
  ...routing,
  ...system,
  ...security,
  ...vlan,
  ...qos,

  _config_statement: $ => choice(
    $.interface_block,
    $.bgp_block,
    $.ospf_block,
    $.eigrp_block,
    $.vlan_block,
    $.line_block,
    $.qos_block,
    $.acl_block,
    $.acl_numbered,
    $.object_group_block,
    $.system_config,
    $.command
  ),

  // ── Keywords ───────────────────────────────────────────────────────────────
  _kw_line: $ => token(prec(100, /[Ll]ine/)),

  // ── Line block (vty, con, aux) ─────────────────────────────────────────────
  // Uses _indent/_dedent like all hierarchical blocks — NO longer $._whitespace
  line_block: $ => prec(200, seq(
    $._kw_line,
    field('type', alias(
      choice('vty', 'VTY', 'con', 'console', 'Console', 'aux', 'Aux'),
      $.word
    )),
    field('start', $.number),
    optional(field('end', $.number)),
    $._newline,
    $._indent,
    repeat(choice(
      $.line_password,
      $.line_exec_timeout,
      $.line_login,
      $.line_transport,
      $.comment,
      $.command
    )),
    $._dedent
  )),

  line_password: $ => seq(
    'password',
    optional(field('encryption_type', $.number)),
    field('password', alias(/[a-zA-Z0-9._\-\/:]+/, $.word)),
    $._newline
  ),

  line_exec_timeout: $ => seq(
    'exec-timeout',
    field('minutes', $.number),
    optional(field('seconds', $.number)),
    $._newline
  ),

  line_login: $ => seq(
    'login',
    optional(field('method', $.word)),
    $._newline
  ),

  line_transport: $ => seq(
    'transport',
    field('direction', choice('input', 'output', 'preferred')),
    repeat1(field('protocol', choice('ssh', 'telnet', 'all', 'none', $.word))),
    $._newline
  ),
};
