#define _CRT_SECURE_NO_WARNINGS

#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "scanner/types.h"
#include "scanner/helpers.h"
#include "scanner/prompt.h"
#include "scanner/network.h"
#include "scanner/noise.h"
#include "scanner/banner.h"
#include "scanner/indent.h"
#include "scanner/output.h"

/* --- Symbol Name Mapping --- */
#ifndef TREE_SITTER_EXTERNAL_SCANNER_PREFIX
#define TREE_SITTER_EXTERNAL_SCANNER_PREFIX tree_sitter_cisco_
#endif

#define CONCAT(a, b) CONCAT_(a, b)
#define CONCAT_(a, b) a ## b
#define EXTERNAL_SCANNER_FN(name) CONCAT(TREE_SITTER_EXTERNAL_SCANNER_PREFIX, external_scanner_ ## name)

/* --- Lifecycle --- */

void *EXTERNAL_SCANNER_FN(create)(void) {
  Scanner *s = (Scanner *)calloc(1, sizeof(Scanner));
  s->indent_stack[0] = 0;
  s->indent_count = 1;
  s->pending_dedents = 0;
  s->in_banner = false;
  s->banner_delimiter = -1;
  return s;
}

void EXTERNAL_SCANNER_FN(destroy)(void *payload) {
  free(payload);
}

unsigned EXTERNAL_SCANNER_FN(serialize)(void *payload,
                                                      char *buffer) {
  Scanner *s = (Scanner *)payload;
  unsigned pos = 0;

  buffer[pos++] = (char)s->indent_count;
  buffer[pos++] = (char)s->pending_dedents;
  buffer[pos++] = (char)(s->in_banner ? 1 : 0);
  buffer[pos++] = (char)(s->in_output ? 1 : 0);

  /* banner_delimiter as 4 bytes little-endian */
  int32_t bd = s->banner_delimiter;
  buffer[pos++] = (char)(bd & 0xFF);
  buffer[pos++] = (char)((bd >> 8) & 0xFF);
  buffer[pos++] = (char)((bd >> 16) & 0xFF);
  buffer[pos++] = (char)((bd >> 24) & 0xFF);

  for (uint8_t i = 0;
       i < s->indent_count && pos + 1 < TREE_SITTER_SERIALIZATION_BUFFER_SIZE;
       i++) {
    buffer[pos++] = (char)(s->indent_stack[i] & 0xFF);
    buffer[pos++] = (char)((s->indent_stack[i] >> 8) & 0xFF);
  }
  return pos;
}

void EXTERNAL_SCANNER_FN(deserialize)(void *payload,
                                                    const char *buffer,
                                                    unsigned length) {
  Scanner *s = (Scanner *)payload;
  /* safe reset */
  s->indent_stack[0] = 0;
  s->indent_count = 1;
  s->pending_dedents = 0;
  s->in_banner = false;
  s->in_output = false;
  s->banner_delimiter = -1;

  if (length < 8)
    return;

  unsigned pos = 0;
  s->indent_count = (uint8_t)(unsigned char)buffer[pos++];
  s->pending_dedents = (uint8_t)(unsigned char)buffer[pos++];
  s->in_banner = (buffer[pos++] != 0);
  s->in_output = (buffer[pos++] != 0);

  int32_t bd = 0;
  bd |= (int32_t)(unsigned char)buffer[pos++];
  bd |= (int32_t)(unsigned char)buffer[pos++] << 8;
  bd |= (int32_t)(unsigned char)buffer[pos++] << 16;
  bd |= (int32_t)(unsigned char)buffer[pos++] << 24;
  s->banner_delimiter = bd;

  if (s->indent_count == 0 || s->indent_count > MAX_INDENT_LEVELS) {
    s->indent_count = 1;
  }
  for (uint8_t i = 0; i < s->indent_count && pos + 1 < length; i++) {
    uint16_t lo = (unsigned char)buffer[pos++];
    uint16_t hi = (unsigned char)buffer[pos++];
    s->indent_stack[i] = lo | (hi << 8);
  }
}

/* --- Main Scan Function --- */

bool EXTERNAL_SCANNER_FN(scan)(void *payload, TSLexer *lexer,
                                             const bool *valid_symbols) {
  Scanner *s = (Scanner *)payload;

  DEBUG_LOG("[SCANNER] Enter scan: col=%u, lookahead='%c' (%d)\n",
            lexer->get_column(lexer),
            (lexer->lookahead >= 32 && lexer->lookahead < 127)
                ? lexer->lookahead
                : '.',
            lexer->lookahead);

  /* 1. Queued DEDENTs */
  if (s->pending_dedents > 0 && valid_symbols[DEDENT]) {
    s->pending_dedents--;
    if (s->indent_count > 1)
      s->indent_count--;
    lexer->result_symbol = DEDENT;
    return true;
  }

  /* 2. IPv4 Family */
  if (scan_ipv4_family(lexer, valid_symbols)) {
    return true;
  }

  /* 3. NEWLINE */
  if (valid_symbols[NEWLINE] &&
      (lexer->lookahead == '\n' || lexer->lookahead == '\r')) {
    if (lexer->lookahead == '\r')
      advance_lexer(lexer);
    if (lexer->lookahead == '\n')
      advance_lexer(lexer);
    lexer->mark_end(lexer);
    lexer->result_symbol = NEWLINE;
    DEBUG_LOG("[SCANNER] Emitting NEWLINE\n");
    return true;
  }

  /* 4. CONSOLE_NOISE & PROMPT (Non-BOL context) */
  if (valid_symbols[CONSOLE_NOISE]) {
    if (scan_console_noise(lexer)) {
      lexer->result_symbol = CONSOLE_NOISE;
      return true;
    }
    if (lexer->get_column(lexer) > 0)
      return false;
  }

  if (valid_symbols[PROMPT_EXEC] || valid_symbols[PROMPT_CONFIG]) {
    if (scan_prompt(lexer, valid_symbols)) {
      lexer->mark_end(lexer);
      return true;
    }
    if (lexer->get_column(lexer) > 0)
      return false;
  }

  /* 5. BANNER */
  if (scan_banner(s, lexer, valid_symbols)) {
    return true;
  }

  /* 6. BOL (Beginning Of Line) Logic */
  if (lexer->get_column(lexer) == 0) {
    /* Skip output sentinels for empty lines UNLESS already in an output block */
    if (is_eol(lexer->lookahead) && !s->in_output) {
      // Allow Indentation handling to proceed for blank lines
    } else {
      if (scan_semaforo(s, lexer, valid_symbols)) {
        return true;
      }
    }

    /* Indentation handling */
    if (scan_indentation(s, lexer, valid_symbols)) {
      return true;
    }

    /* The BULLDOZER */
    if (scan_bulldozer(lexer, valid_symbols)) {
      return true;
    }

    /* Explicit Prompt handling (Semaforo fallback) */
    if (valid_symbols[PROMPT_EXEC] || valid_symbols[PROMPT_CONFIG]) {
      if (scan_prompt(lexer, valid_symbols)) {
        lexer->mark_end(lexer);
        DEBUG_LOG("[SCANNER] Emitting PROMPT through fallback\n");
        return true;
      }
    }

    return false;
  }

  /* 7. EOF with pending indents */
  if (lexer->eof(lexer)) {
    if (valid_symbols[DEDENT] && s->indent_count > 1) {
      s->indent_count--;
      lexer->result_symbol = DEDENT;
      return true;
    }
    return false;
  }

  /* 8. ERROR_MARKER */
  if (valid_symbols[ERROR_MARKER] && lexer->lookahead == '%') {
    while (!is_eol(lexer->lookahead) && !lexer->eof(lexer)) {
      advance_lexer(lexer);
    }
    lexer->mark_end(lexer);
    lexer->result_symbol = ERROR_MARKER;
    return true;
  }

  /* 9. SYSLOG_MSG */
  if (valid_symbols[SYSLOG_MSG] && lexer->lookahead == '*') {
    lexer->mark_end(lexer);
    advance_lexer(lexer);
    bool found_percent = false;
    for (int i = 0; i < 256 && !is_eol(lexer->lookahead) && !lexer->eof(lexer);
         i++) {
      if (lexer->lookahead == '%')
        found_percent = true;
      advance_lexer(lexer);
    }
    if (found_percent) {
      lexer->mark_end(lexer);
      lexer->result_symbol = SYSLOG_MSG;
      return true;
    }
  }

  /* 10. DASHED_LINE */
  if (valid_symbols[DASHED_LINE] &&
      (lexer->lookahead == '-' || lexer->lookahead == '=')) {
    int32_t dash_char = lexer->lookahead;
    int count = 0;
    lexer->mark_end(lexer);
    while (lexer->lookahead == dash_char) {
      advance_lexer(lexer);
      count++;
    }
    if (count >= 4 && is_eol(lexer->lookahead)) {
      lexer->mark_end(lexer);
      lexer->result_symbol = DASHED_LINE;
      return true;
    }
  }

  /* 11. FIELD_SEPARATOR */
  if (valid_symbols[FIELD_SEPARATOR] && lexer->lookahead == ' ') {
    int count = 0;
    while (lexer->lookahead == ' ') {
      advance_lexer(lexer);
      count++;
    }
    if (count >= 2 && !is_eol(lexer->lookahead)) {
      lexer->mark_end(lexer);
      lexer->result_symbol = FIELD_SEPARATOR;
      return true;
    }
  }

  return false;
}
