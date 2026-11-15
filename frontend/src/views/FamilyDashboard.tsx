import React from 'react';
import { WorkspaceData } from '../types';
import { CareCircleMatrix } from '../components/CareCircleMatrix';
import { AdherenceAnalyticsView } from '../components/AdherenceAnalyticsView';
import { Heart, Users } from 'lucide-react';

interface FamilyDashboardProps {
  data: WorkspaceData;
}

export const FamilyDashboard: React.FC<FamilyDashboardProps> = ({ data }) => {
  const { patient, careMembers, auditLogs, analytics } = data;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-1">
            <Users className="w-3.5 h-3.5" /> Family Support Circle
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Care Circle Overview for {patient.name}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Transparently monitor Papa's health routines and doctor appointments while respecting his independence.
          </p>
        </div>

        <div className="bg-emerald-50 text-emerald-900 px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 text-sm">
          <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          <span>7-Day Adherence: <strong>{analytics.adherenceRate}%</strong></span>
        </div>
      </div>

      {/* Analytics Snapshot */}
      <AdherenceAnalyticsView analytics={analytics} />

      {/* Permissions Matrix & Audit Log */}
      <CareCircleMatrix careMembers={careMembers} auditLogs={auditLogs} />
    </div>
  );
};
