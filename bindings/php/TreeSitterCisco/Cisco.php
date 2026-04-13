<?php

namespace TreeSitterCisco;

use FFI;

class Cisco
{
    private static $ffi = null;

    public static function language()
    {
        if (self::$ffi === null) {
            // Assume che la libreria sia stata compilata tramite il Makefile
            self::$ffi = FFI::cdef(
                "typedef struct TSLanguage TSLanguage; const TSLanguage *tree_sitter_cisco(void);",
                __DIR__ . "/../../../tree-sitter-cisco.so"
            );
        }
        return self::$ffi->tree_sitter_cisco();
    }
}
