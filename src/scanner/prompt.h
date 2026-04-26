#ifndef SCANNER_PROMPT_H
#define SCANNER_PROMPT_H

#include "types.h"
#include "helpers.h"

static bool scan_prompt(TSLexer *lexer, const bool *valid_symbols) {
  if (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
      lexer->lookahead == '!')
    return false;
  if (!is_alphanumeric(lexer->lookahead))
    return false;

  bool has_hostname = false;
  while (is_valid_hostname_char(lexer->lookahead)) {
    advance_lexer(lexer);
    has_hostname = true;
  }
  if (!has_hostname)
    return false;

  bool has_parens = false;
  if (lexer->lookahead == '(') {
    has_parens = true;
    advance_lexer(lexer);
    while (lexer->lookahead != ')' && lexer->lookahead != 0 &&
           !is_eol(lexer->lookahead)) {
      advance_lexer(lexer);
    }
    if (lexer->lookahead == ')')
      advance_lexer(lexer);
    else
      return false;
  }

  if (lexer->lookahead == '#' || lexer->lookahead == '>' ||
      lexer->lookahead == ']') {
    advance_lexer(lexer);
    // NOTE: We don't call mark_end here because scan_prompt is used as a
    // lookahead by the Bulldozer. The caller must call mark_end if it intends
    // to produce a prompt token. A prompt is CONFIG only if it had parentheses
    // before the final symbol
    if (has_parens && valid_symbols[PROMPT_CONFIG]) {
      lexer->result_symbol = PROMPT_CONFIG;
    } else {
      lexer->result_symbol = PROMPT_EXEC;
    }
    return true;
  }

  return false;
}

#endif // SCANNER_PROMPT_H
