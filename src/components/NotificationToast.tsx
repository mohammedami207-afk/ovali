import React, { useEffect } from 'react';
import { ShoppingBag, Cloud, CheckCircle2, AlertCircle, X, Bell, BellOff } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'sync' | 'info' | 'warning';
  timestamp: string;
}

interface NotificationToastProps {
  notifications: ToastMessage[];
  onDismiss: (id: string) => void;
  browserNotificationsEnabled: boolean;
  onRequestBrowserPermission: () => void;
}

// Function to play customizable notification sounds using Web Audio API
export const playNotificationSound = (
  type: 'order' | 'sync',
  soundChoice?: 'none' | 'chime' | 'cash_register' | 'bell' | 'pulse'
) => {
  if (type === 'order' && soundChoice === 'none') {
    return; // Muted by admin preference
  }

  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const choice = soundChoice || (type === 'order' ? 'chime' : 'chime');

    if (type === 'order' && choice === 'cash_register') {
      // Upbeat 4-note Cash Register "Cha-Ching!" arpeggio (G5 -> C6 -> E6 -> G6)
      const notes = [783.99, 1046.50, 1318.51, 1567.98];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.25);
      });
    } else if (type === 'order' && choice === 'bell') {
      // Classic Crystal Bell Ring (Fundamental C6 + Harmonics)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
      osc2.frequency.setValueAtTime(2093.00, ctx.currentTime); // C7 harmonic

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.7);
      osc2.stop(ctx.currentTime + 0.7);
    } else if (type === 'order' && choice === 'pulse') {
      // Energetic Pulse Beep (Double rapid pulse)
      [0, 0.12].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + delay + 0.08);

        gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.08);
      });
    } else {
      // Default 'chime' or sync sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      if (type === 'order') {
        // Upbeat double chime (E5 -> A5)
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5

        osc2.frequency.setValueAtTime(329.63, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      } else {
        // Soft single chime (C5 -> G5)
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      }

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Ignore audio context errors if blocked by browser policy
  }
};

export const NotificationToastContainer: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  browserNotificationsEnabled,
  onRequestBrowserPermission
}) => {
  const [dismissPrompt, setDismissPrompt] = React.useState(false);

  // Hide sync (Google Sheets) toasts from storefront customers
  const visibleNotifications = notifications.filter(n => n.type !== 'sync');

  if (visibleNotifications.length === 0 && (browserNotificationsEnabled || dismissPrompt)) {
    return null;
  }

  return (
    <div className="fixed top-16 left-3 right-3 sm:right-auto sm:left-5 z-50 flex flex-col gap-2 sm:max-w-xs w-auto pointer-events-none">
      {/* Browser Notification Permission Prompt Banner */}
      {!browserNotificationsEnabled && !dismissPrompt && 'Notification' in window && Notification.permission !== 'granted' && (
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 text-slate-900 dark:text-white p-2.5 rounded-xl shadow-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Bell className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div>
              <p className="text-[10.5px] font-bold text-slate-900 dark:text-white">تفعيل إشعارات الطلبات</p>
              <p className="text-[8.5px] text-slate-500 dark:text-slate-400">لتنبيهك بالطلبات والصفقات فوراً</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onRequestBrowserPermission}
              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9.5px] rounded-lg transition-all shadow-xs"
            >
              تفعيل
            </button>
            <button
              onClick={() => setDismissPrompt(true)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Stack of In-App Toasts */}
      {visibleNotifications.map((toast) => {
        let icon = <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
        let borderColor = 'border-emerald-500/20';
        let badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300';

        if (toast.type === 'order') {
          icon = <ShoppingBag className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
          borderColor = 'border-rose-500/30';
          badgeBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-300';
        } else if (toast.type === 'warning') {
          icon = <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
          borderColor = 'border-amber-500/30';
          badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-300';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border ${borderColor} text-slate-900 dark:text-white p-2.5 rounded-xl shadow-lg flex items-start justify-between gap-2.5 transform transition-all duration-300 animate-in fade-in slide-in-from-top-2`}
          >
            <div className="flex items-start gap-2">
              <div className={`p-1.5 rounded-lg shrink-0 ${badgeBg}`}>
                {icon}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white">{toast.title}</h4>
                  <span className="text-[8.5px] text-slate-400 font-mono">{toast.timestamp}</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-snug">{toast.message}</p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
