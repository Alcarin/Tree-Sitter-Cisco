#ifndef SCANNER_INDENT_H
#define SCANNER_INDENT_H

#include "types.h"
#include "helpers.h"

static bool scan_indentation(Scanner *s, TSLexer *lexer, const bool *valid_symbols) {
  uint16_t col = 0;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    if (lexer->lookahead == '\t')
      col = (uint16_t)((col / 8 + 1) * 8);
    else
      col++;
    skip_lexer(lexer);
  }

  /* Case A: Empty line or comment -> return false */
  if (lexer->eof(lexer) || is_eol(lexer->lookahead) ||
      lexer->lookahead == '!') {
    if (lexer->eof(lexer) && valid_symbols[DEDENT] && s->indent_count > 1) {
      s->indent_count--;
      lexer->result_symbol = DEDENT;
      return true;
    }
    return false;
  }

  /* Case B: BOL with content -> handle INDENT/DEDENT */
  if (valid_symbols[INDENT] || valid_symbols[DEDENT]) {
    uint16_t top = s->indent_stack[s->indent_count - 1];

    if (col > top) {
      if (valid_symbols[INDENT]) {
        s->indent_stack[s->indent_count++] = col;
        lexer->result_symbol = INDENT;
        return true;
      }
    } else if (col < top) {
      uint8_t pops = 0;
      while (s->indent_count > 1 &&
             s->indent_stack[s->indent_count - 1] > col) {
        s->indent_count--;
        pops++;
      }
      if (pops > 0 && valid_symbols[DEDENT]) {
        if (pops > 1)
          s->pending_dedents = pops - 1;
        lexer->result_symbol = DEDENT;
        return true;
      }
    }
  }
  return false;
}

#endif // SCANNER_INDENT_H
