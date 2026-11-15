import React from 'react';
import { DoseLog } from '../types';
import { Check, X, AlertTriangle, Clock, AlertCircle } from 'lucide-react';

interface ScheduleDoseCardProps {
  dose: DoseLog;
  onTake: (doseId: string) => void;
  onSkip: (dose: DoseLog) => void;
  onUnable: (doseId: string) => void;
  isPatientRole: boolean;
}

export const ScheduleDoseCard: React.FC<ScheduleDoseCardProps> = ({
  dose,
  onTake,
  onSkip,
  onUnable,
  isPatientRole,
}) => {
  const isTaken = dose.status === 'TAKEN';
  const isSkipped = dose.status === 'SKIPPED';
  const isUnable = dose.status === 'UNABLE';
  const isEscalated = dose.status === 'UNCONFIRMED_ESCALATED';
  const isAcknowledged = dose.status === 'ACKNOWLEDGED';
  const isPending = dose.status === 'SCHEDULED' || dose.status === 'REMINDER_SENT';

  const scheduledTimeStr = dose.scheduledAt
    ? new Date(dose.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '09:00 AM';

  const graceDeadlineStr = dose.graceDeadlineAt
    ? new Date(dose.graceDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`card-surface rounded-2xl p-6 border shadow-sm transition-all ${
        isEscalated
          ? 'bg-red-50/60 border-red-300 ring-2 ring-red-400'
          : isTaken
          ? 'bg-emerald-50/40 border-emerald-300'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {dose.medicineName}
            </h3>
            <span className="text-lg font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {dose.dosage}
            </span>
          </div>
          <p className="patient-typography text-slate-600 font-medium">
            {dose.scheduledAt ? 'Scheduled dose' : ''}: Follow instructions:
          </p>
          <p className="text-base text-slate-700 mt-0.5">
            {/* Find instructions or fallback */}
            Take after meal with a full glass of water.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1">
          {isTaken && (
            <span className="badge-emerald inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Check className="w-4 h-4 stroke-[3]" /> Dose Taken
            </span>
          )}
          {isSkipped && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700 border border-slate-300">
              <X className="w-4 h-4" /> Skipped
            </span>
          )}
          {isUnable && (
            <span className="badge-red inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
              <AlertCircle className="w-4 h-4" /> Unable to Take
            </span>
          )}
          {isEscalated && (
            <span className="badge-red inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-400 animate-bounce">
              <AlertTriangle className="w-4 h-4" /> Unconfirmed: Escalated
            </span>
          )}
          {isAcknowledged && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-300">
              <Check className="w-4 h-4" /> Acknowledged by Caregiver
            </span>
          )}
          {isPending && (
            <span className="badge-amber inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Clock className="w-4 h-4" /> Scheduled Today
            </span>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Time: <strong>{scheduledTimeStr}</strong></span>
            {graceDeadlineStr && <span className="text-slate-400">(Grace until {graceDeadlineStr})</span>}
          </div>
        </div>
      </div>

      {/* Confirmation Note or Acknowledgement Details if any */}
      {dose.patientNote && (
        <div className="mb-4 bg-slate-100 p-3 rounded-lg border border-slate-200 text-sm text-slate-700">
          <strong>Note from Patient:</strong> "{dose.patientNote}"
        </div>
      )}

      {dose.acknowledgementNote && (
        <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-900">
          <strong>Caregiver Follow-up ({dose.acknowledgedByName}):</strong> "{dose.acknowledgementNote}"
        </div>
      )}

      {/* Action Controls for Patient / Authorized Caregiver */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Button 1: I Took This Medicine (min-h-14 / 56px height) */}
        <button
          onClick={() => onTake(dose.doseId)}
          disabled={isTaken}
          className={`min-touch-target rounded-xl px-4 font-bold text-lg transition shadow-sm ${
            isTaken
              ? 'bg-emerald-100 text-emerald-800 cursor-default opacity-80'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white focus:ring-4 focus:ring-emerald-300'
          }`}
          aria-label={`Confirm dose of ${dose.medicineName} taken`}
        >
          <Check className="w-5 h-5 mr-2 stroke-[3]" />
          {isTaken ? 'Taken Confirmed' : 'I Took This Medicine'}
        </button>

        {/* Button 2: Skip for Now */}
        <button
          onClick={() => onSkip(dose)}
          disabled={isTaken}
          className={`min-touch-target rounded-xl px-4 font-semibold text-base transition border ${
            isSkipped
              ? 'bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border-slate-300'
          }`}
          aria-label={`Skip scheduled dose of ${dose.medicineName}`}
        >
          <X className="w-5 h-5 mr-2 text-slate-500" />
          {isSkipped ? 'Skipped' : 'Skip for Now'}
        </button>

        {/* Button 3: Unable to Take / Need Help */}
        <button
          onClick={() => onUnable(dose.doseId)}
          disabled={isTaken}
          className={`min-touch-target rounded-xl px-4 font-semibold text-base transition shadow-sm ${
            isUnable || isEscalated
              ? 'bg-red-700 text-white cursor-default'
              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300'
          }`}
          aria-label={`Report unable to take ${dose.medicineName}`}
        >
          <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
          {isUnable ? 'Alert Dispatched' : 'Unable to Take / Help'}
        </button>
      </div>
    </div>
  );
};
