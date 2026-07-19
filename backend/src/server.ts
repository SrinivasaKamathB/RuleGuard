import express from "express";
import cors from "cors";
import { runRuleGuardAnalysis } from "./orchestrator";

const app = express();
const PORT = process.env.PORT || 3001;

// Allow the React frontend to communicate with this backend
app.use(cors());

// Allow the backend to receive JSON data
app.use(express.json());

// Simple test route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "RuleGuard AI backend is running",
  });
});

app.get("/api/demo-data", (req, res) => {
  res.json({
    oldCompanyRecords: `Support ticket: A customer complained that their ₹8,000 refund was approved immediately without a manager.
Bug report: Large refunds must require manager approval.
Code comment: Never remove manager approval for refunds above 5000.`,

    unsafeUpdate:
      "The developer removed the manager approval check from the refund process to make refunds faster.",

    safeUpdate:
      "The developer will keep the manager approval check for refunds above 5000 while improving the refund process.",
  });
});


app.post("/api/analyze", (req, res) => {
  const { oldCompanyRecords, proposedUpdate } = req.body;

  if (!oldCompanyRecords || !proposedUpdate) {
    return res.status(400).json({
      error: "Old company records and proposed update are required.",
    });
  }

  const result = runRuleGuardAnalysis({
    oldCompanyRecords,
    proposedUpdate,
  });

  return res.json(result);
});

app.listen(PORT, () => {
  console.log(`RuleGuard AI backend running on http://localhost:${PORT}`);
});