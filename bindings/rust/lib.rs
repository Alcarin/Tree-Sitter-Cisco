use tree_sitter_language::LanguageFn;

extern "C" {
    fn tree_sitter_cisco() -> *const ();
}

pub const LANGUAGE: LanguageFn = || unsafe { tree_sitter_cisco().cast() };

pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE.into())
            .expect("Error loading Cisco grammar");
    }
}
