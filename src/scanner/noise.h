#ifndef SCANNER_NOISE_H
#define SCANNER_NOISE_H

#include "types.h"
#include "helpers.h"

/*
 * Recognizes console noise (--More--, [confirm], etc.)
 */
static bool scan_console_noise(TSLexer *lexer) {
  int32_t c = lexer->lookahead;
  /* --More-- */
  if (c == '-') {
    lexer->mark_end(lexer);
    advance_lexer(lexer);
    if (lexer->lookahead == '-') {
      advance_lexer(lexer);
      const char *more = "More--";
      for (int i = 0; more[i]; i++) {
        if (lexer->lookahead != more[i])
          return false;
        advance_lexer(lexer);
      }
      lexer->mark_end(lexer);
      return true;
    }
  }
  /* [confirm] or [OK] */
  if (c == '[') {
    lexer->mark_end(lexer);
    advance_lexer(lexer);
    for (int i = 0; i < 20 && !is_eol(lexer->lookahead); i++) {
      if (lexer->lookahead == ']') {
        advance_lexer(lexer);
        lexer->mark_end(lexer);
        return true;
      }
      advance_lexer(lexer);
    }
  }
  return false;
}

#endif // SCANNER_NOISE_H
