/**
 * @file Security configuration rules (ACL, Object-Groups, etc.)
 */

module.exports = {
  // Local Keywords
  _kw_ip: $ => token(prec(100, /[Ii][Pp]/)),
  _kw_ipv6: $ => token(prec(100, /[Ii][Pp][Vv]6/)),

  acl_block: $ => prec(200, choice(
    seq(
      choice($._kw_ip, $._kw_ipv6), 
      'access-list', 
      choice(
        seq(field('type', 'standard'), field('name', choice($.word, $.number)), $._newline, 
          $._indent,
          repeat(choice(
            $.acl_remark_rule,
            $.acl_standard_rule,
            $.comment,
            $._newline,
            $.command
          )),
          $._dedent
        ),
        seq(field('type', 'extended'), field('name', choice($.word, $.number)), $._newline, 
          $._indent,
          repeat(choice(
            $.acl_remark_rule,
            $.acl_extended_rule,
            $.comment,
            $._newline,
            $.command
          )),
          $._dedent
        )
      )
    ),
    seq(
      $._kw_ipv6, 'access-list', field('name', $.word), $._newline,
      $._indent,
      repeat(choice(
        $.comment,
        $._newline,
        $.command
      )),
      $._dedent
    )
  )),

  acl_numbered: $ => prec(200, seq(
    'access-list',
    field('name', $.number),
    choice(
      $.acl_remark_rule,
      $.acl_standard_rule,
      $.acl_extended_rule
    )
  )),

  acl_remark_rule: $ => seq(
    optional(field('sequence', $.number)), 
    field('action', 'remark'),
    field('remark_text', alias($._text_to_eol, $.text)),
    $._newline
  ),
  
  acl_standard_rule: $ => seq(
    optional(field('sequence', $.number)), 
    field('action', choice('permit', 'perm', 'deny', 'den')),
    choice(
          field('source', 'any'),
          seq(field('source_host_kw', 'host'), field('source_host', choice(prec(300, $.ipv4_address), $.ipv6_address))),
          seq(field('source_network', choice(prec(300, $.ipv4_address), $.ipv6_address)), field('source_wildcard', choice(prec(300, $.wildcard_mask), prec(300, $.subnet_mask), prec(300, $.ipv4_address)))),
          field('source_host', choice(prec(300, $.ipv4_address), $.ipv6_address))
        ),
    optional(field('log', choice('log', 'log-input'))),
    $._newline
  ),
  
  acl_extended_rule: $ => seq(
    optional(field('sequence', $.number)), 
    field('action', choice('permit', 'perm', 'deny', 'den')),
    field('protocol', choice($._kw_ip, $._kw_ipv6, 'tcp', 'udp', 'icmp', 'igmp', 'gre', 'esp', 'ah', 'ospf', 'eigrp', $.word, $.number)), 
    $.acl_source,
    optional($.acl_src_operator_port),
    $.acl_destination,
    repeat(choice(
      $.acl_operator_port,
      field('option', choice('established', 'log', 'log-input', 'dscp', 'precedence', $.word))
    )),
    $._newline
  ),

  acl_operator_port: $ => prec.left(1, seq(
    field('operator', choice('eq', 'neq', 'gt', 'lt', 'range')), 
    repeat1(field('port', choice($.word, $.number)))
  )),

  acl_src_operator_port: $ => prec.left(1, seq(
    field('src_operator', choice('eq', 'neq', 'gt', 'lt', 'range')), 
    repeat1(field('src_port', choice($.word, $.number)))
  )),

  acl_source: $ => choice(
    field('source', 'any'),
    seq(field('source_host_kw', 'host'), field('source_host', choice(prec(300, $.ipv4_address), $.ipv6_address))),
    prec(1, seq(field('source_network', choice(prec(300, $.ipv4_address), $.ipv6_address)), field('source_wildcard', choice(prec(300, $.wildcard_mask), prec(300, $.subnet_mask), prec(300, $.ipv4_address))))),
    seq(field('source_object_group_kw', 'object-group'), field('source_object_group', $.word)),
    field('source_host', choice(prec(300, $.ipv4_address), $.ipv6_address))
  ),

  acl_destination: $ => choice(
    field('destination', 'any'),
    seq(field('destination_host_kw', 'host'), field('destination_host', choice(prec(300, $.ipv4_address), $.ipv6_address))),
    prec(1, seq(field('destination_network', choice(prec(300, $.ipv4_address), $.ipv6_address)), field('destination_wildcard', choice(prec(300, $.wildcard_mask), prec(300, $.subnet_mask), prec(300, $.ipv4_address))))),
    seq(field('destination_object_group_kw', 'object-group'), field('destination_object_group', $.word)),
    field('destination_host', choice(prec(300, $.ipv4_address), $.ipv6_address))
  ),

  acl_action: $ => choice('permit', 'perm', 'deny', 'den'),
  
  object_group_block: $ => prec(200, seq(
    'object-group', 
    field('type', choice('network', 'service', 'protocol', 'icmp-type')), 
    field('name', $.word), 
    optional(field('protocol', choice('tcp', 'udp', 'tcp-udp', $.word))),
    $._newline, 
    $._indent,
    repeat(choice(
      prec(10, $.network_object), 
      prec(10, $.port_object), 
      $.comment, 
      $._newline,
      $.command
    )),
    $._dedent
  )),
  
  network_object: $ => seq(
    optional('network-object'),
    choice(
      seq(field('host_kw', 'host'), field('address', choice(prec(300, $.ipv4_address), $.ipv6_address))), 
      seq(field('address', choice(prec(300, $.ipv4_address), $.ipv6_address)), field('mask', choice(prec(300, $.subnet_mask), prec(300, $.wildcard_mask), prec(300, $.ipv4_address)))),
      field('object', choice('any', $.word))
    ), 
    $._newline
  ),
  
  port_object: $ => seq(
    optional('port-object'),
    field('operator', choice('eq', 'neq', 'gt', 'lt', 'range')), 
    repeat1(field('port', choice($.word, $.number))), 
    $._newline
  )
};
