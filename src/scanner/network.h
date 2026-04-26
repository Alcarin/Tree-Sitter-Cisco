#ifndef SCANNER_NETWORK_H
#define SCANNER_NETWORK_H

#include "types.h"
#include "helpers.h"

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

/* Validates wildcard mask: contiguous 0 bits from left then 1s (inverse of subnet) */
static bool is_wildcard_mask(uint32_t ip) {
  if (ip == 0)
    return true; /* 0.0.0.0 is valid as wildcard */
  if (ip == 0xFFFFFFFF)
    return true; /* 255.255.255.255 */
  return (ip & (ip + 1)) == 0;
}

static bool scan_ipv4_family(TSLexer *lexer, const bool *valid_symbols) {
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
  return false;
}

#endif // SCANNER_NETWORK_H
