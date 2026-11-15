import React, { useState } from 'react';
import { CareMember, AuditLog, CareMemberPermissions } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Users, KeyRound, ShieldAlert, Check, Copy, History, UserX } from 'lucide-react';

interface CareCircleMatrixProps {
  careMembers: CareMember[];
  auditLogs: AuditLog[];
}

export const CareCircleMatrix: React.FC<CareCircleMatrixProps> = ({ careMembers, auditLogs }) => {
  const { user } = useAuth();
  const { generatePasscode, updateCareMember } = useWorkspace();
  const isPatient = user?.role === 'PATIENT';

  // Passcode generator state
  const [inviteRole, setInviteRole] = useState<'CAREGIVER' | 'FAMILY'>('CAREGIVER');
  const [generatedPasscode, setGeneratedPasscode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Default permissions for new invite
  const [canView, setCanView] = useState(true);
  const [canMeds, setCanMeds] = useState(inviteRole === 'CAREGIVER');
  const [canAppts, setCanAppts] = useState(inviteRole === 'CAREGIVER');
  const [canEscalate, setCanEscalate] = useState(true);

  const handleRoleChange = (role: 'CAREGIVER' | 'FAMILY') => {
    setInviteRole(role);
    setCanMeds(role === 'CAREGIVER');
    setCanAppts(role === 'CAREGIVER');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const perms: CareMemberPermissions = {
        canViewSchedule: canView,
        canManageMeds: canMeds,
        canManageAppointments: canAppts,
        receiveEscalationEmails: canEscalate,
      };
      const result = await generatePasscode(inviteRole, perms);
      setGeneratedPasscode(result.passcode);
      setExpiresAt(result.expiresAt);
      setCopied(false);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedPasscode) {
      navigator.clipboard.writeText(generatedPasscode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleTogglePermission = async (
    member: CareMember,
    permKey: keyof CareMemberPermissions,
    currentValue: boolean
  ) => {
    if (!isPatient) return;
    await updateCareMember(member.id, { [permKey]: !currentValue });
  };

  const handleRevoke = async (member: CareMember) => {
    if (!isPatient) return;
    if (confirm(`Revoke access for ${member.memberName}? They will no longer be able to view or manage patient routines.`)) {
      await updateCareMember(member.id, undefined, 'REVOKED');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Overview */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-600" /> Care Circle & Patient Autonomy Controls
          </h2>
          <p className="patient-typography text-slate-600 mt-1">
            The patient is the primary owner and controls who joins their circle and what actions each member can perform.
          </p>
        </div>
        {!isPatient && (
          <div className="bg-amber-50 text-amber-900 text-xs px-3 py-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Viewing as {user?.role}. Only the patient can alter permission toggles or revoke access.</span>
          </div>
        )}
      </div>

      {/* Secure Passcode Generator Card (Only Patient can generate) */}
      {isPatient && (
        <div className="card-surface bg-gradient-to-br from-teal-50 to-slate-50 border border-teal-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-2">
            <KeyRound className="w-6 h-6 text-teal-600" /> Generate Secure Single-Use Passcode
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Generate an expiring 6-digit numeric passcode. Stored as a cryptographically salted SHA-256 hash in Firestore with a 15-minute TTL.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Select Role to Invite:</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('CAREGIVER')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm border transition ${
                      inviteRole === 'CAREGIVER'
                        ? 'bg-teal-600 text-white border-teal-600 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Caregiver (Nurse/Aide)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('FAMILY')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm border transition ${
                      inviteRole === 'FAMILY'
                        ? 'bg-teal-600 text-white border-teal-600 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Family Member
                  </button>
                </div>
              </div>

              {/* Scoped Permissions Config */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 text-sm">
                <span className="font-semibold text-slate-900 block mb-1">Pre-configured Permissions:</span>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={canView}
                    onChange={(e) => setCanView(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Can view daily schedule & medication history</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={canMeds}
                    onChange={(e) => setCanMeds(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Can manage & edit medications (Recommended for Caregivers)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={canAppts}
                    onChange={(e) => setCanAppts(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Can manage doctor appointments</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={canEscalate}
                    onChange={(e) => setCanEscalate(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Receive emergency escalation & unconfirmed dose emails</span>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="min-touch-target w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow transition"
              >
                {generating ? 'Generating Salted Hash...' : 'Generate 6-Digit Passcode'}
              </button>
            </div>

            {/* Generated Code Display Box */}
            <div className="bg-white border-2 border-teal-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
              {generatedPasscode ? (
                <>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-1">
                    Single-Use Invitation Passcode
                  </span>
                  <div className="text-5xl font-black tracking-widest text-slate-900 my-3 font-mono">
                    {generatedPasscode.slice(0, 3)} {generatedPasscode.slice(3)}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Expires in 15 minutes ({expiresAt ? new Date(expiresAt).toLocaleTimeString() : ''}). Single redemption only.
                  </p>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-bold hover:bg-teal-100 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied to Clipboard!' : 'Copy Passcode'}
                  </button>
                </>
              ) : (
                <div className="text-slate-400">
                  <KeyRound className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click the generate button to create a temporary 15-minute access code.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Authorized Care Circle Members List */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Authorized Care Circle Members ({careMembers.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">View Schedule</th>
                <th className="py-3 px-4">Manage Meds</th>
                <th className="py-3 px-4">Appointments</th>
                <th className="py-3 px-4">Escalations</th>
                <th className="py-3 px-4">Status</th>
                {isPatient && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {careMembers.map((member) => {
                const isRevoked = member.status === 'REVOKED';

                return (
                  <tr key={member.id} className={isRevoked ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50/60'}>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{member.memberName}</div>
                      <div className="text-xs text-slate-500">{member.memberEmail}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={member.permissions.canViewSchedule}
                        disabled={!isPatient || isRevoked}
                        onChange={() => handleTogglePermission(member, 'canViewSchedule', member.permissions.canViewSchedule)}
                        className="rounded text-teal-600 w-4 h-4 disabled:opacity-50"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={member.permissions.canManageMeds}
                        disabled={!isPatient || isRevoked}
                        onChange={() => handleTogglePermission(member, 'canManageMeds', member.permissions.canManageMeds)}
                        className="rounded text-teal-600 w-4 h-4 disabled:opacity-50"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={member.permissions.canManageAppointments}
                        disabled={!isPatient || isRevoked}
                        onChange={() => handleTogglePermission(member, 'canManageAppointments', member.permissions.canManageAppointments)}
                        className="rounded text-teal-600 w-4 h-4 disabled:opacity-50"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={member.permissions.receiveEscalationEmails}
                        disabled={!isPatient || isRevoked}
                        onChange={() => handleTogglePermission(member, 'receiveEscalationEmails', member.permissions.receiveEscalationEmails)}
                        className="rounded text-teal-600 w-4 h-4 disabled:opacity-50"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          member.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    {isPatient && (
                      <td className="py-4 px-4 text-right">
                        {member.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevoke(member)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold transition"
                          >
                            <UserX className="w-3.5 h-3.5" /> Revoke
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-slate-600" /> Immutable Care Circle Audit Trail
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Every confirmation, passcode generation, permission edit, and caregiver acknowledgement is strictly logged.
        </p>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.logId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {log.actorName}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
