#include <tree_sitter/parser.h>
#include <wctype.h>
#include <string.h>

enum TokenType {
  INDENT,
  DEDENT,
  NEWLINE,
  FIELD_SEPARATOR,
  DASHED_LINE,
  CONSOLE_PROMPT,
  WHITESPACE,
  LINE_CONTENT,
  PROMPT_EXEC,
  PROMPT_CONFIG
};

#define MAX_INDENT_STACK 100

typedef struct {
  uint16_t indents[MAX_INDENT_STACK];
  uint8_t indent_count;
} Scanner;

void *tree_sitter_cisco_external_scanner_create() {
  Scanner *scanner = (Scanner *)calloc(1, sizeof(Scanner));
  scanner->indents[0] = 0;
  scanner->indent_count = 1;
  return scanner;
}

void tree_sitter_cisco_external_scanner_destroy(void *payload) {
  free(payload);
}

unsigned tree_sitter_cisco_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *scanner = (Scanner *)payload;
  size_t size = scanner->indent_count * sizeof(uint16_t);
  memcpy(buffer, scanner->indents, size);
  return (unsigned)size;
}

void tree_sitter_cisco_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  Scanner *scanner = (Scanner *)payload;
  if (length > 0) {
    scanner->indent_count = (uint8_t)(length / sizeof(uint16_t));
    memcpy(scanner->indents, buffer, length);
  } else {
    scanner->indents[0] = 0;
    scanner->indent_count = 1;
  }
}

static bool scan_prompt(TSLexer *lexer, bool *is_config) {
  bool has_hostname = false;
  *is_config = false;
  while (iswalnum((wint_t)lexer->lookahead) || lexer->lookahead == '-' || lexer->lookahead == '_' || lexer->lookahead == '.') {
    has_hostname = true;
    lexer->advance(lexer, false);
  }
  if (!has_hostname) return false;
  if (lexer->lookahead == '(') {
    *is_config = true;
    lexer->advance(lexer, false);
    while (lexer->lookahead != ')' && lexer->lookahead != '\n' && !lexer->eof(lexer)) lexer->advance(lexer, false);
    if (lexer->lookahead == ')') lexer->advance(lexer, false); else return false;
  }
  if (lexer->lookahead == '#' || lexer->lookahead == '>') {
    lexer->advance(lexer, false);
    if (iswspace((wint_t)lexer->lookahead) || lexer->lookahead == '\0') return true;
  }
  return false;
}

bool tree_sitter_cisco_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  Scanner *scanner = (Scanner *)payload;

  if (lexer->eof(lexer)) {
    if (valid_symbols[DEDENT] && scanner->indent_count > 1) {
      scanner->indent_count--;
      lexer->result_symbol = DEDENT;
      return true;
    }
    return false;
  }

  // 0. NEWLINE (Sempre massima priorità)
  if (valid_symbols[NEWLINE]) {
    if (lexer->lookahead == '\n' || lexer->lookahead == '\r') {
      if (lexer->lookahead == '\r') { lexer->advance(lexer, false); if (lexer->lookahead == '\n') lexer->advance(lexer, false); }
      else lexer->advance(lexer, false);
      lexer->result_symbol = NEWLINE;
      return true;
    }
  }

  // 1. INDENT / DEDENT (Solo all'inizio della riga)
  if (lexer->get_column(lexer) == 0 && (valid_symbols[INDENT] || valid_symbols[DEDENT])) {
    uint16_t current_indent = 0;
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      current_indent += (lexer->lookahead == '\t') ? 8 : 1;
      lexer->advance(lexer, true);
    }
    
    // Non emettiamo indentazione per righe vuote o commenti
    if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->lookahead == '!') return false;

    uint16_t last_indent = scanner->indents[scanner->indent_count - 1];

    if (valid_symbols[INDENT] && current_indent > last_indent) {
      scanner->indents[scanner->indent_count++] = current_indent;
      lexer->result_symbol = INDENT;
      return true;
    }
    if (valid_symbols[DEDENT] && current_indent < last_indent) {
      scanner->indent_count--;
      lexer->result_symbol = DEDENT;
      return true;
    }
    
    // Se siamo alla stessa colonna, continuiamo. Se WHITESPACE è valido, lo emettiamo.
    if (valid_symbols[WHITESPACE] && current_indent > 0) {
      lexer->result_symbol = WHITESPACE;
      return true;
    }
  }

  // 2. WHITESPACE (Generico)
  if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') lexer->advance(lexer, true);
    if (valid_symbols[WHITESPACE]) { lexer->result_symbol = WHITESPACE; return true; }
  }

  // 3. PROMPTS
  if (valid_symbols[PROMPT_EXEC] || valid_symbols[PROMPT_CONFIG]) {
    if (lexer->get_column(lexer) == 0) {
      bool is_config = false;
      if (scan_prompt(lexer, &is_config)) {
        if (is_config && valid_symbols[PROMPT_CONFIG]) { lexer->result_symbol = PROMPT_CONFIG; return true; }
        if (!is_config && valid_symbols[PROMPT_EXEC]) { lexer->result_symbol = PROMPT_EXEC; return true; }
      }
    }
  }

  // 4. LINE_CONTENT
  if (valid_symbols[LINE_CONTENT]) {
    bool has_content = false;
    while (lexer->lookahead != '\n' && lexer->lookahead != '\r' && !lexer->eof(lexer)) {
      has_content = true;
      lexer->advance(lexer, false);
    }
    if (has_content) {
      lexer->result_symbol = LINE_CONTENT;
      return true;
    }
  }

  return false;
}
