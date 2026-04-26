const { Server } = require("@modelcontextprotocol/sdk/server");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, "..");
const TS_BIN = path.join(PROJECT_ROOT, "node_modules", ".bin", "tree-sitter.cmd");

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
      // Track position (support both "at (r, c)" and "row:r, col:c")
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

      // Scanner events
      if (line.includes("Enter scan")) {
        const match = line.match(/Enter scan: col=(\d+), lookahead='(.*)' \((\d+)\)/);
        this.events.push({
          type: "scanner",
          msg: line.trim(),
          pos: [...currentPos]
        });
      } else if (line.includes("Valid symbols:")) {
        this.events.push({
          type: "scanner",
          msg: line.trim(),
          pos: [...currentPos]
        });
      } else if (line.includes("Emitting")) {
        this.events.push({
          type: "scanner",
          msg: line.trim(),
          pos: [...currentPos]
        });
      }
      
      // Lexer events
      if (line.includes("lexed_symbol")) {
        const match = line.match(/lexed_symbol:(\w+),\s+version:(\d+)/);
        if (match) {
          this.events.push({
            type: "lex",
            symbol: match[1],
            version: parseInt(match[2]),
            pos: [...currentPos]
          });
        }
      }

      // Shift events
      if (line.includes("shift state:")) {
        const match = line.match(/shift state:(\d+)/);
        if (match) {
          this.events.push({
            type: "shift",
            state: parseInt(match[1]),
            pos: [...currentPos]
          });
        }
      }

      // Error events (Reduce failures)
      if (line.includes("Error: unexpected symbol") || line.includes("Reduce failed") || line.includes("detect_error")) {
        const symMatch = line.match(/symbol:(\w+)|lookahead:(\w+)/);
        this.events.push({
          type: "error",
          symbol: symMatch ? (symMatch[1] || symMatch[2]) : "unknown",
          pos: [...currentPos],
          version: line.includes("version:") ? parseInt(line.match(/version:(\d+)/)[1]) : 0
        });
      }

      // Track max versions (parallel branches)
      const verMatch = line.match(/version:(\d+)/);
      if (verMatch) {
        this.maxVersions = Math.max(this.maxVersions, parseInt(verMatch[1]) + 1);
      }
    }
  }

  getReport() {
    const report = {
      max_parallel_branches: this.maxVersions,
      critical_points: []
    };

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
        const end = Math.min(this.events.length, idx + 5);
        
        report.critical_points.push({
          pos: key.split(",").map(Number),
          failed_symbols: [...new Set(errors.map(e => e.symbol))],
          context: this.events.slice(start, end)
        });
      }
    }

    return report;
  }
}

// MCP Server Setup
const server = new Server(
  {
    name: "Cisco Debug Analyzer (Node)",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ping",
        description: "Simple connection test",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "analyze_failure",
        description: "Analyze a tree-sitter parsing failure from a file or debug log.",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "Path to the Cisco file or debug log to analyze.",
            },
          },
          required: ["file_path"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "ping") {
    return { content: [{ type: "text", text: "pong" }] };
  }

  if (name === "analyze_failure") {
    let filePath = args.file_path;
    
    // Resolve path relative to project root if not absolute
    if (!path.isAbsolute(filePath)) {
      const potential = path.resolve(PROJECT_ROOT, filePath);
      if (fs.existsSync(potential)) {
        filePath = potential;
      } else {
        filePath = path.resolve(process.cwd(), filePath);
      }
    }

    if (!fs.existsSync(filePath)) {
      return { content: [{ type: "text", text: `Error: File not found at ${filePath}` }], isError: true };
    }

    let content = "";
    const fileContent = fs.readFileSync(filePath, "utf8");
    const isLog = fileContent.includes("process version:") || fileContent.includes("lex_external");

    if (isLog) {
      content = fileContent;
    } else {
      // Execute tree-sitter parse --debug
      const result = spawnSync(TS_BIN, ["parse", filePath, "--debug"], {
        cwd: PROJECT_ROOT,
        shell: true,
        encoding: "utf8",
        env: { ...process.env, DEBUG_SCANNER: "1" },
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      content = result.stderr;
      if (!content && result.status !== 0) {
        return { content: [{ type: "text", text: `Error executing tree-sitter: ${result.error?.message || "Unknown error"}` }], isError: true };
      }
    }

    const analyzer = new TraceAnalyzer(content);
    analyzer.parse();
    const report = analyzer.getReport();

    return {
      content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cisco Debug Analyzer MCP server (Node) running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
