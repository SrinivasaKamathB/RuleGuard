import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { runRuleGuardAnalysis } from "./orchestrator";
import { INDUSTRY_PRESETS } from "./data/industryPresets";
import { verifyReleaseCertificateHmac } from "./securityShield";
import { RuleInvariant, ReviewerSignOff } from "./types";

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Enterprise Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*", "https://*"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS Configuration (Customizable via ALLOWED_ORIGINS env)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or requests with no origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      // Strict blocking in production mode
      if (process.env.NODE_ENV === "production") {
        return callback(new Error(`CORS policy violation: origin '${origin}' is not allowed.`));
      }
      // Permissive fallback for local development
      return callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-API-Key"],
    credentials: true,
  })
);

// 3. Rate Limiting Protection (DoS & Resource Exhaustion Defense)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." },
});

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 analysis calls per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Analysis rate limit exceeded. Please wait a moment before running another audit." },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Verification rate limit exceeded. Please wait a moment." },
});

app.use("/api/", apiLimiter);

// 4. Body Parser with Secure Payload Caps
app.use(express.json({ limit: "2mb" }));
app.disable("x-powered-by");

// Route: Health & System Diagnostics
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "2.0.0-enterprise",
    service: "RuleGuard Release Intelligence Engine",
    securityShield: "ENABLED",
    rateLimiting: "ACTIVE",
    hmacSigning: "ENABLED",
    availablePresets: INDUSTRY_PRESETS.length,
    timestamp: new Date().toISOString(),
  });
});

// Route: Get all presets
app.get("/api/presets", (req, res) => {
  res.json(INDUSTRY_PRESETS);
});

// Legacy backward-compatible demo data route
app.get("/api/demo-data", (req, res) => {
  const fintech = INDUSTRY_PRESETS[0];
  res.json({
    oldCompanyRecords: fintech.historicalRecords,
    unsafeUpdate: fintech.unsafeUpdate,
    safeUpdate: fintech.safeUpdate,
    presets: INDUSTRY_PRESETS,
  });
});

// Route: Core Analysis Execution
app.post("/api/analyze", analyzeLimiter, (req, res) => {
  const {
    oldCompanyRecords,
    proposedUpdate,
    mode,
    environment,
    activeInvariants,
    apiKey,
    provider,
    reviewerSignOff,
  } = req.body;

  // Strict input validation & payload bounding
  if (!oldCompanyRecords || typeof oldCompanyRecords !== "string") {
    return res.status(400).json({
      error: "oldCompanyRecords must be a non-empty string payload.",
    });
  }

  if (!proposedUpdate || typeof proposedUpdate !== "string") {
    return res.status(400).json({
      error: "proposedUpdate must be a non-empty string payload.",
    });
  }

  if (oldCompanyRecords.length > 500_000 || proposedUpdate.length > 500_000) {
    return res.status(413).json({
      error: "Payload exceeds maximum allowed length of 500,000 characters per field.",
    });
  }

  // Sanitize mode and environment
  const safeMode = mode === "demo" ? "demo" : "enterprise";
  const validEnvs = ["production", "staging", "development"];
  const safeEnv = validEnvs.includes(environment) ? environment : "production";

  // Sanitize activeInvariants array if provided
  let safeInvariants: RuleInvariant[] | undefined = undefined;
  if (Array.isArray(activeInvariants)) {
    safeInvariants = activeInvariants
      .filter((inv): inv is RuleInvariant => Boolean(inv && typeof inv === "object" && typeof inv.title === "string"))
      .slice(0, 100);
  }

  // Sanitize reviewerSignOff if provided
  let safeSignOff: ReviewerSignOff | undefined = undefined;
  if (reviewerSignOff && typeof reviewerSignOff === "object" && typeof reviewerSignOff.signedBy === "string") {
    safeSignOff = {
      signedBy: String(reviewerSignOff.signedBy).slice(0, 100),
      reviewerRole: String(reviewerSignOff.reviewerRole || "Engineer").slice(0, 100),
      signedAt: String(reviewerSignOff.signedAt || new Date().toISOString()).slice(0, 50),
      comments: reviewerSignOff.comments ? String(reviewerSignOff.comments).slice(0, 500) : undefined,
      approvalStatus: ["APPROVED", "REJECTED", "CONDITIONALLY_APPROVED"].includes(reviewerSignOff.approvalStatus)
        ? reviewerSignOff.approvalStatus
        : "APPROVED",
    };
  }

  try {
    const result = runRuleGuardAnalysis({
      oldCompanyRecords,
      proposedUpdate,
      mode: safeMode,
      environment: safeEnv,
      activeInvariants: safeInvariants,
      apiKey: typeof apiKey === "string" ? apiKey.slice(0, 256) : undefined,
      provider: provider === "gemini" || provider === "openai" || provider === "heuristic" ? provider : undefined,
      reviewerSignOff: safeSignOff,
    });

    return res.json(result);
  } catch (err: any) {
    console.error("RuleGuard Analysis Execution Error:", err?.message || "Internal failure");
    return res.status(500).json({
      error: "Internal analysis engine failure. Transaction halted safely.",
    });
  }
});

// Route: Cryptographic Verification of Release Certificates
app.post("/api/verify-certificate", verifyLimiter, (req, res) => {
  const { fingerprintSha256, decision, timestamp, signatureHmac } = req.body;

  if (!fingerprintSha256 || !decision || !timestamp || !signatureHmac) {
    return res.status(400).json({
      error: "fingerprintSha256, decision, timestamp, and signatureHmac are required.",
    });
  }

  if (typeof fingerprintSha256 !== "string" || typeof signatureHmac !== "string") {
    return res.status(400).json({
      error: "Invalid parameter formats.",
    });
  }

  const isValid = verifyReleaseCertificateHmac(fingerprintSha256, String(decision), String(timestamp), signatureHmac);

  return res.json({
    verified: isValid,
    status: isValid ? "AUTHENTIC_CERTIFICATE" : "INVALID_SIGNATURE_OR_TAMPERED",
    algorithm: "HMAC-SHA256",
    fingerprintSha256,
    verifiedAt: new Date().toISOString(),
  });
});

// Production Static Web Dashboard Serving (Supports unified single-service deployments)
const possibleDistPaths = [
  path.resolve(process.cwd(), "frontend/dist"),
  path.resolve(process.cwd(), "dist"),
  path.resolve(process.cwd(), "public"),
  path.resolve(__dirname, "../../frontend/dist"),
  path.resolve(__dirname, "../frontend/dist"),
  path.resolve(__dirname, "../public"),
];
const distDir = possibleDistPaths.find((p) => fs.existsSync(p));

if (distDir) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      return res.sendFile(path.join(distDir, "index.html"), (err) => {
        if (err) next();
      });
    }
    next();
  });
}

// Global Secure Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Exception:", err?.message || "Unknown error");
  res.status(500).json({ error: "An unexpected error occurred. Request was safely rejected." });
});

const server = app.listen(PORT, () => {
  console.log(`🛡️ RuleGuard 2.0 Enterprise Engine running on http://localhost:${PORT}`);
  console.log(`🔒 Security Shield: Active (Helmet, Rate Limiter, Prompt Injection Shield, HMAC Signer)`);
});

// Graceful Process Termination for Container / Orchestrator Environments
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing HTTP server...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, closing HTTP server...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});