import React, { useState } from 'react';
import { WorkspaceData, DoseLog, TimeOfDayPeriod } from '../types';
import { ScheduleDoseCard } from '../components/ScheduleDoseCard';
import { SkipReasonModal } from '../components/SkipReasonModal';
import { AddMedicationModal } from '../components/AddMedicationModal';
import { useWorkspace } from '../context/WorkspaceContext';
import { AlertCircle, Shield, Plus, Clock, Stethoscope, CheckCircle2 } from 'lucide-react';

interface PatientDashboardProps {
  data: WorkspaceData;
  onNavigateTab: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ data, onNavigateTab }) => {
  const { confirmDose, requestHelp } = useWorkspace();
  const [skipModalDose, setSkipModalDose] = useState<DoseLog | null>(null);
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [helpRequested, setHelpRequested] = useState(false);
  const [requestingHelp, setRequestingHelp] = useState(false);

  const { patient, todayDoseLogs, careMembers, appointments } = data;

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
    await confirmDose(doseId, 'UNABLE', 'Patient reported unable to take scheduled dose.');
  };

  const handleRequestHelp = async () => {
    setRequestingHelp(true);
    const res = await requestHelp('Patient pressed the Request Assistance button on their dashboard.');
    setRequestingHelp(false);
    if (res.success) {
      setHelpRequested(true);
      setTimeout(() => setHelpRequested(false), 8000);
    }
  };

  // Group doses chronologically by period
  const periods: TimeOfDayPeriod[] = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  const activeMembersCount = careMembers.filter((m) => m.status === 'ACTIVE').length;

  return (
    <div className="space-y-8">
      {/* Top Autonomy & Help Bar */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-700 font-semibold mb-1">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Shared with {activeMembersCount} authorized member{activeMembersCount !== 1 ? 's' : ''} — You control access</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back, {patient.name}
          </h2>
          <p className="patient-typography text-slate-600 mt-0.5">
            Today's routine is active. Touch "I Took This Medicine" when you complete each dose.
          </p>
        </div>

        {/* Big Request Assistance Button (min-h-14 / 56px height) */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRequestHelp}
            disabled={requestingHelp}
            className={`min-touch-target px-6 rounded-2xl font-bold text-lg text-white shadow-md transition flex items-center gap-2 ${
              helpRequested
                ? 'bg-emerald-600'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-4 focus:ring-red-200'
            }`}
            aria-label="Request immediate assistance from care circle"
          >
            {helpRequested ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6 animate-pulse" />}
            {helpRequested ? 'Help Request Sent to Caregivers' : requestingHelp ? 'Notifying Circle...' : 'Request Assistance'}
          </button>
        </div>
      </div>

      {/* Main Section Header with + Add Medication */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" /> Today's Medication Routine
          </h3>
          <p className="text-sm text-slate-500">Sorted by time of day</p>
        </div>
        <button
          onClick={() => setAddMedOpen(true)}
          className="min-touch-target px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition flex items-center gap-2 border border-slate-300"
        >
          <Plus className="w-4 h-4" /> Add Medication
        </button>
      </div>

      {/* Today's Schedule Card Grid */}
      {todayDoseLogs.length === 0 ? (
        <div className="card-surface bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-800">No Doses Scheduled for Today</h4>
          <p className="text-sm text-slate-500 mt-1">Use the "Add Medication" button to set up your daily doses.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {periods.map((period) => {
            const dosesInPeriod = todayDoseLogs.filter((d) => {
              const sched = data.schedules.find((s) => s.scheduleId === d.scheduleId);
              return (sched?.periodLabel || 'MORNING') === period;
            });

            if (dosesInPeriod.length === 0) return null;

            return (
              <div key={period} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  {period} Schedule
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {dosesInPeriod.map((dose) => (
                    <ScheduleDoseCard
                      key={dose.doseId}
                      dose={dose}
                      onTake={handleTake}
                      onSkip={handleSkipClick}
                      onUnable={handleUnable}
                      isPatientRole={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Appointments Summary Widget */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" /> Upcoming Doctor Consultations
          </h3>
          <button
            onClick={() => onNavigateTab('appointments')}
            className="text-sm text-teal-700 font-bold hover:underline"
          >
            View All ({appointments.length})
          </button>
        </div>

        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No medical visits scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.slice(0, 2).map((appt) => (
              <div key={appt.appointmentId} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-slate-900 font-bold">{appt.doctorName}</strong>
                  <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-semibold">
                    {appt.specialty}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{appt.location}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(appt.scheduledAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <SkipReasonModal
        isOpen={Boolean(skipModalDose)}
        dose={skipModalDose}
        onClose={() => setSkipModalDose(null)}
        onConfirmSkip={handleConfirmSkip}
      />
      <AddMedicationModal
        isOpen={addMedOpen}
        onClose={() => setAddMedOpen(false)}
      />
    </div>
  );
};
