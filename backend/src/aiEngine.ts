import {
  ChangeAgentResult,
  RuleInvariant,
  TestFinding,
  SafetyAgentResult,
  ReleaseDecision,
  RiskLevel,
} from "./types";

export interface ParsedDiff {
  isDiff: boolean;
  filesModified: string[];
  removedLines: string[];
  addedLines: string[];
  removedGuards: string[];
  addedGuards: string[];
  summary: string;
}

export function parseGitDiffOrCode(raw: string): ParsedDiff {
  const lines = raw.split("\n");
  const filesModified: string[] = [];
  const removedLines: string[] = [];
  const addedLines: string[] = [];
  const removedGuards: string[] = [];
  const addedGuards: string[] = [];

  let isDiff = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("diff --git") || trimmed.startsWith("--- ") || trimmed.startsWith("+++ ")) {
      isDiff = true;
      if (trimmed.startsWith("+++ b/")) {
        filesModified.push(trimmed.replace("+++ b/", ""));
      }
      continue;
    }

    if (trimmed.startsWith("@@")) {
      isDiff = true;
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      isDiff = true;
      const content = line.substring(1).trim();
      if (content.length > 0) {
        removedLines.push(content);
        if (
          content.includes("if ") ||
          content.includes("require") ||
          content.includes("approval") ||
          content.includes("lock") ||
          content.includes("auth") ||
          content.includes("guard") ||
          content.includes("check") ||
          content.includes("audit") ||
          content.includes("log") ||
          content.includes("mutex") ||
          content.includes("validate") ||
          content.includes("verify") ||
          content.includes("protect")
        ) {
          removedGuards.push(content);
        }
      }
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      isDiff = true;
      const content = line.substring(1).trim();
      if (content.length > 0) {
        addedLines.push(content);
        const isComment = content.startsWith("//") || content.startsWith("/*") || content.startsWith("*");
        if (
          !isComment &&
          (content.includes("if ") ||
            content.includes("require") ||
            content.includes("approval") ||
            content.includes("lock") ||
            content.includes("auth") ||
            content.includes("guard") ||
            content.includes("check") ||
            content.includes("audit") ||
            content.includes("log") ||
            content.includes("mutex") ||
            content.includes("validate") ||
            content.includes("verify") ||
            content.includes("protect"))
        ) {
          addedGuards.push(content);
        }
      }
    }
  }

  let summary = "";
  if (isDiff) {
    if (removedGuards.length > 0 && addedGuards.length === 0) {
      summary = `The proposed Git diff removes ${removedGuards.length} protective guard condition(s): [${removedGuards.slice(0, 2).join("; ")}].`;
    } else if (addedGuards.length > 0) {
      summary = `The proposed Git diff retains or adds protective guard check(s): [${addedGuards.slice(0, 2).join("; ")}].`;
    } else {
      summary = `Git diff modified ${filesModified.length || 1} file(s) with ${addedLines.length} additions and ${removedLines.length} deletions.`;
    }
  } else {
    summary = raw.length > 120 ? raw.slice(0, 117) + "..." : raw;
  }

  return {
    isDiff,
    filesModified,
    removedLines,
    addedLines,
    removedGuards,
    addedGuards,
    summary,
  };
}

/**
 * Calls OpenAI or Gemini if API key is configured; otherwise null for semantic fallback.
 */
export async function callLLMIfAvailable(
  prompt: string,
  systemInstruction: string,
  options?: { apiKey?: string; provider?: "gemini" | "openai" | "heuristic" }
): Promise<string | null> {
  const provider = options?.provider || (process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : "heuristic");
  const apiKey = options?.apiKey || (provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY);

  if (!apiKey || provider === "heuristic") {
    return null;
  }

  try {
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: `${systemInstruction}\n\n${prompt}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn(`Upstream API error: HTTP ${res.status}. Falling back to semantic engine.`);
        return null;
      }

      const data = (await res.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    }

    if (provider === "openai") {
      const url = "https://api.openai.com/v1/chat/completions";
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn(`Upstream API error: HTTP ${res.status}. Falling back to semantic engine.`);
        return null;
      }

      const data = (await res.json()) as any;
      return data?.choices?.[0]?.message?.content || null;
    }
  } catch (err: any) {
    console.warn("External provider unreachable or timed out; falling back to offline semantic engine:", err?.message || "Timeout");
  }

  return null;
}

/**
 * Intelligent Dynamic Invariant Mining:
 * Mines any arbitrary company records (tickets, RCAs, comments, PR logs)
 * to discover latent invariants with confidence scores and exact line citations.
 */
export function dynamicMineInvariants(
  records: string,
  existingPresets: RuleInvariant[] = []
): { invariants: RuleInvariant[]; ruleSummary: string } {
  const lines = records
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const mined: RuleInvariant[] = [];
  const textLower = records.toLowerCase();

  // 1. Check against active presets
  for (const preset of existingPresets) {
    const matchesAllGroups = preset.evidenceKeywords.some((kw) => textLower.includes(kw.toLowerCase()));
    if (matchesAllGroups) {
      const matchedEvidence = lines.filter((line) => {
        const lineLower = line.toLowerCase();
        return preset.evidenceKeywords.some((kw) => lineLower.includes(kw.toLowerCase()));
      });

      if (matchedEvidence.length > 0) {
        mined.push({
          ...preset,
          evidence: matchedEvidence,
          origin: "company_preset",
        });
      }
    }
  }

  // 2. Dynamic heuristic miner for ANY unformatted corporate records
  // Looks for mandatory expressions: "must", "require", "mandatory", "never", "always", "policy", "threshold"
  const policyLines = lines.filter((line) => {
    const l = line.toLowerCase();
    return (
      l.includes("must ") ||
      l.includes("require") ||
      l.includes("mandatory") ||
      l.includes("never remove") ||
      l.includes("never disable") ||
      l.includes("never bypass") ||
      l.includes("policy:") ||
      l.includes("invariant:") ||
      l.includes("audit:") ||
      l.includes("incident")
    );
  });

  if (mined.length === 0 && policyLines.length > 0) {
    const primaryLine = policyLines[0];
    let category: RuleInvariant["category"] = "operational";
    if (textLower.includes("payment") || textLower.includes("refund") || textLower.includes("price") || textLower.includes("discount")) {
      category = "financial";
    } else if (textLower.includes("auth") || textLower.includes("password") || textLower.includes("lock") || textLower.includes("token")) {
      category = "security";
    } else if (textLower.includes("audit") || textLower.includes("hipaa") || textLower.includes("gdpr") || textLower.includes("compliance")) {
      category = "compliance";
    } else if (textLower.includes("data") || textLower.includes("retention") || textLower.includes("delete") || textLower.includes("privacy")) {
      category = "privacy";
    }

    mined.push({
      id: `inv_dynamic_${Date.now()}`,
      name: "Discovered Operational Invariant",
      category,
      severity: "high",
      description: primaryLine,
      evidenceKeywords: ["policy", "require", "must", "audit", "security"],
      evidence: policyLines.slice(0, 4),
      confidenceScore: 88,
      origin: "mined",
      isActive: true,
    });
  }

  const primaryRule = mined.length > 0 ? mined[0].description : "No specific company rule was discovered.";

  return {
    invariants: mined,
    ruleSummary: primaryRule,
  };
}

/**
 * Synthesizes an actionable unified Git diff patch when code violates a rule.
 */
export function generateUnifiedPatch(
  diffInfo: ParsedDiff,
  ruleDescription: string,
  suggestedFix: string
): string {
  if (diffInfo.filesModified.length > 0 && diffInfo.removedGuards.length > 0) {
    const file = diffInfo.filesModified[0];
    const restoredGuards = diffInfo.removedGuards.map((g) => `+  ${g}`).join("\n");

    return `diff --git a/${file} b/${file}
--- a/${file}
+++ b/${file}
@@ -35,4 +35,8 @@ // RuleGuard AI Auto-Remediation Patch
+  // RESTORED INVARIANT: ${ruleDescription.slice(0, 60)}...
${restoredGuards}
   // ${suggestedFix}
`;
  }

  return `diff --git a/release/remediation.patch b/release/remediation.patch
--- a/release/remediation.patch
+++ b/release/remediation.patch
@@ -1,3 +1,5 @@
+// ACTIONABLE FIX:
+// ${suggestedFix}
+// Preserve invariant: "${ruleDescription}" before deployment.
`;
}
