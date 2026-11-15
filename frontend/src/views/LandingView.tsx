import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Bell,
  KeyRound,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  Heart,
  UserCheck,
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const { loginAs } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                Elder<span className="text-teal-400">Sync</span>
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">Healthcare SaaS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-teal-400">
              PromptWars × Catalyst Round 2
            </span>
          </div>
        </div>
      </header>

      {/* Main Split Hero (50/50 Layout - Anti-Center Bias) */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-16">
          {/* Left Column (Copy & Role Actions) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-950/80 text-teal-300 border border-teal-800">
              <Shield className="w-3.5 h-3.5" /> Patient-Primary Healthcare SaaS
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Medication adherence grounded in{' '}
              <span className="text-teal-400">dignity and autonomy.</span>
            </h1>

            <p className="text-lg text-slate-300 max-w-[55ch] leading-relaxed">
              Elderly patients retain complete ownership of their routines and care circle permissions.
              Deterministic server-side escalation alerts caregivers when doses remain unconfirmed past grace windows.
            </p>

            {/* 1-Click Instant Demo Authentication Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-xl">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-3">
                1-Click Role Login for Evaluators & Judges:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => loginAs('PATIENT')}
                  className="py-3 px-3.5 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-bold rounded-xl shadow transition text-left flex flex-col justify-between gap-1 group"
                  aria-label="Sign in as elderly patient Robert Vance"
                >
                  <span className="text-xs text-teal-100">Patient</span>
                  <span className="text-sm font-extrabold flex items-center justify-between">
                    Robert, 74y <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </span>
                </button>

                <button
                  onClick={() => loginAs('CAREGIVER')}
                  className="py-3 px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold rounded-xl border border-slate-700 transition text-left flex flex-col justify-between gap-1 group"
                  aria-label="Sign in as caregiver Nurse Sarah"
                >
                  <span className="text-xs text-slate-400">Caregiver</span>
                  <span className="text-sm font-extrabold flex items-center justify-between">
                    Nurse Sarah <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </span>
                </button>

                <button
                  onClick={() => loginAs('FAMILY')}
                  className="py-3 px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold rounded-xl border border-slate-700 transition text-left flex flex-col justify-between gap-1 group"
                  aria-label="Sign in as family member David Vance"
                >
                  <span className="text-xs text-slate-400">Family</span>
                  <span className="text-sm font-extrabold flex items-center justify-between">
                    David (Son) <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Pre-seeded with real multi-role data. Zero passwords required.</span>
              </div>
            </div>
          </div>

          {/* Right Column (Hero Interface Preview: Real Dose Card Component) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-300">Live Component Preview</span>
                </div>
                <span className="text-xs font-mono text-slate-500">09:00 AM Slot</span>
              </div>

              {/* Sample Dose Card preview with large action buttons */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold tracking-tight">Metformin</h3>
                      <span className="text-sm font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        500mg
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Take 1 tablet after breakfast with water.</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Due Now
                  </span>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span>Confirmation grace deadline: <strong>09:03 AM</strong> (3m demo window)</span>
                </div>

                {/* The 3 large elderly touch targets */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => loginAs('PATIENT')}
                    className="w-full min-touch-target rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition shadow flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> I Took This Medicine
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => loginAs('PATIENT')}
                      className="min-touch-target rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                    >
                      Skip for Now
                    </button>
                    <button
                      onClick={() => loginAs('PATIENT')}
                      className="min-touch-target rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100"
                    >
                      Unable to Take
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>WCAG AAA Contrast Compliant</span>
                <span>Minimum 56px Touch Target</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout (Asymmetric Rhythm) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-900">
          {/* Card 1 (Wide): Patient-Primary Autonomy */}
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400 mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Patient-Primary Permission Architecture
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-[65ch]">
                The elderly individual is the primary system owner. They define their emergency contacts,
                configure escalation grace periods, and dynamically grant or revoke permissions for each caregiver and family member.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 font-medium">
                Granular Permissions
              </span>
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 font-medium">
                Instant Revocation
              </span>
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 font-medium">
                Immutable Audit Log
              </span>
            </div>
          </div>

          {/* Card 2: Passcode Onboarding */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-4">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Expiring Single-Use Passcodes
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Zero plaintext invite links. Passcodes are 6-digit numeric tokens hashed with SHA-256 and peppered in Firestore with a 15-minute TTL.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-xs font-mono text-emerald-400">
              crypto.randomInt(100000, 999999)
            </div>
          </div>

          {/* Card 3: Deterministic Escalation */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 mb-4">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Deterministic Cloud Scheduler Escalation
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Server-side cron evaluates unconfirmed doses past the grace period. Dispatches transactional email alerts with idempotency deduplication keys.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-xs text-amber-400">
              Idempotency Key: esc_&#123;doseId&#125;
            </div>
          </div>

          {/* Card 4 (Wide): Adherence & Routine Analytics */}
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Real 7-Day Adherence Analytics
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-[65ch]">
                Computed straight from recorded daily dose logs. Tracks 7-day adherence percentages, identifies time-of-day disruption slots, and measures confirmation latency.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
              <span>Benchmark: &gt;= 80%</span>
              <span>Closed-Loop Acknowledgements</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        ElderSync Healthcare SaaS • Engineered for PromptWars × Catalyst Round 2 with Google Antigravity
      </footer>
    </div>
  );
};
