#ifndef SCANNER_BANNER_H
#define SCANNER_BANNER_H

#include "types.h"
#include "helpers.h"

static bool scan_banner(Scanner *s, TSLexer *lexer, const bool *valid_symbols) {
  if (valid_symbols[BANNER_DELIMITER] || valid_symbols[BANNER_BODY]) {
    /* Skip leading spaces if looking for opening delimiter */
    if (!s->in_banner) {
      while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
        skip_lexer(lexer);
      }
    }

    if (valid_symbols[BANNER_DELIMITER]) {
      if (!s->in_banner) {
        if (!is_eol(lexer->lookahead) && !lexer->eof(lexer)) {
          s->banner_delimiter = lexer->lookahead;
          s->in_banner = true;
          advance_lexer(lexer);

          // Special case: ^C as literal delimiter
          if (s->banner_delimiter == '^' && lexer->lookahead == 'C') {
            advance_lexer(lexer);
          }

          lexer->mark_end(lexer);
          lexer->result_symbol = BANNER_DELIMITER;
          return true;
        }
      } else {
        if (lexer->lookahead == s->banner_delimiter) {
          advance_lexer(lexer);

          // Special case: ^C as literal delimiter
          if (s->banner_delimiter == '^' && lexer->lookahead == 'C') {
            advance_lexer(lexer);
          }

          lexer->mark_end(lexer);
          s->in_banner = false;
          s->banner_delimiter = 0;
          lexer->result_symbol = BANNER_DELIMITER;
          return true;
        }
      }
    }

    if (valid_symbols[BANNER_BODY] && s->in_banner) {
      /* Consume everything until delimiter or EOF */
      bool found_something = false;
      while (!lexer->eof(lexer) && lexer->lookahead != s->banner_delimiter) {
        advance_lexer(lexer);
        found_something = true;
      }
      if (found_something) {
        lexer->mark_end(lexer);
        lexer->result_symbol = BANNER_BODY;
        return true;
      }
    }
  }
  return false;
}

#endif // SCANNER_BANNER_H
