const { spawn } = require('child_process');
const path = require('path');

/**
 * Esegue un comando con un timeout per prevenire loop infiniti o saturazione RAM
 * tipici di alcune grammatiche tree-sitter ambigue durante la generazione o il test.
 */
function runCommand(command, args, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
        const formattedArgs = args.map(arg => (arg.includes(' ') && !arg.startsWith('"')) ? `"${arg}"` : arg);
        console.log(`\x1b[36m[SafeRun]\x1b[0m Esecuzione: ${command} ${formattedArgs.join(' ')}`);
        
        const child = spawn(command, formattedArgs, { 
            shell: true, 
            stdio: 'inherit',
            env: { ...process.env, PAGER: 'cat' } 
        });
        
        const timer = setTimeout(() => {
            console.error(`\x1b[31m[Critical Warning]\x1b[0m Timeout di ${timeoutMs/1000}s superato! Possibile loop o saturazione risorse.`);
            child.kill('SIGKILL');
            reject(new Error('Timeout'));
        }, timeoutMs);

        child.on('exit', (code) => {
            clearTimeout(timer);
            if (code === 0) resolve();
            else reject(new Error(`Il comando è terminato con codice errore ${code}`));
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Uso: node safe-run.js <comando> [argomenti...]");
        process.exit(1);
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    try {
        await runCommand(command, commandArgs);
    } catch (err) {
        console.error(`\x1b[31m[Fail]\x1b[0m ${err.message}`);
        process.exit(1);
    }
}

main();
