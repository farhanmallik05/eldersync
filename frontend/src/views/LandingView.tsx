import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, Shield, Bell, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

export const LandingView: React.FC = () => {
  const { loginAs } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Elder<span className="text-teal-400">Sync</span>
          </span>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-300">
          PromptWars × Catalyst Round 2
        </span>
      </div>

      {/* Main Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-950 text-teal-300 border border-teal-800 mb-6">
          <Shield className="w-4 h-4" /> Patient-Primary Healthcare SaaS
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Medication Adherence with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
            Dignity, Autonomy & Care.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          Most medication apps stop at passive phone alarms. ElderSync gives elderly patients full ownership of their health routines, with deterministic server-side escalation to authorized caregivers and single-use passcode access control.
        </p>

        {/* 1-Click Quick Demo Sign-In Bar (Judge Friendly) */}
        <div className="bg-slate-900/90 border-2 border-teal-500/40 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl backdrop-blur-md">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-4">
            ⚡ 1-Click Quick Demo Sign-In (For Judges & Evaluators)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => loginAs('PATIENT')}
              className="py-4 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition flex flex-col items-center justify-center gap-1.5 group"
            >
              <span className="text-sm">Sign In as</span>
              <span className="text-base font-extrabold flex items-center gap-1">
                Patient <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </span>
              <span className="text-[11px] text-teal-100 font-normal">Robert Vance (74y)</span>
            </button>

            <button
              onClick={() => loginAs('CAREGIVER')}
              className="py-4 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold rounded-xl border border-slate-700 transition flex flex-col items-center justify-center gap-1.5 group"
            >
              <span className="text-sm">Sign In as</span>
              <span className="text-base font-extrabold flex items-center gap-1">
                Caregiver <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Nurse Sarah Jenkins</span>
            </button>

            <button
              onClick={() => loginAs('FAMILY')}
              className="py-4 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold rounded-xl border border-slate-700 transition flex flex-col items-center justify-center gap-1.5 group"
            >
              <span className="text-sm">Sign In as</span>
              <span className="text-base font-extrabold flex items-center gap-1">
                Family <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </span>
              <span className="text-[11px] text-slate-400 font-normal">David Vance (Son)</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-5">
            Pre-seeded Firestore data enables instant multi-role testing without entering passwords.
          </p>
        </div>

        {/* Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 text-left">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <Shield className="w-6 h-6 text-teal-400 mb-2" />
            <h4 className="font-bold text-white mb-1">Patient Autonomy First</h4>
            <p className="text-xs text-slate-400">
              Elderly individuals own their records, confirm doses with large 56px controls, and can grant or revoke caregiver permissions at will.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <Bell className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="font-bold text-white mb-1">Deterministic Escalation</h4>
            <p className="text-xs text-slate-400">
              Backend Cloud Scheduler processor escalates unconfirmed doses past the grace window with idempotent email deduplication locks.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <KeyRound className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-white mb-1">Expiring Passcode Circle</h4>
            <p className="text-xs text-slate-400">
              Zero plaintext invitation codes. Generates 6-digit numeric passcodes hashed with SHA-256 with 15-minute TTL.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        ElderSync Healthcare SaaS • Engineered for PromptWars × Catalyst Round 2 with Google Antigravity
      </footer>
    </div>
  );
};
