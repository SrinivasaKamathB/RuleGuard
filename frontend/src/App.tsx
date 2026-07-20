import { useState } from "react";
import "./App.css";

const unsafeRecords = `Support ticket: A customer complained that their ₹8,000 refund was approved immediately without a manager.
Bug report: Large refunds must require manager approval.
Code comment: Never remove manager approval for refunds above 5000.`;

const unsafeUpdate =
  "The developer removed the manager approval check from the refund process to make refunds faster.";

const safeUpdate =
  "The developer will keep the manager approval check for refunds above 5000 while improving the refund process.";

const agentInfo = [
  {
    name: "Change Agent",
    short: "CHANGE",
    icon: "◈",
    role: "Understands what has changed",
  },
  {
    name: "Rule Agent",
    short: "DISCOVER",
    icon: "⌘",
    role: "Discovers hidden business rules",
  },
  {
    name: "Test Agent",
    short: "SIMULATE",
    icon: "△",
    role: "Tests the change against rules",
  },
  {
    name: "Safety Agent",
    short: "ASSESS",
    icon: "◇",
    role: "Makes the release recommendation",
  },
];

type AnalysisResult = {
  discoveredRule: string;
  evidence: string[];
  decision:
  | "Safe to release"
  | "Unsafe to release"
  | "Review required";
  explanation: string;
  suggestedFix: string | null;
};

function App() {
  const [oldCompanyRecords, setOldCompanyRecords] = useState(unsafeRecords);
  const [proposedUpdate, setProposedUpdate] = useState(unsafeUpdate);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeAgent, setActiveAgent] = useState(-1);
  const [completedAgents, setCompletedAgents] = useState<number[]>([]);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setCompletedAgents([]);

    try {
      for (let i = 0; i < agentInfo.length; i++) {
        setActiveAgent(i);
        await delay(600);
        setCompletedAgents((previous) => [...previous, i]);
      }

      setActiveAgent(-1);

const response = await fetch("/.netlify/functions/analyze", {        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldCompanyRecords,
          proposedUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed.");
      }

      const data = await response.json();
      setResult(data);
    } catch {
      setActiveAgent(-1);
      setError(
        "Could not connect to the RuleGuard AI backend. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setResult(null);
    setError("");
    setActiveAgent(-1);
    setCompletedAgents([]);
  };

  const loadUnsafeDemo = () => {
    setOldCompanyRecords(unsafeRecords);
    setProposedUpdate(unsafeUpdate);
    clearAnalysis();
  };

  const loadSafeDemo = () => {
    setOldCompanyRecords(unsafeRecords);
    setProposedUpdate(safeUpdate);
    clearAnalysis();
  };

  const reset = () => {
    setOldCompanyRecords("");
    setProposedUpdate("");
    clearAnalysis();
  };

  const getAgentStatus = (index: number) => {
    if (completedAgents.includes(index)) return "Completed";
    if (activeAgent === index) return "Analyzing";
    return "Waiting";
  };

  const isSafe = result?.decision === "Safe to release";
  const isReview = result?.decision === "Review required";
  return (
    <main className="app-shell">
      {/* TOP NAVIGATION */}
      <nav className="topbar">
        <div className="brand">
          <div className="brand-shield">RG</div>
          <div>
            <h1>
              RuleGuard <span>AI</span>
            </h1>
            <p>Release Intelligence · Risk Controlled</p>
          </div>
        </div>

        <div className="session-status">
          <span className="live-dot"></span>
          <strong>AI ANALYSIS SYSTEM</strong>
          <span>ONLINE</span>
        </div>

        <div className="system-secure">
          <span>◉</span>
          System Secure
        </div>
      </nav>

      {/* PAGE INTRO */}
      <section className="hero-row">
        <div>
          <p className="eyebrow">MULTI-AGENT RELEASE INTELLIGENCE</p>
          <h2>Release Journey</h2>
          <p className="hero-description">
            Every software change travels through four specialized AI agents
            before reaching the final release gate.
          </p>
        </div>

        <button
          className="new-analysis-button"
          onClick={reset}
          disabled={loading}
        >
          + New Analysis
        </button>
      </section>

      {/* RELEASE PIPELINE */}
      <section className="journey-panel">
        <div className="change-node">
          <span className="node-label">CHANGE RECEIVED</span>
          <div className="change-icon">{"</>"}</div>
          <strong>Proposed Update</strong>
          <small>Ready for inspection</small>
        </div>

        <div className="journey-arrow">→</div>

        {agentInfo.map((agent, index) => {
          const status = getAgentStatus(index);

          return (
            <div className="pipeline-group" key={agent.name}>
              <div
                className={`pipeline-agent agent-${index + 1} ${
                  status === "Analyzing" ? "is-active" : ""
                } ${status === "Completed" ? "is-completed" : ""}`}
              >
                <div className="agent-topline">
                  <span>0{index + 1}</span>
                  <small>{agent.short}</small>
                </div>

                <div className="agent-orb">{agent.icon}</div>

                <h3>{agent.name}</h3>
                <p>{agent.role}</p>

                <div className={`pipeline-status ${status.toLowerCase()}`}>
                  {status === "Completed" ? "✓ Completed" : status}
                </div>
              </div>

              <div className="journey-arrow">→</div>
            </div>
          );
        })}

        {/* RELEASE GATE */}
        <div
          className={`release-gate ${
            result
              ? isSafe
                ? "gate-safe"
                : isReview
                ? "gate-review"
                : "gate-unsafe"
              : ""
          }`}
        >
          <span className="gate-label">RELEASE GATE</span>

          <div className="gate-ring">
            <div className="gate-core">
              {!result && !loading && (
                <>
                  <span>⌁</span>
                  <strong>LOCKED</strong>
                  <small>Awaiting analysis</small>
                </>
              )}

              {loading && (
                <>
                  <span className="scanner">◌</span>
                  <strong>SCANNING</strong>
                  <small>Agents working</small>
                </>
              )}

              {result && isSafe && (
                <>
                  <span>✓</span>
                  <strong>GATE OPEN</strong>
                  <small>Safe to release</small>
                </>
              )}

              {result && isReview && (
                <>
                  <span>!</span>
                  <strong>MANUAL REVIEW</strong>
                  <small>Review required</small>
                </>
              )}

              {result && !isSafe && !isReview && (
                <>
                  <span>×</span>
                  <strong>BLOCKED</strong>
                  <small>Unsafe to release</small>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* INPUT WORKSPACE */}
      <section className="workspace-grid">
        <div className="console-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">EVIDENCE SOURCE</span>
              <h3>Old Company Records</h3>
            </div>
            <span className="header-icon">▤</span>
          </div>

          <textarea
            value={oldCompanyRecords}
            onChange={(e) => setOldCompanyRecords(e.target.value)}
            rows={9}
            placeholder="Paste historical support tickets, bug reports, code comments..."
          />
        </div>

        <div className="console-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">CHANGE REQUEST</span>
              <h3>Proposed Software Update</h3>
            </div>
            <span className="header-icon">{"</>"}</span>
          </div>

          <textarea
            value={proposedUpdate}
            onChange={(e) => setProposedUpdate(e.target.value)}
            rows={9}
            placeholder="Describe the proposed software change..."
          />
        </div>
      </section>

      {/* ACTION CONTROLS */}
      <section className="control-bar">
        <div className="demo-controls">
          <span>DEMO SCENARIOS</span>

          <button onClick={loadUnsafeDemo} disabled={loading}>
            Load Unsafe
          </button>

          <button onClick={loadSafeDemo} disabled={loading}>
            Load Safe
          </button>
        </div>

        <button
          className="analyze-button"
          onClick={runAnalysis}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner">◌</span>
              Agents Analyzing...
            </>
          ) : (
            <>▶ Run Release Analysis</>
          )}
        </button>

        <button className="reset-button" onClick={reset} disabled={loading}>
          Reset
        </button>
      </section>

      {error && <div className="error-banner">⚠ {error}</div>}

      {/* ANALYSIS OUTPUT */}
      {result && (
  <section className="intelligence-console">
    {/* DISCOVERED RULE */}
    <div className="rule-intelligence-card">
      <div className="intelligence-label">
        <span className="intelligence-dot"></span>
        RULE INTELLIGENCE
      </div>

      <div className="rule-content">
        <div className="rule-icon">!</div>

        <div className="rule-text">
          <span>HIDDEN BUSINESS RULE DISCOVERED</span>
          <h3>{result.discoveredRule}</h3>
          <p>
            This rule was reconstructed from historical company records by the
            Rule Agent.
          </p>
        </div>

        <div className="rule-status">
          <span>STATUS</span>
          <strong>PROTECTED</strong>
        </div>
      </div>
    </div>

    {/* EVIDENCE TIMELINE */}
    <div className="evidence-timeline-card">
      <div className="timeline-header">
        <div>
          <span>EVIDENCE TIMELINE</span>
          <h3>How RuleGuard discovered this rule</h3>
        </div>

        <div className="evidence-count">
          {result.evidence.length} SOURCES FOUND
        </div>
      </div>

      <div className="timeline-track">
        {result.evidence.map((item, index) => (
          <div className="timeline-node" key={index}>
            <div className="timeline-marker">
              <span>0{index + 1}</span>
            </div>

            <div className="timeline-evidence">
              <div className="evidence-topline">
                <span>
                  {index === 0
                    ? "SUPPORT RECORD"
                    : index === 1
                    ? "BUG REPORT"
                    : "CODE COMMENT"}
                </span>

                <strong>✓ VERIFIED</strong>
              </div>

              <p>{item}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ANALYSIS + EVIDENCE VAULT */}
    <div className="intelligence-bottom-grid">
      <div className="agent-analysis-card">
        <div className="panel-title">
          <span>AGENT ASSESSMENT</span>
          <h3>Safety Analysis</h3>
        </div>

        <div className="analysis-finding">
          <span>PRIMARY FINDING</span>
          <p>{result.explanation}</p>
        </div>

        {result.suggestedFix && (
          <div className="recommended-action">
            <div className="action-icon">↗</div>

            <div>
              <span>RECOMMENDED ACTION</span>
              <p>{result.suggestedFix}</p>
            </div>
          </div>
        )}

        <div className="agent-summary-row">
          <div>
            <span>CHANGE AGENT</span>
            <strong>✓ COMPLETE</strong>
          </div>

          <div>
            <span>RULE AGENT</span>
            <strong>✓ COMPLETE</strong>
          </div>

          <div>
            <span>TEST AGENT</span>
            <strong>✓ COMPLETE</strong>
          </div>

          <div>
            <span>SAFETY AGENT</span>
            <strong>✓ COMPLETE</strong>
          </div>
        </div>
      </div>

      <div className="evidence-vault-card">
        <div className="vault-header">
          <div>
            <span>EVIDENCE VAULT</span>
            <h3>Verified Rule Sources</h3>
          </div>

          <div className="vault-lock">⌾</div>
        </div>

        <div className="vault-list">
          {result.evidence.map((item, index) => (
            <div className="vault-item" key={index}>
              <div className="vault-number">0{index + 1}</div>

              <div className="vault-content">
                <span>
                  {index === 0
                    ? "HISTORICAL SUPPORT DATA"
                    : index === 1
                    ? "ENGINEERING BUG DATA"
                    : "SOURCE CODE KNOWLEDGE"}
                </span>

                <p>{item}</p>
              </div>

              <div className="vault-verified">✓</div>
            </div>
          ))}
        </div>

        <div className="vault-footer">
          <span>RULE CONFIDENCE</span>
          <strong>Evidence Verified</strong>
        </div>
      </div>
    </div>
  </section>
)}

      {/* FINAL VERDICT */}
      {result && (
        <section
          className={`final-release-verdict ${
            isSafe
              ? "verdict-safe"
              : isReview
              ? "verdict-review"
              : "verdict-unsafe"
          }`}
        >
          <div className="verdict-info">
            <span className="verdict-eyebrow">AI RELEASE VERDICT</span>

            <h2>
              {isSafe
                ? "Release Approved"
                : isReview
                ? "Manual Review Required"
                : "Release Blocked"}
            </h2>

            <p>
              {isSafe
                ? "All RuleGuard agents completed their analysis. The proposed change preserves the discovered business rule."
                : isReview
                ? "RuleGuard could not discover a reliable business rule from the provided records. Manual review is required before making a release decision."
                : "RuleGuard detected a conflict with a protected business rule. This change should not be released in its current form."}
            </p>

            <div className="verdict-agents">
              <span>CHANGE ✓</span>
              <span>RULE ✓</span>
              <span>TEST ✓</span>
              <span>SAFETY ✓</span>
            </div>
          </div>

          <div className="verdict-gate">
            <div className="verdict-ring verdict-ring-outer">
              <div className="verdict-ring verdict-ring-inner">
                <div className="verdict-core">
                  <span className="verdict-symbol">
                    {isSafe ? "✓" : isReview ? "!" : "×"}
                  </span>

                  <small>
                    {isSafe
                      ? "GATE OPEN"
                      : isReview
                      ? "MANUAL REVIEW"
                      : "GATE LOCKED"}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="verdict-decision">
            <span>FINAL DECISION</span>

            <strong>
              {isSafe
                ? "SAFE TO RELEASE"
                : isReview
                ? "REVIEW REQUIRED"
                : "UNSAFE TO RELEASE"}
            </strong>

            <p>
              {isSafe
                ? "Protected rules remain intact."
                : isReview
                ? "Insufficient rule evidence for automatic approval."
                : "Protected rule violation detected."}
            </p>

            <div className="verdict-seal">
              <span>RULEGUARD AI</span>
              <strong>ANALYSIS COMPLETE</strong>
            </div>
          </div>
        </section>
      )}

    </main>
  );
}

export default App;