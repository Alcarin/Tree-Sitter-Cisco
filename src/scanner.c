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
  PROMPT_CONFIG,
  SIGNAL_IOS_CONFIG,
  SIGNAL_IOS_EXEC,
  SIGNAL_INTERFACE_START,
  SIGNAL_ROUTER_START,
  SIGNAL_VLAN_START
};

typedef enum {
  MODE_UNKNOWN,
  MODE_CONFIG,
  MODE_EXEC
} ParserMode;

typedef struct {
  uint16_t indents[100];
  uint8_t indent_count;
  ParserMode current_mode;
} Scanner;

static bool is_prompt_char(int32_t c) {
  return iswalnum((wint_t)c) || c == '-' || c == '_' || c == '.' || c == '(' || c == ')';
}

// Questa funzione "sbircia" il prompt senza consumare testo in modo definitivo (se Tree-sitter fa il rollback)
static bool scan_prompt_pattern(TSLexer *lexer, bool *is_config) {
  *is_config = false;
  bool has_content = false;
  for (int i = 0; i < 64; i++) {
    int32_t c = lexer->lookahead;
    if (is_prompt_char(c)) {
      if (c == '(') *is_config = true;
      has_content = true;
      lexer->advance(lexer, false);
    } else if (c == '#' || c == '>') {
      lexer->advance(lexer, false);
      return has_content;
    } else {
      break;
    }
  }
  return false;
}

void *tree_sitter_cisco_external_scanner_create() {
  Scanner *s = (Scanner *)calloc(1, sizeof(Scanner));
  s->indents[0] = 0;
  s->indent_count = 1;
  s->current_mode = MODE_UNKNOWN;
  return s;
}

void tree_sitter_cisco_external_scanner_destroy(void *payload) {
  free(payload);
}

unsigned tree_sitter_cisco_external_scanner_serialize(void *payload, char *buffer) {
  memcpy(buffer, payload, sizeof(Scanner));
  return sizeof(Scanner);
}

void tree_sitter_cisco_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  if (length == sizeof(Scanner)) memcpy(payload, buffer, length);
}

bool tree_sitter_cisco_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  Scanner *scanner = (Scanner *)payload;

  if (lexer->eof(lexer)) return false;

  // 1. DETERMINAZIONE MODALITÀ (Senza consumare token se possibile)
  if (lexer->get_column(lexer) == 0) {
    if (lexer->lookahead == '!') {
      scanner->current_mode = MODE_CONFIG;
    } else if (lexer->lookahead != '\n' && lexer->lookahead != '\r') {
      // Usiamo una logica di campionamento non distruttiva per i prompt
      // Per rilevare la modalità, non emettiamo token ma aggiorniamo lo stato interno
      if (valid_symbols[SIGNAL_IOS_CONFIG] || valid_symbols[SIGNAL_IOS_EXEC]) {
        // Solo qui sbirciamo il prompt
        bool is_config = false;
        // Nota: non avanziamo il lexer se stiamo solo decidendo il SIGNAL
      }
    }
  }

  // 2. EMISSIONE SEGNALI DI CONTESTO (LUNGHEZZA ZERO)
  // Il parser aspetta questi segnali per decidere il ramo ios_config_segment o ios_exec_segment
  if (valid_symbols[SIGNAL_IOS_CONFIG] || valid_symbols[SIGNAL_IOS_EXEC]) {
    // Heuristic: se non sappiamo, proviamo a guardare il primo carattere
    if (scanner->current_mode == MODE_UNKNOWN) {
      if (lexer->lookahead == '!') scanner->current_mode = MODE_CONFIG;
      else {
        // Tentiamo di vedere se è un prompt
        // Poiché Tree-sitter non permette rollback facile dopo advance(),
        // assumiamo MODE_CONFIG come default e cambieremo se troviamo un prompt reale
        scanner->current_mode = MODE_CONFIG;
      }
    }

    if (valid_symbols[SIGNAL_IOS_CONFIG] && scanner->current_mode == MODE_CONFIG) {
      lexer->result_symbol = SIGNAL_IOS_CONFIG;
      return true;
    }
    if (valid_symbols[SIGNAL_IOS_EXEC] && scanner->current_mode == MODE_EXEC) {
      lexer->result_symbol = SIGNAL_IOS_EXEC;
      return true;
    }
  }

  // 3. PROMPT REALI (Consumano testo)
  if (valid_symbols[PROMPT_CONFIG] || valid_symbols[PROMPT_EXEC]) {
    bool is_config = false;
    if (scan_prompt_pattern(lexer, &is_config)) {
      scanner->current_mode = is_config ? MODE_CONFIG : MODE_EXEC;
      if (is_config && valid_symbols[PROMPT_CONFIG]) { lexer->result_symbol = PROMPT_CONFIG; return true; }
      if (!is_config && valid_symbols[PROMPT_EXEC]) { lexer->result_symbol = PROMPT_EXEC; return true; }
    }
  }

  // 4. ALTRI TOKEN STRUTTURALI (Newline, Whitespace, Indent)
  if (valid_symbols[NEWLINE] && (lexer->lookahead == '\n' || lexer->lookahead == '\r')) {
    if (lexer->lookahead == '\r') { lexer->advance(lexer, false); if (lexer->lookahead == '\n') lexer->advance(lexer, false); }
    else lexer->advance(lexer, false);
    lexer->result_symbol = NEWLINE;
    return true;
  }

  if (valid_symbols[WHITESPACE] && (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') lexer->advance(lexer, true);
    lexer->result_symbol = WHITESPACE;
    return true;
  }

  // 5. INDENT / DEDENT (Solo in CONFIG)
  if (scanner->current_mode == MODE_CONFIG && (valid_symbols[INDENT] || valid_symbols[DEDENT])) {
    if (lexer->get_column(lexer) == 0) {
      uint16_t current_indent = 0;
      while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
        current_indent += (lexer->lookahead == '\t') ? 8 : 1;
        lexer->advance(lexer, true);
      }
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
    }
  }

  return false;
}
