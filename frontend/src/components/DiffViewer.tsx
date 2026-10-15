import { useState, type FC } from "react";
import { Edit3, Eye, Copy, Check } from "lucide-react";

interface DiffViewerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}

export const DiffViewer: FC<DiffViewerProps> = ({
  value,
  onChange,
  placeholder,
  rows = 11,
  readOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<"visual" | "edit">("visual");
  const [copied, setCopied] = useState(false);

  const isDiff =
    value.includes("diff --git") ||
    value.includes("--- ") ||
    value.includes("+++ ") ||
    value.includes("@@") ||
    value.split("\n").some((l) => l.startsWith("-") || l.startsWith("+"));

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = value.split("\n");

  return (
    <div className="diff-viewer-wrapper">
      <div className="diff-toolbar">
        <div className="diff-badges">
          {isDiff ? (
            <span className="diff-badge git-diff">Unified Git Diff</span>
          ) : (
            <span className="diff-badge raw-code">Code / Intent</span>
          )}
          <span className="diff-line-count">{lines.length} lines</span>
        </div>

        <div className="diff-actions">
          <button
            className={`diff-toggle-btn ${viewMode === "visual" ? "active" : ""}`}
            onClick={() => setViewMode("visual")}
            title="Syntax Highlighted Diff View"
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" /> Highlighted
          </button>
          {!readOnly && (
            <button
              className={`diff-toggle-btn ${viewMode === "edit" ? "active" : ""}`}
              onClick={() => setViewMode("edit")}
              title="Edit code text directly"
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit
            </button>
          )}
          <button className="diff-copy-btn" onClick={handleCopy} title="Copy code">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {viewMode === "edit" && !readOnly ? (
        <textarea
          className="code-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          spellCheck={false}
        />
      ) : (
        <div className="diff-content-scroll" style={{ minHeight: `${rows * 22}px` }}>
          {lines.map((line, idx) => {
            let lineType = "normal";
            if (line.startsWith("diff --git") || line.startsWith("index ")) {
              lineType = "meta";
            } else if (line.startsWith("---") || line.startsWith("+++")) {
              lineType = "file-header";
            } else if (line.startsWith("@@")) {
              lineType = "hunk-header";
            } else if (line.startsWith("-")) {
              lineType = "deletion";
            } else if (line.startsWith("+")) {
              lineType = "addition";
            }

            return (
              <div key={idx} className={`diff-line line-${lineType}`}>
                <span className="line-num">{idx + 1}</span>
                <span className="line-prefix">
                  {line.startsWith("+") ? "+" : line.startsWith("-") ? "-" : " "}
                </span>
                <span className="line-text">
                  {line.startsWith("+") || line.startsWith("-") ? line.slice(1) : line}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
