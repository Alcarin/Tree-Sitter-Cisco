import re
import sys
import argparse

def refine_debug_log(content):
    # 1. Rimuove le coordinate numeriche [start_row, start_col] - [end_row, end_col]
    # Esempio: [6, 0] - [7, 18]
    clean_content = re.sub(r'\[\d+, \d+\] - \[\d+, \d+\]', '', content)
    
    # 2. Identifica i blocchi di errore per l'analisi focalizzata
    error_patterns = re.findall(r'\(ERROR.*?\)', clean_content, re.DOTALL)
    
    return clean_content, error_patterns

def main():
    parser = argparse.ArgumentParser(description='Raffina i log di debug di Tree-sitter per una migliore leggibilità.')
    parser.add_argument('input_file', help='Il file contenente il log di debug (output di tree-sitter parse --debug)')
    parser.add_argument('--output', '-o', help='File di output (opzionale, default stdout)')
    
    args = parser.parse_args()
    
    try:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Errore nella lettura del file: {e}")
        sys.exit(1)
        
    clean_content, error_patterns = refine_debug_log(content)
    
    output_stream = sys.stdout
    if args.output:
        output_stream = open(args.output, 'w', encoding='utf-8')
        
    output_stream.write("--- GERARCHIA PULITA PER LLM ---\n")
    output_stream.write(clean_content)
    
    if error_patterns:
        output_stream.write("\n--- NODI CRITICI IDENTIFICATI ---\n")
        for i, err in enumerate(error_patterns):
            output_stream.write(f"Errore {i+1}: {err.strip()}\n")
            
    if args.output:
        output_stream.close()
        print(f"Log raffinato salvato in: {args.output}")

if __name__ == "__main__":
    main()
