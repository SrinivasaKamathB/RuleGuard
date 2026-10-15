import { useState, type FC } from "react";
import {
  FileCode,
  Search,
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Lock,
  Unlock,
  AlertOctagon,
  HelpCircle,
} from "lucide-react";
import type { RuleGuardAnalysisResponse } from "../types";

interface AgentPipelineProps {
  activeAgent: number;
  completedAgents: number[];
  result: RuleGuardAnalysisResponse | null;
  isLoading: boolean;
}

const AGENTS = [
  {
    name: "Change Agent",
    short: "INTENT",
    id: "change",
    icon: <FileCode className="w-5 h-5 text-cyan-400" />,
    role: "Semantics & Guard Check Extraction",
  },
  {
    name: "Rule Agent",
    short: "INVARIANTS",
    id: "rule",
    icon: <Search className="w-5 h-5 text-purple-400" />,
    role: "Institutional Memory & Citation Mining",
  },
  {
    name: "Test Agent",
    short: "SIMULATE",
    id: "test",
    icon: <Cpu className="w-5 h-5 text-amber-400" />,
    role: "Counter-Example Collision Simulator",
  },
  {
    name: "Safety Agent",
    short: "GOVERNANCE",
    id: "safety",
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    role: "Gate Recommendation & Auto-Patch Synthesis",
  },
];

export const AgentPipeline: FC<AgentPipelineProps> = ({
  activeAgent,
  completedAgents,
  result,
  isLoading,
}) => {
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

  const isSafe = result?.decision === "Safe to release";
  const isReview = result?.decision === "Review required";
  const isUnsafe = result?.decision === "Unsafe to release";

  const toggleThoughts = (index: number) => {
    setExpandedAgent(expandedAgent === index ? null : index);
  };

  return (
    <section className="pipeline-journey-panel">
      {/* Starting Node: Change Received */}
      <div className="pipeline-start-node">
        <span className="node-eyebrow">INPUT INGESTED</span>
        <div className="node-icon-box">
          <FileCode className="w-5 h-5 text-cyan-300" />
        </div>
        <strong>Proposed Code Diff</strong>
        <small>Queued for multi-agent audit</small>
      </div>

      <div className="journey-connector">→</div>

      {/* 4 Agent Nodes */}
      {AGENTS.map((agent, index) => {
        const isCompleted = completedAgents.includes(index) || (result !== null && !isLoading);
        const isActive = activeAgent === index;
        const trace = result?.traces?.[index];

        return (
          <div className="agent-stage-group" key={agent.name}>
            <div
              className={`pipeline-agent-card ${
                isActive ? "agent-analyzing" : isCompleted ? "agent-done" : "agent-waiting"
              }`}
            >
              <div className="agent-card-header">
                <span className="agent-number">0{index + 1}</span>
                <span className="agent-short-badge">{agent.short}</span>
              </div>

              <div className="agent-icon-halo">{agent.icon}</div>

              <h3 className="agent-title">{agent.name}</h3>
              <p className="agent-role-desc">{agent.role}</p>

              <div className="agent-status-pill">
                {isActive && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1 inline" />
                    <span>Analyzing...</span>
                  </>
                )}
                {isCompleted && (
                  <>
                    <Check className="w-3 h-3 text-emerald-400 mr-1 inline" />
                    <span>Done {trace ? `(${trace.durationMs}ms)` : ""}</span>
                  </>
                )}
                {!isActive && !isCompleted && <span>Waiting</span>}
              </div>

              {/* Thoughts toggle */}
              {trace && trace.thoughts && trace.thoughts.length > 0 && (
                <button
                  className="thoughts-expander-btn"
                  onClick={() => toggleThoughts(index)}
                  title="Toggle Agent Reasoning Log"
                >
                  <span>Thoughts ({trace.thoughts.length})</span>
                  {expandedAgent === index ? (
                    <ChevronUp className="w-3 h-3 inline" />
                  ) : (
                    <ChevronDown className="w-3 h-3 inline" />
                  )}
                </button>
              )}

              {/* Expandable Thoughts Drawer */}
              {expandedAgent === index && trace && (
                <div className="agent-thoughts-popover">
                  <div className="thoughts-title">Reasoning Log:</div>
                  <ul>
                    {trace.thoughts.map((t, tidx) => (
                      <li key={tidx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="journey-connector">→</div>
          </div>
        );
      })}

      {/* Release Gate Node */}
      <div
        className={`release-gate-card ${
          result
            ? isSafe
              ? "gate-approved"
              : isReview
              ? "gate-review-needed"
              : "gate-blocked"
            : isLoading
            ? "gate-scanning"
            : "gate-idle"
        }`}
      >
        <span className="gate-eyebrow">RELEASE GATE</span>

        <div className="gate-ring-outer">
          <div className="gate-ring-inner">
            <div className="gate-state-core">
              {!result && !isLoading && (
                <>
                  <Lock className="w-6 h-6 text-slate-400" />
                  <strong>LOCKED</strong>
                  <small>Awaiting analysis</small>
                </>
              )}

              {isLoading && (
                <>
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <strong>INSPECTING</strong>
                  <small>Agents simulating</small>
                </>
              )}

              {result && isSafe && (
                <>
                  <Unlock className="w-6 h-6 text-emerald-400" />
                  <strong className="text-emerald-400">GATE OPEN</strong>
                  <small>Release Approved</small>
                </>
              )}

              {result && isReview && (
                <>
                  <HelpCircle className="w-6 h-6 text-amber-400" />
                  <strong className="text-amber-400">REVIEW</strong>
                  <small>Manual signoff</small>
                </>
              )}

              {result && isUnsafe && (
                <>
                  <AlertOctagon className="w-6 h-6 text-rose-500" />
                  <strong className="text-rose-500">BLOCKED</strong>
                  <small>Risk: {result.riskScore}/100</small>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
