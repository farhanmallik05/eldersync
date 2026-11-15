import React, { useState } from 'react';
import { DoseLog } from '../types';
import { X, AlertCircle } from 'lucide-react';

interface SkipReasonModalProps {
  dose: DoseLog | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSkip: (doseId: string, reason: string) => void;
}

const COMMON_REASONS = [
  'Already took earlier today',
  'Doctor or nurse advised temporary hold',
  'Feeling nauseous / unwell',
  'Fasting for lab work / procedure',
  'Out of medication / awaiting pharmacy refill',
  'Other reason',
];

export const SkipReasonModal: React.FC<SkipReasonModalProps> = ({
  dose,
  isOpen,
  onClose,
  onConfirmSkip,
}) => {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !dose) return null;

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Other reason' && customNote.trim()
      ? customNote.trim()
      : selectedReason;

    onConfirmSkip(dose.doseId, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-slate-700" />
            <h3 className="text-xl font-bold text-slate-900">Skip Dose</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 my-3">
          Skipping <strong>{dose.medicineName} ({dose.dosage})</strong>. Please select a reason so your caregiver remains informed.
        </p>

        <div className="space-y-2 my-4">
          {COMMON_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium cursor-pointer transition ${
                selectedReason === r
                  ? 'border-teal-600 bg-teal-50 text-teal-900'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="skipReason"
                checked={selectedReason === r}
                onChange={() => setSelectedReason(r)}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span>{r}</span>
            </label>
          ))}
        </div>

        {selectedReason === 'Other reason' && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Specify Reason:</label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g., Blood pressure was low"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow"
          >
            Confirm Skip
          </button>
        </div>
      </div>
    </div>
  );
};
