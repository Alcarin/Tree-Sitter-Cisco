/**
 * @file Cisco configuration grammar for tree-sitter
 * @author Alcarin
 * @license ISC
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'cisco',

  extras: $ => [], // Gestiamo gli spazi esplicitamente

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.comment,
      $.command,
      $._newline
    ),

    comment: $ => seq(
      optional(/[ \t]+/),
      '!',
      /.*/,
      $._newline
    ),

    command: $ => seq(
      field('indentation', optional(/[ \t]+/)),
      field('text', $._line_content),
      $._newline
    ),

    _line_content: $ => /[^!\n\r\s][^\n\r]*/,

    _newline: $ => /\r?\n/
  }
});
