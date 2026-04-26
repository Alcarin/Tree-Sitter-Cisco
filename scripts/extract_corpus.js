const fs = require('fs');
const path = require('path');

const corpusDir = 'test/corpus';
const outputDir = 'test/raw_inputs';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Pulizia preventiva della directory di output
fs.readdirSync(outputDir).forEach(file => {
    fs.unlinkSync(path.join(outputDir, file));
});

const testRegex = /={10,}\r?\n([^=]+)\r?\n={10,}\r?\n([\s\S]+?)\r?\n-{3,}\r?\n([\s\S]+?)(?=\r?\n={10,}|$)/g;

fs.readdirSync(corpusDir).forEach(file => {
    if (!file.endsWith('.txt')) return;

    const content = fs.readFileSync(path.join(corpusDir, file), 'utf8');
    let match;

    while ((match = testRegex.exec(content)) !== null) {
        const title = match[1].trim();
        const input = match[2].trim();
        
        if (title && input) {
            const baseName = path.basename(file, '.txt');
            const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `${baseName}_${safeTitle}.txt`;
            
            fs.writeFileSync(path.join(outputDir, fileName), input + '\n');
            console.log(`Estratto: ${fileName}`);
        }
    }
});
