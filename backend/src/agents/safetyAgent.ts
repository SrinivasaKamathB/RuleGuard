import type { TestAgentResult } from "./testAgent";
import type { RuleAgentResult } from "./ruleAgent";

export interface SafetyAgentResult {
  agent: "Safety agent";
  status: "completed";
  decision:
  | "Safe to release"
  | "Unsafe to release"
  | "Review required";
  explanation: string;
  suggestedFix: string | null;
}

export function runSafetyAgent(
  testResult: TestAgentResult,
  ruleResult: RuleAgentResult
): SafetyAgentResult {
  const rule = ruleResult.discoveredRule.toLowerCase();
  // No reliable rule was discovered.
// Do not automatically approve an unknown situation.
if (
  ruleResult.discoveredRule ===
  "No specific company rule was discovered."
) {
  return {
    agent: "Safety agent",
    status: "completed",
    decision: "Review required",
    explanation:
      "RuleGuard could not discover a reliable business rule from the provided company records.",
    suggestedFix:
      "Review the company records manually or provide additional historical evidence before approving this release.",
  };
}
  // No rule violation detected
  if (!testResult.ruleViolated) {
    return {
      agent: "Safety agent",
      status: "completed",
      decision: "Safe to release",
      explanation:
        "The proposed update does not violate the discovered company rule.",
      suggestedFix: null,
    };
  }

  // 1. Refund manager-approval violation
  if (
    rule.includes("refund") &&
    rule.includes("manager approval")
  ) {
    return {
      agent: "Safety agent",
      status: "completed",
      decision: "Unsafe to release",
      explanation:
        "The update allows refunds above ₹5,000 without manager approval.",
      suggestedFix:
        "Restore manager approval for refunds above ₹5,000.",
    };
  }

  // 2. Account lockout security violation
  if (
    rule.includes("account") &&
    rule.includes("failed login")
  ) {
    return {
      agent: "Safety agent",
      status: "completed",
      decision: "Unsafe to release",
      explanation:
        "The update removes an account lockout protection required after repeated failed login attempts.",
      suggestedFix:
        "Restore the account lockout mechanism for repeated failed login attempts.",
    };
  }

  // 3. Payment approval violation
  if (
    rule.includes("payment") &&
    rule.includes("approval")
  ) {
    return {
      agent: "Safety agent",
      status: "completed",
      decision: "Unsafe to release",
      explanation:
        "The update removes an approval requirement for high-value payments.",
      suggestedFix:
        "Restore the required approval step before high-value payments are processed.",
    };
  }

  // 4. Data retention violation
  if (
    rule.includes("records") &&
    rule.includes("retention")
  ) {
    return {
      agent: "Safety agent",
      status: "completed",
      decision: "Unsafe to release",
      explanation:
        "The update removes a required company data retention policy.",
      suggestedFix:
        "Restore the required data and record retention policy before releasing the update.",
    };
  }

  // 5. Multi-factor authentication violation
  if (rule.includes("multi-factor authentication")) {
    return {
      agent: "Safety agent",
      status: "completed",
      decision: "Unsafe to release",
      explanation:
        "The update removes multi-factor authentication required for protected user access.",
      suggestedFix:
        "Restore the multi-factor authentication requirement for protected user access.",
    };
  }

  // Fallback for any other detected violation
  return {
    agent: "Safety agent",
    status: "completed",
    decision: "Unsafe to release",
    explanation:
      "The proposed update conflicts with a discovered company rule.",
    suggestedFix:
      "Review the proposed change and preserve the discovered business rule before release.",
  };
}