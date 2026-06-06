"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2 } from "lucide-react";

interface Props {
  onTextExtracted: (text: string, filename: string) => void;
}

export default function UploadZone({ onTextExtracted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pasted, setPasted] = useState("");
  const [tab, setTab] = useState<"upload" | "paste">("upload");

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setError("");
    try {
      if (file.name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onTextExtracted(result.value, file.name);
      } else if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
        const text = await extractPDFText(file);
        onTextExtracted(text, file.name);
      } else {
        const text = await file.text();
        onTextExtracted(text, file.name);
      }
    } catch {
      setError("Failed to parse file. Try pasting the text instead.");
    } finally {
      setLoading(false);
    }
  }, [onTextExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && processFile(files[0]),
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)" }}>
        {(["upload", "paste"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
            style={tab === t
              ? { background: "var(--bg-card)", color: "var(--text-1)", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
              : { color: "var(--text-3)" }
            }
          >
            {t === "upload" ? "Upload File" : "Paste Text"}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        <div
          {...getRootProps()}
          className="rounded-2xl cursor-pointer transition-all"
          style={{
            border: `2px dashed ${isDragActive ? "#7c3aed" : "var(--border-md)"}`,
            background: isDragActive ? "rgba(124,58,237,0.05)" : "var(--bg-card2)",
            padding: "52px 32px",
            textAlign: "center",
          }}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
              {loading
                ? <Loader2 size={30} className="text-violet-500 animate-spin" />
                : <Upload size={30} className="text-violet-500" />
              }
            </div>
            <div>
              <p className="text-base font-semibold mb-2" style={{ color: "var(--text-1)" }}>
                {loading ? "Parsing resume..." : isDragActive ? "Drop it here!" : "Drag & drop your resume"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>PDF, DOCX, or TXT &bull; Max 5MB</p>
            </div>
            <button className="btn-primary px-8 py-3 text-sm">
              Browse Files
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <textarea
            className="w-full rounded-2xl resize-none outline-none transition-colors"
            style={{
              background: "var(--bg-card2)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
              padding: "20px 24px",
              fontSize: "14px",
              lineHeight: "1.75",
              height: "200px",
            }}
            placeholder="Paste your resume text here..."
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={() => {
              if (pasted.trim().length < 50) { setError("Please paste more resume content"); return; }
              onTextExtracted(pasted, "pasted-resume.txt");
            }}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <FileText size={16} />
            Analyze Resume
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
}

async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjsLib = (window as any).pdfjsLib;
    if (pdfjsLib) {
      const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      const texts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        texts.push(content.items.map((item: { str: string }) => item.str).join(" "));
      }
      return texts.join("\n");
    }
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(uint8Array);
}
