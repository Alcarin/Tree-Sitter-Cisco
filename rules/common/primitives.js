/**
 * @file Primitives universali per dispositivi Cisco (IOS, XR, ASA, ecc.)
 */

module.exports = {
  // --- IDENTIFICATORI GENERICI ---
  // word: fallback per qualsiasi stringa alfanumerica
  word: $ => token(prec(-20, /[a-zA-Z0-9._\-\/:\+\$\*]+/)),

  // number: sequenza di cifre
  number: $ => token(prec(-20, /[0-9]+/)),

  // punctuation: caratteri speciali singoli
  punctuation: $ => token(prec(-15, /[,.:;()\[\]{}\-_\/\\|&*+=^%$@!?<>"'~`]/)),

  // IPv4 Address
  ipv4_address: $ => token(prec(100, /([0-9]{1,3}\.){3}[0-9]{1,3}/)),

  // IPv6 address
  ipv6_address: $ => token(prec(150, choice(
    /([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/,
    /([0-9a-fA-F]{1,4}:){1,7}:/,
    /([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}/,
    /([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}/,
    /([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}/,
    /([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}/,
    /([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}/,
    /[0-9a-fA-F]{1,4}:(:[0-9a-fA-F]{1,4}){1,6}/,
    /:(:[0-9a-fA-F]{1,4}){1,7}/,
    /::/,
    /[Ff][Ee]80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+/,
    /([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}\/[0-9]{1,3}/,
    /([0-9a-fA-F]{1,4}:)*:[0-9a-fA-F]{1,4}\/[0-9]{1,3}/,
    /::\/[0-9]{1,3}/
  ))),

  // MAC Address
  mac_address: $ => token(prec(100, choice(
    /[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}/,
    /[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}/,
    /[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}/
  ))),

  // --- NOMI DI INTERFACCIA ---
  // Riconosce abbreviazioni comuni (Gi, Fa, Te, ecc.)
  interface_name: $ => token(prec(100, seq(
    choice(
      /[Gg][Ii]([Gg][Aa][Bb][Ii][Tt][Ee][Tt][Hh][Ee][Rr][Nn][Ee][Tt])?/,
      /[Tt][Ee]([Nn][Gg][Ii][Gg][Aa][Bb][Ii][Tt][Ee][Tt][Hh][Ee][Rr][Nn][Ee][Tt])?/,
      /[Ff][Aa]([Ss][Tt][Ee][Tt][Hh][Ee][Rr][Nn][Ee][Tt])?/,
      /[Ee][Tt]([Hh][Ee][Rr][Nn][Ee][Tt])?/,
      /[Vv][Ll]([Aa][Nn])?/,
      /[Ll][Oo]([Oo][Pp][Bb][Aa][Cc][Kk])?/,
      /[Pp][Oo]([Rr][Tt]-[Cc][Hh][Aa][Nn][Nn][Ee][Ll])?/,
      /[Tt][Uu]([Nn][Nn][Ee][Ll])?/,
      /[Ss][Ee]([Rr][Ii][Aa][Ll])?/,
      /[Mm][Gg][Mm][Tt]([Aa][Nn][Aa][Gg][Ee][Mm][Ee][Nn][Tt])?/,
      /[Bb][Vv][Ii]/,
      /[Aa][Tt][Mm]?/,
      /[Dd][Ii]([Aa][Ll][Ee][Rr])?/,
      /[Mm][Uu]([Ll][Tt][Ii][Ll][Ii][Nn][Kk])?/,
      /[Nn][Uu][Ll][Ll]/,
      /[Ee][Ss][Ee]/
    ),
    optional(/[ \t]+/),
    /[0-9]+([\/][0-9]+)*(\.([0-9]+))?/,
    optional(/[a-zA-Z0-9\-_]/)
  ))),
};
