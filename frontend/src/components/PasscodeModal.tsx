import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { KeyRound, X, CheckCircle2 } from 'lucide-react';

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({ isOpen, onClose }) => {
  const { joinCareCircle } = useWorkspace();
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length !== 6) return;

    setLoading(true);
    setStatusMsg(null);

    const success = await joinCareCircle(passcode);
    setLoading(false);

    if (success) {
      setStatusMsg({
        type: 'success',
        text: 'Access granted! You have successfully joined the Care Circle.',
      });
      setTimeout(() => {
        onClose();
        setPasscode('');
        setStatusMsg(null);
      }, 1500);
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Invalid, expired, or already used passcode. Please verify the 6-digit code.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl font-bold text-slate-900">Join Care Circle</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 my-4">
          Enter the single-use 6-digit passcode provided by the patient. Passcodes expire after 15 minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              6-Digit Passcode
            </label>
            <input
              type="text"
              maxLength={6}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              className="w-full text-center text-4xl font-mono tracking-widest py-3 border-2 border-slate-300 rounded-xl focus:border-teal-600 focus:ring-0 text-slate-900"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {statusMsg.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || passcode.length !== 6}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-lg shadow disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Redeem Passcode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
