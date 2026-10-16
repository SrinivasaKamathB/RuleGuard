import crypto from "crypto";

export interface SecurityScanResult {
  isSuspicious: boolean;
  injectionDetected: boolean;
  warnings: string[];
  sanitizedRecords: string;
  sanitizedUpdate: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt\s+override/i,
  /say\s+["']?safe\s+to\s+release["']?/i,
  /disregard\s+(all\s+)?(rules|invariants|checks)/i,
  /bypass\s+all\s+(security|safety)\s+agents/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /jailbreak/i,
  /mark\s+(this\s+)?(change|update|release)\s+as\s+safe/i,
  /override\s+decision\s*:\s*safe/i,
];

const MAX_PAYLOAD_LENGTH = 500_000; // 500KB max text length per field

export function scanForPromptInjectionAndValidate(
  records: string,
  update: string
): SecurityScanResult {
  const warnings: string[] = [];
  let injectionDetected = false;

  // Length checks
  if (records.length > MAX_PAYLOAD_LENGTH) {
    warnings.push(`Records payload exceeds maximum allowable length of ${MAX_PAYLOAD_LENGTH} characters.`);
  }
  if (update.length > MAX_PAYLOAD_LENGTH) {
    warnings.push(`Update payload exceeds maximum allowable length of ${MAX_PAYLOAD_LENGTH} characters.`);
  }

  // Scan for prompt injection patterns
  const combinedText = `${records}\n${update}`;
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(combinedText)) {
      injectionDetected = true;
      warnings.push(`Potential prompt injection or safety bypass pattern detected: matching pattern [${pattern.source}].`);
      break;
    }
  }

  return {
    isSuspicious: warnings.length > 0,
    injectionDetected,
    warnings,
    sanitizedRecords: records.trim(),
    sanitizedUpdate: update.trim(),
  };
}

const DEFAULT_SECRET = "ruleguard-default-enterprise-signing-secret-2026";
let effectiveSecret = process.env.RELEASE_SIGNING_SECRET || DEFAULT_SECRET;

if (process.env.NODE_ENV === "production" && (!process.env.RELEASE_SIGNING_SECRET || process.env.RELEASE_SIGNING_SECRET === DEFAULT_SECRET)) {
  console.warn(
    "[SECURITY WARNING] RELEASE_SIGNING_SECRET is not set or using default value in production. Generating an ephemeral high-entropy key for this session."
  );
  effectiveSecret = crypto.randomBytes(32).toString("hex");
}

export function generateReleaseCertificateHmac(
  fingerprintSha256: string,
  decision: string,
  timestamp: string
): string {
  const payload = `${fingerprintSha256}:${decision}:${timestamp}`;
  return crypto.createHmac("sha256", effectiveSecret).update(payload).digest("hex");
}

export function verifyReleaseCertificateHmac(
  fingerprintSha256: string,
  decision: string,
  timestamp: string,
  signature: string
): boolean {
  if (!signature || typeof signature !== "string" || signature.length !== 64) {
    return false;
  }
  try {
    const expectedSignature = generateReleaseCertificateHmac(fingerprintSha256, decision, timestamp);
    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expectedSignature, "hex");
    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
