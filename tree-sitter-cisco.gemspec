Gem::Specification.new do |s|
  s.name        = 'tree-sitter-cisco'
  s.version     = '0.1.0'
  s.summary     = "Cisco configuration parser for tree-sitter"
  s.authors     = ["Francesco Rubeo"]
  s.files       = ["bindings/ruby/**/*", "src/**/*"]
  s.extensions  = ["bindings/ruby/ext/tree_sitter_cisco/extconf.rb"]
  s.add_dependency "tree-sitter", "~> 0.23"
end
