#ifndef SCANNER_OUTPUT_H
#define SCANNER_OUTPUT_H

#include "types.h"
#include "helpers.h"
#include "prompt.h"

static bool scan_semaforo(Scanner *s, TSLexer *lexer, const bool *valid_symbols) {
  /* Case C: Output State Machine (Semaforo) - MUST BE FIRST AT BOL */
  // CRITICAL: Mark end immediately to ensure zero-length sentinels.
  // Any characters read by scan_prompt will NOT be consumed.
  lexer->mark_end(lexer);

  bool next_is_prompt = scan_prompt(lexer, valid_symbols);

  // 1. Fine dell'Output: Vediamo un prompt ma credevamo di essere in output
  if (next_is_prompt && s->in_output && valid_symbols[OUTPUT_END]) {
    s->in_output = false; // Reset stato
    lexer->result_symbol = OUTPUT_END;
    DEBUG_LOG("[SCANNER] BOL: Emitting OUTPUT_END\n");
    return true;
  }

  // 2. Continuazione: Non c'è un prompt (o è una riga speciale in output) e siamo già in un blocco output
  if (!next_is_prompt && s->in_output && valid_symbols[OUTPUT_CONTINUE]) {
    lexer->result_symbol = OUTPUT_CONTINUE;
    return true;
  }

  // 3. Inizio Output: Vediamo che NON c'è un prompt all'inizio della riga
  if (!next_is_prompt && !s->in_output && valid_symbols[OUTPUT_START]) {
    s->in_output = true;
    lexer->result_symbol = OUTPUT_START;
    DEBUG_LOG("[SCANNER] BOL: Emitting OUTPUT_START\n");
    return true;
  }

  return false;
}

static bool scan_bulldozer(TSLexer *lexer, const bool *valid_symbols) {
  /* Case D: The BULLDOZER (OUTPUT_BLOCK_CONTENT) */
  if (valid_symbols[OUTPUT_BLOCK_CONTENT]) {
    bool found_content = false;

    // If we are already at a prompt, we can return an empty content
    // as a valid "no-output" block to satisfy mandatory fields.
    if (lexer->get_column(lexer) == 0 && scan_prompt(lexer, valid_symbols)) {
      lexer->mark_end(lexer);
      lexer->result_symbol = OUTPUT_BLOCK_CONTENT;
      return true;
    }

    while (!lexer->eof(lexer)) {
      // If at BOL, check for prompt
      if (lexer->get_column(lexer) == 0) {
        lexer->mark_end(lexer);
        if (scan_prompt(lexer, valid_symbols)) {
          if (found_content) {
            lexer->result_symbol = OUTPUT_BLOCK_CONTENT;
            return true;
          }
          return false;
        }
      }

      // Consume current line until EOL
      while (!is_eol(lexer->lookahead) && !lexer->eof(lexer)) {
        advance_lexer(lexer);
        found_content = true;
      }

      // Mark end before newline (or at EOF)
      lexer->mark_end(lexer);

      // Consume newline to move to next line
      if (is_eol(lexer->lookahead)) {
        if (lexer->lookahead == '\r')
          advance_lexer(lexer);
        if (lexer->lookahead == '\n')
          advance_lexer(lexer);
      } else if (lexer->eof(lexer)) {
        break;
      }
    }

    if (found_content) {
      lexer->result_symbol = OUTPUT_BLOCK_CONTENT;
      return true;
    }
  }
  return false;
}

#endif // SCANNER_OUTPUT_H
