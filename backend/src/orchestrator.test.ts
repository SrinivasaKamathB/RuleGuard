import { runRuleGuardAnalysis } from "./orchestrator";

const oldCompanyRecords = `
Support ticket: A customer complained that their ₹8,000 refund was approved immediately without a manager.
Bug report: Large refunds must require manager approval.
Code comment: Never remove manager approval for refunds above 5000.
`;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

// Test 1: Unsafe scenario
const unsafeResult = runRuleGuardAnalysis({
  oldCompanyRecords,
  proposedUpdate:
    "The developer removed the manager approval check from the refund process to make refunds faster.",
});

assert(
  unsafeResult.decision === "Unsafe to release",
  "Unsafe update should be marked Unsafe to release"
);

assert(
  unsafeResult.testResult.ruleViolated === true,
  "Unsafe update should violate the discovered rule"
);

console.log("✅ Unsafe scenario test passed");

// Test 2: Safe scenario
const safeResult = runRuleGuardAnalysis({
  oldCompanyRecords,
  proposedUpdate:
    "The developer will keep the manager approval check for refunds above 5000 while improving the refund process.",
});

assert(
  safeResult.decision === "Safe to release",
  "Safe update should be marked Safe to release"
);

assert(
  safeResult.testResult.ruleViolated === false,
  "Safe update should not violate the discovered rule"
);

console.log("✅ Safe scenario test passed");
// Test 3: Account lockout scenario
const accountLockoutResult = runRuleGuardAnalysis({
  oldCompanyRecords: `Security policy: User accounts must be locked after repeated failed login attempts.
Bug report: Accounts were not locked after multiple failed login attempts.`,
  proposedUpdate:
    "The developer removed the account lockout mechanism to simplify the login process.",
});

assert(
  accountLockoutResult.decision === "Unsafe to release",
  "Account lockout scenario should be marked Unsafe to release"
);

console.log("✅ Account lockout scenario test passed");


// Test 4: Payment approval scenario
const paymentApprovalResult = runRuleGuardAnalysis({
  oldCompanyRecords: `Finance policy: High-value payments require approval before processing.
Audit report: Payment authorization must be retained for large transactions.`,
  proposedUpdate:
    "The developer removed the payment approval requirement to process payments faster.",
});

assert(
  paymentApprovalResult.decision === "Unsafe to release",
  "Payment approval scenario should be marked Unsafe to release"
);

console.log("✅ Payment approval scenario test passed");
// Test 5: Data retention unsafe scenario
const dataRetentionUnsafeResult = runRuleGuardAnalysis({
  oldCompanyRecords: `Compliance policy: Company records must be retained according to the required data retention policy.
Audit report: Business data retention requirements must be followed.`,
  proposedUpdate:
    "The developer removed the data retention policy to reduce storage costs.",
});

assert(
  dataRetentionUnsafeResult.decision === "Unsafe to release",
  "Data retention unsafe scenario should be marked Unsafe to release"
);

console.log("✅ Data retention unsafe scenario test passed");


// Test 6: Data retention safe scenario
const dataRetentionSafeResult = runRuleGuardAnalysis({
  oldCompanyRecords: `Compliance policy: Company records must be retained according to the required data retention policy.
Audit report: Business data retention requirements must be followed.`,
  proposedUpdate:
    "The developer will keep the data retention policy while optimizing storage.",
});

assert(
  dataRetentionSafeResult.decision === "Safe to release",
  "Data retention safe scenario should be marked Safe to release"
);

console.log("✅ Data retention safe scenario test passed");


// Test 7: MFA unsafe scenario
const mfaUnsafeResult = runRuleGuardAnalysis({
  oldCompanyRecords: `Security policy: Protected user access requires multi-factor authentication.
Security audit: MFA verification must be enabled for protected user login.`,
  proposedUpdate:
    "The developer removed multi-factor authentication to simplify user login.",
});

assert(
  mfaUnsafeResult.decision === "Unsafe to release",
  "MFA unsafe scenario should be marked Unsafe to release"
);

console.log("✅ MFA unsafe scenario test passed");


// Test 8: MFA safe scenario
const mfaSafeResult = runRuleGuardAnalysis({
  oldCompanyRecords: `Security policy: Protected user access requires multi-factor authentication.
Security audit: MFA verification must be enabled for protected user login.`,
  proposedUpdate:
    "The developer will keep multi-factor authentication while improving the login experience.",
});

assert(
  mfaSafeResult.decision === "Safe to release",
  "MFA safe scenario should be marked Safe to release"
);

console.log("✅ MFA safe scenario test passed");
// Test: No recognizable rule should require manual review
const noRuleResult = runRuleGuardAnalysis({
  oldCompanyRecords:
    "The company cafeteria serves lunch from 12 PM to 2 PM.",
  proposedUpdate:
    "The developer changed the dashboard background layout.",
});

assert(
  noRuleResult.decision === "Review required",
  "Unknown rule scenario should be marked Review required"
);

console.log("✅ No-rule review scenario test passed");
console.log("🎉 All RuleGuard AI backend tests passed");