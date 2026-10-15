import { runRuleGuardAnalysis } from "../../../backend/src/orchestrator";

export default async (req: Request) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const body = await req.json();

    const {
      oldCompanyRecords,
      proposedUpdate,
      mode,
      activeInvariants,
      apiKey,
      provider,
    } = body;

    if (
      !oldCompanyRecords ||
      typeof oldCompanyRecords !== "string" ||
      !proposedUpdate ||
      typeof proposedUpdate !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error: "oldCompanyRecords and proposedUpdate must be valid non-empty string payloads.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (oldCompanyRecords.length > 500_000 || proposedUpdate.length > 500_000) {
      return new Response(
        JSON.stringify({
          error: "Payload exceeds maximum allowed length of 500,000 characters per field.",
        }),
        {
          status: 413,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = runRuleGuardAnalysis({
      oldCompanyRecords,
      proposedUpdate,
      mode: mode || "demo",
      activeInvariants,
      apiKey,
      provider,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("RuleGuard analysis error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to run RuleGuard AI analysis.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};