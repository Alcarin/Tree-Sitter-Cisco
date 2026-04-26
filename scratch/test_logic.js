const fs = require('fs');
const path = require('path');
// Mocking path and other things if needed, but let's just copy the class for a second or require it
// Actually, I'll just copy the class logic to be fast
const content = fs.readFileSync('scratch/debug_trace_ping.txt', 'utf8');

class TraceAnalyzer {
  constructor(content) {
    this.content = content;
    this.events = [];
    this.maxVersions = 0;
  }

  parse() {
    const lines = this.content.split("\n");
    let currentPos = [0, 0];
    for (const line of lines) {
      let r, c;
      const atMatch = line.match(/at\s+\((\d+),\s+(\d+)\)/);
      const rowMatch = line.match(/row:(\d+),\s+col:(\d+)/);
      
      if (atMatch) {
        r = parseInt(atMatch[1]);
        c = parseInt(atMatch[2]);
      } else if (rowMatch) {
        r = parseInt(rowMatch[1]);
        c = parseInt(rowMatch[2]);
      }

      if (r !== undefined && c !== undefined) {
        currentPos = [r, c];
      }

      if (line.includes("Enter scan")) {
        this.events.push({ type: "scanner", msg: line.trim(), pos: [...currentPos] });
      } else if (line.includes("Valid symbols:")) {
        this.events.push({ type: "scanner", msg: line.trim(), pos: [...currentPos] });
      } else if (line.includes("Emitting")) {
        this.events.push({ type: "scanner", msg: line.trim(), pos: [...currentPos] });
      } else if (line.includes("lexed_symbol")) {
        const match = line.match(/lexed_symbol:(\w+),\s+version:(\d+)/);
        if (match) this.events.push({ type: "lex", symbol: match[1], version: parseInt(match[2]), pos: [...currentPos] });
      } else if (line.includes("shift state:")) {
        const match = line.match(/shift state:(\d+)/);
        if (match) this.events.push({ type: "shift", state: parseInt(match[1]), pos: [...currentPos] });
      } else if (line.includes("Error: unexpected symbol") || line.includes("Reduce failed") || line.includes("detect_error")) {
        const symMatch = line.match(/symbol:(\w+)|lookahead:(\w+)/);
        this.events.push({
          type: "error",
          symbol: symMatch ? (symMatch[1] || symMatch[2]) : "unknown",
          pos: [...currentPos],
          version: line.includes("version:") ? parseInt(line.match(/version:(\d+)/)[1]) : 0
        });
      }
      const verMatch = line.match(/version:(\d+)/);
      if (verMatch) this.maxVersions = Math.max(this.maxVersions, parseInt(verMatch[1]) + 1);
    }
  }

  getReport() {
    const report = { max_parallel_branches: this.maxVersions, critical_points: [] };
    const posEvents = new Map();
    this.events.forEach(e => {
      const key = e.pos.join(",");
      if (!posEvents.has(key)) posEvents.set(key, []);
      posEvents.get(key).push(e);
    });
    const sortedPositions = Array.from(posEvents.keys()).sort((a, b) => {
      const [aL, aC] = a.split(",").map(Number);
      const [bL, bC] = b.split(",").map(Number);
      return aL - bL || aC - bC;
    });
    for (const key of sortedPositions) {
      const events = posEvents.get(key);
      const errors = events.filter(e => e.type === "error");
      if (errors.length > 0) {
        const idx = this.events.indexOf(errors[0]);
        const start = Math.max(0, idx - 5);
        const end = Math.min(this.events.length, idx + 10); // increased end
        report.critical_points.push({ pos: key.split(",").map(Number), failed_symbols: [...new Set(errors.map(e => e.symbol))], context: this.events.slice(start, end) });
      }
    }
    return report;
  }
}

const analyzer = new TraceAnalyzer(content);
analyzer.parse();
console.log(JSON.stringify(analyzer.getReport(), null, 2));
