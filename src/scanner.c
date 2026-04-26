/*
 * scanner.c - Tree-Sitter Cisco External Scanner
 *
 * TOKEN CONTRACT (CRITICAL order — must match externals[] in grammar.js):
 *
 *  0  INDENT              Indentation level increase (BOL)
 *  1  DEDENT              Indentation level decrease (BOL)
 *  2  NEWLINE             \n or \r\n
 *  3  OUTPUT_BLOCK_CONTENT The "Bulldozer": captures output until next prompt
 *  4  PROMPT_EXEC         hostname# or hostname>
 *  5  PROMPT_CONFIG       hostname(config[-xxx])#
 *  6  ERROR_MARKER        Lines starting with %
 *  7  SYSLOG_MSG          *timestamp: %FACILITY-SEV-MNEM:
 *  8  CONSOLE_NOISE       --More--, [confirm], etc.
 *  9  FIELD_SEPARATOR     2+ spaces (tabular data)
 * 10  DASHED_LINE         Separation line (----)
 * 11  BANNER_DELIMITER    Banner delimiter
 * 12  BANNER_BODY         Banner content
 * 13  OUTPUT_START        Sentinel: output starts
 * 14  OUTPUT_NONE         Sentinel: no output
 * 15  SUBNET_MASK         Subnet mask (255.255.255.0)
 * 16  WILDCARD_MASK       Wildcard mask (0.0.0.255)
 * 17  INVALID_IP          IP out of range
 * 18  BANNER_TRIGGER      Banner logic trigger
 *
 * FUNDAMENTAL RULE: OUTPUT_BLOCK_CONTENT stops only at a prompt at the start of
 * a line.
 */

#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

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

/* --- Token enum (MUST match order in grammar.js externals[]) --- */
enum TokenType {
  INDENT,
  DEDENT,
  NEWLINE,
  OUTPUT_BLOCK_CONTENT,
  PROMPT_EXEC,
  PROMPT_CONFIG,
  ERROR_MARKER,
  SYSLOG_MSG,
  CONSOLE_NOISE,
  FIELD_SEPARATOR,
  DASHED_LINE,
  BANNER_DELIMITER,
  BANNER_BODY,
  OUTPUT_START,
  OUTPUT_CONTINUE,
  OUTPUT_END,
  OUTPUT_NONE,
  SUBNET_MASK,
  WILDCARD_MASK,
  INVALID_IP,
  BANNER_TRIGGER,
  TOKEN_COUNT
};

/* --- State Machine --- */
#define MAX_INDENT_LEVELS 64

typedef struct {
  uint16_t indent_stack[MAX_INDENT_LEVELS];
  uint8_t indent_count;
  uint8_t pending_dedents;
  bool in_banner;
  int32_t banner_delimiter; /* character that closes the current banner */
  bool in_output;           /* Track if we are inside an output block */
} Scanner;

/* --- Helper Prototypes --- */
static void advance_lexer(TSLexer *lexer);
static void skip_lexer(TSLexer *lexer);
static bool is_eol(int32_t c);
static bool is_alphanumeric(int32_t c);
static bool is_valid_hostname_char(int32_t c);
static bool scan_prompt(TSLexer *lexer, const bool *valid_symbols);
static bool scan_console_noise(TSLexer *lexer);
static bool scan_ipv4_or_mask(TSLexer *lexer, const bool *valid_symbols);
static bool scan_output_block(TSLexer *lexer, const bool *valid_symbols);

/* --- Lifecycle --- */

void *tree_sitter_cisco_external_scanner_create(void) {
  Scanner *s = (Scanner *)calloc(1, sizeof(Scanner));
  s->indent_stack[0] = 0;
  s->indent_count = 1;
  s->pending_dedents = 0;
  s->in_banner = false;
  s->banner_delimiter = -1;
  return s;
}

void tree_sitter_cisco_external_scanner_destroy(void *payload) {
  free(payload);
}

unsigned tree_sitter_cisco_external_scanner_serialize(void *payload,
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

void tree_sitter_cisco_external_scanner_deserialize(void *payload,
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

/* --- Helpers --- */

static void advance_lexer(TSLexer *lexer) { lexer->advance(lexer, false); }
static void skip_lexer(TSLexer *lexer) { lexer->advance(lexer, true); }

static bool is_eol(int32_t c) { return c == '\n' || c == '\r' || c == 0; }

/* Advances consuming \r?\n, returns true if it consumed at least one character
 */
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

/* Validates subnet mask: contiguous 1 bits from left then 0s */
static bool is_subnet_mask(uint32_t ip) {
  if (ip == 0)
    return true; /* 0.0.0.0 is valid as mask */
  if (ip == 0xFFFFFFFF)
    return true; /* 255.255.255.255 */
  /* bit sequence must be: a sequence of 1s followed by a sequence of 0s */
  /* invert and add 1: must be a power of 2 */
  uint32_t inv = ~ip;
  return (inv & (inv + 1)) == 0;
}

/* Validates wildcard mask: contiguous 0 bits from left then 1s (inverse of
 * subnet) */
static bool is_wildcard_mask(uint32_t ip) {
  if (ip == 0)
    return true; /* 0.0.0.0 is valid as wildcard */
  if (ip == 0xFFFFFFFF)
    return true; /* 255.255.255.255 */
  return (ip & (ip + 1)) == 0;
}

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

/* --- Main Scan Function --- */

bool tree_sitter_cisco_external_scanner_scan(void *payload, TSLexer *lexer,
                                             const bool *valid_symbols) {
  Scanner *s = (Scanner *)payload;

  DEBUG_LOG("[SCANNER] Enter scan: col=%u, lookahead='%c' (%d)\n",
            lexer->get_column(lexer),
            (lexer->lookahead >= 32 && lexer->lookahead < 127)
                ? lexer->lookahead
                : '.',
            lexer->lookahead);

  /* ============================================================
   * 1. Queued DEDENTs (pending from previous processing)
   * ============================================================ */
  if (s->pending_dedents > 0 && valid_symbols[DEDENT]) {
    s->pending_dedents--;
    if (s->indent_count > 1)
      s->indent_count--;
    lexer->result_symbol = DEDENT;
    return true;
  }

  /* ============================================================
   * 2. IPv4 Family (ABSOLUTE Priority)
   * ============================================================ */
  if (lexer->lookahead >= '0' && lexer->lookahead <= '9') {
    uint32_t octets[4] = {0, 0, 0, 0};
    bool valid_format = true;
    bool out_of_range = false;

    lexer->mark_end(lexer);

    for (int i = 0; i < 4; i++) {
      if (lexer->lookahead < '0' || lexer->lookahead > '9') {
        valid_format = false;
        break;
      }
      uint32_t val = 0;
      int digits = 0;
      while (lexer->lookahead >= '0' && lexer->lookahead <= '9') {
        val = val * 10 + (uint32_t)(lexer->lookahead - '0');
        advance_lexer(lexer);
        digits++;
        if (digits > 3) {
          valid_format = false;
          break;
        }
      }
      if (!valid_format)
        break;
      if (val > 255)
        out_of_range = true;
      octets[i] = val;
      if (i < 3) {
        if (lexer->lookahead != '.') {
          valid_format = false;
          break;
        }
        advance_lexer(lexer);
      }
    }

    if (valid_format) {
      int32_t next = lexer->lookahead;
      bool boundary = !(next >= '0' && next <= '9') && next != '.';
      if (boundary) {
        lexer->mark_end(lexer);
        uint32_t ip32 = (octets[0] << 24) | (octets[1] << 16) |
                        (octets[2] << 8) | octets[3];

        if (out_of_range && valid_symbols[INVALID_IP]) {
          lexer->result_symbol = INVALID_IP;
          return true;
        }
        if (!out_of_range) {
          if (valid_symbols[SUBNET_MASK] && is_subnet_mask(ip32)) {
            lexer->result_symbol = SUBNET_MASK;
            return true;
          }
          if (valid_symbols[WILDCARD_MASK] && is_wildcard_mask(ip32)) {
            lexer->result_symbol = WILDCARD_MASK;
            return true;
          }
        }
      }
    }
  }

  /* ============================================================
   * 3. NEWLINE (Moved here for safety)
   *    Must be checked BEFORE any scanner that advances.
   * ============================================================ */
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

  /* ============================================================
   * 4. PROMPT_EXEC / PROMPT_CONFIG / CONSOLE_NOISE
   *    Maximum priority for structural anchors.
   * ============================================================ */
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
    /* If we are here, scan_prompt failed. If it advanced the lexer,
       we must return false to allow rewind. */
    if (lexer->get_column(lexer) > 0)
      return false;
  }

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

  /* ============================================================
   * 5. INDENT / DEDENT / WHITESPACE
   *    Unified management of BOL and mid-line spaces.
   * ============================================================ */
  bool at_bol = (lexer->get_column(lexer) == 0);

  if (at_bol) {
    /* Skip output sentinels for empty lines UNLESS already in an output block */
    if (is_eol(lexer->lookahead) && !s->in_output) {
      // Allow Indentation handling to proceed for blank lines
    } else {
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

      // 2. Nessun Output: Vediamo un prompt o EOF e non siamo ancora partiti
      if ((next_is_prompt || lexer->eof(lexer)) && !s->in_output &&
          valid_symbols[OUTPUT_NONE]) {
        // s->in_output = false; 
        // lexer->result_symbol = OUTPUT_NONE;
        // DEBUG_LOG("[SCANNER] BOL: Emitting OUTPUT_NONE (DISABLED)\n");
        // return true;
      }

      // 3. Continuazione: Non c'è un prompt (o è una riga speciale in output) e siamo già in un blocco output
      if (!next_is_prompt && s->in_output && valid_symbols[OUTPUT_CONTINUE]) {
        lexer->result_symbol = OUTPUT_CONTINUE;
        return true;
      }

      // 4. Inizio Output: Vediamo che NON c'è un prompt all'inizio della riga
      if (!next_is_prompt && !s->in_output && valid_symbols[OUTPUT_START]) {
        s->in_output = true;
        lexer->result_symbol = OUTPUT_START;
        DEBUG_LOG("[SCANNER] BOL: Emitting OUTPUT_START\n");
        return true;
      }
    }

    /* Now handle Indentation - Only if no sentinel was emitted */
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
    /* Explicit Prompt handling */
    if (valid_symbols[PROMPT_EXEC] || valid_symbols[PROMPT_CONFIG]) {
      if (scan_prompt(lexer, valid_symbols)) {
        lexer->mark_end(lexer);
        DEBUG_LOG("[SCANNER] Emitting PROMPT through Semaforo\n");
        return true;
      }
    }

    return false;
  }

  /* ============================================================
   * 6. EOF with pending indents (safety net)
   * ============================================================ */
  if (lexer->eof(lexer)) {
    if (valid_symbols[DEDENT] && s->indent_count > 1) {
      s->indent_count--;
      lexer->result_symbol = DEDENT;
      return true;
    }
    return false;
  }

  /* ============================================================
   * 7. ERROR_MARKER: lines starting with %
   * ============================================================ */
  if (valid_symbols[ERROR_MARKER] && lexer->lookahead == '%') {
    while (!is_eol(lexer->lookahead) && !lexer->eof(lexer)) {
      advance_lexer(lexer);
    }
    lexer->mark_end(lexer);
    lexer->result_symbol = ERROR_MARKER;
    return true;
  }

  /* ============================================================
   * 8. SYSLOG_MSG: *timestamp: %FACILITY-SEV-MNEM:
   * ============================================================ */
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

  /* ============================================================
   * 9. DASHED_LINE: line composed only of - or = (min 4)
   * ============================================================ */
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

  /* ============================================================
   * 10. FIELD_SEPARATOR: 2+ spaces mid-line
   * ============================================================ */
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
