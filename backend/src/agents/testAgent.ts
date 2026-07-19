import type { ChangeAgentResult } from "./changeAgent";
import type { RuleAgentResult } from "./ruleAgent";

export interface TestAgentResult {
  agent: "Test agent";
  status: "completed";
  ruleViolated: boolean;
  finding: string;
}

export function runTestAgent(
  changeResult: ChangeAgentResult,
  ruleResult: RuleAgentResult
): TestAgentResult {
  const change = changeResult.summary.toLowerCase();
  const rule = ruleResult.discoveredRule.toLowerCase();

  let ruleViolated = false;
  let finding =
    "The proposed update does not conflict with the discovered company rule.";

  // 1. Refund manager-approval rule
  const isRefundRule =
    rule.includes("refund") &&
    rule.includes("manager approval");

  const removesRefundApproval =
    change.includes("removes") &&
    change.includes("manager approval") &&
    change.includes("refund");

  if (isRefundRule && removesRefundApproval) {
    ruleViolated = true;
    finding =
      "The proposed update conflicts with the discovered refund approval rule.";
  }

  // 2. Account lockout security rule
  const isAccountLockoutRule =
    rule.includes("account") &&
    rule.includes("locked") &&
    rule.includes("failed login");

  const removesAccountLockout =
    change.includes("removes") &&
    change.includes("account lockout");

  if (isAccountLockoutRule && removesAccountLockout) {
    ruleViolated = true;
    finding =
      "The proposed update conflicts with the discovered account lockout security rule.";
  }

  // 3. Payment approval rule
  const isPaymentApprovalRule =
    rule.includes("payment") &&
    rule.includes("approval");

  const removesPaymentApproval =
    change.includes("removes") &&
    change.includes("approval") &&
    change.includes("payment");

  if (isPaymentApprovalRule && removesPaymentApproval) {
    ruleViolated = true;
    finding =
      "The proposed update conflicts with the discovered payment approval rule.";
  }

  // 4. Data retention rule
  const isDataRetentionRule =
    rule.includes("records") &&
    rule.includes("retention");

  const removesDataRetention =
    change.includes("removes") &&
    change.includes("data retention");

  if (isDataRetentionRule && removesDataRetention) {
    ruleViolated = true;
    finding =
      "The proposed update conflicts with the discovered data retention rule.";
  }

  // 5. Multi-factor authentication rule
  const isMfaRule =
    rule.includes("multi-factor authentication");

  const removesMfa =
    change.includes("removes") &&
    change.includes("multi-factor authentication");

  if (isMfaRule && removesMfa) {
    ruleViolated = true;
    finding =
      "The proposed update conflicts with the discovered multi-factor authentication security rule.";
  }

  return {
    agent: "Test agent",
    status: "completed",
    ruleViolated,
    finding,
  };
}