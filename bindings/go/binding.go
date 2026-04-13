package tree_sitter_cisco

/*
#cgo CFLAGS: -I../../src
#include "../../src/tree_sitter/parser.h"
#include "../../src/parser.c"
#include "../../src/scanner.c"
*/
import "C"

import (
	"unsafe"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func Language() *tree_sitter.Language {
	return tree_sitter.NewLanguage(unsafe.Pointer(C.tree_sitter_cisco()))
}
