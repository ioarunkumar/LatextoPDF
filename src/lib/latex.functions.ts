import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  source: z.string().min(1).max(500_000),
  engine: z.enum(["pdflatex", "xelatex", "lualatex"]).default("pdflatex"),
});

export const compileLatex = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const form = new FormData();
    form.append("filename[]", "document.tex");
    form.append("filecontents[]", data.source);
    form.append("return", "pdf");
    form.append("engine", data.engine);

    let res: Response;
    try {
      res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
        method: "POST",
        body: form,
      });
    } catch (err) {
      return {
        ok: false as const,
        log: `Network error contacting compiler: ${(err as Error).message}`,
        pdfBase64: null,
      };
    }

    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/pdf")) {
      const buf = new Uint8Array(await res.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      const base64 = btoa(bin);
      return { ok: true as const, log: "Compiled successfully.", pdfBase64: base64 };
    }

    const log = await res.text();
    return { ok: false as const, log: log || `Compile failed (${res.status})`, pdfBase64: null };
  });
