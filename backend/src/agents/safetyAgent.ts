import {
  SafetyAgentResult,
  TestAgentResult,
  RuleAgentResult,
  ChangeAgentResult,
  RiskLevel,
} from "../types";
import { generateUnifiedPatch, parseGitDiffOrCode } from "../aiEngine";
import { INDUSTRY_PRESETS } from "../data/industryPresets";

export { SafetyAgentResult };

export function runSafetyAgent(
  testResult: TestAgentResult,
  ruleResult: RuleAgentResult,
  changeResult?: ChangeAgentResult
): SafetyAgentResult {
  const startTime = Date.now();
  const thoughts: string[] = [];

  thoughts.push("Evaluating test simulation vectors to compute release gate recommendation.");

  const rule = ruleResult.discoveredRule.toLowerCase();

  // 1. No reliable rule discovered -> Fail-closed review required
  if (ruleResult.discoveredRule === "No specific company rule was discovered.") {
    thoughts.push("Insufficient institutional evidence: defaulting to fail-closed manual review.");
    return {
      agent: "Safety agent",
      status: "completed",
      decision: "Review required",
      riskScore: 50,
      riskLevel: "MEDIUM",
      explanation:
        "RuleGuard could not discover a reliable business rule from the provided company records.",
      primaryViolation: null,
      suggestedFix:
        "Review the company records manually or provide additional historical evidence before approving this release.",
      suggestedPatch: null,
      complianceStatus: "MANUAL_AUDIT_PENDING",
      thoughts,
      durationMs: Math.max(10, Date.now() - startTime),
    };
  }

  // 2. Safe to release -> No violations
  if (!testResult.ruleViolated) {
    thoughts.push("Zero invariant collisions detected across all simulation vectors. Release approved.");
    return {
      agent: "Safety agent",
      status: "completed",
      decision: "Safe to release",
      riskScore: 4,
      riskLevel: "LOW",
      explanation: "The proposed update does not violate the discovered company rule.",
      primaryViolation: null,
      suggestedFix: null,
      suggestedPatch: null,
      complianceStatus: "COMPLIANT_VERIFIED",
      thoughts,
      durationMs: Math.max(10, Date.now() - startTime),
    };
  }

  // 3. Unsafe violations detected
  let explanation = "The proposed update conflicts with a discovered company rule.";
  let suggestedFix = "Review the proposed change and preserve the discovered business rule before release.";
  let primaryViolation = ruleResult.discoveredRule;
  let riskScore = 90;
  let riskLevel: RiskLevel = "HIGH";
  let suggestedPatch: string | null = null;

  // Check if matching an industry preset for an ultra-clean patch
  const diffInfo = changeResult ? parseGitDiffOrCode(changeResult.proposedUpdate) : parseGitDiffOrCode("");

  // Domain 1: Refund manager-approval violation
  if (rule.includes("refund") && rule.includes("manager approval")) {
    explanation = "The update allows refunds above ₹5,000 without manager approval.";
    suggestedFix = "Restore manager approval for refunds above ₹5,000.";
    primaryViolation = "Refunds above ₹5,000 need manager approval.";
    riskScore = 96;
    riskLevel = "CRITICAL";

    const preset = INDUSTRY_PRESETS.find((p) => p.id === "fintech_refund");
    suggestedPatch = preset ? preset.suggestedPatch : generateUnifiedPatch(diffInfo, primaryViolation, suggestedFix);
  }

  // Domain 2: Account lockout security violation
  else if (rule.includes("account") && (rule.includes("lock") || rule.includes("failed login"))) {
    explanation = "The update removes an account lockout protection required after repeated failed login attempts.";
    suggestedFix = "Restore the account lockout mechanism for repeated failed login attempts.";
    primaryViolation = "User accounts must be locked after repeated failed login attempts.";
    riskScore = 95;
    riskLevel = "CRITICAL";

    const preset = INDUSTRY_PRESETS.find((p) => p.id === "security_lockout");
    suggestedPatch = preset ? preset.suggestedPatch : generateUnifiedPatch(diffInfo, primaryViolation, suggestedFix);
  }

  // Domain 3: Payment approval violation
  else if (rule.includes("payment") && rule.includes("approval")) {
    explanation = "The update removes an approval requirement for high-value payments.";
    suggestedFix = "Restore the required approval step before high-value payments are processed.";
    primaryViolation = "High-value payments require approval before processing.";
    riskScore = 92;
    riskLevel = "HIGH";
    suggestedPatch = generateUnifiedPatch(diffInfo, primaryViolation, suggestedFix);
  }

  // Domain 4: Data retention violation
  else if (rule.includes("records") && rule.includes("retention")) {
    explanation = "The update removes a required company data retention policy.";
    suggestedFix = "Restore the required data and record retention policy before releasing the update.";
    primaryViolation = "Company records must be retained according to the required data retention policy.";
    riskScore = 88;
    riskLevel = "HIGH";

    const preset = INDUSTRY_PRESETS.find((p) => p.id === "privacy_gdpr");
    suggestedPatch = preset ? preset.suggestedPatch : generateUnifiedPatch(diffInfo, primaryViolation, suggestedFix);
  }

  // Domain 5: Multi-factor authentication violation
  else if (rule.includes("multi-factor authentication") || rule.includes("mfa") || rule.includes("2fa")) {
    explanation = "The update removes multi-factor authentication required for protected user access.";
    suggestedFix = "Restore the multi-factor authentication requirement for protected user access.";
    primaryViolation = "Protected user access requires multi-factor authentication.";
    riskScore = 97;
    riskLevel = "CRITICAL";
    suggestedPatch = generateUnifiedPatch(diffInfo, primaryViolation, suggestedFix);
  }

  // Domain 6: Healthcare HIPAA
  else if (rule.includes("phi") || rule.includes("hipaa") || (rule.includes("patient") && rule.includes("audit"))) {
    explanation = "The update removes mandatory immutable audit logging required for protected health information (PHI) export.";
    suggestedFix = "Restore immutable audit logging on all patient data export routines.";
    primaryViolation = "All patient medical records exports must write an immutable audit log.";
    riskScore = 98;
    riskLevel = "CRITICAL";

    const preset = INDUSTRY_PRESETS.find((p) => p.id === "healthcare_hipaa");
    suggestedPatch = preset ? preset.suggestedPatch : generateUnifiedPatch(diffInfo, primaryViolation, suggestedFix);
  }

  // Domain 7: E-Commerce Inventory Concurrency
  else if (rule.includes("inventory") || rule.includes("mutex") || rule.includes("oversell")) {
    explanation = "The update disables atomic mutex locking during inventory stock reservation, risking negative overselling.";
    suggestedFix = "Restore atomic distributed mutex locking on stock reservation routines.";
    primaryViolation = "Orders cannot be committed without an atomic inventory mutex lock.";
    riskScore = 94;
    riskLevel = "CRITICAL";

    const preset = INDUSTRY_PRESETS.find((p) => p.id === "ecommerce_inventory");
    suggestedPatch = preset ? preset.suggestedPatch : generateUnifiedPatch(diffInfo, primaryViolation, suggestedFix);
  } else {
    suggestedPatch = generateUnifiedPatch(diffInfo, primaryViolation, suggestedFix);
  }

  thoughts.push(`Gate decision: BLOCKED (Unsafe). Risk score assessed at ${riskScore}/100 [${riskLevel}]. Auto-patch synthesized.`);

  return {
    agent: "Safety agent",
    status: "completed",
    decision: "Unsafe to release",
    riskScore,
    riskLevel,
    explanation,
    primaryViolation,
    suggestedFix,
    suggestedPatch,
    complianceStatus: "POLICY_VIOLATION_DETECTED",
    thoughts,
    durationMs: Math.max(12, Date.now() - startTime),
  };
}