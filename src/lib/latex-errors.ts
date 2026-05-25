export type ParsedError = {
  line?: number;
  message: string;
  hint: string;
  category: string;
};

const HINTS: { test: RegExp; category: string; hint: string }[] = [
  { test: /Undefined control sequence/i, category: "Unknown command", hint: "A command isn't defined. Check spelling or add the missing \\usepackage{...}." },
  { test: /Missing \$ inserted/i, category: "Math mode", hint: "Math symbols used outside math mode. Wrap with $...$ or \\[ ... \\]." },
  { test: /Missing \\begin\{document\}/i, category: "Structure", hint: "Document body missing. Add \\begin{document} ... \\end{document}." },
  { test: /File `([^']+)' not found/i, category: "Missing file", hint: "A required file or package is missing. Remove the import or include the file." },
  { test: /LaTeX Error: Environment .* undefined/i, category: "Environment", hint: "Unknown environment. Load the package that provides it (e.g. amsmath, algorithm)." },
  { test: /Runaway argument/i, category: "Brace mismatch", hint: "Unclosed braces or environment. Look for a missing } or \\end{...}." },
  { test: /Extra \}, or forgotten \\endgroup/i, category: "Brace mismatch", hint: "An extra } closing brace. Remove it or add the matching opening brace." },
  { test: /Paragraph ended before .* was complete/i, category: "Brace mismatch", hint: "A command argument was left unfinished — check braces around the previous command." },
  { test: /Unicode character/i, category: "Encoding", hint: "Unsupported Unicode character. Switch to xelatex or replace with LaTeX equivalent." },
  { test: /\\begin\{([^}]+)\} on input line .* ended by \\end\{([^}]+)\}/i, category: "Environment nesting", hint: "Environment open/close mismatch. Make sure each \\begin has a matching \\end." },
];

export function parseLog(log: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = log.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^!|LaTeX Error|Emergency stop/.test(line)) continue;
    let message = line.replace(/^!\s*/, "").trim();
    // pull line number from following "l.NN" line
    let lineNum: number | undefined;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const m = lines[j].match(/^l\.(\d+)/);
      if (m) {
        lineNum = parseInt(m[1], 10);
        break;
      }
    }
    const hit = HINTS.find((h) => h.test.test(message));
    errors.push({
      line: lineNum,
      message,
      category: hit?.category ?? "LaTeX error",
      hint: hit?.hint ?? "Inspect the surrounding lines and check braces, environments, and packages.",
    });
  }
  return errors;
}

export function buildRepairPrompt(source: string, errors: ParsedError[], log: string): string {
  const errBlock = errors.length
    ? errors.map((e, i) => `${i + 1}. [${e.category}]${e.line ? ` line ${e.line}` : ""}: ${e.message}\n   Hint: ${e.hint}`).join("\n")
    : "(no structured errors parsed — see raw log)";
  return `You are a LaTeX repair assistant. Fix the following document so it compiles with pdflatex.

# Errors
${errBlock}

# Raw log (truncated)
${log.slice(0, 2000)}

# Source
\`\`\`latex
${source}
\`\`\`

Return ONLY the corrected full LaTeX source inside a single code block.`;
}
