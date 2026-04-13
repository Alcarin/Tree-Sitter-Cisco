#define PERL_NO_GET_CONTEXT
#include "EXTERN.h"
#include "perl.h"
#include "XSUB.h"

#include <tree_sitter/api.h>

extern const TSLanguage *tree_sitter_cisco(void);

MODULE = TreeSitterCisco		PACKAGE = TreeSitterCisco		

void*
language()
    CODE:
        RETVAL = (void*)tree_sitter_cisco();
    OUTPUT:
        RETVAL
