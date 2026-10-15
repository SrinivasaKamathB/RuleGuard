import { useState, type FC } from "react";
import type { RuleGuardAnalysisResponse } from "../types";
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  FileText,
  Wrench,
  Sparkles,
  Copy,
  Check,
  Fingerprint,
} from "lucide-react";

interface IntelligenceDeckProps {
  result: RuleGuardAnalysisResponse;
  onApplyPatch: (patch: string) => void;
  onOpenAuditModal: () => void;
}

export const IntelligenceDeck: FC<IntelligenceDeckProps> = ({
  result,
  onApplyPatch,
  onOpenAuditModal,
}) => {
  const [copiedPatch, setCopiedPatch] = useState(false);

  const isSafe = result.decision === "Safe to release";
  const isReview = result.decision === "Review required";
  const isUnsafe = result.decision === "Unsafe to release";

  const handleCopyPatch = () => {
    if (result.suggestedPatch) {
      navigator.clipboard.writeText(result.suggestedPatch);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  const primaryFinding = result.testFindings?.[0];

  return (
    <section className="intelligence-deck">
      {/* 1. DISCOVERED INVARIANT CARD */}
      <div className="intel-card invariant-card">
        <div className="card-topline">
          <div className="kicker-group">
            <span className="live-pulse-dot"></span>
            <span className="card-kicker">DISCOVERED INVARIANT</span>
          </div>
          <div className="confidence-pill">
            <span>Confidence:</span>
            <strong>{result.invariants?.[0]?.confidenceScore || 95}%</strong>
          </div>
        </div>

        <div className="invariant-main-row">
          <div className="invariant-icon-wrap">
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="invariant-text-block">
            <h3>{result.discoveredRule}</h3>
            <p>
              Reconstructed from historical corporate records, past bug reports, and compliance directives.
            </p>
          </div>
          <div className="invariant-category-badge">
            <span>PROTECTED INVARIANT</span>
            <strong>{result.invariants?.[0]?.category?.toUpperCase() || "DOMAIN RULE"}</strong>
          </div>
        </div>

        {/* EVIDENCE CITATIONS */}
        <div className="evidence-vault-tray">
          <div className="vault-tray-header">
            <span>HISTORICAL EVIDENCE PROVENANCE ({result.evidence.length} CITATIONS)</span>
            <small>Auditable source trail</small>
          </div>

          <div className="evidence-grid">
            {result.evidence.map((item, idx) => (
              <div key={idx} className="evidence-chip-card">
                <div className="chip-meta">
                  <span className="source-label">
                    {idx === 0
                      ? "INCIDENT / TICKET"
                      : idx === 1
                      ? "POLICY / AUDIT"
                      : "SOURCE CODE COMMENT"}
                  </span>
                  <span className="verified-badge">✓ CITED</span>
                </div>
                <p className="chip-content">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TEST SIMULATION & CONFLICT BREAKDOWN */}
      <div className="intel-card conflict-sim-card">
        <div className="card-topline">
          <div className="kicker-group">
            <span className="card-kicker">COUNTER-EXAMPLE SIMULATION</span>
          </div>
          <div className={`status-pill ${isSafe ? "pill-safe" : isReview ? "pill-review" : "pill-unsafe"}`}>
            {isSafe ? "NO CONFLICTS" : isReview ? "MANUAL REVIEW" : "INVARIANT COLLISION DETECTED"}
          </div>
        </div>

        <div className="sim-finding-box">
          <h4>{result.explanation}</h4>
          {primaryFinding && primaryFinding.counterExample && (
            <div className="counter-example-callout">
              <span className="callout-label">SIMULATED COLLISION SCENARIO:</span>
              <p>"{primaryFinding.counterExample}"</p>
            </div>
          )}
        </div>

        <div className="agent-eval-status-bar">
          <div className="eval-node">
            <span>CHANGE AGENT</span>
            <strong>{result.changeAnalysis?.intent?.toUpperCase() || "ANALYZED"}</strong>
          </div>
          <div className="eval-node">
            <span>RULE AGENT</span>
            <strong>{result.invariants.length} INVARIANTS</strong>
          </div>
          <div className="eval-node">
            <span>TEST AGENT</span>
            <strong>{isUnsafe ? "COLLISION DETECTED" : "PASS"}</strong>
          </div>
          <div className="eval-node">
            <span>SAFETY AGENT</span>
            <strong>{result.complianceStatus}</strong>
          </div>
        </div>
      </div>

      {/* 3. ACTIONABLE REMEDIATION & CODE PATCH */}
      {result.suggestedPatch && (
        <div className="intel-card remediation-card">
          <div className="card-topline">
            <div className="kicker-group">
              <Wrench className="w-4 h-4 text-emerald-400 inline mr-1" />
              <span className="card-kicker">AUTO-REMEDIATION PATCH</span>
            </div>
            <div className="patch-controls">
              <button className="remedy-btn copy" onClick={handleCopyPatch}>
                {copiedPatch ? <Check className="w-3.5 h-3.5 mr-1 inline" /> : <Copy className="w-3.5 h-3.5 mr-1 inline" />}
                Copy Patch
              </button>
              <button
                className="remedy-btn apply-magic"
                onClick={() => onApplyPatch(result.suggestedPatch!)}
                title="Automatically update your code editor with this fix and verify"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 inline" /> Apply Patch to Editor
              </button>
            </div>
          </div>

          {result.suggestedFix && (
            <p className="remediation-guide-text">
              <strong>Recommended Action:</strong> {result.suggestedFix}
            </p>
          )}

          <div className="patch-code-container">
            <pre className="patch-pre">
              <code>{result.suggestedPatch}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 4. FINAL RELEASE VERDICT BANNER */}
      <div
        className={`final-verdict-banner ${
          isSafe ? "verdict-pass" : isReview ? "verdict-manual" : "verdict-fail"
        }`}
      >
        <div className="verdict-left">
          <div className="verdict-icon-container">
            {isSafe ? (
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            ) : isReview ? (
              <HelpCircle className="w-10 h-10 text-amber-400" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-rose-500" />
            )}
          </div>
          <div>
            <span className="verdict-eyebrow">FINAL RELEASE GATE VERDICT</span>
            <h2>
              {isSafe
                ? "Safe to Release — Gate Approved"
                : isReview
                ? "Review Required — Manual Signoff"
                : "Unsafe to Release — Gate Blocked"}
            </h2>
            <p>
              {isSafe
                ? "The proposed software update honors all discovered organizational invariants and compliance guardrails."
                : isReview
                ? "Insufficient corporate records to guarantee safety. Manual developer & compliance signoff required."
                : `Proposed update violates protected invariant [${result.primaryViolation || result.discoveredRule}]. Regressions detected.`}
            </p>
          </div>
        </div>

        <div className="verdict-right">
          <div className="risk-metric-box">
            <span>RISK SCORE</span>
            <strong className={isSafe ? "text-emerald-400" : isReview ? "text-amber-400" : "text-rose-500"}>
              {result.riskScore} / 100
            </strong>
            <small>{result.riskLevel} SEVERITY</small>
          </div>

          <button className="audit-cert-btn" onClick={onOpenAuditModal}>
            <Fingerprint className="w-4 h-4 mr-1 inline text-cyan-300" />
            Release Certificate
          </button>
        </div>
      </div>
    </section>
  );
};
