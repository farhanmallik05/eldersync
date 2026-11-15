import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Pill, X, Plus, Trash2 } from 'lucide-react';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({ isOpen, onClose }) => {
  const { addMedication } = useWorkspace();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timesOfDay, setTimesOfDay] = useState<string[]>(['09:00']);
  const [gracePeriod, setGracePeriod] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddTime = () => {
    setTimesOfDay((prev) => [...prev, '18:00']);
  };

  const handleRemoveTime = (index: number) => {
    setTimesOfDay((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, val: string) => {
    setTimesOfDay((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || timesOfDay.length === 0) return;

    setSubmitting(true);
    await addMedication({
      name: name.trim(),
      dosage: dosage.trim(),
      instructions: instructions.trim() || 'Take with water after meals',
      timesOfDay,
      gracePeriodMinutes: Number(gracePeriod) || 3,
    });
    setSubmitting(false);
    onClose();
    setName('');
    setDosage('');
    setInstructions('');
    setTimesOfDay(['09:00']);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl font-bold text-slate-900">Add New Medication</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Medication Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Atorvastatin, Metformin"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Dosage *</label>
            <input
              type="text"
              required
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 20mg, 1 tablet"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Instructions</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Take after breakfast with a full glass of water."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-800">
                Daily Recurring Schedule Slots (HH:mm)
              </label>
              <button
                type="button"
                onClick={handleAddTime}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Slot
              </button>
            </div>
            <div className="space-y-2">
              {timesOfDay.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={t}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono"
                  />
                  {timesOfDay.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Confirmation Grace Window (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
            />
            <span className="text-xs text-slate-500 block mt-1">Default: 3 mins for rapid live demo testing.</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
