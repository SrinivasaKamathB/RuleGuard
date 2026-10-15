#!/usr/bin/env node

import fs from "fs";
import { runRuleGuardAnalysis } from "./orchestrator";
import { INDUSTRY_PRESETS } from "./data/industryPresets";

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    // If no stdin data after 500ms and TTY, return empty
    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

async function main() {
  const args = process.argv.slice(2);

  let diffPath = "";
  let recordsPath = "";
  let environment = "production";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--diff" && args[i + 1]) diffPath = args[++i];
    if (args[i] === "--records" && args[i + 1]) recordsPath = args[++i];
    if (args[i] === "--env" && args[i + 1]) environment = args[++i];
    if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
🛡️ RuleGuard AI 2.0 - CI/CD Release Safety Gate CLI

Usage:
  npx tsx src/cli.ts [options]
  git diff origin/main...HEAD | npx tsx src/cli.ts

Options:
  --diff <path>       Path to unified git diff or patch file
  --records <path>    Path to company records/tickets text file (Optional, defaults to catalog)
  --env <name>        Target deployment environment (development | staging | production)
  -h, --help          Show this help message

Exit Codes:
  0 = Safe to release (Gate Open)
  1 = Invariant violation detected (Release Blocked)
  2 = Review required / Missing records
`);
      process.exit(0);
    }
  }

  let diffContent = "";
  if (diffPath && fs.existsSync(diffPath)) {
    diffContent = fs.readFileSync(diffPath, "utf8");
  } else {
    diffContent = await readStdin();
  }

  if (!diffContent.trim()) {
    console.error("❌ Error: No code diff provided. Pass via --diff <file> or pipe via stdin.");
    process.exit(2);
  }

  let recordsContent = "";
  if (recordsPath && fs.existsSync(recordsPath)) {
    recordsContent = fs.readFileSync(recordsPath, "utf8");
  } else {
    // Default to combined industry records if not provided
    recordsContent = INDUSTRY_PRESETS.map((p) => p.historicalRecords).join("\n\n");
  }

  console.log(`
============================================================
🛡️  RULEGUARD AI 2.0 - PRE-RELEASE GOVERNANCE GATE
============================================================
Target Environment: ${environment.toUpperCase()}
Timestamp:          ${new Date().toISOString()}
Analyzing software change for latent invariant collisions...
`);

  const result = runRuleGuardAnalysis({
    oldCompanyRecords: recordsContent,
    proposedUpdate: diffContent,
    mode: "enterprise",
    environment: environment as any,
  });

  console.log(`Discovered Invariant: "${result.discoveredRule}"`);
  console.log(`Change Intent:        ${result.changeAnalysis.intent.toUpperCase()}`);
  console.log(`Blast Radius:         ${result.changeAnalysis.blastRadius.toUpperCase()}`);
  console.log(`Risk Score:           ${result.riskScore}/100 [${result.riskLevel}]`);
  console.log(`Audit Fingerprint:    ${result.auditCertificate.fingerprintSha256}`);
  console.log(`HMAC Signature:       ${result.auditCertificate.signatureHmac.slice(0, 32)}...`);
  console.log("------------------------------------------------------------");

  if (result.decision === "Safe to release") {
    console.log("✅ RELEASE APPROVED: Zero invariant violations detected.");
    console.log(`Reasoning: ${result.explanation}`);
    process.exit(0);
  } else if (result.decision === "Unsafe to release") {
    console.log("❌ RELEASE BLOCKED: High-risk business rule regression detected.");
    console.log(`Primary Violation: ${result.primaryViolation}`);
    console.log(`Explanation:       ${result.explanation}`);
    if (result.suggestedFix) {
      console.log(`Suggested Action:  ${result.suggestedFix}`);
    }
    if (result.suggestedPatch) {
      console.log("\nSuggested Remediation Patch:");
      console.log(result.suggestedPatch);
    }
    process.exit(1);
  } else {
    console.log("⚠️ MANUAL REVIEW REQUIRED: Insufficient rule confidence.");
    console.log(`Reasoning: ${result.explanation}`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("Fatal CLI Execution Error:", err);
  process.exit(2);
});
