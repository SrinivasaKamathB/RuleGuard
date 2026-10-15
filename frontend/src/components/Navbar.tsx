import type { FC } from "react";
import { Sparkles, BookOpen, Key, Building2 } from "lucide-react";

interface NavbarProps {
  mode: "demo" | "enterprise";
  onModeChange: (mode: "demo" | "enterprise") => void;
  apiKey: string;
  provider: "gemini" | "openai" | "heuristic";
  onOpenSettings: () => void;
  onOpenRulebook: () => void;
  ruleCount: number;
}

export const Navbar: FC<NavbarProps> = ({
  mode,
  onModeChange,
  apiKey,
  provider,
  onOpenSettings,
  onOpenRulebook,
  ruleCount,
}) => {
  return (
    <nav className="topbar">
      <div className="brand">
        <div className="brand-shield" title="RuleGuard Enterprise">
          <img src="/logo.svg" alt="RuleGuard Emblem" className="w-7 h-7 object-contain" />
        </div>
        <div>
          <h1>
            RuleGuard <span>2.0</span>
          </h1>
          <p>Institutional Memory Gatekeeper · Release Governance</p>
        </div>
      </div>

      <div className="nav-center-controls">
        <div className="mode-toggle-pill">
          <button
            className={`mode-btn ${mode === "demo" ? "active" : ""}`}
            onClick={() => onModeChange("demo")}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 inline" />
            Demo Showcase
          </button>
          <button
            className={`mode-btn ${mode === "enterprise" ? "active" : ""}`}
            onClick={() => onModeChange("enterprise")}
          >
            <Building2 className="w-3.5 h-3.5 mr-1 inline" />
            Company Ready
          </button>
        </div>
      </div>

      <div className="nav-actions">
        <button className="nav-icon-btn" onClick={onOpenRulebook} title="Company Invariant Rulebook">
          <BookOpen className="w-4 h-4 text-cyan-300" />
          <span>Rulebook ({ruleCount})</span>
        </button>

        <button className="nav-icon-btn" onClick={onOpenSettings} title="AI Engine & API Key Settings">
          <Key className="w-4 h-4 text-emerald-400" />
          <span>{apiKey ? provider.toUpperCase() : "Semantic Engine"}</span>
        </button>

        <div className="session-status">
          <span className="live-dot"></span>
          <strong>GOVERNANCE GATE</strong>
          <span>ONLINE</span>
        </div>
      </div>
    </nav>
  );
};
