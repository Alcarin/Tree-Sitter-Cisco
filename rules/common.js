/**
 * @file Common primitives for Cisco grammar
 */

module.exports = {
  ipv4_address: $ => token(prec(2, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)),
  
  ipv6_address: $ => token(prec(2, choice(
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

  interface_name: $ => token(prec(2, choice(
    /(Ethernet|GigabitEthernet|TenGigabitEthernet|FastEthernet|FourtyGigabitEthernet|HundredGigabitEthernet)\d+([./]\d+)*/,
    /(Vlan|Port-channel|Loopback|Tunnel|BVI|Dialer|Embedded-Service-Engine|Group-Async|MFR|Multilink|Serial|Virtual-Template|Virtual-TokenRing)\d+/,
    /Management\d+([./]\d+)*/,
    /Eth\d+([./]\d+)*/,
    /Gi\d+([./]\d+)*/,
    /Te\d+([./]\d+)*/,
    /Fa\d+([./]\d+)*/
  ))),

  mac_address: $ => token(prec(2, choice(
    /[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}/,
    /([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}/,
    /([0-9a-fA-F]{2}-){5}[0-9a-fA-F]{2}/
  ))),

  vlan_range: $ => token(prec(2, seq(/\d+/, repeat1(seq(choice(',', '-'), /\d+/))))),
  
  number: $ => token(prec(1, /\d+/)),
  
  uptime: $ => token(prec(1, /\d+\s+(weeks?|days?|hours?|minutes?|seconds?)(,\s+\d+\s+(weeks?|days?|hours?|minutes?|seconds?))*/)),
  
  // Word ora è più inclusivo per catturare hostname, maschere /, liste e versioni con parentesi
  word: $ => token(prec(-1, /[a-zA-Z0-9._\/!@#$%\-:,/()+]+/)),
  
  wildcard: $ => token(prec(2, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)),
  
  string: $ => token(choice(
    seq('"', /[^"]*/, '"'),
    seq("'", /[^']*/, "'")
  )),
  
  punctuation: $ => token(/[.,:;]/),
  operator: $ => token(/[<>=]/)
};
