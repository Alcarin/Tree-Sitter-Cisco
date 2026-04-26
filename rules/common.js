/**
 * @file Common Cisco CLI primitives
 *
 * NOTE:
 *  - ipv4_address: managed by the scanner (external token)
 *  - ipv6_address: remains in the grammar (sufficient regex)
 *  - Maintained: interface_name, ipv6_address, mac_address, word, number, punctuation
 */

module.exports = {

  // ── Interfaces ─────────────────────────────────────────────────────────────
  // Matches abbreviations (Gi, Fa, Te, Lo, etc.) and full names case-insensitively.
  // prec(100) to have priority over word in positions where an interface is expected.
  interface_name: $ => token(prec(100, seq(
    choice(
      /[Gg][Ii][Gg][Aa][Bb][Ii][Tt][Ee][Tt][Hh][Ee][Rr][Nn][Ee][Tt]/,
      /[Gg][Ii][0-9]/,
      /[Gg][Ii]/,
      /[Tt][Ee][Nn][Gg][Ii][Gg][Aa][Bb][Ii][Tt][Ee][Tt][Hh][Ee][Rr][Nn][Ee][Tt]/,
      /[Tt][Ee][0-9]/,
      /[Tt][Ee]/,
      /[Ff][Aa][Ss][Tt][Ee][Tt][Hh][Ee][Rr][Nn][Ee][Tt]/,
      /[Ff][Aa][0-9]/,
      /[Ff][Aa]/,
      /[Vv][Ll][Aa][Nn]/,
      /[Vv][Ll][0-9]/,
      /[Vv][Ll]/,
      /[Ll][Oo][Oo][Pp][Bb][Aa][Cc][Kk]/,
      /[Ll][Oo][0-9]/,
      /[Ll][Oo]/,
      /[Pp][Oo][Rr][Tt]-[Cc][Hh][Aa][Nn][Nn][Ee][Ll]/,
      /[Pp][Oo][0-9]/,
      /[Pp][Oo]/,
      /[Tt][Uu][Nn][Nn][Ee][Ll]/,
      /[Tt][Uu][0-9]/,
      /[Tt][Uu]/,
      /[Ss][Ee][Rr][Ii][Aa][Ll]/,
      /[Ss][Ee][0-9]/,
      /[Ss][Ee]/,
      /[Mm][Gg][Mm][Tt]/,
      /[Bb][Vv][Ii]/,
      /[Aa][Tt][Mm]/,
      /[Dd][Ii][Aa][Ll][Ee][Rr]/,
      /[Nn][Uu][Ll][Ll]/
    ),
    optional(/[ \t]*/),
    optional(/[0-9]+([\/][0-9]+)*(\.([0-9]+))?/),
    optional(/[a-zA-Z0-9\-_]/)
  ))),

  // ── IPv4 ───────────────────────────────────────────────────────────────────
  ipv4_address: $ => token(prec(100, /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/)),

  // ── IPv6 ───────────────────────────────────────────────────────────────────
  // Remains in grammar: no disambiguation needed (always uses /prefix).
  // prec(150) for priority over word in IPv6 positions.
  ipv6_address: $ => token(prec(150, choice(
    // Full address: 8 groups
    /([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/,
    // Compressed with ::
    /([0-9a-fA-F]{1,4}:){1,7}:/,
    /([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}/,
    /([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}/,
    /([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}/,
    /([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}/,
    /([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}/,
    /[0-9a-fA-F]{1,4}:(:[0-9a-fA-F]{1,4}){1,6}/,
    /:(:[0-9a-fA-F]{1,4}){1,7}/,
    /::/,
    // Link-local with zone ID
    /[Ff][Ee]80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+/,
    // With prefix /N (CIDR)
    /([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}\/[0-9]{1,3}/,
    /([0-9a-fA-F]{1,4}:)*:[0-9a-fA-F]{1,4}\/[0-9]{1,3}/,
    // Special
    /::\/[0-9]{1,3}/
  ))),

  // ── MAC Address ────────────────────────────────────────────────────────────
  mac_address: $ => token(prec(100, choice(
    // Cisco dot notation: xxxx.xxxx.xxxx
    /[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}/,
    // UNIX colon notation: xx:xx:xx:xx:xx:xx
    /[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}/,
    // Windows dash notation: xx-xx-xx-xx-xx-xx
    /[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}/
  ))),

  // ── Generic Primitives ─────────────────────────────────────────────────────
  // word: any alphanumeric token with common separators
  // prec(-20) → fallback — wins only if no more specific token matches
  word: $ => token(prec(-20, /[a-zA-Z0-9._\-\/\+\$\*]+/)),
  _ios_path: $ => token(prec(10, seq(
    /[a-zA-Z0-9\-_]+:/,
    optional(seq(
      optional(/\//),
      /[a-zA-Z0-9_\-\.\/]+/
    ))
  ))),

  // number: sequence of digits — used for AS number, process ID, VLAN ID, etc.
  // prec(-20) to have low priority as fallback
  number: $ => token(prec(-20, /[0-9]+/)),

  // punctuation: single special characters — used in path, crypto, banner, etc.
  punctuation: $ => token(prec(-15, /[,.:;()\[\]{}\-_\/\\|&*+=^%$@!?<>"'~`]/)),

  // ── Free text to EOL ───────────────────────────────────────────────────────
  // Used for description, remark, partial banner body, etc.
  // Does not terminate the newline — that is managed by $._newline
  _text_to_eol: $ => repeat1(choice(
    $.word,
    $.number,
    $.punctuation,
    $.ipv4_address,
    $.ipv6_address,
    $.mac_address,
    $.interface_name,
    /[ \t]+/
  )),

  // Standard Cisco CLI command fallback
  command: $ => prec.dynamic(-110, seq(
    field('trigger', choice($.interface_name, $.word, $.number, $.punctuation)),
    optional(field('text', $.generic_output_line)),
    $._newline
  )),

};
