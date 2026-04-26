/**
 * @file Quality of Service (QoS) rules
 */

module.exports = {
  qos_block: $ => prec(200, choice(
    seq(
      field('type', 'class-map'), 
      optional(field('match_type', choice('match-all', 'match-any'))), 
      field('name', $.word), 
      $._newline,
      $._indent,
      repeat(choice(
        seq('match', field('match_val', $.generic_output_line), $._newline),
        $.comment,
        $._newline,
        $.command
      )),
      $._dedent
    ),
    seq(
      field('type', 'policy-map'), 
      field('name', $.word), 
      $._newline,
      $._indent,
      repeat(choice(
        $.qos_policy_class,
        $.comment,
        $._newline,
        $.command
      )),
      $._dedent
    )
  )),

  qos_policy_class: $ => seq(
    'class', field('name', $.word), $._newline,
    $._indent,
    repeat(choice(
      seq(choice('bandwidth', 'priority', 'police', 'shape', 'service-policy'), field('val', $.generic_output_line), $._newline),
      $.comment,
      $._newline,
      $.command
    )),
    $._dedent
  )
};
