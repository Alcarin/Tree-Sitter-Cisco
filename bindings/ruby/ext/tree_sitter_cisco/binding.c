#include <ruby.h>
#include <tree_sitter/api.h>

extern const TSLanguage *tree_sitter_cisco(void);

VALUE language(VALUE self) {
    return SIZET2NUM((size_t)tree_sitter_cisco());
}

void Init_tree_sitter_cisco() {
    VALUE mTreeSitterCisco = rb_define_module("TreeSitterCisco");
    rb_define_module_function(mTreeSitterCisco, "language", language, 0);
}
