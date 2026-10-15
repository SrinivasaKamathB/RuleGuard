import { useState, type FC, type FormEvent } from "react";
import { X, Key, Shield, Info } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  provider: "gemini" | "openai" | "heuristic";
  onSave: (apiKey: string, provider: "gemini" | "openai" | "heuristic") => void;
}

export const ApiKeyModal: FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey: initialKey,
  provider: initialProvider,
  onSave,
}) => {
  const [key, setKey] = useState(initialKey);
  const [provider, setProvider] = useState<"gemini" | "openai" | "heuristic">(initialProvider);

  if (!isOpen) return null;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onSave(key.trim(), provider);
    onClose();
  };

  const handleClear = () => {
    setKey("");
    setProvider("heuristic");
    onSave("", "heuristic");
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window settings-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <Key className="w-5 h-5 text-emerald-400" />
            <div>
              <h3>AI Engine & LLM Settings</h3>
              <p>Configure model provider for dynamic multi-agent reasoning</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          <div className="setting-block">
            <label>Model Provider</label>
            <div className="provider-selector">
              <label className={`provider-option ${provider === "gemini" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={provider === "gemini"}
                  onChange={() => setProvider("gemini")}
                />
                <strong>Google Gemini</strong>
                <small>gemini-1.5-flash / gemini-2.0</small>
              </label>

              <label className={`provider-option ${provider === "openai" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={provider === "openai"}
                  onChange={() => setProvider("openai")}
                />
                <strong>OpenAI</strong>
                <small>gpt-4o-mini / gpt-4.1-mini</small>
              </label>

              <label className={`provider-option ${provider === "heuristic" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="provider"
                  value="heuristic"
                  checked={provider === "heuristic"}
                  onChange={() => setProvider("heuristic")}
                />
                <strong>Zero-Config Semantic Engine</strong>
                <small>Built-in instant local engine (No API Key required)</small>
              </label>
            </div>
          </div>

          {provider !== "heuristic" && (
            <div className="setting-block">
              <label>API Key</label>
              <input
                type="password"
                placeholder={provider === "gemini" ? "AIzaSy..." : "sk-..."}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="key-input"
              />
              <p className="setting-hint">
                <Info className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                Your key is stored strictly in your browser's local memory and sent only to execute analysis.
              </p>
            </div>
          )}

          <div className="zero-config-info-box">
            <Shield className="w-4 h-4 text-emerald-400 inline mr-1.5" />
            <span>
              <strong>Zero-Config Ready:</strong> If no API key is provided, RuleGuard AI automatically uses its high-speed semantic invariant engine with 100% offline capability.
            </span>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={handleClear}>
              Reset to Zero-Config
            </button>
            <button type="submit" className="primary-action-btn">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
