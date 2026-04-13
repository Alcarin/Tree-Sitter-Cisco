const fs = require('fs');
const path = require('path');

// 1. Sorgente della Verità
const config = JSON.parse(fs.readFileSync('tree-sitter.json', 'utf8'));
const { version, license, keywords, description } = config.metadata;
const { repository, homepage, bugs } = config.metadata.links;
const author = config.metadata.authors[0].name;

console.log(`🚀 Sincronizzazione metadati v${version} per ${author}...`);

/**
 * Funzione di utilità per sostituire pattern nei file
 */
function updateFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(({ regex, value }) => {
    content = content.replace(regex, value);
  });
  fs.writeFileSync(filePath, content);
  console.log(`✅ Aggiornato: ${filePath}`);
}

// 2. Aggiornamento package.json
updateFile('package.json', [
  { regex: /"version": "[^"]+"/, value: `"version": "${version}"` },
  { regex: /"author": "[^"]+"/, value: `"author": "${author}"` },
  { regex: /"license": "[^"]+"/, value: `"license": "${license}"` },
  { regex: /"description": "[^"]+"/, value: `"description": "${description}"` },
  { regex: /"url": "https:\/\/github\.com\/[^\/]+\/tree-sitter-cisco\.git"/, value: `"url": "${repository}.git"` },
  { regex: /"url": "https:\/\/github\.com\/[^\/]+\/tree-sitter-cisco\/issues"/, value: `"url": "${bugs}"` },
  { regex: /"homepage": "[^"]+"/, value: `"homepage": "${homepage}"` },
  { regex: /"keywords": \[[^\]]+\]/s, value: `"keywords": [\n    ${keywords.map(k => `"${k}"`).join(',\n    ')}\n  ]` }
]);

// 3. Aggiornamento Cargo.toml (Rust)
updateFile('Cargo.toml', [
  { regex: /version = "[^"]+"/, value: `version = "${version}"` },
  { regex: /license = "[^"]+"/, value: `license = "${license}"` },
  { regex: /authors = \["[^"]+"\]/, value: `authors = ["${author}"]` },
  { regex: /description = "[^"]+"/, value: `description = "${description}"` },
  { regex: /repository = "[^"]+"/, value: `repository = "${repository}"` }
]);

// 4. Aggiornamento setup.py (Python)
updateFile('setup.py', [
  { regex: /version="[^"]+"/, value: `version="${version}"` },
  { regex: /author="[^"]+"/, value: `author="${author}"` },
  { regex: /description="[^"]+"/, value: `description="${description}"` },
  { regex: /"License :: OSI Approved :: [^ ]+ License"/, value: `"License :: OSI Approved :: ${license} License"` },
  { regex: /"Source": "[^"]+"/, value: `"Source": "${repository}"` },
  { regex: /install_requires=\[[^\]]+\]/, value: `install_requires=["tree-sitter~=0.23"]` }
]);

// 5. Aggiornamento pom.xml (Java)
updateFile('pom.xml', [
  { regex: /<version>[^<]+<\/version>/, value: `<version>${version}</version>` },
  { regex: /<name>[^<]+<\/name>/, value: `<name>${description} Binding</name>` }
]);

// 6. Aggiornamento gemspec (Ruby)
updateFile('tree-sitter-cisco.gemspec', [
  { regex: /s.version *= '[^']+'/, value: `s.version     = '${version}'` },
  { regex: /s.authors *= \["[^"]+"\]/, value: `s.authors     = ["${author}"]` },
  { regex: /s.summary *= "[^"]+"/, value: `s.summary     = "${description}"` }
]);

// 7. Aggiornamento go.mod (Go)
const goRepo = repository.replace('https://', '');
updateFile('go.mod', [
  { regex: /module [^\s]+/, value: `module ${goRepo.toLowerCase()}` }
]);

console.log('✨ Sincronizzazione completata!');
