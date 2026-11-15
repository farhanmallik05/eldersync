import React, { useState } from 'react';
import { WorkspaceData, DoseLog } from '../types';
import { CaregiverEscalationQueue } from '../components/CaregiverEscalationQueue';
import { ScheduleDoseCard } from '../components/ScheduleDoseCard';
import { AddMedicationModal } from '../components/AddMedicationModal';
import { SkipReasonModal } from '../components/SkipReasonModal';
import { useWorkspace } from '../context/WorkspaceContext';
import { HeartPulse, Plus, Clock, Activity } from 'lucide-react';

interface CaregiverDashboardProps {
  data: WorkspaceData;
  onNavigateTab: (tab: string) => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({ data, onNavigateTab }) => {
  const { confirmDose } = useWorkspace();
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [skipModalDose, setSkipModalDose] = useState<DoseLog | null>(null);

  const { patient, todayDoseLogs, auditLogs } = data;

  // Filter escalated or unable doses
  const escalatedDoses = todayDoseLogs.filter(
    (d) => d.status === 'UNCONFIRMED_ESCALATED' || d.status === 'UNABLE'
  );

  const handleTake = async (doseId: string) => {
    await confirmDose(doseId, 'TAKEN');
  };

  const handleSkipClick = (dose: DoseLog) => {
    setSkipModalDose(dose);
  };

  const handleConfirmSkip = async (doseId: string, reason: string) => {
    await confirmDose(doseId, 'SKIPPED', reason);
  };

  const handleUnable = async (doseId: string) => {
    await confirmDose(doseId, 'UNABLE', 'Caregiver noted patient unable to take dose.');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-1">
            <HeartPulse className="w-3.5 h-3.5" /> Caregiver Co-Management Workspace
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Monitoring Patient: {patient.name} ({patient.age}y)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Emergency contact: <strong>{patient.emergencyPhone}</strong> | Grace period: <strong>{patient.gracePeriodMinutes} mins</strong>
          </p>
        </div>

        <button
          onClick={() => setAddMedOpen(true)}
          className="min-touch-target px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow"
        >
          <Plus className="w-4 h-4" /> Add Patient Medication
        </button>
      </div>

      {/* Priority Escalation Queue (Floating at top) */}
      <CaregiverEscalationQueue escalatedDoses={escalatedDoses} />

      {/* Today's Medication Routine Overview */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-teal-600" /> Patient's Scheduled Routine Today
        </h3>

        <div className="space-y-4">
          {todayDoseLogs.map((dose) => (
            <ScheduleDoseCard
              key={dose.doseId}
              dose={dose}
              onTake={handleTake}
              onSkip={handleSkipClick}
              onUnable={handleUnable}
              isPatientRole={false}
            />
          ))}
        </div>
      </div>

      {/* Live Care Activity & Audit Timeline */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" /> Live Care Circle Activity Timeline
          </h3>
          <button
            onClick={() => onNavigateTab('care-circle')}
            className="text-sm text-teal-700 font-bold hover:underline"
          >
            Manage Permissions & Passcodes
          </button>
        </div>

        <div className="space-y-3">
          {auditLogs.slice(0, 5).map((log) => (
            <div
              key={log.logId}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900">{log.action.replace(/_/g, ' ')}</strong>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{log.details}</p>
                <span className="text-[11px] text-slate-400">By: {log.actorName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AddMedicationModal
        isOpen={addMedOpen}
        onClose={() => setAddMedOpen(false)}
      />
      <SkipReasonModal
        isOpen={Boolean(skipModalDose)}
        dose={skipModalDose}
        onClose={() => setSkipModalDose(null)}
        onConfirmSkip={handleConfirmSkip}
      />
    </div>
  );
};
