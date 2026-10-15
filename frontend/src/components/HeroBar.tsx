import type { FC } from "react";
import type { IndustryPreset } from "../types";
import { AlertTriangle, CheckCircle, RotateCcw, Plus } from "lucide-react";

interface HeroBarProps {
  mode: "demo" | "enterprise";
  presets: IndustryPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: IndustryPreset) => void;
  onLoadUnsafe: () => void;
  onLoadSafe: () => void;
  onReset: () => void;
  onNewAnalysis: () => void;
  isLoading: boolean;
}

export const HeroBar: FC<HeroBarProps> = ({
  mode,
  presets,
  selectedPresetId,
  onSelectPreset,
  onLoadUnsafe,
  onLoadSafe,
  onReset,
  onNewAnalysis,
  isLoading,
}) => {
  return (
    <section className="hero-section">
      <div className="hero-header">
        <div>
          <div className="eyebrow-badge">
            {mode === "demo" ? "INTERACTIVE SCENARIO EVALUATION" : "ENTERPRISE RELEASE GOVERNANCE PIPELINE"}
          </div>
          <h2>Multi-Agent Release Journey</h2>
          <p className="hero-description">
            {mode === "demo"
              ? "Select an industry scenario to simulate how RuleGuard detects latent policy regressions in real code changes."
              : "Paste your company's historical tickets, incident RCAs, and proposed Git diff to execute formal invariant governance."}
          </p>
        </div>

        <div className="hero-actions">
          <button className="secondary-btn" onClick={onReset} disabled={isLoading}>
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Reset
          </button>
          <button className="primary-action-btn" onClick={onNewAnalysis} disabled={isLoading}>
            <Plus className="w-4 h-4 inline mr-1" /> New Analysis
          </button>
        </div>
      </div>

      {mode === "demo" && (
        <div className="preset-selector-bar">
          <div className="preset-chips">
            {presets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  className={`preset-chip ${isSelected ? "active" : ""}`}
                  onClick={() => onSelectPreset(preset)}
                  disabled={isLoading}
                >
                  <span className="preset-icon">{preset.icon}</span>
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-badge">{preset.badge}</span>
                </button>
              );
            })}
          </div>

          <div className="quick-load-controls">
            <button
              className="quick-unsafe-btn"
              onClick={onLoadUnsafe}
              disabled={isLoading}
              title="Load code change that violates the latent rule"
            >
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> Load Unsafe Change
            </button>
            <button
              className="quick-safe-btn"
              onClick={onLoadSafe}
              disabled={isLoading}
              title="Load code change that preserves the latent rule"
            >
              <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Load Safe Change
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
