import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useWorkspace } from './context/WorkspaceContext';
import { Navbar } from './components/Navbar';
import { PatientDashboard } from './views/PatientDashboard';
import { CaregiverDashboard } from './views/CaregiverDashboard';
import { FamilyDashboard } from './views/FamilyDashboard';
import { LandingView } from './views/LandingView';
import { AppointmentsView } from './components/AppointmentsView';
import { CareCircleMatrix } from './components/CareCircleMatrix';
import { AdherenceAnalyticsView } from './components/AdherenceAnalyticsView';
import { PasscodeModal } from './components/PasscodeModal';
import { NotificationLogModal } from './components/NotificationLogModal';
import { AddMedicationModal } from './components/AddMedicationModal';
import { Pill, Plus, Clock, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, refreshWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<string>('schedule');
  const [passcodeModalOpen, setPasscodeModalOpen] = useState<boolean>(false);
  const [outboxModalOpen, setOutboxModalOpen] = useState<boolean>(false);
  const [addMedModalOpen, setAddMedModalOpen] = useState<boolean>(false);

  // If no user is signed in, display the landing page
  if (!user) {
    return <LandingView />;
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Synchronizing ElderSync Workspace...</h3>
        <p className="text-sm text-slate-500">Loading patient profile and materializing today's schedule.</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md text-center">
          <h3 className="text-lg font-bold text-red-900 mb-2">Connection Error</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={() => refreshWorkspace()}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar & Judge Evaluation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openPasscodeModal={() => setPasscodeModalOpen(true)}
        openNotificationLog={() => setOutboxModalOpen(true)}
      />

      {/* Main Workspace Canvas */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {data && (
          <>
            {activeTab === 'schedule' && (
              <>
                {user.role === 'PATIENT' && (
                  <PatientDashboard data={data} onNavigateTab={setActiveTab} />
                )}
                {user.role === 'CAREGIVER' && (
                  <CaregiverDashboard data={data} onNavigateTab={setActiveTab} />
                )}
                {user.role === 'FAMILY' && <FamilyDashboard data={data} />}
              </>
            )}

            {activeTab === 'medications' && (
              <div className="space-y-6">
                <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <Pill className="w-7 h-7 text-teal-600" /> Medication Master Prescriptions
                    </h2>
                    <p className="patient-typography text-slate-600 mt-1">
                      Active medications and their daily recurring schedule slots.
                    </p>
                  </div>
                  {(user.role === 'PATIENT' || user.role === 'CAREGIVER') && (
                    <button
                      onClick={() => setAddMedModalOpen(true)}
                      className="min-touch-target px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition flex items-center gap-2 flex-shrink-0"
                    >
                      <Plus className="w-5 h-5" /> Add Medication
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.medications.map((med) => {
                    const medSchedules = data.schedules.filter((s) => s.medicineId === med.medicineId);

                    return (
                      <div
                        key={med.medicineId}
                        className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-slate-900">{med.name}</h3>
                            <span className="text-sm font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                              {med.dosage}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{med.instructions}</p>

                          <div className="space-y-1.5 pt-3 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                              Recurring Slots:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {medSchedules.map((s) => (
                                <span
                                  key={s.scheduleId}
                                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {s.timeOfDay} ({s.periodLabel})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <span>Status: {med.active ? 'Active Prescription' : 'Inactive'}</span>
                          <span>Grace: {medSchedules[0]?.gracePeriodMinutes || 3} min</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <AppointmentsView appointments={data.appointments} />
            )}

            {activeTab === 'care-circle' && (
              <CareCircleMatrix careMembers={data.careMembers} auditLogs={data.auditLogs} />
            )}

            {activeTab === 'analytics' && (
              <AdherenceAnalyticsView analytics={data.analytics} />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <PasscodeModal
        isOpen={passcodeModalOpen}
        onClose={() => setPasscodeModalOpen(false)}
      />
      <NotificationLogModal
        isOpen={outboxModalOpen}
        onClose={() => setOutboxModalOpen(false)}
        notifications={data?.notifications || []}
      />
      <AddMedicationModal
        isOpen={addMedModalOpen}
        onClose={() => setAddMedModalOpen(false)}
      />
    </div>
  );
};
