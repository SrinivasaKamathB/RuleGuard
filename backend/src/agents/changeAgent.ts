export interface ChangeAgentResult {
  agent: "Change agent";
  status: "completed";
  summary: string;
  proposedUpdate: string;
}

export function runChangeAgent(
  proposedUpdate: string
): ChangeAgentResult {
  const update = proposedUpdate.toLowerCase();

  let summary = "The proposed software update was analyzed.";

  const removesRequirement =
    update.includes("remove") ||
    update.includes("removes") ||
    update.includes("removed") ||
    update.includes("bypass") ||
    update.includes("disable") ||
    update.includes("disables") ||
    update.includes("delete");

  const preservesRequirement =
    update.includes("keep") ||
    update.includes("keeps") ||
    update.includes("retain") ||
    update.includes("retains") ||
    update.includes("preserve") ||
    update.includes("preserves");

  // 1. Refund approval changes
  if (
    removesRequirement &&
    (update.includes("manager approval") ||
      update.includes("manager authorization"))
  ) {
    summary =
      "The update removes the manager approval requirement from the refund process.";
  }

  // Refund approval preserved
  else if (
    preservesRequirement &&
    (update.includes("manager approval") ||
      update.includes("manager authorization"))
  ) {
    summary =
      "The update keeps the manager approval requirement in the refund process.";
  }

  // 2. Account lockout changes
  else if (
    removesRequirement &&
    (update.includes("account lock") ||
      update.includes("lockout"))
  ) {
    summary =
      "The update removes the account lockout security requirement.";
  }

  // Account lockout preserved
  else if (
    preservesRequirement &&
    (update.includes("account lock") ||
      update.includes("lockout"))
  ) {
    summary =
      "The update keeps the account lockout security requirement.";
  }

  // 3. Payment approval changes
  else if (
    removesRequirement &&
    update.includes("payment") &&
    (update.includes("approval") ||
      update.includes("authorization"))
  ) {
    summary =
      "The update removes an approval requirement from the payment process.";
  }

  // Payment approval preserved
  else if (
    preservesRequirement &&
    update.includes("payment") &&
    (update.includes("approval") ||
      update.includes("authorization"))
  ) {
    summary =
      "The update keeps the approval requirement in the payment process.";
  }

  // 4. Data retention changes
  else if (
    removesRequirement &&
    (update.includes("data retention") ||
      update.includes("record retention") ||
      update.includes("retain data") ||
      update.includes("retain records"))
  ) {
    summary =
      "The update removes the required data retention policy.";
  }

  // Data retention preserved
  else if (
    preservesRequirement &&
    (update.includes("data retention") ||
      update.includes("record retention") ||
      update.includes("retain data") ||
      update.includes("retain records"))
  ) {
    summary =
      "The update keeps the required data retention policy.";
  }

  // 5. MFA / 2FA changes
  else if (
    removesRequirement &&
    (update.includes("two-factor") ||
      update.includes("2fa") ||
      update.includes("multi-factor") ||
      update.includes("mfa"))
  ) {
    summary =
      "The update removes the multi-factor authentication requirement.";
  }

  // MFA / 2FA preserved
  else if (
    preservesRequirement &&
    (update.includes("two-factor") ||
      update.includes("2fa") ||
      update.includes("multi-factor") ||
      update.includes("mfa"))
  ) {
    summary =
      "The update keeps the multi-factor authentication requirement.";
  }

  return {
    agent: "Change agent",
    status: "completed",
    summary,
    proposedUpdate,
  };
}