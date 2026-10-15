import { runRuleGuardAnalysis } from "./orchestrator";
import { INDUSTRY_PRESETS } from "./data/industryPresets";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

console.log("🚀 Running RuleGuard AI 2.0 Enterprise Test Suite...\n");

// Test 1: Real Git Diff input handling
const diffUnsafeResult = runRuleGuardAnalysis({
  oldCompanyRecords: INDUSTRY_PRESETS[0].historicalRecords,
  proposedUpdate: INDUSTRY_PRESETS[0].unsafeUpdate,
  mode: "enterprise",
});

assert(diffUnsafeResult.decision === "Unsafe to release", "Git diff removing manager approval must be Unsafe");
assert(diffUnsafeResult.changeAnalysis.diffType === "git_diff", "Must detect unified git diff format");
assert(diffUnsafeResult.changeAnalysis.intent === "loosening", "Must detect loosening intent");
assert(diffUnsafeResult.riskScore > 80, "Risk score must be high for critical refund violation");
assert(diffUnsafeResult.suggestedPatch !== null, "Must generate actionable unified patch");
assert(diffUnsafeResult.auditCertificate.fingerprintSha256.length === 64, "Must generate valid SHA-256 fingerprint");
console.log("✅ Test 1 Passed: Real Git Diff input parsing & risk scoring");

// Test 2: Git Diff safe scenario
const diffSafeResult = runRuleGuardAnalysis({
  oldCompanyRecords: INDUSTRY_PRESETS[0].historicalRecords,
  proposedUpdate: INDUSTRY_PRESETS[0].safeUpdate,
  mode: "enterprise",
});

assert(diffSafeResult.decision === "Safe to release", "Git diff retaining manager approval must be Safe");
assert(diffSafeResult.riskScore < 20, "Safe change must have low risk score");
console.log("✅ Test 2 Passed: Real Git Diff safe preservation");

// Test 3: Healthcare HIPAA PHI audit logging preset
const hipaaPreset = INDUSTRY_PRESETS.find((p) => p.id === "healthcare_hipaa")!;
const hipaaUnsafe = runRuleGuardAnalysis({
  oldCompanyRecords: hipaaPreset.historicalRecords,
  proposedUpdate: hipaaPreset.unsafeUpdate,
});

assert(hipaaUnsafe.decision === "Unsafe to release", "HIPAA audit log removal must be marked Unsafe");
assert(hipaaUnsafe.riskLevel === "CRITICAL", "HIPAA audit bypass must be CRITICAL severity");
console.log("✅ Test 3 Passed: Healthcare HIPAA PHI compliance violation detected");

// Test 4: E-Commerce Inventory Concurrency Mutex preset
const ecomPreset = INDUSTRY_PRESETS.find((p) => p.id === "ecommerce_inventory")!;
const ecomUnsafe = runRuleGuardAnalysis({
  oldCompanyRecords: ecomPreset.historicalRecords,
  proposedUpdate: ecomPreset.unsafeUpdate,
});

assert(ecomUnsafe.decision === "Unsafe to release", "Inventory mutex removal must be marked Unsafe");
assert(ecomUnsafe.testFindings.some((f) => f.violated), "Must include detailed test findings");
console.log("✅ Test 4 Passed: E-Commerce concurrency mutex invariant evaluated");

// Test 5: Dynamic Invariant Mining from arbitrary unformatted text
const arbitraryRecords = `
INCIDENT-991 [CRITICAL]: Internal API endpoint /export/raw was invoked without encryption key rotation check.
Security Policy Sec-9: Data export endpoints must verify KMS key rotation status before initiating byte stream.
Comment in export.py: Never disable KMS key rotation check prior to streaming export data.
`;

const dynamicResult = runRuleGuardAnalysis({
  oldCompanyRecords: arbitraryRecords,
  proposedUpdate: "The developer disabled the KMS key rotation check to accelerate export streaming.",
  mode: "enterprise",
});

assert(dynamicResult.decision === "Unsafe to release", "Dynamic policy violation must be caught");
assert(dynamicResult.invariants.length > 0, "Must dynamically mine invariants from arbitrary records");
assert(dynamicResult.evidence.length > 0, "Must extract verbatim citation lines");
console.log("✅ Test 5 Passed: Dynamic invariant mining & citation on arbitrary corporate records");

console.log("\n🎉 ALL RULEGUARD AI 2.0 ADVANCED TESTS PASSED SUCCESSFULLY!");
