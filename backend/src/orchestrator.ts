import crypto from "crypto";
import { runChangeAgent } from "./agents/changeAgent";
import { runRuleAgent } from "./agents/ruleAgent";
import { runTestAgent } from "./agents/testAgent";
import { runSafetyAgent } from "./agents/safetyAgent";
import { RuleGuardInput, RuleGuardAnalysisResponse, AgentExecutionTrace } from "./types";
import { scanForPromptInjectionAndValidate, generateReleaseCertificateHmac } from "./securityShield";

export { RuleGuardInput, RuleGuardAnalysisResponse };

export function runRuleGuardAnalysis(input: RuleGuardInput): RuleGuardAnalysisResponse {
  const analysisId = `rg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  const environment = input.environment || "production";

  // Pre-flight Security Scan: Detect prompt injections & validate bounds
  const secScan = scanForPromptInjectionAndValidate(input.oldCompanyRecords, input.proposedUpdate);

  // Agent 1: Change Agent - Understand the proposed software change / Git diff
  const changeResult = runChangeAgent(secScan.sanitizedUpdate, {
    apiKey: input.apiKey,
    provider: input.provider,
  });

  // Agent 2: Rule Agent - Discover hidden rules from company records or active invariants
  const ruleResult = runRuleAgent(secScan.sanitizedRecords, input.activeInvariants, {
    apiKey: input.apiKey,
    provider: input.provider,
  });

  // Agent 3: Test Agent - Test the proposed change against the discovered rules
  const testResult = runTestAgent(changeResult, ruleResult);

  // Agent 4: Safety Agent - Make the final release recommendation & synthesize patch
  const safetyResult = runSafetyAgent(testResult, ruleResult, changeResult);

  // If prompt injection was detected, elevate security and force review/block
  if (secScan.injectionDetected) {
    safetyResult.thoughts.push("SECURITY ALERT: Adversarial prompt injection pattern detected in input payload.");
    if (safetyResult.decision === "Safe to release") {
      safetyResult.decision = "Review required";
      safetyResult.explanation = "A potential prompt injection or security check bypass attempt was detected in the payload.";
      safetyResult.riskScore = Math.max(safetyResult.riskScore, 75);
      safetyResult.complianceStatus = "SECURITY_INSPECTION_MANDATORY";
    }
  }

  // Compile detailed execution traces for live UI streaming
  const traces: AgentExecutionTrace[] = [
    {
      agentId: "change",
      agentName: "Change Agent",
      status: "completed",
      durationMs: changeResult.durationMs,
      summary: changeResult.summary,
      thoughts: changeResult.thoughts,
    },
    {
      agentId: "rule",
      agentName: "Rule Agent",
      status: "completed",
      durationMs: ruleResult.durationMs,
      summary: ruleResult.discoveredRule,
      thoughts: ruleResult.thoughts,
    },
    {
      agentId: "test",
      agentName: "Test Agent",
      status: "completed",
      durationMs: testResult.durationMs,
      summary: testResult.finding,
      thoughts: testResult.thoughts,
    },
    {
      agentId: "safety",
      agentName: "Safety Agent",
      status: "completed",
      durationMs: safetyResult.durationMs,
      summary: safetyResult.explanation,
      thoughts: safetyResult.thoughts,
    },
  ];

  // Cryptographic audit fingerprint (SHA-256)
  const auditPayload = JSON.stringify({
    analysisId,
    timestamp,
    environment,
    rule: ruleResult.discoveredRule,
    changeSummary: changeResult.summary,
    decision: safetyResult.decision,
    evidenceCount: ruleResult.evidence.length,
    injectionDetected: secScan.injectionDetected,
  });
  const fingerprintSha256 = crypto.createHash("sha256").update(auditPayload).digest("hex");

  // Server-side HMAC-SHA256 signature to prevent tampering
  const signatureHmac = generateReleaseCertificateHmac(fingerprintSha256, safetyResult.decision, timestamp);

  return {
    id: analysisId,
    timestamp,
    mode: input.mode || "demo",
    environment,
    engineUsed:
      input.apiKey && input.provider !== "heuristic"
        ? (input.provider === "openai" ? "openai" : "gemini")
        : "semantic_heuristic",

    // Legacy backwards-compatible fields
    discoveredRule: ruleResult.discoveredRule,
    evidence: ruleResult.evidence,
    testResult,
    decision: safetyResult.decision,
    explanation: safetyResult.explanation,
    suggestedFix: safetyResult.suggestedFix,

    // 2.0 Extended enterprise fields
    riskScore: safetyResult.riskScore,
    riskLevel: safetyResult.riskLevel,
    primaryViolation: safetyResult.primaryViolation,
    suggestedPatch: safetyResult.suggestedPatch,
    complianceStatus: safetyResult.complianceStatus,
    invariants: ruleResult.invariants,
    changeAnalysis: changeResult,
    testFindings: testResult.findings,
    securityScan: {
      injectionDetected: secScan.injectionDetected,
      warnings: secScan.warnings,
      payloadIntegrity: secScan.isSuspicious ? "SUSPICIOUS" : "VERIFIED",
    },
    reviewerSignOff: input.reviewerSignOff,

    agents: {
      changeAgent: changeResult,
      ruleAgent: ruleResult,
      testAgent: testResult,
      safetyAgent: safetyResult,
    },

    traces,
    auditCertificate: {
      fingerprintSha256,
      signatureHmac,
      signingAlgorithm: "HMAC-SHA256",
      timestamp,
      verifiedInvariantsCount: ruleResult.invariants.length,
      decision: safetyResult.decision,
      status: safetyResult.complianceStatus,
      environment,
      reviewerSignOff: input.reviewerSignOff,
    },
  };
}