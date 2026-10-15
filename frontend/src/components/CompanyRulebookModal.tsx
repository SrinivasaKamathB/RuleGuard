import { useState, type FC, type FormEvent } from "react";
import type { RuleInvariant, InvariantCategory, InvariantSeverity } from "../types";
import { X, Plus, Trash2, BookOpen } from "lucide-react";

interface CompanyRulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  invariants: RuleInvariant[];
  onToggleInvariant: (id: string) => void;
  onAddInvariant: (inv: RuleInvariant) => void;
  onDeleteInvariant: (id: string) => void;
}

export const CompanyRulebookModal: FC<CompanyRulebookModalProps> = ({
  isOpen,
  onClose,
  invariants,
  onToggleInvariant,
  onAddInvariant,
  onDeleteInvariant,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<InvariantCategory>("financial");
  const [severity, setSeverity] = useState<InvariantSeverity>("critical");
  const [keywords, setKeywords] = useState("");

  if (!isOpen) return null;

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    const newInv: RuleInvariant = {
      id: `inv_custom_${Date.now()}`,
      name: name.trim(),
      category,
      severity,
      description: description.trim(),
      evidenceKeywords: keywords.split(",").map((k) => k.trim()).filter((k) => k.length > 0),
      evidence: ["Added manually via Company Invariant Rulebook"],
      confidenceScore: 100,
      origin: "manual",
      isActive: true,
    };

    onAddInvariant(newInv);
    setName("");
    setDescription("");
    setKeywords("");
    setIsAdding(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window rulebook-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3>Company Invariant Rulebook</h3>
              <p>Active institutional business rules and safety guardrails</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="rulebook-toolbar">
            <span className="rulebook-count-text">
              <strong>{invariants.filter((i) => i.isActive).length}</strong> of{" "}
              <strong>{invariants.length}</strong> invariants active
            </span>
            <button className="add-rule-btn" onClick={() => setIsAdding(!isAdding)}>
              <Plus className="w-4 h-4 mr-1 inline" /> {isAdding ? "Cancel" : "Add Invariant"}
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleCreate} className="add-rule-form">
              <h4>Define New Company Invariant</h4>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Invariant Name (e.g., Max Discount Limit)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <select value={category} onChange={(e) => setCategory(e.target.value as InvariantCategory)}>
                  <option value="financial">Financial</option>
                  <option value="security">Security</option>
                  <option value="compliance">Compliance</option>
                  <option value="operational">Operational</option>
                  <option value="privacy">Privacy</option>
                </select>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as InvariantSeverity)}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <textarea
                placeholder="Full Invariant Description (e.g., Discounts over 25% require VP Sales signoff)."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />

              <input
                type="text"
                placeholder="Keywords comma-separated (e.g. discount, coupon, approval, vp)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />

              <div className="form-submit-row">
                <button type="submit" className="save-rule-btn">
                  Save Invariant
                </button>
              </div>
            </form>
          )}

          <div className="invariants-list">
            {invariants.map((inv) => (
              <div key={inv.id} className={`invariant-item-card ${inv.isActive ? "is-active" : "is-inactive"}`}>
                <div className="item-toggle-wrap">
                  <input
                    type="checkbox"
                    checked={inv.isActive}
                    onChange={() => onToggleInvariant(inv.id)}
                    id={`toggle-${inv.id}`}
                  />
                </div>

                <div className="item-details">
                  <div className="item-topline">
                    <label htmlFor={`toggle-${inv.id}`} className="item-name">
                      {inv.name}
                    </label>
                    <span className={`badge-severity sev-${inv.severity}`}>{inv.severity}</span>
                    <span className="badge-category">{inv.category}</span>
                  </div>
                  <p className="item-desc">{inv.description}</p>
                </div>

                {inv.origin === "manual" && (
                  <button
                    className="delete-item-btn"
                    onClick={() => onDeleteInvariant(inv.id)}
                    title="Delete custom invariant"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="primary-action-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
