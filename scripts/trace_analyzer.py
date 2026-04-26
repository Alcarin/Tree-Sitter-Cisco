import os
import re
import sys
import json
import subprocess
from pathlib import Path
from collections import defaultdict
from mcp.server.fastmcp import FastMCP

class TraceAnalyzer:
    EXTERNAL_SYMBOLS = [
        "INDENT", "DEDENT", "NEWLINE", "OUTPUT_BLOCK_CONTENT",
        "PROMPT_EXEC", "PROMPT_CONFIG", "ERROR_MARKER", "SYSLOG_MSG",
        "CONSOLE_NOISE", "FIELD_SEPARATOR", "DASHED_LINE", "BANNER_DELIMITER",
        "BANNER_BODY", "OUTPUT_START", "OUTPUT_CONTINUE", "OUTPUT_END",
        "OUTPUT_NONE", "SUBNET_MASK", "WILDCARD_MASK", "INVALID_IP",
        "BANNER_TRIGGER"
    ]

    def __init__(self, log_content):
        self.log_content = log_content
        self.versions = defaultdict(list)
        self.current_pos = (0, 0)
        self.events = []
        self.active_versions = {}
        self.max_versions = 0

    def parse(self):
        lines = self.log_content.splitlines()
        for line in lines:
            # Track position
            pos_match = re.search(r'row:(\d+), col:(\d+)', line)
            if pos_match:
                self.current_pos = (int(pos_match.group(1)), int(pos_match.group(2)))

            # Track version processing
            version_match = re.search(r'process version:(\d+), version_count:(\d+), state:(\d+)', line)
            if version_match:
                v_id = int(version_match.group(1))
                v_count = int(version_match.group(2))
                state = int(version_match.group(3))
                self.max_versions = max(self.max_versions, v_count)
                self.active_versions[v_id] = {'state': state, 'pos': self.current_pos}
                continue

            # Track lexing
            lex_match = re.search(r'lexed_lookahead sym:(\w+), size:(\d+)', line)
            if lex_match:
                sym = lex_match.group(1)
                self.events.append({
                    'type': 'lex',
                    'symbol': sym,
                    'pos': self.current_pos,
                    'version': list(self.active_versions.keys())[-1] if self.active_versions else 0
                })

            # Track errors
            error_match = re.search(r'detect_error lookahead:(\w+)', line)
            if error_match:
                sym = error_match.group(1)
                self.events.append({
                    'type': 'error',
                    'symbol': sym,
                    'pos': self.current_pos,
                    'version': list(self.active_versions.keys())[-1] if self.active_versions else 0
                })

            # Track shift
            shift_match = re.search(r'shift state:(\d+)', line)
            if shift_match:
                state = int(shift_match.group(1))
                self.events.append({
                    'type': 'shift',
                    'state': state,
                    'pos': self.current_pos
                })

            # Track scanner logs
            scanner_match = re.search(r'\[SCANNER\] (.*)', line)
            if scanner_match:
                msg = scanner_match.group(1)
                if "Valid symbols:" in msg:
                    indices = re.findall(r'(\d+)', msg)
                    names = []
                    for idx in indices:
                        i = int(idx)
                        if i < len(self.EXTERNAL_SYMBOLS):
                            names.append(self.EXTERNAL_SYMBOLS[i])
                        else:
                            names.append(f"UNKNOWN({i})")
                    msg = "Valid symbols: " + ", ".join(names)

                self.events.append({
                    'type': 'scanner',
                    'msg': msg,
                    'pos': self.current_pos
                })

    def get_report(self):
        report = {
            'max_parallel_branches': self.max_versions,
            'critical_points': []
        }
        
        pos_events = defaultdict(list)
        for e in self.events:
            pos_events[e['pos']].append(e)
            
        for pos in sorted(pos_events.keys()):
            errors = [e for e in pos_events[pos] if e['type'] == 'error']
            if errors:
                point = {
                    'pos': pos,
                    'failed_symbols': [e['symbol'] for e in errors],
                    'context': []
                }
                idx = self.events.index(errors[0])
                start = max(0, idx - 5)
                end = min(len(self.events), idx + 5)
                for i in range(start, end):
                    point['context'].append(self.events[i])
                report['critical_points'].append(point)
        
        return report

# Create FastMCP server
mcp = FastMCP("Cisco Debug Analyzer")

# Absolute path for the log file to avoid CWD issues
LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mcp_server_debug.log")

def log_debug(msg):
    # Logging disabilitato per pulizia. Riattivare se necessario per debug.
    pass

log_debug("Script initialized")

@mcp.tool()
def ping() -> str:
    """Semplice test di connessione."""
    log_debug("Tool call: ping")
    return "pong"

@mcp.tool()
def analyze_failure(file_path: str) -> str:
    """
    Analizza un fallimento di parsing Tree-sitter estraendo le ramificazioni e i conflitti dal log di debug.
    
    Args:
        file_path: Percorso del file Cisco o del file di log di debug da analizzare.
    """
    log_debug(f"Tool call: analyze_failure with file_path='{file_path}'")
    
    # Risoluzione intelligente del percorso
    p = Path(file_path)
    project_root = Path(__file__).parent.parent.resolve()
    
    # Se il path è relativo, proviamo prima rispetto alla root del progetto, poi rispetto alla CWD
    if not p.is_absolute():
        potential_path = project_root / p
        if potential_path.exists():
            target_path = potential_path.resolve()
        else:
            target_path = p.resolve()
    else:
        target_path = p.resolve()
    
    log_debug(f"Resolved target: {target_path}")
    log_debug(f"Project root: {project_root}")

    if not target_path.exists():
        log_debug(f"File NOT found: {target_path}")
        return f"File not found: {target_path}"
    
    content = ""
    is_log = False
    
    try:
        with open(target_path, 'r', encoding='utf-8', errors='ignore') as f:
            snippet = f.read(1024)
            if "process version:" in snippet or "lex_external" in snippet:
                is_log = True
        log_debug(f"is_log={is_log}")
    except Exception as e:
        log_debug(f"Error reading file: {e}")
        return f"Error reading file: {e}"
    
    if is_log:
        with open(target_path, 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        # È un file da parsare. Torniamo alla cattura in memoria.
        log_debug("Executing tree-sitter parse --debug (in-memory)...")
        
        # Percorso al binario locale di tree-sitter per evitare npx
        ts_bin = project_root / "node_modules" / ".bin" / "tree-sitter.cmd"
        
        try:
            # Comando con binario locale e CWD forzata alla root del progetto
            if ts_bin.exists():
                cmd = f'"{ts_bin}" parse "{target_path}" --debug'
            else:
                cmd = f'npx --yes tree-sitter parse "{target_path}" --debug'
            
            log_debug(f"Command: {cmd}")
            
            # Esecuzione e cattura in memoria
            result = subprocess.run(
                cmd, 
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.PIPE, 
                text=True,
                shell=True, 
                cwd=str(project_root),
                timeout=60,
                encoding="utf-8",
                errors="ignore"
            )
            
            content = result.stderr
            log_debug(f"Tree-sitter finished. Exit code: {result.returncode}, Log size: {len(content)}")
            
        except subprocess.TimeoutExpired:
            log_debug("Tree-sitter timeout expired")
            return "Error: Tree-sitter parsing timed out (60s)."
        except Exception as e:
            log_debug(f"Subprocess error: {e}")
            return f"Error executing tree-sitter: {e}"


    log_debug("Starting trace analysis...")
    analyzer = TraceAnalyzer(content)
    analyzer.parse()
    report = analyzer.get_report()
    log_debug(f"Analysis complete. Critical points: {len(report['critical_points'])}")
    return json.dumps(report, indent=2)



if __name__ == "__main__":
    if "--mcp" in sys.argv:
        mcp.run()
    else:
        if len(sys.argv) < 2:
            print("Usage: python trace_analyzer.py <file_to_parse_or_log> [--mcp]")
            sys.exit(1)
        
        target = sys.argv[1]
        print(analyze_failure(target))
