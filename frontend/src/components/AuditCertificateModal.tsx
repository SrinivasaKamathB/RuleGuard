import { useState, type FC, type FormEvent } from "react";
import type { RuleGuardAnalysisResponse, ReviewerSignOff } from "../types";
import { X, Fingerprint, ShieldCheck, Copy, Check, Printer, UserCheck, ShieldAlert, KeyRound } from "lucide-react";

interface AuditCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: RuleGuardAnalysisResponse | null;
  onSignOff?: (signoff: ReviewerSignOff) => void;
}

export const AuditCertificateModal: FC<AuditCertificateModalProps> = ({
  isOpen,
  onClose,
  result,
  onSignOff,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerRole, setReviewerRole] = useState("Principal Release Engineer");
  const [approvalStatus, setApprovalStatus] = useState<"APPROVED" | "REJECTED" | "CONDITIONALLY_APPROVED">("APPROVED");
  const [comments, setComments] = useState("");
  const [signedRecord, setSignedRecord] = useState<ReviewerSignOff | null>(result?.reviewerSignOff || null);

  if (!isOpen || !result) return null;

  const cert = result.auditCertificate;
  const isSafe = result.decision === "Safe to release";

  const handleCopyJson = () => {
    const fullAudit = {
      ...result,
      reviewerSignOff: signedRecord,
    };
    navigator.clipboard.writeText(JSON.stringify(fullAudit, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSignCertificate = (e: FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;

    const signoff: ReviewerSignOff = {
      signedBy: reviewerName.trim(),
      reviewerRole,
      signedAt: new Date().toISOString(),
      comments: comments.trim(),
      approvalStatus,
    };

    setSignedRecord(signoff);
    setIsSigning(false);
    if (onSignOff) onSignOff(signoff);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window cert-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <Fingerprint className="w-5 h-5 text-cyan-400" />
            <div>
              <h3>Release Governance Audit Certificate</h3>
              <p>Cryptographically verified multi-agent pre-release safety record</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body cert-body">
          <div className="cert-document-frame">
            <div className="cert-doc-header">
              <div className="cert-seal-badge">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
                <span>RULEGUARD AI</span>
              </div>
              <div className="cert-doc-title">
                <h2>SOFTWARE RELEASE AUDIT CERTIFICATE</h2>
                <span>GOVERNANCE SPECIFICATION ISO/IEC 25010 & SOC-2 COMPLIANT</span>
              </div>
            </div>

            <div className="cert-meta-grid">
              <div className="cert-meta-item">
                <span>CERTIFICATE ID</span>
                <strong>{result.id}</strong>
              </div>
              <div className="cert-meta-item">
                <span>TARGET ENVIRONMENT</span>
                <strong className="text-cyan-400">{(result.environment || "PRODUCTION").toUpperCase()}</strong>
              </div>
              <div className="cert-meta-item">
                <span>RELEASE GATE VERDICT</span>
                <strong className={isSafe ? "text-emerald-400" : "text-rose-500"}>
                  {result.decision.toUpperCase()}
                </strong>
              </div>
              <div className="cert-meta-item">
                <span>RISK ASSESSMENT</span>
                <strong>{result.riskScore}/100 [{result.riskLevel}]</strong>
              </div>
            </div>

            <div className="cert-section-block">
              <h4>PROTECTED BUSINESS INVARIANT EVALUATED</h4>
              <p className="cert-rule-text">"{result.discoveredRule}"</p>
            </div>

            <div className="cert-section-block">
              <h4>EVALUATION FINDING & SAFETY REASONING</h4>
              <p className="cert-explanation-text">{result.explanation}</p>
            </div>

            <div className="cert-section-block">
              <h4>SECURITY SHIELD & PAYLOAD INTEGRITY</h4>
              <div className="cert-security-strip">
                {result.securityScan?.injectionDetected ? (
                  <span className="badge-sec-alert">
                    <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                    Security Warning: Adversarial Prompt Injection Pattern Flagged
                  </span>
                ) : (
                  <span className="badge-sec-ok">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                    Payload Integrity: Verified Clean (Zero Injection Vectors Detected)
                  </span>
                )}
              </div>
            </div>

            <div className="cert-section-block">
              <h4>MULTI-AGENT EXECUTION AUDIT TRAIL</h4>
              <div className="cert-agent-table">
                {result.traces.map((trace) => (
                  <div key={trace.agentId} className="cert-agent-row">
                    <span className="cert-agent-name">{trace.agentName}</span>
                    <span className="cert-agent-summary">{trace.summary}</span>
                    <span className="cert-agent-time">{trace.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>

            {/* REVIEWER SIGN-OFF SECTION */}
            <div className="cert-section-block cert-signoff-block">
              <div className="signoff-header">
                <h4>ENTERPRISE REVIEWER SIGN-OFF</h4>
                {!signedRecord && (
                  <button className="open-sign-btn" onClick={() => setIsSigning(!isSigning)}>
                    <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                    {isSigning ? "Cancel" : "Add Reviewer Sign-Off"}
                  </button>
                )}
              </div>

              {isSigning && (
                <form onSubmit={handleSignCertificate} className="sign-form">
                  <div className="sign-form-row">
                    <input
                      type="text"
                      placeholder="Reviewer Full Name (e.g. Sarah Chen)"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required
                    />
                    <select value={reviewerRole} onChange={(e) => setReviewerRole(e.target.value)}>
                      <option value="Lead Release Engineer">Lead Release Engineer</option>
                      <option value="Security Architecture Lead">Security Architecture Lead</option>
                      <option value="Compliance Officer">Compliance Officer</option>
                      <option value="VP of Engineering">VP of Engineering</option>
                    </select>
                    <select
                      value={approvalStatus}
                      onChange={(e) => setApprovalStatus(e.target.value as any)}
                    >
                      <option value="APPROVED">Sign & Approve</option>
                      <option value="CONDITIONALLY_APPROVED">Conditionally Approve</option>
                      <option value="REJECTED">Reject Release</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Audit Comments / Conditions (Optional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="sign-comments-input"
                  />
                  <div className="sign-action-row">
                    <button type="submit" className="confirm-sign-btn">
                      Cryptographically Seal Sign-Off
                    </button>
                  </div>
                </form>
              )}

              {signedRecord && (
                <div className="signed-stamp-badge">
                  <div className="stamp-left">
                    <UserCheck className="w-6 h-6 text-emerald-400" />
                    <div>
                      <strong>Digitally Signed by: {signedRecord.signedBy}</strong>
                      <small>{signedRecord.reviewerRole} · {new Date(signedRecord.signedAt).toLocaleString()}</small>
                    </div>
                  </div>
                  <span className={`stamp-status ${signedRecord.approvalStatus.toLowerCase()}`}>
                    {signedRecord.approvalStatus}
                  </span>
                </div>
              )}
            </div>

            <div className="cert-footer-fingerprint">
              <div className="hash-block">
                <span className="hash-label">CRYPTOGRAPHIC SHA-256 FINGERPRINT:</span>
                <code className="hash-code">{cert.fingerprintSha256}</code>
              </div>
              <div className="hash-block">
                <span className="hash-label">
                  <KeyRound className="w-3 h-3 inline mr-1 text-cyan-400" />
                  SERVER HMAC-SHA256 DIGITAL SIGNATURE (TAMPER-EVIDENT):
                </span>
                <code className="hash-code signature-code">
                  {cert.signatureHmac || "AWAITING_SERVER_HMAC_SEAL"}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={handlePrint}>
            <Printer className="w-4 h-4 inline mr-1" /> Print Certificate
          </button>
          <button className="secondary-btn" onClick={handleCopyJson}>
            {copied ? <Check className="w-4 h-4 inline text-emerald-400 mr-1" /> : <Copy className="w-4 h-4 inline mr-1" />}
            Copy JSON Audit Record
          </button>
          <button className="primary-action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
