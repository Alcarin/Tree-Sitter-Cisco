#ifndef SCANNER_TYPES_H
#define SCANNER_TYPES_H

#include <stdint.h>
#include <stdbool.h>

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

#endif // SCANNER_TYPES_H
