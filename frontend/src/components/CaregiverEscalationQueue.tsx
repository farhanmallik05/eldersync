import React, { useState } from 'react';
import { DoseLog } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { AlertTriangle, CheckCircle2, PhoneCall } from 'lucide-react';

interface CaregiverEscalationQueueProps {
  escalatedDoses: DoseLog[];
}

export const CaregiverEscalationQueue: React.FC<CaregiverEscalationQueueProps> = ({ escalatedDoses }) => {
  const { acknowledgeDose } = useWorkspace();
  const [selectedDose, setSelectedDose] = useState<DoseLog | null>(null);
  const [note, setNote] = useState('');
  const [markTaken, setMarkTaken] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (escalatedDoses.length === 0) {
    return (
      <div className="card-surface bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 mb-8 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-emerald-900">All Scheduled Doses Confirmed or On Track</h4>
          <p className="text-sm text-emerald-700">No active unconfirmed dose escalations or emergency help alerts right now.</p>
        </div>
      </div>
    );
  }

  const handleAcknowledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDose || !note.trim()) return;

    setSubmitting(true);
    await acknowledgeDose(selectedDose.doseId, note, markTaken);
    setSubmitting(false);
    setSelectedDose(null);
    setNote('');
  };

  return (
    <div
      aria-live="polite"
      className="card-surface bg-red-50/80 border-2 border-red-400 rounded-2xl p-6 mb-8 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-red-950 flex items-center gap-2">
            Priority Escalation Queue ({escalatedDoses.length} Active Alert{escalatedDoses.length > 1 ? 's' : ''})
          </h3>
          <p className="text-sm text-red-800">
            Doses requiring caregiver verification or follow-up phone call to ensure safety.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {escalatedDoses.map((dose) => {
          const scheduledTimeStr = dose.scheduledAt
            ? new Date(dose.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '09:00 AM';

          const graceDeadlineStr = dose.graceDeadlineAt
            ? new Date(dose.graceDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '09:03 AM';

          return (
            <div
              key={dose.doseId}
              className="bg-white border border-red-300 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-slate-900">
                    Unconfirmed Dose: {dose.medicineName} ({dose.dosage})
                  </span>
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-300">
                    {dose.status}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  Scheduled at <strong>{scheduledTimeStr}</strong>. Grace period elapsed at <strong>{graceDeadlineStr}</strong>.
                </p>
                <p className="text-xs text-slate-500 mt-1 italic">
                  Note: Alert indicates dose is unconfirmed, not confirmed missed.
                </p>
                {dose.patientNote && (
                  <p className="text-xs bg-amber-50 text-amber-900 p-1.5 rounded mt-1.5 border border-amber-200">
                    Patient Note: "{dose.patientNote}"
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedDose(dose);
                  setNote(`Called patient: confirmed taking medication now.`);
                }}
                className="min-touch-target px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 flex-shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                Acknowledge & Record Follow-Up
              </button>
            </div>
          );
        })}
      </div>

      {/* Acknowledge Modal */}
      {selectedDose && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Acknowledge & Record Caregiver Follow-Up
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Recording your acknowledgement updates the timeline live for all family members and prevents duplicate calls.
            </p>

            <form onSubmit={handleAcknowledgeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Follow-up Resolution Note *
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900"
                  placeholder="e.g., Called Papa: he took it at 9:05 AM with lunch, marking confirmed."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="markTakenCheck"
                  checked={markTaken}
                  onChange={(e) => setMarkTaken(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="markTakenCheck" className="text-sm font-medium text-slate-800">
                  Mark dose as confirmed <strong>TAKEN</strong> in patient logs
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDose(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !note.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Confirm Acknowledgement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
