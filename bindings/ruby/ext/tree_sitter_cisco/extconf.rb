require "mkmf"

$CFLAGS << " -std=c99 -I#{File.join(__dir__, "..", "..", "..", "src")}"
$VPATH << "$(srcdir)/../../../src"

create_makefile("tree_sitter_cisco/tree_sitter_cisco")
