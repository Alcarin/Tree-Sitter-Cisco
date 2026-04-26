/**
 * @file VLAN configuration rules
 */

module.exports = {
  _kw_vlan: $ => token(prec(100, /[Vv][Ll][Aa][Nn]/)),

  vlan_block: $ => prec(200, seq(
    $._kw_vlan, 
    field('id', choice($.number, $.word)), // word for ranges or names in some contexts
    $._newline,
    optional(seq(
      $._indent,
      repeat(choice(
        seq('name', field('name', $.word), $._newline),
        $.comment,
        $._newline,
        $.command
      )),
      $._dedent
    ))
  ))
};
