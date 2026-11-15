import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WorkspaceData, DoseStatus, CareMemberPermissions } from '../types';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  data: WorkspaceData | null;
  loading: boolean;
  error: string | null;
  refreshWorkspace: () => Promise<void>;
  confirmDose: (doseId: string, status: DoseStatus, patientNote?: string) => Promise<boolean>;
  acknowledgeDose: (doseId: string, note: string, markAsTaken?: boolean) => Promise<boolean>;
  requestHelp: (message?: string) => Promise<{ success: boolean; notifiedCount: number }>;
  runSchedulerCheck: (simulatedNowIso?: string) => Promise<any>;
  generatePasscode: (role: 'CAREGIVER' | 'FAMILY', permissions: CareMemberPermissions) => Promise<{ passcode: string; expiresAt: string }>;
  joinCareCircle: (passcode: string) => Promise<boolean>;
  addMedication: (payload: { name: string; dosage: string; instructions: string; timesOfDay: string[]; gracePeriodMinutes?: number }) => Promise<boolean>;
  addAppointment: (payload: { doctorName: string; specialty: string; location: string; scheduledAt: string; notes?: string }) => Promise<boolean>;
  updateCareMember: (memberId: string, permissions?: Partial<CareMemberPermissions>, status?: 'ACTIVE' | 'REVOKED') => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const patientId = 'patient_robert_vance'; // Primary seeded patient

  const fetchWorkspace = useCallback(async () => {
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/patients/${patientId}/workspace`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load patient workspace (${res.status})`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error loading workspace');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace, user]);

  const confirmDose = async (doseId: string, status: DoseStatus, patientNote?: string) => {
    try {
      const res = await fetch(`/api/doses/${doseId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, patientNote }),
      });

      if (res.ok) {
        await fetchWorkspace();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const acknowledgeDose = async (doseId: string, note: string, markAsTaken = false) => {
    try {
      const res = await fetch(`/api/doses/${doseId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ acknowledgementNote: note, markAsTaken }),
      });

      if (res.ok) {
        await fetchWorkspace();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const requestHelp = async (message?: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/help-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        const json = await res.json();
        await fetchWorkspace();
        return { success: true, notifiedCount: json.notifiedCaregiversCount };
      }
      return { success: false, notifiedCount: 0 };
    } catch {
      return { success: false, notifiedCount: 0 };
    }
  };

  const runSchedulerCheck = async (simulatedNowIso?: string) => {
    try {
      const res = await fetch('/api/scheduler/run-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulatedNowIso, patientId }),
      });
      const json = await res.json();
      await fetchWorkspace();
      return json;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const generatePasscode = async (role: 'CAREGIVER' | 'FAMILY', permissions: CareMemberPermissions) => {
    const res = await fetch(`/api/patients/${patientId}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role, permissions }),
    });

    if (!res.ok) throw new Error('Failed to generate passcode');
    const json = await res.json();
    await fetchWorkspace();
    return { passcode: json.passcode, expiresAt: json.expiresAt };
  };

  const joinCareCircle = async (passcode: string) => {
    try {
      const res = await fetch('/api/care-circle/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId, passcode }),
      });

      if (res.ok) {
        await fetchWorkspace();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const addMedication = async (payload: any) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/medications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchWorkspace();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const addAppointment = async (payload: any) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchWorkspace();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateCareMember = async (memberId: string, permissions?: any, status?: any) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/care-members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions, status }),
      });

      if (res.ok) {
        await fetchWorkspace();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        loading,
        error,
        refreshWorkspace: fetchWorkspace,
        confirmDose,
        acknowledgeDose,
        requestHelp,
        runSchedulerCheck,
        generatePasscode,
        joinCareCircle,
        addMedication,
        addAppointment,
        updateCareMember,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
};
