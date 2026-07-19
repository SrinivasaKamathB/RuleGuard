export interface RuleAgentResult {
  agent: "Rule agent";
  status: "completed";
  discoveredRule: string;
  evidence: string[];
}

interface RuleDefinition {
  name: string;
  requiredKeywordGroups: string[][];
  evidenceKeywords: string[];
  discoveredRule: string;
}

const ruleCatalog: RuleDefinition[] = [
  {
    name: "Refund approval",
    requiredKeywordGroups: [
      ["refund", "refunds"],
      ["manager approval", "manager authorization"],
    ],
    evidenceKeywords: [
      "refund",
      "refunds",
      "manager approval",
      "manager authorization",
    ],
    discoveredRule:
      "Refunds above ₹5,000 need manager approval.",
  },

  {
    name: "Account lockout",
    requiredKeywordGroups: [
      ["account", "accounts", "login"],
      ["lock", "locked", "lockout"],
      ["failed", "failed login"],
    ],
    evidenceKeywords: [
      "account",
      "accounts",
      "login",
      "lock",
      "locked",
      "lockout",
      "failed",
    ],
    discoveredRule:
      "User accounts must be locked after repeated failed login attempts.",
  },

  {
    name: "Payment approval",
    requiredKeywordGroups: [
      ["payment", "payments"],
      ["approval", "authorization"],
    ],
    evidenceKeywords: [
      "payment",
      "payments",
      "approval",
      "authorization",
    ],
    discoveredRule:
      "High-value payments require approval before processing.",
  },

  {
    name: "Data retention",
    requiredKeywordGroups: [
      ["data", "records"],
      ["retain", "retained", "retention", "keep"],
    ],
    evidenceKeywords: [
      "data",
      "records",
      "retain",
      "retained",
      "retention",
    ],
    discoveredRule:
      "Company records must be retained according to the required data retention policy.",
  },

  {
    name: "Two-factor authentication",
    requiredKeywordGroups: [
      ["two-factor", "2fa", "multi-factor", "mfa"],
      ["authentication", "verification", "login"],
    ],
    evidenceKeywords: [
      "two-factor",
      "2fa",
      "multi-factor",
      "mfa",
      "authentication",
      "verification",
      "login",
    ],
    discoveredRule:
      "Protected user access requires multi-factor authentication.",
  },
];

export function runRuleAgent(
  oldCompanyRecords: string
): RuleAgentResult {
  const normalizedRecords = oldCompanyRecords.toLowerCase();

  const collectEvidence = (keywords: string[]) => {
    return oldCompanyRecords
      .split("\n")
      .map((record) => record.trim())
      .filter((record) => record.length > 0)
      .filter((record) => {
        const normalizedRecord = record.toLowerCase();

        return keywords.some((keyword) =>
          normalizedRecord.includes(keyword)
        );
      });
  };

  for (const ruleDefinition of ruleCatalog) {
    const ruleDetected =
      ruleDefinition.requiredKeywordGroups.every(
        (keywordGroup) =>
          keywordGroup.some((keyword) =>
            normalizedRecords.includes(keyword)
          )
      );

    if (ruleDetected) {
      return {
        agent: "Rule agent",
        status: "completed",
        discoveredRule:
          ruleDefinition.discoveredRule,
        evidence: collectEvidence(
          ruleDefinition.evidenceKeywords
        ),
      };
    }
  }

  return {
    agent: "Rule agent",
    status: "completed",
    discoveredRule:
      "No specific company rule was discovered.",
    evidence: [],
  };
}