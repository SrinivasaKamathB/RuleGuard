import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function discoverRuleWithAI(
  oldCompanyRecords: string
): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    instructions: `
You are the Rule Agent inside RuleGuard AI.

Analyze historical company records and reconstruct the most important
business rule that a proposed software change must not violate.

Return only one clear business rule.
Do not include explanations or additional text.
`,
    input: oldCompanyRecords,
  });

  return response.output_text.trim();
}
