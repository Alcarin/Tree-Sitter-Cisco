#ifndef SCANNER_HELPERS_H
#define SCANNER_HELPERS_H

#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

static bool is_debug_enabled = false;
static bool debug_initialized = false;

#define DEBUG_LOG(...) \
    do { \
        if (!debug_initialized) { \
            is_debug_enabled = (getenv("DEBUG_SCANNER") != NULL); \
            debug_initialized = true; \
        } \
        if (is_debug_enabled) { \
            fprintf(stderr, __VA_ARGS__); \
        } \
    } while (0)

/* --- Helpers --- */

static void advance_lexer(TSLexer *lexer) { lexer->advance(lexer, false); }
static void skip_lexer(TSLexer *lexer) { lexer->advance(lexer, true); }

static bool is_eol(int32_t c) { return c == '\n' || c == '\r' || c == 0; }

/* Advances consuming \r?\n, returns true if it consumed at least one character */
static bool consume_eol(TSLexer *lexer) {
  bool consumed = false;
  if (lexer->lookahead == '\r') {
    advance_lexer(lexer);
    consumed = true;
  }
  if (lexer->lookahead == '\n') {
    advance_lexer(lexer);
    consumed = true;
  }
  return consumed;
}

static bool is_alphanumeric(int32_t c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
         (c >= '0' && c <= '9');
}

static bool is_valid_hostname_char(int32_t c) {
  return is_alphanumeric(c) || c == '-' || c == '_' || c == '.';
}

#endif // SCANNER_HELPERS_H
