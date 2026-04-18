/**
 * @file Common primitives for Cisco grammar - High Precision Anti-Conflict
 */

module.exports = {
  ipv4_address: $ => token(prec(100, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)),
  
  ipv6_address: $ => token(prec(100, choice(
    /([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d+)?/,
    /([0-9a-fA-F]{1,4}:){1,7}:(\/\d+)?/,
    /([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}(\/\d+)?/,
    /([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}(\/\d+)?/,
    /([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}(\/\d+)?/,
    /([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}(\/\d+)?/,
    /([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}(\/\d+)?/,
    /[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})(\/\d+)?/,
    /:(:[0-9a-fA-F]{1,4}){1,7}(\/\d+)?/,
    /::(\/\d+)?/
  ))),

  interface_name: $ => token(prec(100, choice(
    /(Ethernet|GigabitEthernet|TenGigabitEthernet|FastEthernet|FourtyGigabitEthernet|HundredGigabitEthernet|Serial|Tunnel|Loopback|Vlan|Port-channel|BVI|Dialer|Embedded-Service-Engine|Group-Async|MFR|Multilink|Virtual-Template|Virtual-TokenRing)\s*\d+([./]\d+)*/,
    /Management\d+([./]\d+)*/,
    /(Eth|Gi|Te|Fa|Gig)\s*\d+([./]\d+)*/
  ))),

  mac_address: $ => token(prec(100, choice(
    /[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}/,
    /([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}/,
    /([0-9a-fA-F]{2}-){5}[0-9a-fA-F]{2}/
  ))),

  vlan_range: $ => token(prec(100, seq(/\d+/, repeat1(seq(choice(',', '-'), /\d+/))))),
  
  number: $ => token(prec(10, /\d+/)),
  
  uptime: $ => seq(
    $.number,
    choice(/years?/, /months?/, /weeks?/, /days?/, /hours?/, /minutes?/, /seconds?/),
    repeat(seq(
      optional(','),
      $.number,
      choice(/years?/, /months?/, /weeks?/, /days?/, /hours?/, /minutes?/, /seconds?/)
    ))
  ),
  
  word: $ => token(prec(1, /[a-zA-Z0-9._\/\-]+/)),

  wildcard: $ => token(prec(10, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)),
  
  string: $ => token(choice(
    seq('"', /[^"]*/, '"'),
    seq("'", /[^']*/, "'")
  )),
  
  punctuation: $ => token(prec(1, /[.,:;]/)),
  text: $ => token(prec(1, /[a-zA-Z0-9._\/!@#$%\-:/()+]+/)),
  operator: $ => token(/[<>=]/)
};
