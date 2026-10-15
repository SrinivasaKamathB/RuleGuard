import { RuleInvariant } from "../types";

export interface IndustryPreset {
  id: string;
  name: string;
  badge: string;
  domain: string;
  icon: string;
  description: string;
  historicalRecords: string;
  unsafeUpdate: string;
  safeUpdate: string;
  suggestedPatch: string;
  defaultInvariants: RuleInvariant[];
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: "fintech_refund",
    name: "Fintech: Refund Authorization",
    badge: "FINANCE",
    domain: "Payment Operations & Risk",
    icon: "💳",
    description: "Protection against unauthorized high-value customer refunds.",
    historicalRecords: `INCIDENT-4091 [P1]: Customer refund of ₹8,000 was executed automatically without manager review, causing treasury reconciliation discrepancy.
Support ticket #88412: Merchant processed multiple immediate refunds > ₹5,000 without second-pair-of-eyes signoff.
Compliance Audit 2024: Mandatory dual-control authorization required on all disbursement refunds exceeding ₹5,000 threshold.
Code comment (services/refundEngine.ts): Never remove manager approval for refunds above 5000. Required by RBI digital payment safety guidelines.`,
    unsafeUpdate: `diff --git a/services/refundEngine.ts b/services/refundEngine.ts
--- a/services/refundEngine.ts
+++ b/services/refundEngine.ts
@@ -42,8 +42,4 @@ export async function processCustomerRefund(refund: RefundRequest) {
-  // Enforce dual signoff for high value transactions
-  if (refund.amount > 5000) {
-    await requireManagerApproval(refund.id, refund.amount);
-  }
   // Directly dispatch payment gateway refund to reduce customer wait time
   return await paymentGateway.disburse(refund);
 }`,
    safeUpdate: `diff --git a/services/refundEngine.ts b/services/refundEngine.ts
--- a/services/refundEngine.ts
+++ b/services/refundEngine.ts
@@ -42,6 +42,8 @@ export async function processCustomerRefund(refund: RefundRequest) {
   // Retain manager approval requirement for refunds above 5000 with optimized async queue
   if (refund.amount > 5000) {
     await requireManagerApprovalAsync(refund.id, refund.amount);
   }
   return await paymentGateway.disburse(refund);
 }`,
    suggestedPatch: `diff --git a/services/refundEngine.ts b/services/refundEngine.ts
--- a/services/refundEngine.ts
+++ b/services/refundEngine.ts
@@ -42,4 +42,8 @@ export async function processCustomerRefund(refund: RefundRequest) {
+  // RESTORED INVARIANT: Mandatory dual signoff for refunds > ₹5,000
+  if (refund.amount > 5000) {
+    await requireManagerApproval(refund.id, refund.amount);
+  }
   return await paymentGateway.disburse(refund);
 }`,
    defaultInvariants: [
      {
        id: "inv_fin_01",
        name: "High-Value Refund Dual Approval",
        category: "financial",
        severity: "critical",
        description: "Disbursements and customer refunds above ₹5,000 require authenticated manager approval.",
        evidenceKeywords: ["refund", "refunds", "manager approval", "manager authorization", "5000"],
        evidence: [
          "Customer refund of ₹8,000 was executed automatically without manager review",
          "Never remove manager approval for refunds above 5000",
        ],
        confidenceScore: 98,
        origin: "company_preset",
        isActive: true,
      },
    ],
  },

  {
    id: "security_lockout",
    name: "IAM: Account Lockout Defense",
    badge: "SECURITY",
    domain: "Authentication & Credential Stuffing",
    icon: "🔐",
    description: "Protection against brute-force password cracking attacks.",
    historicalRecords: `SEC-ALERT-892: Distributed credential stuffing attack on customer login endpoint caused 42 account takeovers.
Security Policy Sec-4.1: User accounts must be locked after repeated failed login attempts (maximum 5 attempts).
Bug report #1904: Attackers bypassed lockout because failed attempt counter was silently reset on network retry.
Code comment (controllers/auth.ts): Invariant: Always lock account and trigger security notice after 5 consecutive failed login attempts.`,
    unsafeUpdate: `diff --git a/controllers/auth.ts b/controllers/auth.ts
--- a/controllers/auth.ts
+++ b/controllers/auth.ts
@@ -28,7 +28,2 @@ export async function handleUserLogin(req: Request, res: Response) {
-  if (user.failedAttempts >= 5) {
-    await lockAccountAndNotify(user.id);
-    return res.status(423).json({ error: "Account locked due to repeated failed login attempts" });
-  }
   const isValid = await verifyPassword(req.body.password, user.passwordHash);
 }`,
    safeUpdate: `diff --git a/controllers/auth.ts b/controllers/auth.ts
--- a/controllers/auth.ts
+++ b/controllers/auth.ts
@@ -28,6 +28,8 @@ export async function handleUserLogin(req: Request, res: Response) {
   // Keep account lockout security requirement while improving cache hit rate
   if (user.failedAttempts >= 5) {
     await lockAccountAndNotify(user.id);
     return res.status(423).json({ error: "Account locked" });
   }
 }`,
    suggestedPatch: `diff --git a/controllers/auth.ts b/controllers/auth.ts
--- a/controllers/auth.ts
+++ b/controllers/auth.ts
@@ -28,2 +28,7 @@ export async function handleUserLogin(req: Request, res: Response) {
+  // RESTORED INVARIANT: Lock user account after 5 consecutive failed attempts
+  if (user.failedAttempts >= 5) {
+    await lockAccountAndNotify(user.id);
+    return res.status(423).json({ error: "Account locked due to repeated failed login attempts" });
+  }
   const isValid = await verifyPassword(req.body.password, user.passwordHash);
 }`,
    defaultInvariants: [
      {
        id: "inv_sec_01",
        name: "Repeated Failed Login Lockout",
        category: "security",
        severity: "critical",
        description: "User accounts must be locked after repeated failed login attempts to prevent brute-force exploitation.",
        evidenceKeywords: ["account", "lock", "locked", "lockout", "failed", "failed login"],
        evidence: [
          "User accounts must be locked after repeated failed login attempts (maximum 5 attempts)",
          "Always lock account and trigger security notice after 5 consecutive failed login attempts",
        ],
        confidenceScore: 96,
        origin: "company_preset",
        isActive: true,
      },
    ],
  },

  {
    id: "healthcare_hipaa",
    name: "Healthcare: HIPAA Audit Logging",
    badge: "HEALTHCARE",
    domain: "PHI Protection & Regulatory Auditing",
    icon: "🏥",
    description: "Protection of protected health information (PHI) access trails.",
    historicalRecords: `HHS OCR Audit Warning 2025: All patient medical records queries and bulk data exports must write an immutable audit log entry.
Incident MED-102: Doctor export of 400 patient records had no audit trail due to bypass during batch export.
Code comment (exports/patientExporter.ts): CRITICAL HIPAA REQUIREMENT: Never disable audit logging when exporting PHI records.
Security Architecture Review: Audit event must record clinicianId, patientId, timestamp, and queryHash before releasing record bytes.`,
    unsafeUpdate: `diff --git a/exports/patientExporter.ts b/exports/patientExporter.ts
--- a/exports/patientExporter.ts
+++ b/exports/patientExporter.ts
@@ -19,5 +19,2 @@ export async function exportPatientHistory(patientId: string, clinicianId: strin
-  // Write immutable HIPAA audit trail
-  await auditLogger.logAccess({ type: "PHI_EXPORT", clinicianId, patientId });
-  
   // Directly stream PDF to improve download throughput
   return await generatePatientPdf(patientId);
 }`,
    safeUpdate: `diff --git a/exports/patientExporter.ts b/exports/patientExporter.ts
--- a/exports/patientExporter.ts
+++ b/exports/patientExporter.ts
@@ -19,4 +19,6 @@ export async function exportPatientHistory(patientId: string, clinicianId: strin
   // Preserve immutable HIPAA audit logging while buffering stream
   await auditLogger.logAccess({ type: "PHI_EXPORT", clinicianId, patientId, buffered: true });
   return await generatePatientPdf(patientId);
 }`,
    suggestedPatch: `diff --git a/exports/patientExporter.ts b/exports/patientExporter.ts
--- a/exports/patientExporter.ts
+++ b/exports/patientExporter.ts
@@ -19,2 +19,5 @@ export async function exportPatientHistory(patientId: string, clinicianId: strin
+  // RESTORED INVARIANT: Immutable audit log mandatory for PHI export
+  await auditLogger.logAccess({ type: "PHI_EXPORT", clinicianId, patientId });
   return await generatePatientPdf(patientId);
 }`,
    defaultInvariants: [
      {
        id: "inv_hipaa_01",
        name: "PHI Access Immutable Audit Trail",
        category: "compliance",
        severity: "critical",
        description: "All patient health record views and exports must write an immutable audit log entry for regulatory compliance.",
        evidenceKeywords: ["audit", "hipaa", "phi", "patient", "medical", "records", "log"],
        evidence: [
          "All patient medical records queries and bulk data exports must write an immutable audit log entry",
          "CRITICAL HIPAA REQUIREMENT: Never disable audit logging when exporting PHI records",
        ],
        confidenceScore: 97,
        origin: "company_preset",
        isActive: true,
      },
    ],
  },

  {
    id: "privacy_gdpr",
    name: "GDPR: Right-to-be-Forgotten",
    badge: "PRIVACY",
    domain: "Data Retention & Compliance",
    icon: "🇪🇺",
    description: "Protection of user deletion cascading guarantees.",
    historicalRecords: `GDPR Regulatory Fine Notice: User account deletion requests must cascade to purge all secondary analytics and tracking records within 30 days.
Support Ticket #6620: User requested account deletion under GDPR Article 17, but analytics team retained identifiable behavioral telemetry.
Data Privacy Directive: Company records and user data must be retained or purged according to the mandatory data retention policy.
Code comment (jobs/userPurgeWorker.ts): Invariant: Data retention policy mandates secondary telemetry deletion when user triggers account deletion.`,
    unsafeUpdate: `diff --git a/jobs/userPurgeWorker.ts b/jobs/userPurgeWorker.ts
--- a/jobs/userPurgeWorker.ts
+++ b/jobs/userPurgeWorker.ts
@@ -15,6 +15,2 @@ export async function purgeUserData(userId: string) {
   await primaryDb.users.delete(userId);
-  // Removed downstream analytics purge to preserve training datasets
-  // await analyticsDb.telemetry.deleteMany({ userId });
-  // await warehouse.events.anonymize({ userId });
   return { status: "user_deleted" };
 }`,
    safeUpdate: `diff --git a/jobs/userPurgeWorker.ts b/jobs/userPurgeWorker.ts
--- a/jobs/userPurgeWorker.ts
+++ b/jobs/userPurgeWorker.ts
@@ -15,4 +15,6 @@ export async function purgeUserData(userId: string) {
   await primaryDb.users.delete(userId);
   // Keep required data retention policy by cascading deletion to analytics
   await analyticsDb.telemetry.deleteMany({ userId });
   await warehouse.events.anonymize({ userId });
 }`,
    suggestedPatch: `diff --git a/jobs/userPurgeWorker.ts b/jobs/userPurgeWorker.ts
--- a/jobs/userPurgeWorker.ts
+++ b/jobs/userPurgeWorker.ts
@@ -15,2 +15,6 @@ export async function purgeUserData(userId: string) {
   await primaryDb.users.delete(userId);
+  // RESTORED INVARIANT: Cascading GDPR deletion across analytics pipelines
+  await analyticsDb.telemetry.deleteMany({ userId });
+  await warehouse.events.anonymize({ userId });
   return { status: "user_deleted" };
 }`,
    defaultInvariants: [
      {
        id: "inv_gdpr_01",
        name: "Cascading Data Retention & Right-to-Erasure",
        category: "privacy",
        severity: "high",
        description: "Company records and user telemetry must be retained and purged in strict accordance with the data retention policy.",
        evidenceKeywords: ["data", "records", "retention", "retain", "delete", "gdpr", "purge"],
        evidence: [
          "Company records and user data must be retained or purged according to the mandatory data retention policy",
          "Data retention policy mandates secondary telemetry deletion when user triggers account deletion",
        ],
        confidenceScore: 94,
        origin: "company_preset",
        isActive: true,
      },
    ],
  },

  {
    id: "ecommerce_inventory",
    name: "E-Commerce: Flash Sale Mutex Lock",
    badge: "COMMERCE",
    domain: "Concurrency & Inventory Integrity",
    icon: "🛒",
    description: "Protection against negative inventory overselling during high concurrency.",
    historicalRecords: `POST-MORTEM #440: During Cyber Monday flash sale, 1,200 iPhones were sold with only 250 in stock due to unisolated database reads.
Merchant SLA Policy: Orders cannot be committed without an atomic inventory mutex lock. Over-selling carries 100% merchant penalty.
Bug report #8103: Disabling distributed lock caused double-spending of stock allocation.
Code comment (inventory/orderService.ts): Never bypass atomic lock when decrementing SKU quantity. High concurrency invariant.`,
    unsafeUpdate: `diff --git a/inventory/orderService.ts b/inventory/orderService.ts
--- a/inventory/orderService.ts
+++ b/inventory/orderService.ts
@@ -34,8 +34,3 @@ export async function reserveStock(sku: string, quantity: number) {
-  // Atomic distributed lock to prevent overselling
-  const lock = await redisMutex.acquire(\`lock:sku:\${sku}\`);
-  try {
-    return await db.inventory.decrement(sku, quantity);
-  } finally {
-    await lock.release();
-  }
+  // Removed mutex lock to increase checkout throughput during flash sales
+  return await db.inventory.decrement(sku, quantity);
 }`,
    safeUpdate: `diff --git a/inventory/orderService.ts b/inventory/orderService.ts
--- a/inventory/orderService.ts
+++ b/inventory/orderService.ts
@@ -34,4 +34,6 @@ export async function reserveStock(sku: string, quantity: number) {
   // Retain atomic inventory lock while optimizing lock hold duration
   const lock = await redisMutex.acquireOptimistic(\`lock:sku:\${sku}\`, { ttlMs: 150 });
   try {
     return await db.inventory.decrement(sku, quantity);
   } finally {
     await lock.release();
   }
 }`,
    suggestedPatch: `diff --git a/inventory/orderService.ts b/inventory/orderService.ts
--- a/inventory/orderService.ts
+++ b/inventory/orderService.ts
@@ -34,3 +34,8 @@ export async function reserveStock(sku: string, quantity: number) {
+  // RESTORED INVARIANT: Atomic distributed mutex lock prevents overselling
+  const lock = await redisMutex.acquire(\`lock:sku:\${sku}\`);
+  try {
+    return await db.inventory.decrement(sku, quantity);
+  } finally {
+    await lock.release();
+  }
 }`,
    defaultInvariants: [
      {
        id: "inv_ecom_01",
        name: "Atomic Inventory Concurrency Mutex",
        category: "operational",
        severity: "critical",
        description: "Inventory allocations must be guarded by atomic distributed locking to prevent negative stock overselling.",
        evidenceKeywords: ["inventory", "oversell", "stock", "mutex", "lock", "concurrency"],
        evidence: [
          "Orders cannot be committed without an atomic inventory mutex lock",
          "Never bypass atomic lock when decrementing SKU quantity. High concurrency invariant",
        ],
        confidenceScore: 95,
        origin: "company_preset",
        isActive: true,
      },
    ],
  },
];
