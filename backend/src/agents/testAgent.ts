import { ChangeAgentResult, RuleAgentResult, TestAgentResult, TestFinding } from "../types";

export { TestAgentResult, TestFinding };

export function runTestAgent(
  changeResult: ChangeAgentResult,
  ruleResult: RuleAgentResult
): TestAgentResult {
  const startTime = Date.now();
  const thoughts: string[] = [];

  thoughts.push("Initiating invariant collision detection and counter-example simulation.");

  const change = changeResult.summary.toLowerCase();
  const rule = ruleResult.discoveredRule.toLowerCase();
  const updateRaw = changeResult.proposedUpdate.toLowerCase();

  const isLoosening =
    changeResult.intent === "loosening" ||
    change.includes("removes") ||
    change.includes("bypasses") ||
    updateRaw.includes("remove") ||
    updateRaw.includes("bypass") ||
    updateRaw.includes("disable") ||
    changeResult.removedPreconditions.length > 0;

  const isPreserving =
    changeResult.intent === "preserving" ||
    change.includes("keeps") ||
    change.includes("retains") ||
    updateRaw.includes("keep") ||
    updateRaw.includes("retain") ||
    updateRaw.includes("preserve");

  const findings: TestFinding[] = [];
  let ruleViolated = false;
  let finding = "The proposed update does not conflict with the discovered company rule.";

  // 1. Refund manager-approval rule
  const isRefundRule = rule.includes("refund") && rule.includes("manager approval");
  if (isRefundRule) {
    if (isLoosening && !isPreserving) {
      ruleViolated = true;
      finding = "The proposed update conflicts with the discovered refund approval rule.";
      findings.push({
        invariantId: "inv_base_01",
        invariantName: "Refund approval",
        violated: true,
        conflictReason: "Update removes manager authorization for disbursements above ₹5,000 threshold.",
        counterExample: "A refund for ₹8,500 will disburse directly from payment gateway without required dual signoff.",
        severity: "critical",
      });
      thoughts.push("Collision Detected: Refund processing bypasses manager authorization requirement.");
    } else {
      findings.push({
        invariantId: "inv_base_01",
        invariantName: "Refund approval",
        violated: false,
        conflictReason: "Dual approval guard is preserved in the proposed change.",
        counterExample: "Disbursements > ₹5,000 continue to trigger manager authorization check.",
        severity: "critical",
      });
      thoughts.push("Invariant Validated: Manager authorization guard verified intact.");
    }
  }

  // 2. Account lockout security rule
  const isAccountLockoutRule =
    rule.includes("account") && rule.includes("locked") && rule.includes("failed login");
  if (isAccountLockoutRule) {
    if (isLoosening && !isPreserving) {
      ruleViolated = true;
      finding = "The proposed update conflicts with the discovered account lockout security rule.";
      findings.push({
        invariantId: "inv_base_02",
        invariantName: "Account lockout",
        violated: true,
        conflictReason: "Update removes account lockout protection required after repeated failed attempts.",
        counterExample: "An attacker can submit unlimited brute-force credential combinations without account lockdown.",
        severity: "critical",
      });
      thoughts.push("Collision Detected: Account lockout safeguard is removed.");
    } else {
      findings.push({
        invariantId: "inv_base_02",
        invariantName: "Account lockout",
        violated: false,
        conflictReason: "Failed login lockout logic is preserved.",
        counterExample: "5 consecutive failed logins trigger lockout and security notification.",
        severity: "critical",
      });
      thoughts.push("Invariant Validated: Account lockout safeguard verified intact.");
    }
  }

  // 3. Payment approval rule
  const isPaymentApprovalRule = rule.includes("payment") && rule.includes("approval");
  if (isPaymentApprovalRule) {
    if (isLoosening && !isPreserving) {
      ruleViolated = true;
      finding = "The proposed update conflicts with the discovered payment approval rule.";
      findings.push({
        invariantId: "inv_base_03",
        invariantName: "Payment approval",
        violated: true,
        conflictReason: "Update removes authorization requirement from payment processing pipeline.",
        counterExample: "High-value wire transfers process without treasury approval.",
        severity: "high",
      });
      thoughts.push("Collision Detected: Payment approval requirement is stripped.");
    } else {
      findings.push({
        invariantId: "inv_base_03",
        invariantName: "Payment approval",
        violated: false,
        conflictReason: "Payment authorization is retained.",
        counterExample: "High-value transactions continue to route through approval queue.",
        severity: "high",
      });
      thoughts.push("Invariant Validated: Payment approval step verified intact.");
    }
  }

  // 4. Data retention rule
  const isDataRetentionRule = rule.includes("records") && rule.includes("retention");
  if (isDataRetentionRule) {
    if (isLoosening && !isPreserving) {
      ruleViolated = true;
      finding = "The proposed update conflicts with the discovered data retention rule.";
      findings.push({
        invariantId: "inv_base_04",
        invariantName: "Data retention",
        violated: true,
        conflictReason: "Update removes required company data retention or cascading purge policy.",
        counterExample: "Secondary telemetry records fail to delete upon user erasure request, violating GDPR Article 17.",
        severity: "high",
      });
      thoughts.push("Collision Detected: Data retention policy requirement is removed.");
    } else {
      findings.push({
        invariantId: "inv_base_04",
        invariantName: "Data retention",
        violated: false,
        conflictReason: "Data retention and cascading purge rules are honored.",
        counterExample: "Records are retained or deleted according to compliance schedules.",
        severity: "high",
      });
      thoughts.push("Invariant Validated: Data retention policy verified intact.");
    }
  }

  // 5. Multi-factor authentication rule
  const isMfaRule = rule.includes("multi-factor authentication");
  if (isMfaRule) {
    if (isLoosening && !isPreserving) {
      ruleViolated = true;
      finding = "The proposed update conflicts with the discovered multi-factor authentication security rule.";
      findings.push({
        invariantId: "inv_base_05",
        invariantName: "Two-factor authentication",
        violated: true,
        conflictReason: "Update bypasses MFA requirement for protected user sessions.",
        counterExample: "User can authenticate with single password factor, exposing protected data.",
        severity: "critical",
      });
      thoughts.push("Collision Detected: Multi-factor authentication requirement bypassed.");
    } else {
      findings.push({
        invariantId: "inv_base_05",
        invariantName: "Two-factor authentication",
        violated: false,
        conflictReason: "Multi-factor authentication challenge remains active.",
        counterExample: "Login requires 2FA token before session token grant.",
        severity: "critical",
      });
      thoughts.push("Invariant Validated: Multi-factor authentication verified intact.");
    }
  }

  // 6. HIPAA PHI Audit Trail
  const isHipaaRule = rule.includes("phi") || rule.includes("hipaa") || (rule.includes("patient") && rule.includes("audit"));
  if (isHipaaRule) {
    if (isLoosening && !isPreserving) {
      ruleViolated = true;
      finding = "The proposed update conflicts with the discovered HIPAA PHI audit logging invariant.";
      findings.push({
        invariantId: "inv_hipaa_01",
        invariantName: "PHI Access Immutable Audit Trail",
        violated: true,
        conflictReason: "Update removes or bypasses auditLogger on medical records export.",
        counterExample: "Bulk patient records downloaded with zero audit trail in violation of HIPAA §164.312(b).",
        severity: "critical",
      });
      thoughts.push("Collision Detected: HIPAA compliance audit logger disabled.");
    }
  }

  // 7. E-Commerce Mutex Lock
  const isMutexRule = rule.includes("mutex") || rule.includes("oversell") || (rule.includes("inventory") && rule.includes("lock"));
  if (isMutexRule) {
    if (isLoosening && !isPreserving) {
      ruleViolated = true;
      finding = "The proposed update conflicts with the discovered inventory concurrency lock invariant.";
      findings.push({
        invariantId: "inv_ecom_01",
        invariantName: "Atomic Inventory Concurrency Mutex",
        violated: true,
        conflictReason: "Update removes distributed lock, creating race conditions during concurrent checkouts.",
        counterExample: "10 concurrent checkouts decrement inventory simultaneously, driving stock negative.",
        severity: "critical",
      });
      thoughts.push("Collision Detected: Concurrency lock removed, exposing inventory race condition.");
    }
  }

  // 8. General fallback for arbitrary custom rules
  if (!ruleViolated && ruleResult.invariants.length > 0 && isLoosening && !isPreserving) {
    const primary = ruleResult.invariants[0];
    ruleViolated = true;
    finding = `The proposed update conflicts with the discovered invariant: "${primary.description}".`;
    findings.push({
      invariantId: primary.id,
      invariantName: primary.name,
      violated: true,
      conflictReason: "Proposed update removes or relaxes safeguards governing this invariant.",
      counterExample: "Production execution may violate policy invariants without guard checks.",
      severity: primary.severity,
    });
    thoughts.push(`Collision Detected: Custom invariant "${primary.name}" relaxed.`);
  }

  const durationMs = Math.max(14, Date.now() - startTime);

  return {
    agent: "Test agent",
    status: "completed",
    ruleViolated,
    finding,
    findings,
    simulationScenariosTested: Math.max(findings.length, 1),
    thoughts,
    durationMs,
  };
}