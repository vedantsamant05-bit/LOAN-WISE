'use client';

import React, { useState } from 'react';

interface ManualReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicantName: string;
  defaultAction?: 'APPROVE_OVERRIDE' | 'REJECT_OVERRIDE';
  onSuccess: (updated: any) => void;
}

export function ManualReviewModal({
  isOpen,
  onClose,
  applicationId,
  applicantName,
  defaultAction = 'APPROVE_OVERRIDE',
  onSuccess,
}: ManualReviewModalProps) {
  const [action, setAction] = useState<'APPROVE_OVERRIDE' | 'REJECT_OVERRIDE'>(defaultAction);
  const [notes, setNotes] = useState(
    'Underwriting review confirmed compensating asset reserves and clean primary bureau tradelines. Approved with secondary supervisor signoff.'
  );
  const [reviewToken, setReviewToken] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/applications/${applicationId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${reviewToken.trim()}`,
        },
        body: JSON.stringify({
          action,
          notes,
          actor: 'Pooja Deshmukh (Risk Underwriting Lead)',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit review');
      }

      const updated = await res.json();
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      alert(`Error submitting review: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-forest-950 text-white flex items-center justify-between border-b border-forest-900 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="material-symbols-outlined text-sage-200 text-[22px] sm:text-[24px]">gavel</span>
            <div>
              <h2 className="font-section-title text-base sm:text-section-title font-semibold text-white">
                Underwriting Manual Review
              </h2>
              <p className="font-caption text-caption text-sage-500">
                {applicationId} — {applicantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sage-500 hover:text-white transition-colors p-1"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-label font-label text-ink-700 mb-1.5">
                Resolution Action
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setAction('APPROVE_OVERRIDE')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-body-compact-medium text-body-compact-medium transition-colors ${
                    action === 'APPROVE_OVERRIDE'
                      ? 'bg-status-success-bg border-status-success text-status-success ring-1 ring-status-success'
                      : 'bg-white border-border text-ink-700 hover:bg-ivory-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Approve with Exception</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAction('REJECT_OVERRIDE')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-body-compact-medium text-body-compact-medium transition-colors ${
                    action === 'REJECT_OVERRIDE'
                      ? 'bg-status-danger-bg border-status-danger text-status-danger ring-1 ring-status-danger'
                      : 'bg-white border-border text-ink-700 hover:bg-ivory-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span>Override to Reject</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-label font-label text-ink-700 mb-1">
                Underwriter Security Key (Bearer Token)
              </label>
              <input
                type="password"
                required
                value={reviewToken}
                onChange={(e) => setReviewToken(e.target.value)}
                placeholder="Enter server authorization key"
                className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
              />
              <p className="text-caption text-ink-500 mt-1">
                Must match the server REVIEW_API_KEY environment variable.
              </p>
            </div>

            <div>
              <label className="block text-label font-label text-ink-700 mb-1">
                Underwriting Justification &amp; Audit Notes
              </label>
              <textarea
                required
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain reason for manual override, compensating factors, or specific credit risk rationale..."
                className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
              />
              <p className="text-caption text-ink-500 mt-1">
                This entry is recorded in the append-only audit trail and linked to your analyst ID.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-ivory-50 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-border text-ink-700 hover:bg-ivory-100 font-body-compact-medium text-body-compact-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-forest-900 text-white hover:bg-forest-800 font-body-compact-medium text-body-compact-medium shadow-sm disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
