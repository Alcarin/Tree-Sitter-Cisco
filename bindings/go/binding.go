package tree_sitter_cisco

// #include "../../src/tree_sitter/parser.h"
// TSLanguage *tree_sitter_cisco();
import "C"

import (
	"unsafe"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func Language() *tree_sitter.Language {
	return tree_sitter.NewLanguage(unsafe.Pointer(C.tree_sitter_cisco()))
}
