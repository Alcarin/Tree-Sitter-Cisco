/**
 * @file System and Global configuration rules
 */

module.exports = {
  // Local Keywords
  _kw_hostname: $ => token(prec(100, choice('hostname', 'host'))),
  _kw_username: $ => token(prec(100, choice('username', 'user'))),
  _kw_ip: $ => token(prec(100, /[Ii][Pp]/)),

  system_config: $ => choice(
    $.hostname_config,
    $.banner_config,
    $.aaa_config,
    $.username_config,
    $.prefix_list,
    $.ntp_config,
    $.logging_config,
    $.vrf_definition_legacy,
    $.vrf_definition_block,
    $.vtp_config,
    $.snmp_config,
    $.ssh_config,
    $.boot_config,
    $.crypto_config,
    $.static_route
  ),

  hostname_config: $ => seq(
    $._kw_hostname, field('name', choice($.interface_name, $.word)), $._newline
  ),

  banner_config: $ => seq(
    'banner', field('type', choice('motd', 'login', 'exec', $.word)),
    $._banner_trigger,
    $._banner_delimiter,
    optional(field('content', alias($._banner_body, $.banner_text))),
    $._banner_delimiter,
    $._newline
  ),

  aaa_config: $ => seq(
    'aaa', field('type', $.word), optional(field('subtype', $.word)), repeat(field('option', $.word)), $._newline
  ),

  username_config: $ => prec(100, seq(
    $._kw_username, field('name', $.word),
    repeat(choice(
      seq('privilege', field('privilege', $.number)),
      seq(choice('secret', 'password'), optional(field('encryption_type', $.number)), field('password', $.word)),
      seq('description', field('description', $.word)),
      $.word,
      $.number
    )),
    $._newline
  )),

  prefix_list: $ => seq(
    $._kw_ip, 'prefix-list', field('name', $.word),
    optional(seq('seq', field('sequence', $.number))),
    field('action', alias(choice('permit', 'deny'), $.acl_action)),
    field('prefix', prec(300, $.ipv4_address)),
    optional(seq('/', field('length', $.number))),
    optional(seq('ge', field('ge', $.number))),
    optional(seq('le', field('le', $.number))),
    $._newline
  ),

  ntp_config: $ => seq(
    'ntp', field('type', $.word), field('address', choice(prec(300, $.ipv4_address), $.interface_name, $.word)), $._newline
  ),

  logging_config: $ => seq(
    'logging', choice(
      seq('host', field('host', choice(prec(300, $.ipv4_address), $.word))),
      seq('trap', field('level', $.word)),
      repeat1(field('option', $.word))
    ),
    $._newline
  ),

  vrf_definition_legacy: $ => seq(
    $._kw_ip, 'vrf', field('name', $.word), $._newline
  ),

  vrf_definition_block: $ => prec(200, seq(
    'vrf', 'definition', field('name', $.word), $._newline,
    $._indent,
    repeat(choice(
      $.vrf_rd,
      seq('address-family', field('proto', choice('ipv4', 'ipv6')), $._newline),
      'exit-address-family',
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent
  )),

  vrf_rd: $ => seq('rd', field('rd', $.word), $._newline),
  vtp_config: $ => seq(
    'vtp', field('feature', $.word), field('option', $.word), $._newline
  ),

  snmp_config: $ => prec(100, seq(
    'snmp-server', 
    field('feature', $.word),
    repeat(field('option', choice($.word, $.number, prec(300, $.ipv4_address), $.punctuation))), 
    $._newline
  )),

  ssh_config: $ => seq(
    $._kw_ip, 'ssh', repeat1($.word), $._newline
  ),

  boot_config: $ => seq(
    'boot', repeat1(choice($.word, $.punctuation)), $._newline
  ),

  crypto_config: $ => seq(
    'crypto', repeat1(choice($.word, $.punctuation, $.number)), $._newline
  )
};
