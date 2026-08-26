import React, { useState } from 'react';
import API from '../services/authAPI';
import { FiAlertTriangle, FiX, FiCheckCircle, FiUploadCloud, FiShield } from 'react-icons/fi';

const DISPUTE_REASONS = [
  'Waste quality mismatch',
  'Incorrect waste type',
  'Quantity mismatch',
  'Contamination/mixed material',
  'Damaged material',
  'Seller issue',
  'Other'
];

export default function DisputeModal({ order, isOpen, onClose, onDisputeCreated }) {
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || description.trim().length === 0) {
      setErrorMsg('Please describe the quality or material discrepancy in detail.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const evidenceImages = evidenceUrl.trim() ? [evidenceUrl.trim()] : [];

      await API.post('/disputes', {
        orderId: order.exchangeId || order._id,
        reason,
        description: description.trim(),
        evidenceImages
      });

      setSuccessMsg('Dispute filed successfully. Sent to seller & administrator for resolution.');
      setTimeout(() => {
        if (onDisputeCreated) onDisputeCreated();
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to file dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden z-10 p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">Raise Material Quality Dispute</h2>
              <p className="text-xs text-gray-500 font-medium">Order #{order.exchangeId || order._id?.toString().slice(-6)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Dispute Reason */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 uppercase mb-1.5">
              Primary Discrepancy Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-emerald-500 cursor-pointer"
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 uppercase mb-1.5">
              Detailed Description of Issue
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the purity variance, visual contamination, moisture level deviation, or damaged batch..."
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 focus:outline-emerald-500"
              maxLength={3000}
            />
          </div>

          {/* Evidence Image / Link */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 uppercase mb-1">
              Evidence Document / Photo URL (Optional)
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="e.g. /uploads/assay_report.pdf or photo link"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-emerald-500"
            />
          </div>

          {/* Mediation Protection Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
            <span className="font-extrabold flex items-center gap-1.5">
              <FiShield className="w-4 h-4 text-amber-700" /> Platform Governance Guarantee
            </span>
            <p className="text-amber-800 leading-relaxed font-medium">
              Filing a dispute pauses order completion. The seller will be notified to provide an explanation, and the platform admin will mediate the resolution.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FiAlertTriangle className="w-4 h-4" />
              <span>{submitting ? 'Submitting Dispute...' : 'Submit Dispute'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
