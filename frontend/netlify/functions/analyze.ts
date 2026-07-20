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

    const { oldCompanyRecords, proposedUpdate } = body;

    if (!oldCompanyRecords || !proposedUpdate) {
      return new Response(
        JSON.stringify({
          error: "Old company records and proposed update are required.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await runRuleGuardAnalysis({
      oldCompanyRecords,
      proposedUpdate,
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