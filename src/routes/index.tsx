import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Code2, FileCode2, ScrollText, History, Settings, Play, Download,
  ChevronDown, Plus, X, Trash2, ChevronUp, PanelLeft, FileText,
} from "lucide-react";
import { compileLatex } from "@/lib/latex.functions";
import logo from "@/assets/logo.png";
import { parseLog, buildRepairPrompt, type ParsedError } from "@/lib/latex-errors";
import { PdfCanvas } from "@/components/pdf-canvas";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useDefaultLayout } from "react-resizable-panels";
import { useIsMobile } from "@/hooks/use-mobile";

function usePersistedLayout(id: string) {
  return useDefaultLayout({
    id,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  });
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI LaTeX Repair Engine — Compile & Fix LaTeX in the Browser" },
      { name: "description", content: "Paste broken LaTeX, compile to PDF, and get AI-ready repair prompts." },
    ],
  }),
  component: Index,
});

const SAMPLE = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage[margin=1in]{geometry}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage{hyperref}

\definecolor{primary}{RGB}{40,40,40}

\title{\textbf{Arun Kumar Resume + Project Demo}}
\author{Arun Kumar}
\date{\today}

\begin{document}

\maketitle

\section*{About Me}

\textbf{Arun Kumar}

\vspace{0.3cm}

B.Tech CSE student passionate about:
\begin{itemize}[leftmargin=0.6cm]
    \item Web Development
    \item AI-powered tools
    \item Developer-focused products
    \item Browser-based applications
    \item Open-source projects
\end{itemize}

\vspace{0.3cm}

GitHub:
\href{https://github.com/the-unknown-hacker}
{https://github.com/ioarunkumar}

\section*{Skills}

\begin{itemize}[leftmargin=0.6cm]
    \item HTML, CSS, JavaScript
    \item React.js and Next.js
    \item Python
    \item Git and GitHub
    \item Tailwind CSS
    \item AI Workflow Automation
    \item UI/UX Prototyping
\end{itemize}

\section*{Project: AI LaTeX Repair Engine}

\textbf{Website Description}

AI LaTeX Repair Engine is an offline-first browser-based platform designed to fix AI-generated LaTeX errors and generate PDFs directly inside the browser without heavy server usage.

The platform helps developers, students, researchers, and AI users debug broken LaTeX quickly using AI-assisted workflows.

\section*{Main Features}

\begin{itemize}[leftmargin=0.6cm]

    \item Browser-side PDF generation using pdflatex

    \item Offline support using PWA architecture

    \item Monaco-based LaTeX editor

    \item Split-screen PDF preview

    \item Human-readable error explanations

    \item AI-ready repair prompt generation

    \item Minimal failing snippet extraction

    \item repair-request.zip export

    \item Unsupported package detection

    \item Infinite loop protection

    \item Unicode sanitization warnings

    \item Open-source and privacy-friendly workflow

\end{itemize}

\section*{Workflow}

\begin{enumerate}[leftmargin=0.7cm]

    \item Upload or paste LaTeX code

    \item Compile PDF directly in browser

    \item Analyze compiler errors

    \item Generate AI repair prompt

    \item Export repair package

    \item Fix errors using AI tools

\end{enumerate}

\section*{Future Goals}

\begin{itemize}[leftmargin=0.6cm]

    \item GitHub integration

    \item XeLaTeX support

    \item Advanced diagnostics

    \item Better AI-assisted workflows

    \item Multi-file project support

\end{itemize}

\section*{Conclusion}

This project focuses on making AI-generated LaTeX usable through:
\begin{itemize}[leftmargin=0.6cm]

    \item Better diagnostics
    \item Faster debugging
    \item Offline workflows
    \item AI-assisted repair systems

\end{itemize}

\end{document}`;

type TopTab = "editor" | "templates" | "logs" | "history" | "settings";
type BottomTab = "terminal" | "problems" | "output" | "log";
type MobilePane = "editor" | "preview";

function Index() {
  const [source, setSource] = useState(SAMPLE);
  const [engine, setEngine] = useState<"pdflatex" | "xelatex" | "lualatex">("pdflatex");
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [log, setLog] = useState<string>("");
  const [errors, setErrors] = useState<ParsedError[]>([]);
  const [busy, setBusy] = useState(false);
  const [topTab, setTopTab] = useState<TopTab>("editor");
  const [botTab, setBotTab] = useState<BottomTab>("terminal");
  const [mobilePane, setMobilePane] = useState<MobilePane>("editor");
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  const pdfBlobRef = useRef<Blob | null>(null);
  const isMobile = useIsMobile();
  const editorLayout = usePersistedLayout("latex-editor-vertical");
  const mainLayout = usePersistedLayout("latex-main-horizontal");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const compile = useServerFn(compileLatex);

  const onCompile = useCallback(async () => {
    setBusy(true);
    try {
      const r = await compile({ data: { source, engine } });
      setLog(r.log);
      if (r.ok && r.pdfBase64) {
        const bin = atob(r.pdfBase64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const blob = new Blob([arr], { type: "application/pdf" });
        pdfBlobRef.current = blob;
        setPdfData(arr);
        setErrors([]);
        setBotTab("terminal");
        if (isMobile) setMobilePane("preview");
      } else {
        setErrors(parseLog(r.log));
        setBotTab("problems");
      }
    } catch (err) {
      setLog(`Client error: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [compile, source, engine, isMobile]);

  const downloadPdf = () => {
    if (!pdfBlobRef.current) return;
    const url = URL.createObjectURL(pdfBlobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = useMemo(() => source.split("\n"), [source]);
  const repairPrompt = useMemo(() => buildRepairPrompt(source, errors, log), [source, errors, log]);

  const terminalLog = useMemo(() => {
    if (busy) return "$ pdflatex -interaction=nonstopmode document.tex\nCompiling…";
    if (!log) return "$ ready — press Compile to PDF.";
    return `$ ${engine} -interaction=nonstopmode document.tex\n${log}\n$ `;
  }, [busy, log, engine]);

  // Sync gutter scroll with textarea
  const onEditorScroll = useCallback(() => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Track cursor position
  const updateCursor = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = ta.value.slice(0, pos);
    const ln = before.split("\n").length;
    const col = pos - before.lastIndexOf("\n");
    setCursor({ ln, col });
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.addEventListener("keyup", updateCursor);
    ta.addEventListener("click", updateCursor);
    return () => {
      ta.removeEventListener("keyup", updateCursor);
      ta.removeEventListener("click", updateCursor);
    };
  }, [updateCursor]);

  const editorPane = (
    <section className="flex h-full min-w-0 flex-col">
      {/* File tabs */}
      <div className="flex items-center border-b border-border bg-card">
        <div className="flex items-center gap-2 border-r border-border px-3 py-2 text-xs">
          <span className="font-mono text-foreground">document.tex</span>
          <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" />
        </div>
        <button className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <ResizablePanelGroup
        direction="vertical"
        defaultLayout={editorLayout.defaultLayout}
        onLayoutChanged={editorLayout.onLayoutChanged}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={90} minSize={10}>
          {/* Editor body: gutter + textarea, both scroll-locked */}
          <div className="relative flex h-full min-h-0 bg-background font-mono text-sm leading-6">
            <div
              ref={gutterRef}
              aria-hidden
              className="select-none overflow-hidden border-r border-border bg-background px-3 py-3 text-right text-xs text-primary/70"
              style={{ width: "3.5rem" }}
            >
              <div>
                {lines.map((_, i) => (
                  <div key={i} className="tabular-nums leading-6" style={{ height: "1.5rem" }}>
                    {i + 1}
                  </div>
                ))}
                <div style={{ height: "50vh" }} />
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onScroll={onEditorScroll}
              onKeyUp={updateCursor}
              onClick={updateCursor}
              spellCheck={false}
              wrap="off"
              className="ide-scroll min-w-0 flex-1 resize-none overflow-auto whitespace-pre bg-transparent px-4 py-3 leading-6 text-foreground outline-none"
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle orientation="vertical" />

        <ResizablePanel defaultSize={10} minSize={5}>
          <div className="flex h-full flex-col border-t border-border bg-background">
            <div className="flex items-center border-b border-border bg-card pr-2">
              {([
                ["terminal", "TERMINAL", null],
                ["problems", "PROBLEMS", errors.length],
                ["output", "OUTPUT", null],
                ["log", "LOG", null],
              ] as const).map(([id, label, badge]) => (
                <button
                  key={id}
                  onClick={() => setBotTab(id)}
                  className={`relative flex items-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
                    botTab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {badge !== null && (
                    <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      badge ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground"
                    }`}>{badge}</span>
                  )}
                  {botTab === id && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-primary" />}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                <button className="rounded p-1 hover:bg-secondary hover:text-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
                <button className="rounded p-1 hover:bg-secondary hover:text-foreground"><ChevronUp className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="ide-scroll flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed">
              {botTab === "terminal" && <TerminalView text={terminalLog} ok={!!pdfData} />}
              {botTab === "problems" && <ProblemsView errors={errors} ok={!!pdfData} />}
              {botTab === "output" && (
                <pre className="whitespace-pre-wrap text-muted-foreground">{log || "No output yet."}</pre>
              )}
              {botTab === "log" && (
                <pre className="whitespace-pre-wrap text-foreground">{repairPrompt}</pre>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-1.5 font-mono text-[11px] text-muted-foreground">
        <div className="flex gap-5">
          <span>Ln {cursor.ln}, Col {cursor.col}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>LaTeX</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{lines.length} lines</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Auto-save ON
          </span>
        </div>
      </div>
    </section>
  );

  const previewPane = (
    <section className="flex h-full min-w-0 flex-col bg-background/30">
      {pdfData ? (
        <PdfCanvas data={pdfData} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-10 text-center text-sm text-muted-foreground">
          Press <span className="mx-1 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs text-foreground">Compile to PDF</span> to render here.
        </div>
      )}
    </section>
  );

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="LaTeX to PDF" className="h-9 w-9 rounded-md object-cover" />
          <div className="hidden leading-tight sm:block">
            <h1 className="text-sm font-semibold">AI LaTeX Repair Engine</h1>
            <p className="text-[11px] text-muted-foreground">Compile, diagnose, and prep AI repair prompts</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {([
            ["editor", Code2, "Editor"],
            ["templates", FileCode2, "Templates"],
            ["logs", ScrollText, "Logs"],
            ["history", History, "History"],
            ["settings", Settings, "Settings"],
          ] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTopTab(id)}
              className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition ${
                topTab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {topTab === id && <span className="absolute inset-x-2 -bottom-[7px] h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as typeof engine)}
              className="appearance-none rounded-md border border-border bg-secondary px-3 py-2 pr-8 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="pdflatex">pdflatex</option>
              <option value="xelatex">xelatex</option>
              <option value="lualatex">lualatex</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button
            onClick={onCompile}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {busy ? "Compiling…" : "Compile"}
          </button>
          <button
            onClick={downloadPdf}
            disabled={!pdfData}
            className="items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-muted disabled:opacity-50 inline-flex"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </header>

      {/* Mobile pane toggle */}
      {isMobile && (
        <div className="flex shrink-0 border-b border-border bg-card">
          <button
            onClick={() => setMobilePane("editor")}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-medium ${
              mobilePane === "editor" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            <PanelLeft className="h-3.5 w-3.5" /> Editor
          </button>
          <button
            onClick={() => setMobilePane("preview")}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-medium ${
              mobilePane === "preview" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {isMobile ? (
          <div className="flex-1">
            {mobilePane === "editor" ? editorPane : previewPane}
          </div>
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            defaultLayout={mainLayout.defaultLayout}
            onLayoutChanged={mainLayout.onLayoutChanged}
            className="flex-1"
          >
            <ResizablePanel defaultSize={55} minSize={25}>
              {editorPane}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={45} minSize={20}>
              {previewPane}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}

function TerminalView({ text, ok }: { text: string; ok: boolean }) {
  return (
    <div className="space-y-1">
      <pre className="whitespace-pre-wrap text-muted-foreground">
        <span className="text-primary">{text.split("\n")[0]}</span>
        {"\n"}
        {text.split("\n").slice(1).join("\n")}
      </pre>
      {ok && (
        <div className="font-mono text-primary">✓ Compiled successfully. No errors detected.</div>
      )}
    </div>
  );
}

function ProblemsView({ errors, ok }: { errors: ParsedError[]; ok: boolean }) {
  if (ok) return <div className="text-primary">✓ No problems detected.</div>;
  if (!errors.length) return <div className="text-muted-foreground">No problems yet.</div>;
  return (
    <ul className="divide-y divide-border">
      {errors.map((e, i) => (
        <li key={i} className="py-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">{e.category}</span>
            {e.line && <span className="text-muted-foreground">line {e.line}</span>}
          </div>
          <p className="mt-1 text-foreground">{e.message}</p>
          <p className="mt-0.5 text-muted-foreground">→ {e.hint}</p>
        </li>
      ))}
    </ul>
  );
}
