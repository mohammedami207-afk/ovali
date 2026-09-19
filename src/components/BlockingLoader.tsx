import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

interface BlockingLoaderProps {
  message?: string;
  onDismiss?: () => void;
}

export const BlockingLoader: React.FC<BlockingLoaderProps> = ({ 
  message = 'تحميل العروضات الجديده...',
  onDismiss
}) => {
  return (
    <>
      {/* Top Animated Shimmer Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[100001] bg-slate-800/40 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-accent animate-[shimmer_1.2s_infinite] w-full" />
      </div>

      {/* Light Transparent Backdrop + Compact Floating Frosted Glass Card */}
      <div 
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-[2px] text-white overflow-hidden p-4 transition-all duration-300 pointer-events-auto" 
        dir="rtl"
        onClick={() => onDismiss?.()}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative flex items-center justify-between gap-3.5 bg-slate-900/95 backdrop-blur-xl border border-white/10 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/40 max-w-sm animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Subtle Spinner Icon */}
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-9 h-9 rounded-xl bg-theme-primary/15 border border-theme-primary/30 flex items-center justify-center text-theme-primary shadow-inner">
              <Sparkles className="w-4 h-4 text-theme-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-slate-950 rounded-full border border-theme-primary/40 text-theme-primary">
              <RefreshCw className="w-3 h-3 animate-spin" />
            </div>
          </div>

          {/* Text Info */}
          <div className="flex flex-col text-right flex-1">
            <span className="text-xs font-bold text-white font-cairo leading-snug flex items-center gap-1.5">
              {message}
            </span>
            <span className="text-[11px] text-slate-300/80 font-sans mt-0.5">
              مزامنة فورية لتسوق أفضل وأسرع
            </span>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors text-xs font-mono"
              title="تخطي والبدء فوراً"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </>
  );
};

