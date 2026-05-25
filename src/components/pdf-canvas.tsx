import { useEffect, useRef } from "react";

export function PdfCanvas({ data }: { data: Uint8Array | null }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url" as string)).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

      const loadingTask = pdfjs.getDocument({ data: data.slice(0) });
      const pdf = await loadingTask.promise;
      if (cancelled) return;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "mx-auto mb-4 rounded-sm bg-white shadow-lg max-w-full h-auto";
        const ctx = canvas.getContext("2d")!;
        container.appendChild(canvas);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (cancelled) return;
      }
    })().catch((e) => {
      if (!cancelled && container) {
        container.innerHTML = `<div class="p-6 text-sm text-destructive">PDF render error: ${(e as Error).message}</div>`;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [data]);

  return <div ref={containerRef} className="h-full w-full overflow-auto p-6" />;
}
