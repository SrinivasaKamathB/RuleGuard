export type InvariantCategory =
  | "financial"
  | "security"
  | "compliance"
  | "operational"
  | "privacy";

export type InvariantSeverity = "critical" | "high" | "medium" | "low";

export interface RuleInvariant {
  id: string;
  name: string;
  category: InvariantCategory;
  severity: InvariantSeverity;
  description: string;
  evidenceKeywords: string[];
  evidence: string[];
  confidenceScore: number;
  origin: "mined" | "company_preset" | "manual";
  isActive: boolean;
}

export interface ChangeAgentResult {
  agent: "Change agent";
  status: "completed";
  summary: string;
  diffType: "git_diff" | "code_snippet" | "text_summary";
  intent: "loosening" | "bypassing" | "preserving" | "enhancing" | "refactoring";
  affectedEntities: string[];
  removedPreconditions: string[];
  blastRadius: "low" | "medium" | "high";
  proposedUpdate: string;
  thoughts: string[];
  durationMs: number;
}

export interface RuleAgentResult {
  agent: "Rule agent";
  status: "completed";
  discoveredRule: string;
  invariants: RuleInvariant[];
  evidence: string[];
  overallConfidence: number;
  thoughts: string[];
  durationMs: number;
}

export interface TestFinding {
  invariantId: string;
  invariantName: string;
  violated: boolean;
  conflictReason: string;
  counterExample: string;
  severity: InvariantSeverity;
}

export interface TestAgentResult {
  agent: "Test agent";
  status: "completed";
  ruleViolated: boolean;
  finding: string;
  findings: TestFinding[];
  simulationScenariosTested: number;
  thoughts: string[];
  durationMs: number;
}

export type ReleaseDecision =
  | "Safe to release"
  | "Unsafe to release"
  | "Review required";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SafetyAgentResult {
  agent: "Safety agent";
  status: "completed";
  decision: ReleaseDecision;
  riskScore: number;
  riskLevel: RiskLevel;
  explanation: string;
  primaryViolation: string | null;
  suggestedFix: string | null;
  suggestedPatch: string | null;
  complianceStatus: string;
  thoughts: string[];
  durationMs: number;
}

export interface AgentExecutionTrace {
  agentId: "change" | "rule" | "test" | "safety";
  agentName: string;
  status: "completed" | "failed";
  durationMs: number;
  summary: string;
  thoughts: string[];
}

export interface ReviewerSignOff {
  signedBy: string;
  reviewerRole: string;
  signedAt: string;
  comments?: string;
  approvalStatus: "APPROVED" | "REJECTED" | "CONDITIONALLY_APPROVED";
}

export interface SecurityScanInfo {
  injectionDetected: boolean;
  warnings: string[];
  payloadIntegrity: "VERIFIED" | "SUSPICIOUS";
}

export interface RuleGuardAnalysisResponse {
  id: string;
  timestamp: string;
  mode: "demo" | "enterprise";
  environment: "development" | "staging" | "production" | "audit";
  engineUsed: "gemini" | "openai" | "semantic_heuristic";
  
  discoveredRule: string;
  evidence: string[];
  decision: ReleaseDecision;
  explanation: string;
  suggestedFix: string | null;
  testResult: TestAgentResult;
  
  riskScore: number;
  riskLevel: RiskLevel;
  primaryViolation: string | null;
  suggestedPatch: string | null;
  complianceStatus: string;
  invariants: RuleInvariant[];
  changeAnalysis: ChangeAgentResult;
  testFindings: TestFinding[];
  securityScan: SecurityScanInfo;
  reviewerSignOff?: ReviewerSignOff;
  
  agents: {
    changeAgent: ChangeAgentResult;
    ruleAgent: RuleAgentResult;
    testAgent: TestAgentResult;
    safetyAgent: SafetyAgentResult;
  };
  
  traces: AgentExecutionTrace[];
  auditCertificate: {
    fingerprintSha256: string;
    signatureHmac: string;
    signingAlgorithm: "HMAC-SHA256";
    timestamp: string;
    verifiedInvariantsCount: number;
    decision: ReleaseDecision;
    status: string;
    environment: string;
    reviewerSignOff?: ReviewerSignOff;
  };
}

export interface IndustryPreset {
  id: string;
  name: string;
  badge: string;
  domain: string;
  icon: string;
  description: string;
  historicalRecords: string;
  unsafeUpdate: string;
  safeUpdate: string;
  suggestedPatch: string;
  defaultInvariants: RuleInvariant[];
}
