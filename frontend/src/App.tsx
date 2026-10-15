import { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { HeroBar } from "./components/HeroBar";
import { AgentPipeline } from "./components/AgentPipeline";
import { DiffViewer } from "./components/DiffViewer";
import { IntelligenceDeck } from "./components/IntelligenceDeck";
import { CompanyRulebookModal } from "./components/CompanyRulebookModal";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { AuditCertificateModal } from "./components/AuditCertificateModal";
import { INDUSTRY_PRESETS } from "./data/industryPresets";
import type {
  RuleGuardAnalysisResponse,
  RuleInvariant,
  IndustryPreset,
} from "./types";
import { Play, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import "./App.css";

const STORAGE_KEY_INVARIANTS = "ruleguard_invariants_v2";
const STORAGE_KEY_APIKEY = "ruleguard_apikey_v2";
const STORAGE_KEY_PROVIDER = "ruleguard_provider_v2";

export function App() {
  const [mode, setMode] = useState<"demo" | "enterprise">("demo");
  const [selectedPreset, setSelectedPreset] = useState<IndustryPreset>(INDUSTRY_PRESETS[0]);

  const [oldCompanyRecords, setOldCompanyRecords] = useState(INDUSTRY_PRESETS[0].historicalRecords);
  const [proposedUpdate, setProposedUpdate] = useState(INDUSTRY_PRESETS[0].unsafeUpdate);

  const [result, setResult] = useState<RuleGuardAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeAgent, setActiveAgent] = useState(-1);
  const [completedAgents, setCompletedAgents] = useState<number[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Invariants state
  const [companyInvariants, setCompanyInvariants] = useState<RuleInvariant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVARIANTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INDUSTRY_PRESETS.flatMap((p) => p.defaultInvariants);
  });

  // API Key state
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_APIKEY) || "";
  });
  const [provider, setProvider] = useState<"gemini" | "openai" | "heuristic">(() => {
    return (localStorage.getItem(STORAGE_KEY_PROVIDER) as any) || "heuristic";
  });

  // Modals state
  const [isRulebookOpen, setIsRulebookOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Persist invariants and settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INVARIANTS, JSON.stringify(companyInvariants));
  }, [companyInvariants]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveSettings = (newKey: string, newProvider: "gemini" | "openai" | "heuristic") => {
    setApiKey(newKey);
    setProvider(newProvider);
    localStorage.setItem(STORAGE_KEY_APIKEY, newKey);
    localStorage.setItem(STORAGE_KEY_PROVIDER, newProvider);
    showNotification(`Settings saved: ${newProvider.toUpperCase()} mode active.`);
  };

  const handleSelectPreset = (preset: IndustryPreset) => {
    setSelectedPreset(preset);
    setOldCompanyRecords(preset.historicalRecords);
    setProposedUpdate(preset.unsafeUpdate);
    setResult(null);
    setError("");
    setActiveAgent(-1);
    setCompletedAgents([]);
  };

  const handleLoadUnsafe = () => {
    setProposedUpdate(selectedPreset.unsafeUpdate);
    setResult(null);
    setError("");
    setActiveAgent(-1);
    setCompletedAgents([]);
    showNotification(`Loaded unsafe modification for ${selectedPreset.name}`);
  };

  const handleLoadSafe = () => {
    setProposedUpdate(selectedPreset.safeUpdate);
    setResult(null);
    setError("");
    setActiveAgent(-1);
    setCompletedAgents([]);
    showNotification(`Loaded safe modification for ${selectedPreset.name}`);
  };

  const handleReset = () => {
    setOldCompanyRecords("");
    setProposedUpdate("");
    setResult(null);
    setError("");
    setActiveAgent(-1);
    setCompletedAgents([]);
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setError("");
    setActiveAgent(-1);
    setCompletedAgents([]);
    if (mode === "demo") {
      setOldCompanyRecords(selectedPreset.historicalRecords);
      setProposedUpdate(selectedPreset.unsafeUpdate);
    }
  };

  const runAnalysis = useCallback(async () => {
    if (!oldCompanyRecords.trim() || !proposedUpdate.trim()) {
      setError("Please provide both historical company records and a proposed software change.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);
    setCompletedAgents([]);

    try {
      // Step through the 4 agents with visual responsiveness
      for (let i = 0; i < 4; i++) {
        setActiveAgent(i);
        await new Promise((res) => setTimeout(res, 350));
        setCompletedAgents((prev) => [...prev, i]);
      }
      setActiveAgent(-1);

      // Attempt /api/analyze, fallback to Netlify function if running on serverless
      let response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldCompanyRecords,
          proposedUpdate,
          mode,
          activeInvariants: companyInvariants.filter((i) => i.isActive),
          apiKey,
          provider,
        }),
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch("/.netlify/functions/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldCompanyRecords,
            proposedUpdate,
            mode,
            activeInvariants: companyInvariants.filter((i) => i.isActive),
            apiKey,
            provider,
          }),
        });
      }

      if (!response.ok) {
        throw new Error("Analysis execution failed on the backend.");
      }

      const data: RuleGuardAnalysisResponse = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setActiveAgent(-1);
      setError(
        "Could not connect to the RuleGuard AI backend. Ensure the backend server is running on http://localhost:3001 or Netlify serverless is deployed."
      );
    } finally {
      setIsLoading(false);
    }
  }, [oldCompanyRecords, proposedUpdate, mode, companyInvariants, apiKey, provider]);

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to trigger analysis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isLoading) {
          runAnalysis();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runAnalysis, isLoading]);

  const handleApplyPatch = (patch: string) => {
    // If we have selected preset safeUpdate, apply that for high fidelity, otherwise the patch
    const targetUpdate = selectedPreset ? selectedPreset.safeUpdate : patch;
    setProposedUpdate(targetUpdate);
    showNotification("✨ Auto-Remediation patch applied to editor! Re-running safety analysis...");
    setTimeout(() => {
      runAnalysis();
    }, 400);
  };

  const handleToggleInvariant = (id: string) => {
    setCompanyInvariants((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i))
    );
  };

  const handleAddInvariant = (newInv: RuleInvariant) => {
    setCompanyInvariants((prev) => [newInv, ...prev]);
    showNotification(`Added new company invariant: "${newInv.name}"`);
  };

  const handleDeleteInvariant = (id: string) => {
    setCompanyInvariants((prev) => prev.filter((i) => i.id !== id));
    showNotification("Invariant removed from rulebook.");
  };

  return (
    <main className="app-shell">
      {/* Toast Notification */}
      {notification && (
        <div className="toast-notification">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 inline mr-2" />
          <span>{notification}</span>
        </div>
      )}

      {/* TOPBAR */}
      <Navbar
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          setResult(null);
          showNotification(`Switched to ${m === "demo" ? "Demo Showcase" : "Company Ready"} mode`);
        }}
        apiKey={apiKey}
        provider={provider}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRulebook={() => setIsRulebookOpen(true)}
        ruleCount={companyInvariants.filter((i) => i.isActive).length}
      />

      {/* HERO & SCENARIO SELECTION */}
      <HeroBar
        mode={mode}
        presets={INDUSTRY_PRESETS}
        selectedPresetId={selectedPreset.id}
        onSelectPreset={handleSelectPreset}
        onLoadUnsafe={handleLoadUnsafe}
        onLoadSafe={handleLoadSafe}
        onReset={handleReset}
        onNewAnalysis={handleNewAnalysis}
        isLoading={isLoading}
      />

      {/* 4-AGENT PIPELINE & DYNAMIC RELEASE GATE */}
      <AgentPipeline
        activeAgent={activeAgent}
        completedAgents={completedAgents}
        result={result}
        isLoading={isLoading}
      />

      {/* DUAL-PANE INTERACTIVE WORKSPACE */}
      <section className="workspace-grid">
        {/* Left Pane: Historical Evidence & Company Records */}
        <div className="console-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">ORGANIZATIONAL MEMORY</span>
              <h3>Historical Records & Policies</h3>
            </div>
            <button
              className="card-header-action-btn"
              onClick={() => setIsRulebookOpen(true)}
              title="Open Company Invariants Rulebook"
            >
              <BookOpen className="w-4 h-4 mr-1 inline" />
              Rulebook ({companyInvariants.filter((i) => i.isActive).length})
            </button>
          </div>

          <div className="card-body-editor">
            <textarea
              className="records-textarea"
              value={oldCompanyRecords}
              onChange={(e) => setOldCompanyRecords(e.target.value)}
              rows={11}
              placeholder="Paste historical support tickets, bug post-mortems, compliance directives, code comments..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Pane: Proposed Code Diff Inspector */}
        <div className="console-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">CHANGE UNDER AUDIT</span>
              <h3>Proposed Git Diff / Code Change</h3>
            </div>
            <div className="card-header-badge">
              <span>UNIFIED INSPECTOR</span>
            </div>
          </div>

          <div className="card-body-editor">
            <DiffViewer
              value={proposedUpdate}
              onChange={setProposedUpdate}
              placeholder="Paste unified git diff (--- a/... +++ b/...) or raw function code snippet..."
              rows={11}
            />
          </div>
        </div>
      </section>

      {/* CONTROL & EXECUTION BAR */}
      <section className="execution-control-bar">
        <div className="shortcut-hint">
          <span>Tip: Press </span>
          <kbd>Cmd</kbd> + <kbd>Enter</kbd>
          <span> to run analysis instantly</span>
        </div>

        <button
          className="run-analysis-btn"
          onClick={runAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="button-spinner">◌</span>
              Executing Multi-Agent Audit...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current mr-2 inline" />
              Run Multi-Agent Safety Analysis
            </>
          )}
        </button>
      </section>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="error-banner">
          <AlertCircle className="w-5 h-5 text-rose-400 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* INTELLIGENCE & VERDICT DECK */}
      {result && (
        <IntelligenceDeck
          result={result}
          onApplyPatch={handleApplyPatch}
          onOpenAuditModal={() => setIsAuditModalOpen(true)}
        />
      )}

      {/* MODALS */}
      <CompanyRulebookModal
        isOpen={isRulebookOpen}
        onClose={() => setIsRulebookOpen(false)}
        invariants={companyInvariants}
        onToggleInvariant={handleToggleInvariant}
        onAddInvariant={handleAddInvariant}
        onDeleteInvariant={handleDeleteInvariant}
      />

      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        provider={provider}
        onSave={handleSaveSettings}
      />

      <AuditCertificateModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        result={result}
      />
    </main>
  );
}

export default App;