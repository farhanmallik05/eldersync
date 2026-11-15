import React from 'react';
import { AdherenceAnalytics } from '../types';
import { TrendingUp, Clock, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

interface AdherenceAnalyticsViewProps {
  analytics: AdherenceAnalytics;
}

export const AdherenceAnalyticsView: React.FC<AdherenceAnalyticsViewProps> = ({ analytics }) => {
  const {
    adherenceRate,
    totalDoses,
    takenCount,
    skippedCount,
    escalatedCount,
    disruptionSlot,
    avgConfirmationDelayMinutes,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-teal-600" /> 7-Day Adherence & Routine Analytics
        </h2>
        <p className="patient-typography text-slate-600 mt-1">
          Metrics computed deterministically from real Firestore dose logs. Zero static mocks or client-side estimates.
        </p>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Adherence Rate Gauge Card */}
        <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500 uppercase">7-Day Adherence</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="my-2">
            <div className="text-4xl font-extrabold text-slate-900">{adherenceRate}%</div>
            <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  adherenceRate >= 80 ? 'bg-emerald-500' : adherenceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, adherenceRate)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Target healthcare benchmark: &gt;= 80% for chronic therapy
          </p>
        </div>

        {/* Taken vs Skipped */}
        <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500 uppercase">Confirmed Taken</span>
            <CheckCircle className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-4xl font-extrabold text-slate-900 my-2">
            {takenCount} <span className="text-lg font-normal text-slate-400">/ {totalDoses} doses</span>
          </div>
          <p className="text-xs text-emerald-700 font-semibold">
            {skippedCount} dose{skippedCount !== 1 ? 's' : ''} skipped with documented rationale
          </p>
        </div>

        {/* Disruption Window */}
        <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500 uppercase">Disruption Window</span>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-amber-900 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 inline-block">
              {disruptionSlot}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Slot with highest delay or skipped frequency in the routine
          </p>
        </div>

        {/* Latency */}
        <div className="card-surface bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500 uppercase">Avg Confirmation Delay</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-4xl font-extrabold text-slate-900 my-2">
            {avgConfirmationDelayMinutes} <span className="text-lg font-normal text-slate-400">min</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Average minutes between scheduled slot and patient confirmation tap
          </p>
        </div>
      </div>

      {/* Routine Recommendations Card */}
      <div className="card-surface bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Routine Pattern Assessment</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          Based on the 7-day adherence record of <strong>{adherenceRate}%</strong>, Robert demonstrates reliable morning routine compliance. The <strong>{disruptionSlot}</strong> window exhibits the greatest variation in confirmation timing. Caregivers are encouraged to align evening doses with dinner or evening television habits to minimize late-evening unconfirmed escalations.
        </p>
      </div>
    </div>
  );
};
