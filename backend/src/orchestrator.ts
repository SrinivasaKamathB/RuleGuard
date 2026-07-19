import { runChangeAgent } from "./agents/changeAgent";
import { runRuleAgent } from "./agents/ruleAgent";
import { runTestAgent } from "./agents/testAgent";
import { runSafetyAgent } from "./agents/safetyAgent";

export interface RuleGuardInput {
  oldCompanyRecords: string;
  proposedUpdate: string;
}

export function runRuleGuardAnalysis(input: RuleGuardInput) {
  // Agent 1: Understand the proposed software change
  const changeResult = runChangeAgent(input.proposedUpdate);

  // Agent 2: Discover hidden rules from old company records
  const ruleResult = runRuleAgent(input.oldCompanyRecords);

  // Agent 3: Test the proposed change against the discovered rule
  const testResult = runTestAgent(changeResult, ruleResult);

  // Agent 4: Make the final safety recommendation
  const safetyResult = runSafetyAgent(testResult, ruleResult);

  return {
    discoveredRule: ruleResult.discoveredRule,

    agents: {
      changeAgent: changeResult,
      ruleAgent: ruleResult,
      testAgent: testResult,
      safetyAgent: safetyResult,
    },

    evidence: ruleResult.evidence,
    testResult,
    decision: safetyResult.decision,
    explanation: safetyResult.explanation,
    suggestedFix: safetyResult.suggestedFix,
  };
}