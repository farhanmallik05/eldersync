import React from 'react';
import { NotificationRecord } from '../types';
import { Mail, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface NotificationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationRecord[];
}

export const NotificationLogModal: React.FC<NotificationLogModalProps> = ({
  isOpen,
  onClose,
  notifications,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-teal-600" />
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Transactional Email Outbox & Idempotency Log
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic duplicate prevention: Every notification is keyed by <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700">idempotencyKey</code>.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto divide-y divide-slate-100 py-2 flex-1">
          {notifications.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">No notifications recorded in outbox yet.</p>
          ) : (
            notifications.map((notif) => (
              <div key={notif.idempotencyKey} className="py-3.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {notif.type}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">To: {notif.recipientEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {notif.deliveryStatus === 'SENT' ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                    <span className="text-slate-400">
                      {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-bold text-slate-900">{notif.subject}</div>
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                  {notif.bodyPreview}
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-600" /> Key: {notif.idempotencyKey}
                  {notif.providerMessageId && <span> | ID: {notif.providerMessageId}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-semibold rounded-lg text-sm hover:bg-slate-800"
          >
            Close Outbox
          </button>
        </div>
      </div>
    </div>
  );
};
