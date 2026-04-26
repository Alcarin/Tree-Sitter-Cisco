import re
import sys
import argparse

def map_errors(source_file, ast_file):
    with open(source_file, 'r', encoding='utf-8') as f:
        source_lines = f.readlines()
        
    with open(ast_file, 'r', encoding='utf-8') as f:
        ast_content = f.read()
        
    # Trova tutti i nodi ERROR con le loro coordinate
    # Formato atteso: (ERROR [start_row, start_col] - [end_row, end_col])
    # o semplicemente (ERROR ...) se le coordinate sono presenti nel nodo padre
    
    # Cerchiamo pattern tipo: (ERROR [6, 0] - [6, 10])
    error_matches = re.finditer(r'\(ERROR\s+\[(\d+),\s+\d+\]\s+-\s+\[(\d+),\s+\d+\]', ast_content)
    
    results = []
    for match in error_matches:
        start_row = int(match.group(1))
        end_row = int(match.group(2))
        
        error_text = match.group(0)
        # Tentiamo di catturare un po' di contesto dell'errore (i figli se presenti)
        # Questo è complesso con regex su S-expressions bilanciate, ma proviamo il base
        
        snippet = []
        for i in range(start_row, end_row + 1):
            if i < len(source_lines):
                snippet.append(source_lines[i].strip())
        
        results.append({
            'line': start_row + 1,
            'text': " | ".join(snippet),
            'node': error_text + ")" # Chiusura approssimativa
        })
        
    return results

def main():
    parser = argparse.ArgumentParser(description='Mappa gli errori dell\'AST Tree-sitter sulle righe del file sorgente.')
    parser.add_argument('source_file', help='Il file sorgente originale (Cisco log)')
    parser.add_argument('ast_file', help='Il file contenente l\'AST (output di tree-sitter parse)')
    
    args = parser.parse_args()
    
    errors = map_errors(args.source_file, args.ast_file)
    
    if not errors:
        print("Nessun nodo ERROR trovato con coordinate nel file AST.")
        # Proviamo a cercare ERROR senza coordinate per avvisare l'utente
        if '(ERROR' in open(args.ast_file).read():
            print("AVVISO: Nodi ERROR presenti ma senza coordinate. Assicurati di usare 'tree-sitter parse' che includa i range.")
        return

    print(f"--- REPORT ERRORI ({len(errors)}) ---")
    for err in errors:
        print(f"Riga {err['line']}: \"{err['text']}\" -> Match Fallito: {err['node']}")

if __name__ == "__main__":
    main()
