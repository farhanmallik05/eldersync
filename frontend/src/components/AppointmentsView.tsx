import React, { useState } from 'react';
import { Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Calendar, Plus, MapPin, Stethoscope, Clock, Check } from 'lucide-react';

interface AppointmentsViewProps {
  appointments: Appointment[];
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ appointments }) => {
  const { user } = useAuth();
  const { addAppointment } = useWorkspace();
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Can add if patient owner or caregiver with canManageAppointments
  const canManage = user?.role === 'PATIENT' || user?.role === 'CAREGIVER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !specialty || !location || !dateTime) return;

    setSaving(true);
    await addAppointment({
      doctorName,
      specialty,
      location,
      scheduledAt: new Date(dateTime).toISOString(),
      notes,
    });
    setSaving(false);
    setModalOpen(false);
    setDoctorName('');
    setSpecialty('');
    setLocation('');
    setDateTime('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-teal-600" /> Doctor Appointments & Medical Visits
          </h2>
          <p className="patient-typography text-slate-600 mt-1">
            Automated reminders are dispatched 24 hours prior to scheduled clinic consultations.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="min-touch-target px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition flex items-center gap-2 flex-shrink-0"
          >
            <Plus className="w-5 h-5" /> Add Appointment
          </button>
        )}
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.map((appt) => {
          const apptDate = new Date(appt.scheduledAt);
          const dateStr = apptDate.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const timeStr = apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={appt.appointmentId}
              className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {appt.specialty}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {appt.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" /> {appt.doctorName}
                </h3>

                <div className="space-y-1.5 mt-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span><strong>{dateStr}</strong> at {timeStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{appt.location}</span>
                  </div>
                </div>

                {appt.notes && (
                  <p className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                    <strong>Notes:</strong> {appt.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{appt.reminderSent ? '✓ Reminder Sent via Email' : '• Reminder Scheduled 24h Prior'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Appointment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Schedule Doctor Appointment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Dr. Aris Thorne"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Medical Specialty *</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Cardiology, Endocrinology"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Clinic / Hospital Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Metro Health Pavilion, Suite 402"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Consultation Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Bring recent blood pressure log and medication list."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow disabled:opacity-50"
                >
                  {saving ? 'Scheduling...' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
