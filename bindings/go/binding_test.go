package tree_sitter_cisco_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_cisco "github.com/Alcarin/tree-sitter-cisco/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter_cisco.Language()
	if language == nil {
		t.Fatal("Error: tree-sitter-cisco language is nil")
	}

	parser := tree_sitter.NewParser()
	err := parser.SetLanguage(language)
	if err != nil {
		t.Fatalf("Error setting cisco language: %v", err)
	}
}
